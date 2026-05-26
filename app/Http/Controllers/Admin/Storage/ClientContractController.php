<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\BasicController;
use App\Models\Client;
use App\Models\ClientContract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ClientContractController extends BasicController
{
    public $model = ClientContract::class;
    public $prefix4filter = 'client_contracts';

    private ?string $oldFilePath = null;

    public function setPaginationInstance(string $model)
    {
        return $model::query()
            ->select('client_contracts.*')
            ->selectRaw("(SELECT TRIM(CONCAT(COALESCE(users.name, ''), ' ', COALESCE(users.lastname, ''))) FROM users WHERE users.id = client_contracts.created_by LIMIT 1) AS creator_label");
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $this->oldFilePath = null;
        $id = $body['id'] ?? null;
        $clientId = (int)($body['client_id'] ?? 0);

        $clientExists = Client::query()
            ->whereKey($clientId)
            ->whereNotNull('status')
            ->where('client_kind', 'regular')
            ->exists();

        if (!$clientExists) {
            throw new \Exception('Cliente no encontrado');
        }

        $contractCode = trim((string)($body['contract_code'] ?? ''));
        if ($contractCode === '') {
            throw new \Exception('El codigo de contrato es obligatorio');
        }

        $startsAt = $this->normalizeDate($body['starts_at'] ?? null, 'Fecha inicio');
        $endsAt = $this->normalizeDate($body['ends_at'] ?? null, 'Fecha fin');
        if ($startsAt > $endsAt) {
            throw new \Exception('La fecha fin no puede ser menor a la fecha inicio');
        }

        $current = $id ? ClientContract::query()->find($id) : null;
        if ($current && (int)$current->client_id !== $clientId) {
            throw new \Exception('El contrato no pertenece al cliente seleccionado');
        }

        $file = $request->file('file');
        if (!$current && !$file) {
            throw new \Exception('El archivo del contrato es obligatorio');
        }

        if ($file) {
            $maxBytes = 20 * 1024 * 1024;
            if ($file->getSize() > $maxBytes) {
                throw new \Exception('El archivo no debe superar 20MB');
            }

            $allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, $allowedExtensions, true)) {
                throw new \Exception('Solo se permiten archivos PDF, Word o imagen');
            }

            $allowedMimeTypes = [
                'pdf' => ['application/pdf'],
                'doc' => ['application/msword', 'application/vnd.ms-word', 'application/x-cfb', 'application/x-ole-storage'],
                'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
                'jpg' => ['image/jpeg'],
                'jpeg' => ['image/jpeg'],
                'png' => ['image/png'],
            ];
            $detectedMime = $file->getMimeType();
            $clientMime = $file->getClientMimeType();
            if (
                !in_array($detectedMime, $allowedMimeTypes[$extension] ?? [], true)
                && !in_array($clientMime, $allowedMimeTypes[$extension] ?? [], true)
            ) {
                throw new \Exception('El tipo real del archivo no coincide con el formato permitido');
            }

            if ($current?->file_path) {
                $this->oldFilePath = $current->file_path;
            }

            $path = $file->store('client-contracts', 'public');
            $body['file_path'] = $path;
            $body['file_name'] = $file->getClientOriginalName();
            $body['file_mime'] = $detectedMime ?: $clientMime;
        } elseif ($current) {
            unset($body['file_path'], $body['file_name'], $body['file_mime']);
        }

        if (!$current) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        $body['client_id'] = $clientId;
        $body['contract_code'] = $contractCode;
        $body['starts_at'] = $startsAt;
        $body['ends_at'] = $endsAt;
        $body['updated_by'] = $userId;

        unset($body['file']);

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        if ($this->oldFilePath) {
            $oldFilePath = $this->oldFilePath;
            DB::afterCommit(fn() => Storage::disk('public')->delete($oldFilePath));
            $this->oldFilePath = null;
        }

        return null;
    }

    public function file(Request $request, string $id)
    {
        $contract = ClientContract::query()
            ->whereKey($id)
            ->whereNotNull('status')
            ->firstOrFail();

        if (!$contract->file_path || !Storage::disk('public')->exists($contract->file_path)) {
            abort(404, 'Archivo no encontrado');
        }

        return Storage::disk('public')->download(
            $contract->file_path,
            $contract->file_name ?: basename($contract->file_path)
        );
    }

    private function normalizeDate($value, string $label): string
    {
        $text = trim((string)($value ?? ''));
        if ($text === '') {
            throw new \Exception("{$label} es obligatoria");
        }

        $timestamp = strtotime($text);
        if ($timestamp === false) {
            throw new \Exception("{$label} es invalida");
        }

        return date('Y-m-d', $timestamp);
    }
}
