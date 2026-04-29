<?php

namespace App\Http\Requests\Tenant;

use App\Models\Billing\Configuration;
use App\Models\Billing\Document;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;

/**
 * Class DocumentUpdateRequest
 *
 * @package App\Http\Requests\Tenant
 * @mixin FormRequest
 */
class DocumentUpdateRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        $currencyTypeId = $this->input('currency_type_id');
        $exchangeRateSale = $this->input('exchange_rate_sale');

        if (strtoupper((string)$currencyTypeId) === 'PEN' && (!is_numeric($exchangeRateSale) || (float)$exchangeRateSale <= 0)) {
            $this->merge([
                'exchange_rate_sale' => 1,
            ]);
        }
    }

    /**
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * @return array
     */
    public function rules()
    {
        return [
            'id' => 'required|numeric',
            'customer_id' => [
                'required',
            ],
            'establishment_id' => [
                'required',
            ],
            'series' => [
                'required',
            ],
            'date_of_issue' => [
                'required',
            ],
            'exchange_rate_sale' => [
                'required',
                'numeric',
                'min:0.01'
            ],
        ];
    }

    /**
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $documentId = $this->route('document') ?: $this->route('id') ?: $this->input('id');
            if (!$documentId) {
                return;
            }

            $document = Document::find($documentId);
            if (!$document) {
                return;
            }

            if ((string) $document->state_type_id !== '01') {
                $validator->errors()->add('id', 'Solo se pueden editar comprobantes en estado Registrado.');
                return;
            }

            if (!(bool) $document->is_editable) {
                $validator->errors()->add('id', 'El comprobante no está habilitado para edición.');
                return;
            }

            $shippingTimeDays = 4;
            $restrictReceiptDate = true;

            if (
                Schema::hasColumn('configurations', 'shipping_time_days') &&
                Schema::hasColumn('configurations', 'restrict_receipt_date')
            ) {
                $configuration = Configuration::query()
                    ->select(['shipping_time_days', 'restrict_receipt_date'])
                    ->first();

                if ($configuration) {
                    $shippingTimeDays = (int) $configuration->shipping_time_days > 0
                        ? (int) $configuration->shipping_time_days
                        : 4;
                    $restrictReceiptDate = (bool) $configuration->restrict_receipt_date;
                }
            }

            if ($restrictReceiptDate) {
                $diffDays = Carbon::parse($document->date_of_issue)->diffInDays(Carbon::now());
                if ($diffDays >= $shippingTimeDays) {
                    $validator->errors()->add(
                        'date_of_issue',
                        "No se puede editar un comprobante con más de {$shippingTimeDays} día(s) de emisión."
                    );
                }
            }
        });
    }
}
