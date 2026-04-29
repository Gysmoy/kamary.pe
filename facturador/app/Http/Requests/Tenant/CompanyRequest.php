<?php

namespace App\Http\Requests\Tenant;

use App\Models\Billing\Company;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompanyRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $id = $this->input('id');
        if (empty($id)) {
            $id = optional(Company::active())->id;
        }

        return [
            'name' => [
                'required',
                Rule::unique('companies')->ignore($id),
            ],
            'trade_name' => [
                'required',
                Rule::unique('companies')->ignore($id),
            ],
            'number' => [
                'required',
                Rule::unique('companies')->ignore($id),
            ],
            'soap_type_id' => [
                'nullable'
            ],
            'soap_username' => [
                'required_if:soap_type_id,"02"',
                'required_if:soap_send_id,"02"'
            ],
            'soap_password' => [
                'required_if:soap_type_id,"02"',
                'required_if:soap_send_id,"02"'
            ],
        ];
    }
}
