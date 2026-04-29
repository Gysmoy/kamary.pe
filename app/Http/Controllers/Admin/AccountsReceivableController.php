<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\AccountsReceivable;
use App\Models\ReceivablePayment;
use App\Services\AccountsReceivableService;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SoDe\Extend\Response;

class AccountsReceivableController extends BasicController
{
    public $model = AccountsReceivable::class;
    public $reactView = 'Admin/AccountsReceivable';
    public $prefix4filter = 'accounts_receivable';

    public function setReactViewProperties(Request $request)
    {
        return [
            'requiredPermission' => 'accounts-receivable',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $this->baseQuery();
    }

    public function registerPayment(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        DB::beginTransaction();
        try {
            $accountsReceivable = AccountsReceivable::findOrFail($id);

            if (!$accountsReceivable->status) {
                throw new \Exception('La cuenta por cobrar no esta activa');
            }
            if ((float)$accountsReceivable->balance_amount <= 0) {
                throw new \Exception('La cuenta por cobrar ya no tiene saldo pendiente');
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
            if ($amount > ((float)$accountsReceivable->balance_amount + 0.0001)) {
                throw new \Exception('El pago no puede exceder el saldo pendiente');
            }

            $paymentFile = null;
            if ($request->hasFile('payment_file')) {
                $paymentFile = $this->storePaymentFile($request->file('payment_file'));
            }

            ReceivablePayment::create([
                'accounts_receivable_id' => $accountsReceivable->id,
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

            app(AccountsReceivableService::class)->recalculateFromPayments($accountsReceivable->fresh());

            DB::commit();

            $response->status = 200;
            $response->message = 'Pago registrado correctamente';
            $response->data = $this->loadAccountsReceivable($accountsReceivable->id);
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
        $path = "images/receivable_payment/{$filename}";
        abort_unless(Storage::exists($path), 404);
        return Storage::download($path, basename($filename));
    }

    private function baseQuery()
    {
        return AccountsReceivable::select('accounts_receivable.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'client:id,document_number,full_name',
                'eventualClient:id,document_number,business_name',
                'commercialOrder:id,code,order_status,billing_status,issue_date',
                'serviceOrder:id,code,order_status,billing_status,issue_date',
                'installments:id,accounts_receivable_id,installment_number,due_date,amount,paid_amount,balance_amount,paid_at,payment_status,status',
                'payments' => fn($query) => $query
                    ->select('id', 'accounts_receivable_id', 'amount', 'payment_date', 'payment_method', 'bank', 'operation_number', 'payment_file', 'observations', 'status', 'created_by', 'updated_by', 'created_at')
                    ->orderByDesc('payment_date')
                    ->orderByDesc('id'),
                'payments.creator:id,name,lastname,username,fullname',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ]);
    }

    private function loadAccountsReceivable(int $id): AccountsReceivable
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
        Storage::putFileAs('images/receivable_payment', $file, $filename);
        return $filename;
    }
}
