<?php

namespace App\Http\Controllers\Billing\Api;

use App\Http\Controllers\Controller;
use App\Models\Billing\Catalogs\Country;
use App\Models\Billing\Catalogs\District;
use App\Models\Billing\Establishment;
use App\Models\Billing\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class EstablishmentController extends Controller
{
    public function index()
    {
        return [
            'success' => true,
            'data' => Establishment::query()
                ->orderBy('code')
                ->orderBy('description')
                ->get()
                ->map(fn (Establishment $establishment) => $this->transform($establishment))
                ->values(),
        ];
    }

    public function sync(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'records' => ['required', 'array', 'min:1'],
            'records.*.id' => ['nullable', 'integer'],
            'records.*.code' => ['required', 'string', 'max:10'],
            'records.*.description' => ['required', 'string', 'max:255'],
            'records.*.ubigeo' => ['required', 'digits:6'],
            'records.*.address' => ['required', 'string', 'max:255'],
            'records.*.email' => ['nullable', 'email', 'max:255'],
            'records.*.telephone' => ['nullable', 'string', 'max:30'],
        ]);

        $validator->after(function ($validator) use ($request) {
            $codes = collect($request->input('records', []))
                ->map(fn ($row) => strtoupper(trim((string) ($row['code'] ?? ''))))
                ->filter();

            if ($codes->count() !== $codes->unique()->count()) {
                $validator->errors()->add('records', 'No se permiten codigos de establecimiento repetidos en la misma sincronizacion.');
            }
        });

        $validated = $validator->validate();
        $countryId = $this->resolveCountryId();
        $synced = [];

        DB::connection('tenant')->transaction(function () use ($validated, $countryId, &$synced) {
            foreach ($validated['records'] as $row) {
                $code = strtoupper(trim((string) $row['code']));
                $district = District::query()->with('province.department')->find($row['ubigeo']);
                if (!$district || !$district->province || !$district->province->department) {
                    throw new \RuntimeException("El ubigeo {$row['ubigeo']} no existe en el facturador.");
                }

                $establishment = Establishment::query()->where('code', $code)->first();
                if (!$establishment && !empty($row['id'])) {
                    $establishment = Establishment::query()->find((int) $row['id']);
                }
                if (!$establishment) {
                    $establishment = new Establishment();
                }

                $establishment->description = trim((string) $row['description']);
                $establishment->country_id = $countryId;
                $establishment->department_id = $district->province->department->id;
                $establishment->province_id = $district->province->id;
                $establishment->district_id = $district->id;
                $establishment->address = trim((string) $row['address']);
                $establishment->email = trim((string) ($row['email'] ?? '')) ?: '-';
                $establishment->telephone = trim((string) ($row['telephone'] ?? '')) ?: '-';
                $establishment->code = $code;
                $establishment->save();

                $this->ensureWarehouse($establishment);
                $synced[] = $this->transform($establishment->fresh());
            }
        });

        return [
            'success' => true,
            'message' => 'Sucursales sincronizadas correctamente.',
            'data' => $synced,
        ];
    }

    private function resolveCountryId(): string
    {
        $countryId = Country::query()->where('id', 'PE')->value('id');
        if ($countryId) {
            return (string) $countryId;
        }

        $countryId = Country::query()->orderBy('id')->value('id');
        if ($countryId) {
            return (string) $countryId;
        }

        throw new \RuntimeException('No existe pais configurado para registrar establecimientos.');
    }

    private function ensureWarehouse(Establishment $establishment): void
    {
        if (
            !class_exists(Warehouse::class)
            || !Schema::connection('tenant')->hasTable('warehouses')
            || !Schema::connection('tenant')->hasColumn('warehouses', 'establishment_id')
            || !Schema::connection('tenant')->hasColumn('warehouses', 'description')
        ) {
            return;
        }

        $warehouse = Warehouse::query()->firstOrNew([
            'establishment_id' => $establishment->id,
        ]);

        if (!$warehouse->exists || trim((string) $warehouse->description) === '') {
            $warehouse->description = 'Almacen - ' . $establishment->description;
        }

        if (Schema::connection('tenant')->hasColumn('warehouses', 'active') && $warehouse->active === null) {
            $warehouse->active = true;
        }

        $warehouse->save();
    }

    private function transform(Establishment $establishment): array
    {
        return [
            'id' => $establishment->id,
            'code' => $establishment->code,
            'description' => $establishment->description,
            'ubigeo' => $establishment->district_id,
            'address' => $establishment->address,
            'email' => $establishment->email,
            'telephone' => $establishment->telephone,
        ];
    }
}
