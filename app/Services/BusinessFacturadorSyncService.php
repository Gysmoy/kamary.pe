<?php

namespace App\Services;

use App\Models\Business;
use App\Models\BusinessBranch;
use Illuminate\Support\Facades\Crypt;
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
}
