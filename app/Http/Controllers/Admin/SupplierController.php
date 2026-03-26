<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use SoDe\Extend\Response;

class SupplierController extends BasicController
{
    public $model = Supplier::class;
    public $reactView = 'Admin/Suppliers';
    public $prefix4filter = 'suppliers';

    public function setPaginationInstance(string $model)
    {
        return $model::select('suppliers.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'suppliers.created_by')
            ->join('users as updater', 'updater.id', '=', 'suppliers.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $ruc = preg_replace('/\D+/', '', (string)($body['ruc'] ?? ''));
        $businessName = trim((string)($body['business_name'] ?? ''));

        if ($ruc === '' || strlen($ruc) !== 11) {
            throw new \Exception('El RUC debe tener 11 digitos');
        }
        if ($businessName === '') {
            throw new \Exception('La razon social es obligatoria');
        }

        $existsRuc = Supplier::where('ruc', $ruc)
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($existsRuc) {
            throw new \Exception('Ya existe un proveedor con este RUC');
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }
        $body['updated_by'] = $userId;
        $body['ruc'] = $ruc;
        $body['business_name'] = $businessName;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();

            $this->model::where($this->identifier, $request->id)->update($data);

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            $this->model::where($this->identifier, $request->id)->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function lookupByRuc(Request $request, string $ruc): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $normalizedRuc = preg_replace('/\D+/', '', (string)$ruc);
            if (strlen($normalizedRuc) !== 11) {
                throw new \Exception('El RUC debe tener 11 digitos');
            }

            $existing = Supplier::where('ruc', $normalizedRuc)->whereNotNull('status')->first();
            if ($existing) {
                throw new \Exception('El proveedor ya existe. Seleccionalo de la lista o usa otro RUC');
            }

            $token = env('DEVEX_PEOPLE_API_TOKEN');
            if (!$token) {
                throw new \Exception('No se ha configurado DEVEX_PEOPLE_API_TOKEN en .env');
            }

            $url = rtrim(env('DEVEX_PEOPLE_API_URL', 'https://devex.pe/client-api/people/ruc'), '/') . '/' . $normalizedRuc;
            $apiResponse = Http::acceptJson()
                ->withToken($token)
                ->timeout(15)
                ->get($url);

            if (!$apiResponse->ok()) {
                $response->status = 200;
                $response->message = 'No se encontro informacion para este RUC en el servicio externo';
                $response->data = [
                    'found' => false,
                    'provider' => null,
                ];
                return response($response->toArray(), $response->status);
            }

            $json = $apiResponse->json();
            $person = $json['data'] ?? null;
            if (!$person) {
                $response->status = 200;
                $response->message = 'No se encontro informacion para este RUC en el servicio externo';
                $response->data = [
                    'found' => false,
                    'provider' => null,
                ];
                return response($response->toArray(), $response->status);
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'found' => true,
                'provider' => [
                    'ruc' => $normalizedRuc,
                    'business_name' => trim((string)($person['fullname'] ?? $person['name'] ?? '')),
                    'address' => trim((string)($person['full_address'] ?? $person['address'] ?? '')),
                    'email_1' => trim((string)($person['email'] ?? '')) ?: null,
                    'mobile' => trim((string)($person['phone'] ?? '')) ?: null,
                ],
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }
}
