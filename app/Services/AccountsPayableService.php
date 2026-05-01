<?php

namespace App\Services;

use App\Models\AccountsPayable;
use App\Models\AccountsPayableInstallment;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReceipt;
use Illuminate\Support\Carbon;

class AccountsPayableService
{
    public function syncFromPurchaseOrder(PurchaseOrder $order): ?AccountsPayable
    {
        $order->loadMissing('supplier', 'business', 'branch', 'warehouse');
        $this->purgeLegacyReceiptPayablesForOrder($order);
        $isEligibleSource = $this->isEligiblePurchaseOrderSource($order);

        $accountsPayable = AccountsPayable::query()
            ->where('source_type', 'purchase_order')
            ->where('source_id', $order->id)
            ->first();

        if (!$accountsPayable) {
            $accountsPayable = new AccountsPayable([
                'source_type' => 'purchase_order',
                'source_id' => $order->id,
            ]);
        }

        $accountsPayable->loadMissing('payments');
        $hasPayments = $accountsPayable->exists && $accountsPayable->payments()->where('status', 1)->exists();

        if (!$isEligibleSource) {
            if ($accountsPayable->exists) {
                if ($hasPayments) {
                    throw new \Exception('No puedes anular o desactivar una orden de compra a credito con pagos registrados');
                }
                AccountsPayableInstallment::where('accounts_payable_id', $accountsPayable->id)->delete();
                $accountsPayable->delete();
            }
            return null;
        }

        if (!$accountsPayable->exists) {
            $accountsPayable->code = $this->nextCode();
            $accountsPayable->created_by = $order->created_by;
        } elseif ($hasPayments && $this->hasLockedFinancialChangesFromPurchaseOrder($accountsPayable, $order)) {
            throw new \Exception('No puedes modificar los datos financieros de la orden de compra porque la cuenta por pagar ya tiene pagos registrados');
        }

        $dueDate = $this->resolvePurchaseOrderDueDate($order);

        $accountsPayable->fill([
            'business_id' => $order->business_id,
            'business_branch_id' => $order->business_branch_id,
            'warehouse_id' => $order->warehouse_id,
            'supplier_id' => $order->supplier_id,
            'document_type' => 'Orden compra',
            'series' => null,
            'sequence' => null,
            'issue_date' => $order->issue_date,
            'due_date' => $dueDate,
            'currency' => $order->currency,
            'payment_condition' => $order->payment_condition,
            'subtotal' => $order->subtotal,
            'tax_amount' => $order->tax_amount,
            'total' => $order->total,
            'observations' => $order->observations,
            'status' => true,
            'updated_by' => $order->updated_by,
        ]);
        $accountsPayable->save();

        $this->syncInstallmentsFromPurchaseOrder($accountsPayable, $order);

        return $this->recalculateFromPayments($accountsPayable->fresh());
    }

    public function syncFromPurchaseReceipt(PurchaseReceipt $receipt): ?AccountsPayable
    {
        $receipt->loadMissing('supplier', 'business', 'branch', 'warehouse', 'purchaseOrder');

        if ($receipt->purchaseOrder && $this->shouldUsePurchaseOrderSource($receipt->purchaseOrder)) {
            return $this->syncFromPurchaseOrder($receipt->purchaseOrder);
        }

        $isConfirmed = (bool)$receipt->status && $receipt->receipt_status === 'confirmed';

        $accountsPayable = AccountsPayable::query()
            ->where('source_type', 'purchase_receipt')
            ->where('source_id', $receipt->id)
            ->first();

        if (!$accountsPayable) {
            $accountsPayable = new AccountsPayable([
                'source_type' => 'purchase_receipt',
                'source_id' => $receipt->id,
            ]);
        }

        $accountsPayable->loadMissing('payments');
        $hasPayments = $accountsPayable->exists && $accountsPayable->payments()->where('status', 1)->exists();

        if (!$isConfirmed) {
            if ($accountsPayable->exists) {
                if ($hasPayments) {
                    throw new \Exception('No puedes anular o desactivar una recepcion con pagos registrados');
                }
                $accountsPayable->delete();
            }
            return null;
        }

        if (!$accountsPayable->exists) {
            $accountsPayable->code = $this->nextCode();
            $accountsPayable->created_by = $receipt->created_by;
        } elseif ($hasPayments && $this->hasLockedFinancialChanges($accountsPayable, $receipt)) {
            throw new \Exception('No puedes modificar los datos financieros de la recepcion porque la cuenta por pagar ya tiene pagos registrados');
        }

        $dueDate = $receipt->first_due_date ?: $receipt->issue_date;

        $accountsPayable->fill([
            'business_id' => $receipt->business_id,
            'business_branch_id' => $receipt->business_branch_id,
            'warehouse_id' => $receipt->warehouse_id,
            'supplier_id' => $receipt->supplier_id,
            'document_type' => $receipt->document_type,
            'series' => $receipt->document_series,
            'sequence' => $receipt->document_sequence,
            'issue_date' => $receipt->issue_date,
            'due_date' => $dueDate,
            'currency' => $receipt->currency,
            'payment_condition' => $receipt->payment_condition,
            'subtotal' => $receipt->subtotal,
            'tax_amount' => $receipt->tax_amount,
            'total' => $receipt->total,
            'observations' => $receipt->observations,
            'status' => $isConfirmed,
            'updated_by' => $receipt->updated_by,
        ]);
        $accountsPayable->save();

        $this->syncInstallments($accountsPayable, $receipt);

        return $this->recalculateFromPayments($accountsPayable->fresh());
    }

    public function recalculateFromPayments(AccountsPayable $accountsPayable): AccountsPayable
    {
        $accountsPayable->loadMissing('installments');

        $installments = $accountsPayable->installments()->orderBy('installment_number')->get();
        $payments = $accountsPayable->payments()
            ->where('status', 1)
            ->orderBy('payment_date')
            ->orderBy('id')
            ->get();

        if ($installments->isEmpty()) {
            return $accountsPayable->fresh(['installments', 'payments']);
        }

        if ((float)$payments->sum('amount') - (float)$accountsPayable->total > 0.0001) {
            throw new \Exception('Los pagos registrados exceden el total de la cuenta por pagar');
        }

        if ($accountsPayable->payment_condition === 'Contado' && $payments->isEmpty()) {
            $paidAt = $accountsPayable->issue_date instanceof Carbon
                ? $accountsPayable->issue_date->copy()->endOfDay()
                : Carbon::parse($accountsPayable->issue_date)->endOfDay();

            foreach ($installments as $installment) {
                $amount = round((float)$installment->amount, 2);
                $installment->update([
                    'paid_amount' => $amount,
                    'balance_amount' => 0,
                    'paid_at' => $paidAt,
                    'payment_status' => 'paid',
                ]);
            }

            $accountsPayable->update([
                'paid_amount' => round((float)$accountsPayable->total, 2),
                'balance_amount' => 0,
                'payment_status' => 'paid',
            ]);

            return $accountsPayable->fresh([
                'business',
                'branch',
                'warehouse',
                'supplier',
                'installments',
                'payments.creator',
                'creator',
                'updater',
            ]);
        }

        $paymentBuckets = $payments->map(function ($payment) {
            return [
                'remaining' => round((float)$payment->amount, 2),
                'paid_at' => $payment->payment_date instanceof Carbon
                    ? $payment->payment_date->copy()->endOfDay()
                    : Carbon::parse($payment->payment_date)->endOfDay(),
            ];
        })->values()->all();

        $totalPaid = 0;

        foreach ($installments as $installment) {
            $remainingInstallment = round((float)$installment->amount, 2);
            $appliedAmount = 0;
            $lastPaidAt = null;

            foreach ($paymentBuckets as &$bucket) {
                if ($remainingInstallment <= 0) break;
                if ($bucket['remaining'] <= 0) continue;

                $applied = min($remainingInstallment, $bucket['remaining']);
                if ($applied <= 0) continue;

                $bucket['remaining'] = max(0, round($bucket['remaining'] - $applied, 2));
                $remainingInstallment = max(0, round($remainingInstallment - $applied, 2));
                $appliedAmount = round($appliedAmount + $applied, 2);
                $lastPaidAt = $bucket['paid_at'];
            }
            unset($bucket);

            $paymentStatus = 'pending';
            if ($appliedAmount > 0 && $remainingInstallment > 0) {
                $paymentStatus = 'partial';
            } elseif ($remainingInstallment <= 0) {
                $paymentStatus = 'paid';
            }

            $installment->update([
                'paid_amount' => $appliedAmount,
                'balance_amount' => $remainingInstallment,
                'paid_at' => $lastPaidAt,
                'payment_status' => $paymentStatus,
            ]);

            $totalPaid = round($totalPaid + $appliedAmount, 2);
        }

        $balanceAmount = max(0, round((float)$accountsPayable->total - $totalPaid, 2));
        $paymentStatus = 'pending';
        if ($totalPaid > 0 && $balanceAmount > 0) {
            $paymentStatus = 'partial';
        } elseif ($balanceAmount <= 0) {
            $paymentStatus = 'paid';
        }

        $accountsPayable->update([
            'paid_amount' => $totalPaid,
            'balance_amount' => $balanceAmount,
            'payment_status' => $paymentStatus,
        ]);

        return $accountsPayable->fresh([
            'business',
            'branch',
            'warehouse',
            'supplier',
            'installments',
            'payments.creator',
            'creator',
            'updater',
        ]);
    }

    private function syncInstallments(AccountsPayable $accountsPayable, PurchaseReceipt $receipt): void
    {
        AccountsPayableInstallment::where('accounts_payable_id', $accountsPayable->id)->delete();

        $installments = max(1, (int)($receipt->installments ?: 1));
        $baseDate = $receipt->first_due_date ?: $receipt->issue_date;
        $baseTotal = round((float)$receipt->total, 2);
        $splitBase = $installments > 0 ? round($baseTotal / $installments, 2) : $baseTotal;
        $running = 0;

        for ($number = 1; $number <= $installments; $number++) {
            $amount = $number === $installments
                ? round($baseTotal - $running, 2)
                : $splitBase;
            $running += $amount;

            AccountsPayableInstallment::create([
                'accounts_payable_id' => $accountsPayable->id,
                'installment_number' => $number,
                'due_date' => $baseDate?->copy()?->addMonths($number - 1) ?? null,
                'amount' => $amount,
                'paid_amount' => 0,
                'balance_amount' => $amount,
                'paid_at' => null,
                'payment_status' => 'pending',
                'status' => true,
            ]);
        }
    }

    private function purgeLegacyReceiptPayablesForOrder(PurchaseOrder $order): void
    {
        $relatedReceiptIds = PurchaseReceipt::query()
            ->where('purchase_order_id', $order->id)
            ->pluck('id');

        if ($relatedReceiptIds->isEmpty()) {
            return;
        }

        $legacyPayables = AccountsPayable::query()
            ->where('source_type', 'purchase_receipt')
            ->whereIn('source_id', $relatedReceiptIds)
            ->get();

        foreach ($legacyPayables as $legacyPayable) {
            $legacyHasPayments = $legacyPayable->payments()->where('status', 1)->exists();
            if ($legacyHasPayments) {
                throw new \Exception('La orden de compra ya tiene pagos registrados en cuentas por pagar previas creadas desde recepciones y no se puede migrar automaticamente');
            }

            AccountsPayableInstallment::where('accounts_payable_id', $legacyPayable->id)->delete();
            $legacyPayable->delete();
        }
    }

    private function syncInstallmentsFromPurchaseOrder(AccountsPayable $accountsPayable, PurchaseOrder $order): void
    {
        AccountsPayableInstallment::where('accounts_payable_id', $accountsPayable->id)->delete();

        $dueDate = $this->resolvePurchaseOrderDueDate($order);
        $amount = round((float)$order->total, 2);

        AccountsPayableInstallment::create([
            'accounts_payable_id' => $accountsPayable->id,
            'installment_number' => 1,
            'due_date' => $dueDate,
            'amount' => $amount,
            'paid_amount' => 0,
            'balance_amount' => $amount,
            'paid_at' => null,
            'payment_status' => 'pending',
            'status' => true,
        ]);
    }

    private function hasLockedFinancialChanges(AccountsPayable $accountsPayable, PurchaseReceipt $receipt): bool
    {
        $currentDueDate = $receipt->first_due_date ?: $receipt->issue_date;

        return $this->normalizeNullableString($accountsPayable->document_type) !== $this->normalizeNullableString($receipt->document_type)
            || $this->normalizeNullableString($accountsPayable->series) !== $this->normalizeNullableString($receipt->document_series)
            || $this->normalizeNullableString($accountsPayable->sequence) !== $this->normalizeNullableString($receipt->document_sequence)
            || $this->normalizeDateString($accountsPayable->issue_date) !== $this->normalizeDateString($receipt->issue_date)
            || $this->normalizeDateString($accountsPayable->due_date) !== $this->normalizeDateString($currentDueDate)
            || $this->normalizeNullableString($accountsPayable->currency) !== $this->normalizeNullableString($receipt->currency)
            || $this->normalizeNullableString($accountsPayable->payment_condition) !== $this->normalizeNullableString($receipt->payment_condition)
            || round((float)$accountsPayable->subtotal, 2) !== round((float)$receipt->subtotal, 2)
            || round((float)$accountsPayable->tax_amount, 2) !== round((float)$receipt->tax_amount, 2)
            || round((float)$accountsPayable->total, 2) !== round((float)$receipt->total, 2);
    }

    private function hasLockedFinancialChangesFromPurchaseOrder(AccountsPayable $accountsPayable, PurchaseOrder $order): bool
    {
        $currentDueDate = $this->resolvePurchaseOrderDueDate($order);
        $accountsPayable->loadMissing('installments');

        return (int)$accountsPayable->supplier_id !== (int)$order->supplier_id
            || $this->normalizeNullableString($accountsPayable->document_type) !== 'Orden compra'
            || $this->normalizeDateString($accountsPayable->issue_date) !== $this->normalizeDateString($order->issue_date)
            || $this->normalizeDateString($accountsPayable->due_date) !== $this->normalizeDateString($currentDueDate)
            || $this->normalizeNullableString($accountsPayable->currency) !== $this->normalizeNullableString($order->currency)
            || $this->normalizeNullableString($accountsPayable->payment_condition) !== $this->normalizeNullableString($order->payment_condition)
            || round((float)$accountsPayable->subtotal, 2) !== round((float)$order->subtotal, 2)
            || round((float)$accountsPayable->tax_amount, 2) !== round((float)$order->tax_amount, 2)
            || round((float)$accountsPayable->total, 2) !== round((float)$order->total, 2)
            || $accountsPayable->installments()->count() !== 1;
    }

    private function normalizeNullableString($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        return $text === '' ? null : $text;
    }

    private function normalizeDateString($value): ?string
    {
        if (!$value) return null;
        if ($value instanceof Carbon) return $value->format('Y-m-d');
        return Carbon::parse($value)->format('Y-m-d');
    }

    private function isEligiblePurchaseOrderSource(PurchaseOrder $order): bool
    {
        return (bool)$order->status
            && $order->payment_condition === 'Credito'
            && $order->order_status !== 'cancelled';
    }

    private function shouldUsePurchaseOrderSource(PurchaseOrder $order): bool
    {
        if ($order->payment_condition === 'Credito') {
            return true;
        }

        return AccountsPayable::query()
            ->where('source_type', 'purchase_order')
            ->where('source_id', $order->id)
            ->exists();
    }

    private function resolvePurchaseOrderDueDate(PurchaseOrder $order): ?Carbon
    {
        if ($order->expected_date) {
            return $order->expected_date instanceof Carbon
                ? $order->expected_date->copy()
                : Carbon::parse($order->expected_date);
        }

        return $order->issue_date instanceof Carbon
            ? $order->issue_date->copy()
            : Carbon::parse($order->issue_date);
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = AccountsPayable::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }
        return 'CXP-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }
}
