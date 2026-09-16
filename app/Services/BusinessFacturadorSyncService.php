<?php

namespace App\Services;

use App\Models\Business;
use App\Models\BusinessBranch;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BusinessFacturadorSyncService
{
    public function __construct(
        private readonly FacturadorPro5Service $facturadorPro5Service
    ) {
    }

    public function sync(Business $business): array
    {
        $business->loadMissing('branches');
        $this->assertBusinessIsReady($business);
        $this->facturadorPro5Service->forBusiness($business);

        $company = $this->facturadorPro5Service->syncCompany($this->buildCompanyPayload($business));
        $establishments = [];
        $series = [];
        $logo = null;
        $certificate = null;

        if ($business->fiscal_logo_path) {
            $logo = $this->facturadorPro5Service->uploadCompanyLogo(
                $this->resolvePublicStoragePath($business->fiscal_logo_path)
            );
        }

        if ($business->fiscal_certificate_path) {
            $password = $this->resolveCertificatePassword($business);
            if ($password === '') {
                throw new \RuntimeException('La empresa tiene certificado cargado pero no tiene clave de certificado guardada.');
            }

            $certificate = $this->facturadorPro5Service->uploadCompanyCertificate(
                $this->resolveLocalStoragePath($business->fiscal_certificate_path),
                $password
            );
        }

        $establishmentPayload = $this->buildEstablishmentsPayload($business);
        if (!empty($establishmentPayload)) {
            $establishments = $this->facturadorPro5Service->syncEstablishments($establishmentPayload);
            $seriesPayload = $this->buildSeriesPayload($business, $establishments['data'] ?? []);
            if (!empty($seriesPayload)) {
                $series = $this->facturadorPro5Service->syncSeries($seriesPayload);
            }
        }

        $record = $this->facturadorPro5Service->companyRecord();

        return [
            'company' => $company,
            'establishments' => $establishments,
            'series' => $series,
            'logo' => $logo,
            'certificate' => $certificate,
            'record' => $record,
        ];
    }

    public function assertBusinessIsReady(Business $business): void
    {
        $this->ensureBusinessIsReady($business);
    }

    public function buildCompanyPayload(Business $business): array
    {
        return [
            'id' => $business->facturador_company_id,
            'identity_document_type_id' => '6',
            'number' => $business->tax_number,
            'name' => $business->name,
            'trade_name' => $business->trade_name ?: $business->name,
            'address' => $business->fiscal_address,
            'soap_send_id' => $business->soap_send_id ?: '01',
            'soap_type_id' => $business->soap_type_id ?: '01',
            'soap_username' => $business->soap_username,
            'soap_password' => $business->soap_password,
            'soap_url' => $business->soap_url,
            'certificate_due' => optional($business->certificate_due)->format('Y-m-d'),
            'detraction_account' => $business->detraction_account,
            'operation_amazonia' => (bool) $business->operation_amazonia,
            'send_document_to_pse' => (bool) $business->send_document_to_pse,
            'url_signature_pse' => $business->url_signature_pse,
            'url_send_cdr_pse' => $business->url_send_cdr_pse,
            'client_id_pse' => $business->client_id_pse,
            'integrated_query_client_id' => $business->integrated_query_client_id,
            'integrated_query_client_secret' => $business->integrated_query_client_secret,
            'gre_client_id' => $business->gre_client_id,
            'gre_client_secret' => $business->gre_client_secret,
        ];
    }

    private function ensureBusinessIsReady(Business $business): void
    {
        if (trim((string) $business->name) === '') {
            throw new \RuntimeException('La razon social de la empresa es obligatoria.');
        }

        if (!preg_match('/^\d{11}$/', trim((string) $business->tax_number))) {
            throw new \RuntimeException('La empresa debe tener un RUC valido de 11 digitos.');
        }

        if (trim((string) $business->soap_type_id) === '') {
            throw new \RuntimeException('Debes definir el entorno SOAP de la empresa.');
        }

        $requiresSoapCredentials = in_array((string) $business->soap_type_id, ['02'], true)
            || in_array((string) $business->soap_send_id, ['02'], true);

        if ($requiresSoapCredentials) {
            if (trim((string) $business->soap_username) === '') {
                throw new \RuntimeException('Debes registrar el usuario SOAP para produccion u OSE.');
            }

            if (trim((string) $business->soap_password) === '') {
                throw new \RuntimeException('Debes registrar la clave SOAP para produccion u OSE.');
            }
        }
    }

    private function buildEstablishmentsPayload(Business $business): array
    {
        return $business->branches
            ->where('status', true)
            ->values()
            ->map(function (BusinessBranch $branch) {
                if (trim((string) $branch->name) === '') {
                    throw new \RuntimeException('Existe una sucursal activa sin nombre.');
                }

                if (trim((string) ($branch->establishment_code ?? '')) === '') {
                    throw new \RuntimeException("La sucursal {$branch->name} no tiene codigo fiscal configurado.");
                }

                if (trim((string) ($branch->ubigeo ?? '')) === '') {
                    throw new \RuntimeException("La sucursal {$branch->name} no tiene ubigeo configurado.");
                }

                if (trim((string) ($branch->address ?? '')) === '') {
                    throw new \RuntimeException("La sucursal {$branch->name} no tiene direccion fiscal configurada.");
                }

                return [
                    'id' => $branch->facturador_establishment_id,
                    'code' => $branch->establishment_code,
                    'description' => $branch->name,
                    'ubigeo' => $branch->ubigeo,
                    'address' => $branch->address,
                    'email' => $branch->email,
                    'telephone' => $branch->telephone,
                ];
            })
            ->all();
    }

    private function buildSeriesPayload(Business $business, array $syncedEstablishments): array
    {
        $establishmentsByCode = collect($syncedEstablishments)->keyBy(function ($row) {
            return strtoupper(trim((string) ($row['code'] ?? '')));
        });

        $defaultSeries = [
            '01' => trim((string) config('facturadorpro5.series.factura', '')),
            '03' => trim((string) config('facturadorpro5.series.boleta', '')),
            '07' => trim((string) config('facturadorpro5.series.nota_credito', '')),
            '09' => trim((string) config('facturadorpro5.series.guia', '')),
        ];

        $records = [];

        foreach ($business->branches->where('status', true) as $branch) {
            $code = strtoupper(trim((string) ($branch->establishment_code ?? '')));
            if ($code === '') {
                continue;
            }

            $establishment = $establishmentsByCode->get($code);
            $establishmentId = (int) ($establishment['id'] ?? 0);
            if ($establishmentId <= 0) {
                throw new \RuntimeException("No se pudo resolver el establecimiento remoto para la sucursal {$branch->name}.");
            }

            $seriesByType = [
                '01' => trim((string) ($branch->series_factura ?: $defaultSeries['01'])),
                '03' => trim((string) ($branch->series_boleta ?: $defaultSeries['03'])),
                '07' => trim((string) ($branch->series_nota_credito ?: $defaultSeries['07'])),
                '09' => trim((string) ($branch->series_guia ?: $defaultSeries['09'])),
            ];

            foreach ($seriesByType as $documentTypeId => $number) {
                if ($number === '') {
                    continue;
                }

                $records[] = [
                    'establishment_id' => $establishmentId,
                    'document_type_id' => $documentTypeId,
                    'number' => $number,
                ];
            }
        }

        return $records;
    }

    private function resolvePublicStoragePath(string $path): string
    {
        if (!Storage::disk('public')->exists($path)) {
            throw new \RuntimeException('No se encontro el logo fiscal local para sincronizar.');
        }

        return Storage::disk('public')->path($path);
    }

    private function resolveLocalStoragePath(string $path): string
    {
        if (!Storage::disk('local')->exists($path)) {
            throw new \RuntimeException('No se encontro el certificado fiscal local para sincronizar.');
        }

        return Storage::disk('local')->path($path);
    }

    private function resolveCertificatePassword(Business $business): string
    {
        if (!$business->fiscal_certificate_password) {
            return '';
        }

        return Crypt::decryptString($business->fiscal_certificate_password);
    }

    /**
     * Sincroniza y ademas guarda el resultado. Es lo que hacia el controlador; al vivir aqui se
     * puede llamar desde cualquier lado (al guardar una sede, al emitir) y no solo desde el boton.
     *
     * Es idempotente: el facturador actualiza la empresa, empareja los establecimientos por codigo
     * y usa firstOrNew en las series, asi que repetirlo no duplica nada.
     */
    public function syncAndPersist(Business $business, ?int $userId = null): Business
    {
        try {
            $sync = $this->sync($business);

            DB::transaction(function () use ($business, $sync, $userId) {
                $record = $sync['record']['data'] ?? [];
                $business->update([
                    'facturador_company_id' => $record['id'] ?? $business->facturador_company_id,
                    'facturador_sync_status' => 'success',
                    'facturador_sync_message' => 'Configuracion sincronizada correctamente',
                    'facturador_last_sync_at' => now(),
                    'facturador_logo_synced_at' => isset($sync['logo']) ? now() : $business->facturador_logo_synced_at,
                    'facturador_certificate_synced_at' => isset($sync['certificate']) ? now() : $business->facturador_certificate_synced_at,
                    'updated_by' => $userId ?? $business->updated_by,
                ]);

                $sincronizadas = collect($sync['establishments']['data'] ?? [])
                    ->keyBy(fn($item) => strtoupper(trim((string) ($item['code'] ?? ''))));
                if ($sincronizadas->isEmpty()) return;

                foreach ($business->branches()->get() as $branch) {
                    $codigo = strtoupper(trim((string) ($branch->establishment_code ?? '')));
                    $encontrada = $codigo === '' ? null : $sincronizadas->get($codigo);
                    if (!$encontrada) continue;

                    $branch->update([
                        'facturador_establishment_id' => $encontrada['id'] ?? $branch->facturador_establishment_id,
                        'facturador_sync_status' => 'success',
                        'facturador_sync_message' => 'Sucursal sincronizada correctamente',
                        'facturador_last_sync_at' => now(),
                        'updated_by' => $userId ?? $branch->updated_by,
                    ]);
                }
            });

            Cache::forget($this->claveFreno($business));
        } catch (\Throwable $th) {
            // El estado de error se guarda FUERA de cualquier transaccion del que llama: si el
            // llamador hace rollback, igual queda constancia de por que fallo.
            Business::whereKey($business->id)->update([
                'facturador_sync_status' => 'error',
                'facturador_sync_message' => $th->getMessage(),
            ]);
            // Freno: con el facturador caido, no se reintenta en cada intento de emision.
            Cache::put($this->claveFreno($business), $th->getMessage(), now()->addMinutes(10));
            throw $th;
        }

        return $business->fresh(['branches']);
    }

    /**
     * Deja la empresa lista para emitir, sincronizando sola si hace falta.
     *
     * El sistema marca la empresa como "pendiente" cada vez que se edita algo fiscal (una sede, sus
     * series, el logo). Hasta ahora lo unico que la devolvia a "sincronizada" era un boton manual,
     * y mientras tanto no se podia emitir ningun comprobante.
     */
    public function ensureSynced(Business $business): void
    {
        if ($this->pareceSincronizada($business)) return;

        // Solo se sincroniza sola una empresa que YA estuvo sincronizada antes (tiene identificador
        // en el facturador). Dar de alta una empresa nueva sigue siendo manual, porque cada
        // instancia del facturador atiende a una sola empresa y conviene que alguien lo mire.
        if (!$business->facturador_company_id) {
            throw new \RuntimeException('La empresa no esta sincronizada con el facturador interno. Sincronizala desde Sedes y facturacion.');
        }

        if ($motivo = Cache::get($this->claveFreno($business))) {
            throw new \RuntimeException('No se pudo sincronizar automaticamente con el facturador: ' . $motivo);
        }

        $this->syncAndPersist($business);
    }

    /** Intenta sincronizar sin romper lo que el usuario estaba haciendo. */
    public function trySync(Business $business, ?int $userId = null): void
    {
        try {
            $this->syncAndPersist($business, $userId);
        } catch (\Throwable $th) {
            report($th);   // el motivo queda en facturador_sync_message y a la vista en el grid
        }
    }

    private function pareceSincronizada(Business $business): bool
    {
        if (($business->facturador_sync_status ?? null) !== 'success') return false;
        if (!$business->facturador_company_id) return false;

        $business->loadMissing('branches');

        return !$business->branches
            ->filter(fn($b) => $b->status !== null)
            ->contains(fn($b) => $b->facturador_sync_status !== 'success' || !$b->facturador_establishment_id);
    }

    private function claveFreno(Business $business): string
    {
        return 'facturador-autosync-block:' . $business->id;
    }
}
