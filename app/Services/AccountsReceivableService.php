<?php

namespace App\Services;

use App\Models\AccountsReceivable;
use App\Models\AccountsReceivableInstallment;
use App\Models\CommercialOrder;
use App\Models\ServiceOrder;
use Illuminate\Support\Carbon;

class AccountsReceivableService
{
    public function syncFromCommercialOrder(CommercialOrder $order): ?AccountsReceivable
    {
        return $this->syncFromSource('commercial_order', $order);
    }

    public function syncFromServiceOrder(ServiceOrder $order): ?AccountsReceivable
    {
        return $this->syncFromSource('service_order', $order);
    }

    public function recalculateFromPayments(AccountsReceivable $accountsReceivable): AccountsReceivable
    {
        $accountsReceivable->loadMissing('installments', 'commercialOrder', 'serviceOrder');

        $installments = $accountsReceivable->installments()->orderBy('installment_number')->get();
        $payments = $accountsReceivable->payments()
            ->where('status', 1)
            ->orderBy('payment_date')
            ->orderBy('id')
            ->get();

        if ($installments->isEmpty()) {
            return $accountsReceivable->fresh(['installments', 'payments']);
        }

        if ((float)$payments->sum('amount') - (float)$accountsReceivable->total > 0.0001) {
            throw new \Exception('Los pagos registrados exceden el total de la cuenta por cobrar');
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

        $balanceAmount = max(0, round((float)$accountsReceivable->total - $totalPaid, 2));
        $paymentStatus = 'pending';
        if ($totalPaid > 0 && $balanceAmount > 0) {
            $paymentStatus = 'partial';
        } elseif ($balanceAmount <= 0) {
            $paymentStatus = 'paid';
        }

        $accountsReceivable->update([
            'paid_amount' => $totalPaid,
            'balance_amount' => $balanceAmount,
            'payment_status' => $paymentStatus,
        ]);

        if ($accountsReceivable->commercialOrder) $this->syncSourceSnapshot($accountsReceivable->commercialOrder, $totalPaid, $balanceAmount, $paymentStatus);
        if ($accountsReceivable->serviceOrder) $this->syncSourceSnapshot($accountsReceivable->serviceOrder, $totalPaid, $balanceAmount, $paymentStatus);

        return $accountsReceivable->fresh([
            'business',
            'branch',
            'warehouse',
            'client',
            'eventualClient',
            'commercialOrder',
            'serviceOrder',
            'installments',
            'payments.creator',
            'creator',
            'updater',
        ]);
    }

    private function syncFromSource(string $sourceType, CommercialOrder|ServiceOrder $order): ?AccountsReceivable
    {
        if ($sourceType === 'commercial_order') {
            $order->loadMissing('client', 'eventualClient', 'business', 'branch', 'warehouse');
        } else {
            $order->loadMissing('client', 'business', 'branch');
        }

        $isActiveSource = (bool) $order->status && !in_array($order->order_status, ['draft', 'cancelled'], true);

        $accountsReceivable = AccountsReceivable::query()
            ->where('source_type', $sourceType)
            ->where('source_id', $order->id)
            ->first();

        if (!$accountsReceivable) {
            $accountsReceivable = new AccountsReceivable([
                'source_type' => $sourceType,
                'source_id' => $order->id,
            ]);
        }

        $accountsReceivable->loadMissing('payments', 'installments');
        $hasPayments = $accountsReceivable->exists && $accountsReceivable->payments()->where('status', 1)->exists();

        if (!$isActiveSource) {
            if ($accountsReceivable->exists) {
                if ($hasPayments) {
                    $message = $sourceType === 'service_order'
                        ? 'No puedes anular o desactivar una orden de servicio con pagos registrados'
                        : 'No puedes anular o desactivar un pedido con pagos registrados';
                    throw new \Exception($message);
                }
                $accountsReceivable->delete();
            }
            $this->syncSourceSnapshot($order, 0, round((float) $order->total, 2), 'pending');
            return null;
        }

        if (!$accountsReceivable->exists) {
            $accountsReceivable->code = $this->nextCode();
            $accountsReceivable->created_by = $order->created_by;
        } elseif ($hasPayments && $this->hasLockedFinancialChanges($accountsReceivable, $order, $sourceType)) {
            $message = $sourceType === 'service_order'
                ? 'No puedes modificar los datos financieros de la orden de servicio porque la cuenta por cobrar ya tiene pagos registrados'
                : 'No puedes modificar los datos financieros del pedido porque la cuenta por cobrar ya tiene pagos registrados';
            throw new \Exception($message);
        }

        $dueDate = $this->resolveDueDate($order, $sourceType);

        $accountsReceivable->fill([
            'business_id' => $order->business_id,
            'business_branch_id' => $order->business_branch_id,
            'warehouse_id' => $sourceType === 'commercial_order' ? $order->warehouse_id : null,
            'client_id' => $order->client_id,
            'eventual_client_id' => $sourceType === 'commercial_order' ? $order->eventual_client_id : null,
            'commercial_order_id' => $sourceType === 'commercial_order' ? $order->id : null,
            'service_order_id' => $sourceType === 'service_order' ? $order->id : null,
            'document_type' => $sourceType === 'commercial_order' ? $order->document_type : $order->expected_document_type,
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
        $accountsReceivable->save();

        $this->syncInstallments($accountsReceivable, $order, $sourceType);

        return $this->recalculateFromPayments($accountsReceivable->fresh());
    }

    private function syncInstallments(AccountsReceivable $accountsReceivable, CommercialOrder|ServiceOrder $order, string $sourceType): void
    {
        AccountsReceivableInstallment::where('accounts_receivable_id', $accountsReceivable->id)->delete();

        $installments = max(1, (int)($order->installments ?: 1));
        $baseDate = $this->resolveDueDate($order, $sourceType);
        $baseTotal = round((float)$order->total, 2);
        $splitBase = $installments > 0 ? round($baseTotal / $installments, 2) : $baseTotal;
        $running = 0;

        for ($number = 1; $number <= $installments; $number++) {
            $amount = $number === $installments
                ? round($baseTotal - $running, 2)
                : $splitBase;
            $running += $amount;

            AccountsReceivableInstallment::create([
                'accounts_receivable_id' => $accountsReceivable->id,
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

    private function resolveDueDate(CommercialOrder|ServiceOrder $order, string $sourceType): ?Carbon
    {
        if ($order->first_due_date) {
            return $order->first_due_date instanceof Carbon
                ? $order->first_due_date->copy()
                : Carbon::parse($order->first_due_date);
        }

        $issueDate = $order->issue_date instanceof Carbon
            ? $order->issue_date->copy()
            : Carbon::parse($order->issue_date);

        if ($order->payment_condition === 'Credito') {
            $days = (int)($order->client?->contract_due_days ?? 0);
            return $issueDate->copy()->addDays(max(0, $days));
        }

        return $issueDate;
    }

    private function hasLockedFinancialChanges(AccountsReceivable $accountsReceivable, CommercialOrder|ServiceOrder $order, string $sourceType): bool
    {
        $currentDueDate = $this->resolveDueDate($order, $sourceType);
        $accountsReceivable->loadMissing('installments');
        $documentType = $sourceType === 'commercial_order' ? $order->document_type : $order->expected_document_type;
        $eventualClientId = $sourceType === 'commercial_order' ? $order->eventual_client_id : null;

        return (int)$accountsReceivable->client_id !== (int)$order->client_id
            || (int)$accountsReceivable->eventual_client_id !== (int)$eventualClientId
            || $this->normalizeNullableString($accountsReceivable->document_type) !== $this->normalizeNullableString($documentType)
            || $this->normalizeDateString($accountsReceivable->issue_date) !== $this->normalizeDateString($order->issue_date)
            || $this->normalizeDateString($accountsReceivable->due_date) !== $this->normalizeDateString($currentDueDate)
            || $this->normalizeNullableString($accountsReceivable->currency) !== $this->normalizeNullableString($order->currency)
            || $this->normalizeNullableString($accountsReceivable->payment_condition) !== $this->normalizeNullableString($order->payment_condition)
            || round((float)$accountsReceivable->subtotal, 2) !== round((float)$order->subtotal, 2)
            || round((float)$accountsReceivable->tax_amount, 2) !== round((float)$order->tax_amount, 2)
            || round((float)$accountsReceivable->total, 2) !== round((float)$order->total, 2)
            || $accountsReceivable->installments()->count() !== max(1, (int)($order->installments ?: 1));
    }

    private function syncSourceSnapshot(CommercialOrder|ServiceOrder $order, float $paidAmount, float $balanceAmount, string $paymentStatus): void
    {
        $order->update([
            'paid_amount' => round($paidAmount, 2),
            'balance_amount' => round($balanceAmount, 2),
            'payment_status' => $paymentStatus,
        ]);
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

    private function nextCode(): string
    {
        $next = 1;
        $latest = AccountsReceivable::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }
        return 'CXC-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }
}
