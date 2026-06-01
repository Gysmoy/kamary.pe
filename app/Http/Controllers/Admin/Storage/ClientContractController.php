<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\BasicController;
use App\Models\ClientContract;
use App\Models\ClientContractAnnex;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
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
        $body = $request->except(['file', 'annexes', 'annexes[]']);
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
            $this->oldFilePath = null;

            try {
                $this->deleteStoredFile($oldFilePath);
            } catch (\Throwable $th) {
                report($th);
            }
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

        return $this->storedFileResponse($contract->file_path, $contract->file_name, $contract->file_mime, $request->boolean('download'));
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

        return $this->storedFileResponse($annex->file_path, $annex->file_name, $annex->file_mime, $request->boolean('download'));
    }

    public function deleteFile(Request $request, string $id)
    {
        $response = new Response();
        try {
            $contract = $this->storageContractQuery()
                ->whereKey($id)
                ->whereNotNull('status')
                ->firstOrFail();

            if (!$contract->file_path) {
                throw new \Exception('El contrato no tiene documento oficial registrado');
            }

            $filePath = $contract->file_path;
            $contract->update([
                'file_path' => null,
                'file_name' => null,
                'file_mime' => null,
                'updated_by' => Auth::id(),
            ]);

            $this->deleteStoredFile($filePath);

            $response->status = 200;
            $response->message = 'Documento oficial eliminado';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function deleteAnnex(Request $request, string $id)
    {
        $response = new Response();
        try {
            $annex = ClientContractAnnex::query()
                ->whereKey($id)
                ->whereNotNull('status')
                ->whereHas('contract.client', function ($query) {
                    StorageScope::applyClientScope($query);
                })
                ->firstOrFail();

            $filePath = $annex->file_path;
            $annex->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

            $this->deleteStoredFile($filePath);

            $response->status = 200;
            $response->message = 'Anexo eliminado';
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

        return $this->flattenUploadedFiles($files);
    }

    private function storeContractFile(UploadedFile $file, string $folder): array
    {
        if (!$file->isValid()) {
            $fileName = $file->getClientOriginalName() ?: 'archivo';
            throw new \Exception("No se pudo cargar {$fileName}: {$file->getErrorMessage()}");
        }

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

    private function flattenUploadedFiles(mixed $files): array
    {
        if ($files instanceof UploadedFile) {
            return [$files];
        }

        if (!is_array($files)) {
            return [];
        }

        $result = [];
        foreach ($files as $file) {
            array_push($result, ...$this->flattenUploadedFiles($file));
        }

        return $result;
    }

    private function storedFileResponse(?string $path, ?string $name = null, ?string $mime = null, bool $download = false)
    {
        $resolved = $this->resolveStoredFile($path, $name);
        if (!$resolved) {
            abort(404, 'Archivo no encontrado');
        }

        $headers = [];
        if ($mime) {
            $headers['Content-Type'] = $mime;
        }

        if ($resolved['disk'] === 'public') {
            if ($download) {
                return Storage::disk('public')->download(
                    $resolved['path'],
                    $name ?: basename($resolved['path']),
                    $headers
                );
            }

            return Storage::disk('public')->response(
                $resolved['path'],
                $name ?: basename($resolved['path']),
                $headers
            );
        }

        if ($download) {
            return response()->download($resolved['path'], $name ?: basename($resolved['path']), $headers);
        }

        return response()->file($resolved['path'], $headers);
    }

    private function deleteStoredFile(?string $path): void
    {
        $resolved = $this->resolveStoredFile($path);
        if (!$resolved) {
            return;
        }

        if ($resolved['disk'] === 'public') {
            Storage::disk('public')->delete($resolved['path']);
            return;
        }

        @unlink($resolved['path']);
    }

    private function resolveStoredFile(?string $path, ?string $name = null): ?array
    {
        foreach ($this->diskPathCandidates($path, $name) as $candidate) {
            if (Storage::disk('public')->exists($candidate)) {
                return [
                    'disk' => 'public',
                    'path' => $candidate,
                ];
            }
        }

        foreach ($this->absolutePathCandidates($path, $name) as $candidate) {
            $realPath = realpath($candidate);
            if ($realPath && is_file($realPath) && $this->isAllowedFilePath($realPath)) {
                return [
                    'disk' => 'absolute',
                    'path' => $realPath,
                ];
            }
        }

        return null;
    }

    private function diskPathCandidates(?string $path, ?string $name = null): array
    {
        $normalized = $this->normalizeFilePath($path);
        $candidates = [];

        $this->pushDiskPath($candidates, $normalized);

        $trimmed = ltrim($normalized, '/');
        foreach ([
            'storage/app/public/',
            'app/public/',
            'public/storage/',
            'storage/',
            'public/',
        ] as $prefix) {
            if (stripos($trimmed, $prefix) === 0) {
                $this->pushDiskPath($candidates, substr($trimmed, strlen($prefix)));
            }
        }

        foreach ([
            '/storage/app/public/',
            '/app/public/',
            '/public/storage/',
            '/storage/',
            '/public/',
        ] as $needle) {
            $position = stripos($normalized, $needle);
            if ($position !== false) {
                $this->pushDiskPath($candidates, substr($normalized, $position + strlen($needle)));
            }
        }

        foreach ([$this->safeBasename($normalized), $this->safeBasename($name)] as $baseName) {
            if (!$baseName) continue;
            $this->pushDiskPath($candidates, $baseName);
            foreach ([
                'client-contracts',
                'client-contract-annexes',
                'contracts',
                'contract',
                'documents',
                'documentos',
            ] as $folder) {
                $this->pushDiskPath($candidates, "{$folder}/{$baseName}");
            }
        }

        return $candidates;
    }

    private function absolutePathCandidates(?string $path, ?string $name = null): array
    {
        $normalized = $this->normalizeFilePath($path);
        $candidates = [];

        $this->pushAbsolutePath($candidates, $normalized);

        foreach ($this->diskPathCandidates($path, $name) as $candidate) {
            $this->pushAbsolutePath($candidates, storage_path("app/public/{$candidate}"));
            $this->pushAbsolutePath($candidates, public_path($candidate));
            $this->pushAbsolutePath($candidates, public_path("storage/{$candidate}"));
        }

        return $candidates;
    }

    private function normalizeFilePath(?string $path): string
    {
        $value = trim((string)($path ?? ''));
        if ($value === '') {
            return '';
        }

        if (preg_match('#^https?://#i', $value)) {
            $urlPath = parse_url($value, PHP_URL_PATH);
            if (is_string($urlPath) && $urlPath !== '') {
                $value = $urlPath;
            }
        }

        $value = rawurldecode(str_replace('\\', '/', $value));

        return preg_replace('#/+#', '/', $value) ?: '';
    }

    private function pushDiskPath(array &$candidates, ?string $path): void
    {
        $path = trim((string)($path ?? ''));
        if ($path === '') {
            return;
        }

        $path = ltrim($this->normalizeFilePath($path), '/');
        if ($path === '' || preg_match('#(^|/)\.\.(/|$)#', $path)) {
            return;
        }

        if (!in_array($path, $candidates, true)) {
            $candidates[] = $path;
        }
    }

    private function pushAbsolutePath(array &$candidates, ?string $path): void
    {
        $path = trim((string)($path ?? ''));
        if ($path === '') {
            return;
        }

        $path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
        if (!$this->isAbsolutePath($path) || in_array($path, $candidates, true)) {
            return;
        }

        $candidates[] = $path;
    }

    private function safeBasename(?string $path): ?string
    {
        $path = $this->normalizeFilePath($path);
        if ($path === '') {
            return null;
        }

        $baseName = basename($path);

        return $baseName !== '.' && $baseName !== '/' ? $baseName : null;
    }

    private function isAbsolutePath(string $path): bool
    {
        return str_starts_with($path, DIRECTORY_SEPARATOR)
            || preg_match('#^[A-Z]:[\\\\/]#i', $path) === 1;
    }

    private function isAllowedFilePath(string $path): bool
    {
        $normalizedPath = $this->normalizeRealPath($path);

        foreach ([storage_path('app/public'), public_path()] as $root) {
            $realRoot = realpath($root);
            if (!$realRoot) {
                continue;
            }

            $normalizedRoot = rtrim($this->normalizeRealPath($realRoot), '/');
            if ($normalizedPath === $normalizedRoot || str_starts_with($normalizedPath, "{$normalizedRoot}/")) {
                return true;
            }
        }

        return false;
    }

    private function normalizeRealPath(string $path): string
    {
        return strtolower(str_replace('\\', '/', $path));
    }
}
