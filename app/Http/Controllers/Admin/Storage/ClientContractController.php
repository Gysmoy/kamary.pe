<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\BasicController;
use App\Models\ClientContract;
use App\Models\ClientContractAnnex;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use SoDe\Extend\Response;

class ClientContractController extends BasicController
{
    public $model = ClientContract::class;
    public $prefix4filter = 'client_contracts';

    private ?string $oldFilePath = null;

    public function setPaginationInstance(string $model)
    {
        return $model::query()
            ->select('client_contracts.*')
            ->with(['annexes' => function ($query) {
                $query->whereNotNull('status')->orderBy('id');
            }])
            ->withCount(['annexes' => function ($query) {
                $query->whereNotNull('status');
            }])
            ->whereHas('client', function ($query) {
                StorageScope::applyClientScope($query);
            })
            ->selectRaw("(SELECT TRIM(CONCAT(COALESCE(users.name, ''), ' ', COALESCE(users.lastname, ''))) FROM users WHERE users.id = client_contracts.created_by LIMIT 1) AS creator_label");
    }

    public function beforeSave(Request $request)
    {
        $body = $request->except(['file', 'annexes']);
        $userId = Auth::id();
        $this->oldFilePath = null;
        $id = $body['id'] ?? null;
        $clientId = (int)($body['client_id'] ?? 0);

        StorageScope::assertClient($clientId);

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
            if ($current?->file_path) {
                $this->oldFilePath = $current->file_path;
            }

            $storedFile = $this->storeContractFile($file, 'client-contracts');
            $body['file_path'] = $storedFile['path'];
            $body['file_name'] = $storedFile['name'];
            $body['file_mime'] = $storedFile['mime'];
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
        foreach ($this->annexFiles($request) as $annexFile) {
            $storedFile = $this->storeContractFile($annexFile, 'client-contract-annexes');
            ClientContractAnnex::query()->create([
                'client_contract_id' => $jpa->id,
                'file_path' => $storedFile['path'],
                'file_name' => $storedFile['name'],
                'file_mime' => $storedFile['mime'],
                'status' => true,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
        }

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
            ->whereHas('client', function ($query) {
                StorageScope::applyClientScope($query);
            })
            ->firstOrFail();

        if (!$contract->file_path || !Storage::disk('public')->exists($contract->file_path)) {
            abort(404, 'Archivo no encontrado');
        }

        return Storage::disk('public')->response(
            $contract->file_path,
            $contract->file_name ?: basename($contract->file_path)
        );
    }

    public function annexFile(Request $request, string $id)
    {
        $annex = ClientContractAnnex::query()
            ->whereKey($id)
            ->whereNotNull('status')
            ->whereHas('contract.client', function ($query) {
                StorageScope::applyClientScope($query);
            })
            ->firstOrFail();

        if (!$annex->file_path || !Storage::disk('public')->exists($annex->file_path)) {
            abort(404, 'Archivo no encontrado');
        }

        return Storage::disk('public')->response(
            $annex->file_path,
            $annex->file_name ?: basename($annex->file_path)
        );
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $updated = $this->storageContractQuery()
                ->where($this->identifier, $id)
                ->update([
                    'status' => null,
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('No se ha eliminado ningun registro');

            ClientContractAnnex::query()
                ->where('client_contract_id', $id)
                ->update([
                    'status' => null,
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

    private function storageContractQuery()
    {
        return $this->model::query()
            ->whereHas('client', fn($query) => StorageScope::applyClientScope($query));
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

    private function annexFiles(Request $request): array
    {
        $files = $request->file('annexes', []);
        if ($files instanceof UploadedFile) {
            return [$files];
        }

        return array_values(array_filter((array)$files, fn($file) => $file instanceof UploadedFile));
    }

    private function storeContractFile(UploadedFile $file, string $folder): array
    {
        $maxBytes = 20 * 1024 * 1024;
        if ($file->getSize() > $maxBytes) {
            throw new \Exception('Cada archivo no debe superar 20MB');
        }

        $allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $allowedExtensions, true)) {
            throw new \Exception('Solo se permiten archivos PDF, Word o imagen');
        }

        $allowedMimeTypes = [
            'pdf' => ['application/pdf', 'application/x-pdf', 'application/acrobat', 'application/vnd.pdf'],
            'doc' => ['application/msword', 'application/vnd.ms-word', 'application/x-cfb', 'application/x-ole-storage'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
        ];
        $genericMimeTypes = ['application/octet-stream', 'application/x-empty', 'binary/octet-stream'];
        $detectedMime = $file->getMimeType();
        $clientMime = $file->getClientMimeType();
        $validMime = in_array($detectedMime, $allowedMimeTypes[$extension] ?? [], true)
            || in_array($clientMime, $allowedMimeTypes[$extension] ?? [], true);

        if (!$validMime && in_array($extension, ['pdf', 'doc', 'docx'], true)) {
            $validMime = in_array($detectedMime, $genericMimeTypes, true)
                || in_array($clientMime, $genericMimeTypes, true);
        }

        if (!$validMime) {
            throw new \Exception('El tipo real del archivo no coincide con el formato permitido');
        }

        $path = $file->store($folder, 'public');
        if (!$path) {
            throw new \Exception('No se pudo guardar el archivo cargado');
        }

        return [
            'path' => $path,
            'name' => $file->getClientOriginalName(),
            'mime' => $detectedMime ?: $clientMime,
        ];
    }
}
