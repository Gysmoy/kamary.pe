<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Services\BusinessFacturadorSyncService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use SoDe\Extend\Response;

class BusinessController extends BasicController
{
    public $model = Business::class;
    public $reactView = 'Admin/Businesses';
    public $prefix4filter = 'businesses';

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('businesses.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->whereIn('businesses.business_key', BusinessScope::fixedKeys())
            ->leftJoin('users as creator', 'creator.id', '=', 'businesses.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'businesses.updated_by');

        $scopeKey = $this->resolveScopeKeyForPagination(request());
        if ($scopeKey) {
            $query->where('businesses.business_key', $scopeKey);
        }

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $existing = !empty($body['id']) ? BusinessScope::findFixedBusiness($body['id']) : null;
        $businessKey = $existing?->business_key ?: BusinessScope::normalize($body['business_key'] ?? null);

        if (!$existing) {
            throw new \Exception('Solo se permiten las dos empresas fijas: Kamary Peru y Kamary Medicals');
        }

        if (!BusinessScope::normalize($businessKey)) {
            throw new \Exception('La empresa no tiene una clave fija valida');
        }

        $name = trim((string)($body['name'] ?? $existing?->name ?? ''));
        if ($name === '') {
            throw new \Exception('El nombre de la empresa es obligatorio');
        }

        $body['updated_by'] = $userId;
        $body['business_key'] = $businessKey;
        $body['name'] = $name;
        $body['description'] = array_key_exists('description', $body) ? trim((string)$body['description']) : $existing?->description;
        $body['tax_number'] = array_key_exists('tax_number', $body) ? $this->normalizeTaxNumber($body['tax_number']) : $existing?->tax_number;
        $body['trade_name'] = array_key_exists('trade_name', $body) ? $this->nullableTrim($body['trade_name']) : $existing?->trade_name;
        $body['soap_send_id'] = array_key_exists('soap_send_id', $body) ? $this->normalizeSoapSendId($body['soap_send_id']) : $existing?->soap_send_id;
        $body['soap_type_id'] = array_key_exists('soap_type_id', $body) ? $this->normalizeSoapTypeId($body['soap_type_id']) : $existing?->soap_type_id;
        $body['soap_username'] = array_key_exists('soap_username', $body) ? $this->nullableTrim($body['soap_username']) : $existing?->soap_username;
        $body['soap_password'] = array_key_exists('soap_password', $body) ? $this->nullableTrim($body['soap_password']) : $existing?->soap_password;
        $body['soap_url'] = array_key_exists('soap_url', $body) ? $this->nullableTrim($body['soap_url']) : $existing?->soap_url;
        $body['detraction_account'] = array_key_exists('detraction_account', $body) ? $this->nullableTrim($body['detraction_account']) : $existing?->detraction_account;
        $body['certificate_due'] = array_key_exists('certificate_due', $body) ? $this->normalizeDate($body['certificate_due']) : optional($existing?->certificate_due)->format('Y-m-d');
        $body['operation_amazonia'] = array_key_exists('operation_amazonia', $body) ? $this->toBoolean($body['operation_amazonia']) : (bool) $existing?->operation_amazonia;
        $body['send_document_to_pse'] = array_key_exists('send_document_to_pse', $body) ? $this->toBoolean($body['send_document_to_pse']) : (bool) $existing?->send_document_to_pse;
        $body['url_signature_pse'] = array_key_exists('url_signature_pse', $body) ? $this->nullableTrim($body['url_signature_pse']) : $existing?->url_signature_pse;
        $body['url_send_cdr_pse'] = array_key_exists('url_send_cdr_pse', $body) ? $this->nullableTrim($body['url_send_cdr_pse']) : $existing?->url_send_cdr_pse;
        $body['client_id_pse'] = array_key_exists('client_id_pse', $body) ? $this->nullableTrim($body['client_id_pse']) : $existing?->client_id_pse;
        $body['integrated_query_client_id'] = array_key_exists('integrated_query_client_id', $body) ? $this->nullableTrim($body['integrated_query_client_id']) : $existing?->integrated_query_client_id;
        $body['integrated_query_client_secret'] = array_key_exists('integrated_query_client_secret', $body) ? $this->nullableTrim($body['integrated_query_client_secret']) : $existing?->integrated_query_client_secret;

        $plainCertificatePassword = trim((string) ($body['fiscal_certificate_password'] ?? ''));
        unset($body['fiscal_certificate_password']);
        if ($plainCertificatePassword !== '') {
            $body['fiscal_certificate_password'] = Crypt::encryptString($plainCertificatePassword);
        }

        if ($existing && $this->hasBusinessFiscalChanges($existing, $body, $plainCertificatePassword !== '')) {
            $body['facturador_sync_status'] = 'pending';
            $body['facturador_sync_message'] = 'Configuracion fiscal modificada localmente. Requiere nueva sincronizacion.';
        }

        $body['status'] = true;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return Business::with([
            'creator:id,name,lastname,username,fullname',
            'updater:id,name,lastname,username,fullname',
        ])->find($jpa->id);
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $field = $this->allowedBooleanFieldFromRequest($request);
            if (in_array($field, ['status', 'business_key'], true)) {
                throw new \Exception('No puedes modificar el estado o clave de una empresa fija');
            }

            $data = [];
            $data[$field] = $request->value;
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
            throw new \Exception('No puedes desactivar las empresas fijas');
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        $response->status = 400;
        $response->message = 'No puedes eliminar las empresas fijas';
        return response($response->toArray(), $response->status);
    }

    public function branches(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = BusinessScope::findFixedBusiness($id);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $business->branches()->orderBy('name')->get([
                'id',
                'business_id',
                'name',
                'establishment_code',
                'ubigeo',
                'address',
                'email',
                'telephone',
                'facturador_establishment_id',
                'facturador_sync_status',
                'facturador_sync_message',
                'facturador_last_sync_at',
                'series_factura',
                'series_boleta',
                'series_nota_credito',
                'series_guia',
                'status',
            ]);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function saveBranch(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = BusinessScope::findFixedBusiness($id);
            $userId = Auth::id();
            $input = $request->all();
            $name = trim((string)$request->name);
            $mode = trim((string)($request->mode ?? ''));
            $isUpdate = $mode === 'update';
            $seriesFactura = $this->normalizeSeries($request->series_factura ?? null);
            $seriesBoleta = $this->normalizeSeries($request->series_boleta ?? null);
            $seriesNotaCredito = $this->normalizeSeries($request->series_nota_credito ?? null);
            $seriesGuia = $this->normalizeSeries($request->series_guia ?? null);

            if ($name === '') {
                throw new \Exception('El nombre de la sede es obligatorio');
            }

            $branchId = $isUpdate && is_numeric($request->id) ? (int)$request->id : null;
            $branch = null;
            if ($branchId) {
                $branch = BusinessBranch::where('business_id', $business->id)
                    ->where('id', $branchId)
                    ->first();
                if (!$branch) $branchId = null;
            }

            $establishmentCode = array_key_exists('establishment_code', $input)
                ? $this->normalizeEstablishmentCode($request->establishment_code)
                : $branch?->establishment_code;
            $ubigeo = array_key_exists('ubigeo', $input)
                ? $this->normalizeUbigeo($request->ubigeo)
                : $branch?->ubigeo;
            $address = array_key_exists('address', $input)
                ? $this->nullableTrim($request->address)
                : $branch?->address;
            $email = array_key_exists('email', $input)
                ? $this->normalizeNullableEmail($request->email)
                : $branch?->email;
            $telephone = array_key_exists('telephone', $input)
                ? $this->normalizeTelephone($request->telephone)
                : $branch?->telephone;

            $exists = BusinessBranch::where('business_id', $business->id)
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->when($branchId, fn($query) => $query->where('id', '!=', $branchId))
                ->exists();
            if ($exists) {
                throw new \Exception('Ya existe una sede con ese nombre para esta empresa');
            }

            if ($establishmentCode !== null) {
                $existsCode = BusinessBranch::where('business_id', $business->id)
                    ->where('establishment_code', $establishmentCode)
                    ->when($branchId, fn($query) => $query->where('id', '!=', $branchId))
                    ->exists();
                if ($existsCode) {
                    throw new \Exception('Ya existe una sede con ese codigo fiscal para esta empresa');
                }
            }

            $requiresFiscalResync = !$branch
                || $branch->name !== $name
                || $branch->establishment_code !== $establishmentCode
                || $branch->ubigeo !== $ubigeo
                || $branch->address !== $address
                || $branch->email !== $email
                || $branch->telephone !== $telephone;
            $requiresSeriesResync = !$branch
                || $branch->series_factura !== $seriesFactura
                || $branch->series_boleta !== $seriesBoleta
                || $branch->series_nota_credito !== $seriesNotaCredito
                || $branch->series_guia !== $seriesGuia;

            if ($isUpdate && $branch) {
                $payload = [
                    'name' => $name,
                    'establishment_code' => $establishmentCode,
                    'ubigeo' => $ubigeo,
                    'address' => $address,
                    'email' => $email,
                    'telephone' => $telephone,
                    'series_factura' => $seriesFactura,
                    'series_boleta' => $seriesBoleta,
                    'series_nota_credito' => $seriesNotaCredito,
                    'series_guia' => $seriesGuia,
                    'status' => $request->status ?? $branch->status,
                    'updated_by' => $userId,
                ];

                if ($requiresFiscalResync || $requiresSeriesResync) {
                    $payload['facturador_sync_status'] = 'pending';
                    $payload['facturador_sync_message'] = 'Sucursal o series modificadas localmente. Requiere nueva sincronizacion.';
                }

                $branch->update($payload);
            } else {
                $branch = BusinessBranch::create([
                    'business_id' => $business->id,
                    'name' => $name,
                    'establishment_code' => $establishmentCode,
                    'ubigeo' => $ubigeo,
                    'address' => $address,
                    'email' => $email,
                    'telephone' => $telephone,
                    'facturador_establishment_id' => null,
                    'facturador_sync_status' => 'pending',
                    'facturador_sync_message' => 'Sucursal pendiente de sincronizar.',
                    'facturador_last_sync_at' => null,
                    'series_factura' => $seriesFactura,
                    'series_boleta' => $seriesBoleta,
                    'series_nota_credito' => $seriesNotaCredito,
                    'series_guia' => $seriesGuia,
                    'status' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $branch->fresh();
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function branchBoolean(Request $request, string $id, string $branchId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            BusinessScope::findFixedBusiness($id);
            $field = trim((string)$request->field);
            if (!in_array($field, ['status'], true)) {
                throw new \Exception('Campo no permitido para esta operacion');
            }

            $data = [];
            $data[$field] = $request->value;

            BusinessBranch::where('business_id', $id)
                ->where('id', $branchId)
                ->update(array_merge($data, [
                    'facturador_sync_status' => 'pending',
                    'facturador_sync_message' => 'Estado de sucursal modificado localmente. Requiere nueva sincronizacion.',
                    'updated_by' => Auth::id(),
                ]));

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function deleteBranch(Request $request, string $id, string $branchId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            BusinessScope::findFixedBusiness($id);
            $branch = BusinessBranch::where('business_id', $id)
                ->where('id', $branchId)
                ->firstOrFail();

            if ($branch->facturador_establishment_id || $branch->facturador_sync_status === 'success') {
                throw new \Exception('No puedes eliminar una sucursal ya sincronizada. Desactiva la sede y vuelve a sincronizar.');
            }

            $deleted = $branch->delete();

            if (!$deleted) throw new \Exception('No se ha eliminado ningun registro');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function uploadFiscalAssets(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $business = BusinessScope::findFixedBusiness($id);

            if ($request->hasFile('logo')) {
                $logo = $request->file('logo');
                $extension = strtolower((string) $logo->getClientOriginalExtension());
                if (!in_array($extension, ['png', 'jpg', 'jpeg', 'gif', 'svg'], true)) {
                    throw new \Exception('El logo debe ser png, jpg, jpeg, gif o svg');
                }

                $logoName = 'business_' . $business->id . '_logo.' . $extension;
                $logoPath = 'business-fiscal/logos/' . $logoName;
                Storage::disk('public')->putFileAs('business-fiscal/logos', $logo, $logoName);
                $business->fiscal_logo_path = $logoPath;
                $business->facturador_logo_synced_at = null;
            }

            $certificatePassword = trim((string) $request->input('certificate_password', ''));
            if ($request->hasFile('certificate')) {
                $certificate = $request->file('certificate');
                $extension = strtolower((string) $certificate->getClientOriginalExtension());
                if (!in_array($extension, ['pfx', 'p12'], true)) {
                    throw new \Exception('El certificado debe estar en formato .pfx o .p12');
                }

                if ($certificatePassword === '') {
                    throw new \Exception('La clave del certificado es obligatoria al cargar el certificado');
                }

                $certificateName = 'business_' . $business->id . '_certificate.' . $extension;
                $certificatePath = 'business-fiscal/certificates/' . $certificateName;
                Storage::disk('local')->putFileAs('business-fiscal/certificates', $certificate, $certificateName);
                $business->fiscal_certificate_path = $certificatePath;
                $business->fiscal_certificate_password = Crypt::encryptString($certificatePassword);
                $business->facturador_certificate_synced_at = null;
            } elseif ($certificatePassword !== '') {
                $business->fiscal_certificate_password = Crypt::encryptString($certificatePassword);
                $business->facturador_certificate_synced_at = null;
            }

            $business->facturador_sync_status = 'pending';
            $business->facturador_sync_message = 'Archivos fiscales modificados localmente. Requiere nueva sincronizacion.';
            $business->updated_by = Auth::id();
            $business->save();

            $response->status = 200;
            $response->message = 'Archivos fiscales guardados correctamente';
            $response->data = $business->fresh(['creator:id,name,lastname,username,fullname', 'updater:id,name,lastname,username,fullname']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function deleteFiscalAsset(Request $request, string $id, string $type): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $business = BusinessScope::findFixedBusiness($id);
            if ($type === 'logo') {
                if ($business->fiscal_logo_path) {
                    Storage::disk('public')->delete($business->fiscal_logo_path);
                }
                $business->fiscal_logo_path = null;
                $business->facturador_logo_synced_at = null;
            } elseif ($type === 'certificate') {
                if ($business->fiscal_certificate_path) {
                    Storage::disk('local')->delete($business->fiscal_certificate_path);
                }
                $business->fiscal_certificate_path = null;
                $business->fiscal_certificate_password = null;
                $business->facturador_certificate_synced_at = null;
            } else {
                throw new \Exception('Tipo de archivo fiscal no soportado');
            }

            $business->facturador_sync_status = 'pending';
            $business->facturador_sync_message = 'Archivos fiscales modificados localmente. Requiere nueva sincronizacion.';
            $business->updated_by = Auth::id();
            $business->save();

            $response->status = 200;
            $response->message = 'Archivo fiscal eliminado correctamente';
            $response->data = $business->fresh(['creator:id,name,lastname,username,fullname', 'updater:id,name,lastname,username,fullname']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function syncFacturador(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        DB::beginTransaction();

        try {
            $business = BusinessScope::findFixedBusiness($id);
            $sync = app(BusinessFacturadorSyncService::class)->sync($business);
            $record = $sync['record']['data'] ?? [];
            $syncedEstablishments = collect($sync['establishments']['data'] ?? [])->keyBy(function ($item) {
                return strtoupper(trim((string) ($item['code'] ?? '')));
            });

            $business->update([
                'facturador_company_id' => $record['id'] ?? $business->facturador_company_id,
                'facturador_sync_status' => 'success',
                'facturador_sync_message' => 'Configuracion sincronizada correctamente',
                'facturador_last_sync_at' => now(),
                'facturador_logo_synced_at' => isset($sync['logo']) ? now() : $business->facturador_logo_synced_at,
                'facturador_certificate_synced_at' => isset($sync['certificate']) ? now() : $business->facturador_certificate_synced_at,
                'updated_by' => Auth::id(),
            ]);

            if ($syncedEstablishments->isNotEmpty()) {
                $now = now();
                $branches = $business->branches()->get();
                foreach ($branches as $branch) {
                    $code = strtoupper(trim((string) ($branch->establishment_code ?? '')));
                    if ($code === '') {
                        continue;
                    }

                    $matched = $syncedEstablishments->get($code);
                    if (!$matched) {
                        continue;
                    }

                    $branch->update([
                        'facturador_establishment_id' => $matched['id'] ?? $branch->facturador_establishment_id,
                        'facturador_sync_status' => 'success',
                        'facturador_sync_message' => 'Sucursal sincronizada correctamente',
                        'facturador_last_sync_at' => $now,
                        'updated_by' => Auth::id(),
                    ]);
                }
            }

            DB::commit();
            $response->status = 200;
            $response->message = 'Configuracion fiscal sincronizada con el facturador';
            $response->data = $business->fresh([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
                'branches',
            ]);
        } catch (\Throwable $th) {
            DB::rollBack();

            if (!empty($id) && ctype_digit((string) $id)) {
                Business::where('id', $id)->whereIn('business_key', BusinessScope::fixedKeys())->update([
                    'facturador_sync_status' => 'error',
                    'facturador_sync_message' => $th->getMessage(),
                    'updated_by' => Auth::id(),
                ]);
            }

            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function nullableTrim($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);
        return $text === '' ? null : $text;
    }

    private function hasBusinessFiscalChanges(Business $existing, array $payload, bool $certificatePasswordChanged): bool
    {
        if ($certificatePasswordChanged) {
            return true;
        }

        $currentCertificateDue = optional($existing->certificate_due)->format('Y-m-d');

        return $existing->name !== ($payload['name'] ?? $existing->name)
            || $existing->tax_number !== ($payload['tax_number'] ?? $existing->tax_number)
            || $existing->trade_name !== ($payload['trade_name'] ?? $existing->trade_name)
            || $existing->soap_send_id !== ($payload['soap_send_id'] ?? $existing->soap_send_id)
            || $existing->soap_type_id !== ($payload['soap_type_id'] ?? $existing->soap_type_id)
            || $existing->soap_username !== ($payload['soap_username'] ?? $existing->soap_username)
            || $existing->soap_password !== ($payload['soap_password'] ?? $existing->soap_password)
            || $existing->soap_url !== ($payload['soap_url'] ?? $existing->soap_url)
            || $existing->detraction_account !== ($payload['detraction_account'] ?? $existing->detraction_account)
            || $currentCertificateDue !== ($payload['certificate_due'] ?? $currentCertificateDue)
            || (bool) $existing->operation_amazonia !== (bool) ($payload['operation_amazonia'] ?? $existing->operation_amazonia)
            || (bool) $existing->send_document_to_pse !== (bool) ($payload['send_document_to_pse'] ?? $existing->send_document_to_pse)
            || $existing->url_signature_pse !== ($payload['url_signature_pse'] ?? $existing->url_signature_pse)
            || $existing->url_send_cdr_pse !== ($payload['url_send_cdr_pse'] ?? $existing->url_send_cdr_pse)
            || $existing->client_id_pse !== ($payload['client_id_pse'] ?? $existing->client_id_pse)
            || $existing->integrated_query_client_id !== ($payload['integrated_query_client_id'] ?? $existing->integrated_query_client_id)
            || $existing->integrated_query_client_secret !== ($payload['integrated_query_client_secret'] ?? $existing->integrated_query_client_secret);
    }

    private function resolveScopeKeyForPagination(Request $request): ?string
    {
        return BusinessScope::scopedKeyForRequest($request, [
            '/admin/businesses',
            '/admin/billing-settings',
            '/admin/entry-note',
            '/admin/articles',
            '/admin/warehouses',
        ]);
    }

    private function normalizeTaxNumber($value): ?string
    {
        $text = preg_replace('/\D+/', '', (string) $value);
        if ($text === '') {
            return null;
        }

        if (!preg_match('/^\d{11}$/', $text)) {
            throw new \Exception('El RUC de la empresa debe tener 11 digitos');
        }

        return $text;
    }

    private function normalizeSoapSendId($value): ?string
    {
        $text = $this->nullableTrim($value);
        if ($text === null) {
            return null;
        }

        if (!in_array($text, ['01', '02'], true)) {
            throw new \Exception('soap_send_id invalido');
        }

        return $text;
    }

    private function normalizeSoapTypeId($value): ?string
    {
        $text = $this->nullableTrim($value);
        if ($text === null) {
            return null;
        }

        if (!in_array($text, ['01', '02'], true)) {
            throw new \Exception('soap_type_id invalido');
        }

        return $text;
    }

    private function normalizeDate($value): ?string
    {
        $text = $this->nullableTrim($value);
        if ($text === null) {
            return null;
        }

        $timestamp = strtotime($text);
        if ($timestamp === false) {
            throw new \Exception('Fecha invalida');
        }

        return date('Y-m-d', $timestamp);
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    private function normalizeSeries($value): ?string
    {
        $text = strtoupper(trim((string) $value));
        return $text === '' ? null : $text;
    }

    private function normalizeEstablishmentCode($value): ?string
    {
        $text = strtoupper(trim((string) $value));
        if ($text === '') {
            return null;
        }

        if (strlen($text) > 10) {
            throw new \Exception('El codigo fiscal de la sede no puede exceder 10 caracteres');
        }

        if (!preg_match('/^[A-Z0-9-]+$/', $text)) {
            throw new \Exception('El codigo fiscal de la sede solo admite letras, numeros y guion');
        }

        return $text;
    }

    private function normalizeUbigeo($value): ?string
    {
        $text = preg_replace('/\D+/', '', (string) $value);
        if ($text === '') {
            return null;
        }

        if (!preg_match('/^\d{6}$/', $text)) {
            throw new \Exception('El ubigeo de la sede debe tener 6 digitos');
        }

        return $text;
    }

    private function normalizeNullableEmail($value): ?string
    {
        $text = $this->nullableTrim($value);
        if ($text === null) {
            return null;
        }

        if (!filter_var($text, FILTER_VALIDATE_EMAIL)) {
            throw new \Exception('El correo de la sede no tiene un formato valido');
        }

        return $text;
    }

    private function normalizeTelephone($value): ?string
    {
        $text = $this->nullableTrim($value);
        if ($text === null) {
            return null;
        }

        if (strlen($text) > 30) {
            throw new \Exception('El telefono de la sede no puede exceder 30 caracteres');
        }

        return $text;
    }
}
