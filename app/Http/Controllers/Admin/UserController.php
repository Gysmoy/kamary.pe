<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Driver;
use App\Models\User;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\File;
use SoDe\Extend\JSON;
use Spatie\Permission\Models\Role;

class UserController extends BasicController
{
    private const ALLOWED_SCOPES = ['kamary-peru', 'kamary-medicals'];

    public $model = User::class;
    public $reactView = 'Admin/Users';
    public $ignoreStatusFilter = true;
    public $identifier = 'uuid';
    public $softDeletion = false;

    public function setReactViewProperties(Request $request)
    {
        $prefixes = JSON::parse(File::get(storage_path('app/utils/phone_prefixes.json')));
        $roles = Role::all(['name']);
        $drivers = Schema::hasTable('drivers')
            ? Driver::query()
                ->whereNotNull('status')
                ->orderBy('full_name')
                ->get(['id', 'code', 'full_name', 'document_number', 'license_number', 'status'])
            : collect();

        return [
            'prefixes' => $prefixes,
            'roles' => $roles,
            'drivers' => $drivers
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::with(['roles', 'driver:id,code,full_name,license_number'])
            ->select('users.*')
            ->selectRaw('users.id AS entity_id');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();

        if (Schema::hasColumn('users', 'scope')) {
            if (array_key_exists('scope', $body)) {
                $body['scope'] = $this->normalizeScopeList($body['scope']);
                if (empty($body['scope'])) {
                    throw new \Exception('Selecciona al menos una empresa para el usuario');
                }
            }
        } else {
            unset($body['scope']);
        }

        if (array_key_exists('storage_client_id', $body)) {
            if (Schema::hasColumn('users', 'storage_client_id')) {
                $body['storage_client_id'] = $body['storage_client_id'] === '' || $body['storage_client_id'] === null
                    ? null
                    : (int) $body['storage_client_id'];
                if ($body['storage_client_id']) {
                    StorageScope::assertClient((int)$body['storage_client_id']);
                }
            } else {
                unset($body['storage_client_id']);
            }
        }

        if (Schema::hasColumn('users', 'fullname')) {
            $fullname = trim(implode(' ', array_filter([
                trim((string)($body['name'] ?? '')),
                trim((string)($body['lastname'] ?? '')),
            ])));
            if ($fullname !== '') {
                $body['fullname'] = $fullname;
            }
        }

        $hasDriverPayload = array_key_exists('is_driver', $body) || array_key_exists('driver_id', $body);

        if ($hasDriverPayload && Schema::hasColumn('users', 'is_driver')) {
            $body['is_driver'] = $this->toBoolean($body['is_driver'] ?? false);
        } else {
            unset($body['is_driver']);
        }

        if ($hasDriverPayload && Schema::hasColumn('users', 'driver_id')) {
            $body['driver_id'] = ($body['is_driver'] ?? false)
                ? $this->resolveDriverId($body)
                : null;
        } else {
            unset($body['driver_id']);
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        if (!$request->has('roles')) return;

        $userJpa = User::find($jpa->id);
        $userJpa->syncRoles($request->roles);
    }

    private function resolveDriverId(array $body): int
    {
        $driverId = $this->toNullableInt($body['driver_id'] ?? null);
        if ($driverId) {
            return Driver::query()->whereNotNull('status')->findOrFail($driverId)->id;
        }

        $fullName = trim((string)($body['fullname'] ?? ''));
        if ($fullName === '') {
            $fullName = trim(implode(' ', array_filter([
                trim((string)($body['name'] ?? '')),
                trim((string)($body['lastname'] ?? '')),
            ])));
        }

        if ($fullName === '') {
            throw new \Exception('Indica el nombre del usuario para vincularlo como conductor');
        }

        $normalizedFullName = $this->normalizeDriverText($fullName);
        $driver = Driver::query()
            ->whereNotNull('status')
            ->get(['id', 'code', 'full_name', 'phone', 'email'])
            ->first(fn($row) => $this->normalizeDriverText($row->full_name) === $normalizedFullName);

        if ($driver) {
            $updates = [];
            if (!$driver->phone && !empty($body['phone'])) $updates['phone'] = trim((string)$body['phone']);
            if (!$driver->email && !empty($body['email'])) $updates['email'] = trim((string)$body['email']);
            if (!empty($updates)) {
                $updates['updated_by'] = Auth::id();
                $driver->update($updates);
            }

            return $driver->id;
        }

        $driver = Driver::create([
            'code' => $this->nextDriverCode(),
            'full_name' => $fullName,
            'phone' => trim((string)($body['phone'] ?? '')) ?: null,
            'email' => trim((string)($body['email'] ?? '')) ?: null,
            'status' => true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return $driver->id;
    }

    private function nextDriverCode(): string
    {
        $next = 1;
        $latest = Driver::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }

        return 'DRV-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }

    private function normalizeDriverText($value): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/', ' ', (string)$value) ?? (string)$value));
    }

    private function normalizeScopeList($value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $value = is_array($decoded) ? $decoded : [$value];
        }

        if (!is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map(
            fn($scope) => mb_strtolower(trim((string)$scope)),
            $value
        ), fn($scope) => in_array($scope, self::ALLOWED_SCOPES, true))));
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        $text = strtolower(trim((string)$value));
        return in_array($text, ['1', 'true', 'activo', 'active', 'si', 'yes', 'on'], true);
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int)$text;
    }
}
