<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\AccountsPayable;
use App\Models\AccountsPayablePayment;
use App\Services\AccountsPayableService;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SoDe\Extend\Response;

class AccountsPayableController extends BasicController
{
    public $model = AccountsPayable::class;
    public $reactView = 'Admin/AccountsPayable';
    public $prefix4filter = 'accounts_payable';

    public function setPaginationInstance(string $model)
    {
        return $this->baseQuery();
    }

    public function registerPayment(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        DB::beginTransaction();
        try {
            $accountsPayable = AccountsPayable::findOrFail($id);

            if (!$accountsPayable->status) {
                throw new \Exception('La cuenta por pagar no esta activa');
            }
            if ((float)$accountsPayable->balance_amount <= 0) {
                throw new \Exception('La cuenta por pagar ya no tiene saldo pendiente');
            }

            $amount = $this->toNullableDecimal($request->input('amount'));
            $paymentDate = $this->normalizeDate($request->input('payment_date') ?? now()->toDateString());
            $paymentMethod = trim((string)($request->input('payment_method') ?? ''));
            $bank = trim((string)($request->input('bank') ?? '')) ?: null;
            $operationNumber = trim((string)($request->input('operation_number') ?? '')) ?: null;
            $observations = trim((string)($request->input('observations') ?? '')) ?: null;

            if (is_null($amount) || $amount <= 0) {
                throw new \Exception('El monto del pago debe ser mayor a 0');
            }
            if (!$paymentDate) {
                throw new \Exception('La fecha de pago es obligatoria');
            }
            if ($paymentMethod === '') {
                throw new \Exception('El tipo de pago es obligatorio');
            }
            if ($amount > ((float)$accountsPayable->balance_amount + 0.0001)) {
                throw new \Exception('El pago no puede exceder el saldo pendiente');
            }

            $paymentFile = null;
            if ($request->hasFile('payment_file')) {
                $paymentFile = $this->storePaymentFile($request->file('payment_file'));
            }

            AccountsPayablePayment::create([
                'accounts_payable_id' => $accountsPayable->id,
                'amount' => $amount,
                'payment_date' => $paymentDate,
                'payment_method' => $paymentMethod,
                'bank' => $bank,
                'operation_number' => $operationNumber,
                'payment_file' => $paymentFile,
                'observations' => $observations,
                'status' => true,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            app(AccountsPayableService::class)->recalculateFromPayments($accountsPayable->fresh());

            DB::commit();

            $response->status = 200;
            $response->message = 'Pago registrado correctamente';
            $response->data = $this->loadAccountsPayable($accountsPayable->id);
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function paymentFile(Request $request, string $filename)
    {
        $path = "images/accounts_payable_payment/{$filename}";
        abort_unless(Storage::exists($path), 404);
        return Storage::download($path, basename($filename));
    }

    private function baseQuery()
    {
        return AccountsPayable::select('accounts_payable.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'supplier:id,ruc,business_name',
                'purchaseReceipt:id,code,purchase_order_id,issue_date,receipt_status',
                'purchaseReceipt.purchaseOrder:id,code',
                'installments:id,accounts_payable_id,installment_number,due_date,amount,paid_amount,balance_amount,paid_at,payment_status,status',
                'payments' => fn($query) => $query
                    ->select('id', 'accounts_payable_id', 'amount', 'payment_date', 'payment_method', 'bank', 'operation_number', 'payment_file', 'observations', 'status', 'created_by', 'updated_by', 'created_at')
                    ->orderByDesc('payment_date')
                    ->orderByDesc('id'),
                'payments.creator:id,name,lastname,username,fullname',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ]);
    }

    private function loadAccountsPayable(int $id): AccountsPayable
    {
        return $this->baseQuery()->findOrFail($id);
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) {
            throw new \Exception("Valor numerico invalido: {$value}");
        }
        return (float)$text;
    }

    private function normalizeDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) {
            throw new \Exception("Fecha invalida: {$value}");
        }
        return date('Y-m-d', $timestamp);
    }

    private function storePaymentFile($file): string
    {
        $ext = $file->getClientOriginalExtension();
        $filename = Str::uuid()->toString() . ($ext ? ".{$ext}" : '');
        Storage::putFileAs('images/accounts_payable_payment', $file, $filename);
        return $filename;
    }
}
