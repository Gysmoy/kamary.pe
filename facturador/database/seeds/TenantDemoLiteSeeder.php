<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class TenantDemoLiteSeeder extends Seeder
{
    /** @var string */
    private $connection = 'tenant';
    /** @var bool */
    private $seedDemoData = false;
    /** @var bool */
    private $seedCompanyDefaults = true;
    /** @var string */
    private $adminEmail = 'admin@gmail.com';
    /** @var string */
    private $adminPassword = '123456';

    public function run()
    {
        if (!$this->hasTable('users')) {
            return;
        }

        $this->seedDemoData = $this->envBool('SEED_DEMO_DATA', false);
        $this->seedCompanyDefaults = $this->envBool('SEED_COMPANY_DEFAULTS', true);
        $this->adminEmail = $this->envString('SEED_ADMIN_EMAIL', 'admin@gmail.com');
        $this->adminPassword = $this->envString('SEED_ADMIN_PASSWORD', '123456');

        $countryId = $this->resolveCountryId();
        $departmentId = $this->resolveDepartmentId($countryId);
        $provinceId = $this->resolveProvinceId($departmentId);
        $districtId = $this->resolveDistrictId($provinceId);

        $soapTypeId = $this->resolveId('soap_types', 'id', '01');
        $identityRucId = $this->resolveId('cat_identity_document_types', 'id', '6');
        $identityDniId = $this->resolveId('cat_identity_document_types', 'id', '1');
        $currencyId = $this->resolveId('cat_currency_types', 'id', 'PEN');
        $unitTypeProductId = $this->resolveId('cat_unit_types', 'id', 'NIU');
        $unitTypeServiceId = $this->resolveId('cat_unit_types', 'id', 'ZZ');
        $affectationIgvId = $this->resolveId('cat_affectation_igv_types', 'id', '10');

        $adminUser = $this->findAdminUser();
        $establishmentId = $this->seedEstablishment(
            $adminUser ? (int) $adminUser->establishment_id : null,
            $countryId,
            $departmentId,
            $provinceId,
            $districtId
        );

        $adminUserId = $this->seedAdminUser($adminUser, $establishmentId, $identityDniId);

        $this->seedConfiguration($soapTypeId);
        $this->seedCompany($identityRucId, $soapTypeId);
        $this->seedSeries($establishmentId);

        if (!$this->seedDemoData) {
            return;
        }

        $customerOneId = $this->seedCustomer(
            '00000001',
            'CLIENTE DEMO DNI',
            $identityDniId,
            $countryId,
            $departmentId,
            $provinceId,
            $districtId,
            $adminUserId
        );

        $customerTwoId = $this->seedCustomer(
            '20111111111',
            'CLIENTE DEMO SAC',
            $identityRucId,
            $countryId,
            $departmentId,
            $provinceId,
            $districtId,
            $adminUserId
        );

        $this->seedCustomerAddress($customerOneId, $countryId, $departmentId, $provinceId, $districtId);
        $this->seedCustomerAddress($customerTwoId, $countryId, $departmentId, $provinceId, $districtId);

        $itemOneId = $this->seedItem([
            'internal_id' => 'PRD-001',
            'description' => 'PRODUCTO DEMO LITE 1',
            'name' => 'PRODUCTO DEMO LITE 1',
            'second_name' => 'UNIDAD',
            'item_type_id' => '01',
            'unit_type_id' => $unitTypeProductId,
            'currency_type_id' => $currencyId,
            'sale_unit_price' => 25.50,
            'purchase_unit_price' => 12.00,
            'stock' => 150,
            'stock_min' => 5,
            'sale_affectation_igv_type_id' => $affectationIgvId,
            'purchase_affectation_igv_type_id' => $affectationIgvId,
        ]);

        $itemTwoId = $this->seedItem([
            'internal_id' => 'PRD-002',
            'description' => 'PRODUCTO DEMO LITE 2',
            'name' => 'PRODUCTO DEMO LITE 2',
            'second_name' => 'UNIDAD',
            'item_type_id' => '01',
            'unit_type_id' => $unitTypeProductId,
            'currency_type_id' => $currencyId,
            'sale_unit_price' => 10.00,
            'purchase_unit_price' => 5.00,
            'stock' => 80,
            'stock_min' => 3,
            'sale_affectation_igv_type_id' => $affectationIgvId,
            'purchase_affectation_igv_type_id' => $affectationIgvId,
        ]);

        $itemThreeId = $this->seedItem([
            'internal_id' => 'SRV-001',
            'description' => 'SERVICIO DEMO LITE',
            'name' => 'SERVICIO DEMO LITE',
            'second_name' => 'SERVICIO',
            'item_type_id' => '02',
            'unit_type_id' => $unitTypeServiceId,
            'currency_type_id' => $currencyId,
            'sale_unit_price' => 50.00,
            'purchase_unit_price' => 0,
            'stock' => 0,
            'stock_min' => 0,
            'sale_affectation_igv_type_id' => $affectationIgvId,
            'purchase_affectation_igv_type_id' => $affectationIgvId,
        ]);

        $this->seedItemUnitType($itemOneId, $unitTypeProductId);
        $this->seedItemUnitType($itemTwoId, $unitTypeProductId);
        $this->seedItemUnitType($itemThreeId, $unitTypeServiceId);
    }

    private function findAdminUser()
    {
        return $this->table('users')
            ->where('email', $this->adminEmail)
            ->orderBy('id')
            ->first();
    }

    private function seedAdminUser($adminUser, $establishmentId, $identityDniId)
    {
        if (!$this->hasTable('users')) {
            return null;
        }

        $now = now();
        if ($adminUser) {
            $updates = $this->filterColumns('users', []);

            if ($establishmentId && $this->hasColumn('users', 'establishment_id') && empty($adminUser->establishment_id)) {
                $updates['establishment_id'] = $establishmentId;
            }
            if ($this->hasColumn('users', 'type') && empty($adminUser->type)) {
                $updates['type'] = 'admin';
            }
            if ($identityDniId && $this->hasColumn('users', 'identity_document_type_id') && empty($adminUser->identity_document_type_id)) {
                $updates['identity_document_type_id'] = $identityDniId;
            }
            if ($this->hasColumn('users', 'number') && empty($adminUser->number)) {
                $updates['number'] = '00000001';
            }
            if ($this->hasColumn('users', 'phone') && empty($adminUser->phone)) {
                $updates['phone'] = '999999999';
            }
            if ($this->hasColumn('users', 'api_token') && empty($adminUser->api_token)) {
                $updates['api_token'] = Str::random(60);
            }

            if (!empty($updates)) {
                if ($this->hasColumn('users', 'updated_at')) {
                    $updates['updated_at'] = $now;
                }
                $this->table('users')->where('id', $adminUser->id)->update($updates);
            }

            return (int) $adminUser->id;
        }

        $insert = $this->filterColumns('users', [
            'name' => 'Administrador Demo',
            'email' => $this->adminEmail,
            'establishment_id' => $establishmentId,
            'type' => 'admin',
            'locked' => 0,
            'identity_document_type_id' => $identityDniId,
            'number' => '00000001',
            'phone' => '999999999',
            'api_token' => Str::random(60),
            'updated_at' => $now,
        ]);

        if ($this->hasColumn('users', 'password')) {
            $insert['password'] = Hash::make($this->adminPassword);
        }
        if ($this->hasColumn('users', 'created_at')) {
            $insert['created_at'] = $now;
        }

        return (int) $this->table('users')->insertGetId($insert);
    }

    private function seedEstablishment($preferredId, $countryId, $departmentId, $provinceId, $districtId)
    {
        if (!$this->hasTable('establishments')) {
            return null;
        }

        $record = null;
        if ($preferredId) {
            $record = $this->table('establishments')->where('id', $preferredId)->first();
        }
        if (!$record) {
            $record = $this->table('establishments')->whereIn('code', ['0000', '0001'])->orderBy('id')->first();
        }
        if (!$record) {
            $record = $this->table('establishments')->orderBy('id')->first();
        }

        if ($record) {
            return (int) $record->id;
        }

        $payload = $this->filterColumns('establishments', [
            'description' => 'Sede Principal Demo',
            'country_id' => $countryId,
            'department_id' => $departmentId,
            'province_id' => $provinceId,
            'district_id' => $districtId,
            'address' => 'Av. Demo 123',
            'email' => $this->adminEmail,
            'telephone' => '999999999',
            'code' => '0001',
            'template_pdf' => 'blank',
            'template_ticket_pdf' => 'blank',
            'trade_address' => 'Av. Demo 123',
            'web_address' => 'http://localhost:8080',
            'aditional_information' => 'Datos de prueba para demo lite',
            'updated_at' => now(),
        ]);

        if ($this->hasColumn('establishments', 'created_at')) {
            $payload['created_at'] = now();
        }

        return (int) $this->table('establishments')->insertGetId($payload);
    }

    private function seedConfiguration($soapTypeId)
    {
        if (!$this->hasTable('configurations')) {
            return;
        }

        $payload = $this->filterColumns('configurations', [
            'send_auto' => 1,
            'cron' => 1,
            'stock' => 1,
            'sunat_alternate_server' => 0,
            'limit_documents' => 0,
            'limit_users' => 10,
            'locked_emission' => 0,
            'locked_users' => 0,
            'quantity_documents' => 0,
            'amount_plastic_bag_taxes' => 0.10,
            'config_system_env' => 1,
            'soap_send_id' => '01',
            'soap_type_id' => $soapTypeId,
            'decimal_quantity' => 2,
            'shipping_time_days' => 4,
            'shipping_time_days_voided' => 0,
            'restrict_receipt_date' => 1,
            'restrict_voided_send' => 0,
            'locked_admin' => 0,
            'updated_at' => now(),
        ]);

        $existing = $this->table('configurations')->orderBy('id')->first();
        if ($existing) {
            $updates = $this->fillMissingColumns($existing, $payload);
            if (!empty($updates)) {
                if ($this->hasColumn('configurations', 'updated_at')) {
                    $updates['updated_at'] = now();
                }
                $this->table('configurations')->where('id', $existing->id)->update($updates);
            }
            return;
        }

        if ($this->hasColumn('configurations', 'created_at')) {
            $payload['created_at'] = now();
        }

        $this->table('configurations')->insert($payload);
    }

    private function seedCompany($identityRucId, $soapTypeId)
    {
        if (!$this->hasTable('companies')) {
            return null;
        }

        $existing = $this->table('companies')->orderBy('id')->first();
        if ($existing) {
            return (int) $existing->id;
        }

        if (!$this->seedCompanyDefaults) {
            return null;
        }

        $payload = $this->filterColumns('companies', [
            'identity_document_type_id' => $identityRucId,
            'number' => '20100066603',
            'name' => 'EMPRESA PRINCIPAL',
            'trade_name' => 'EMPRESA PRINCIPAL',
            'soap_send_id' => '01',
            'soap_type_id' => $soapTypeId,
            'soap_username' => null,
            'soap_password' => null,
            'soap_url' => null,
            'certificate' => null,
            'logo' => null,
            'operation_amazonia' => 0,
            'updated_at' => now(),
        ]);

        if ($this->hasColumn('companies', 'created_at')) {
            $payload['created_at'] = now();
        }

        return (int) $this->table('companies')->insertGetId($payload);
    }

    private function seedSeries($establishmentId)
    {
        if (!$this->hasTable('series')) {
            return;
        }
        if (!$establishmentId) {
            return;
        }

        $seriesMap = [
            '01' => 'F001',
            '03' => 'B001',
            '07' => 'FC01',
            '08' => 'FD01',
        ];

        foreach ($seriesMap as $documentTypeId => $number) {
            if (!$this->existsById('cat_document_types', $documentTypeId)) {
                continue;
            }

            $match = [
                'establishment_id' => $establishmentId,
                'document_type_id' => $documentTypeId,
                'number' => $number,
            ];

            $payload = $this->filterColumns('series', array_merge($match, [
                'contingency' => 0,
                'updated_at' => now(),
            ]));

            $record = $this->table('series')
                ->where('establishment_id', $establishmentId)
                ->where('document_type_id', $documentTypeId)
                ->where('number', $number)
                ->first();

            if ($record) {
                continue;
            }

            if ($this->hasColumn('series', 'created_at')) {
                $payload['created_at'] = now();
            }

            $this->table('series')->insert($payload);
        }
    }

    private function seedCustomer(
        $number,
        $name,
        $identityDocumentTypeId,
        $countryId,
        $departmentId,
        $provinceId,
        $districtId,
        $sellerId
    ) {
        if (!$this->hasTable('persons')) {
            return null;
        }

        $base = $this->filterColumns('persons', [
            'type' => 'customers',
            'identity_document_type_id' => $identityDocumentTypeId,
            'number' => $number,
            'name' => $name,
            'trade_name' => $name,
            'country_id' => $countryId,
            'department_id' => $departmentId,
            'province_id' => $provinceId,
            'district_id' => $districtId,
            'address' => 'Direccion demo',
            'condition' => null,
            'state' => null,
            'email' => 'cliente.demo@example.com',
            'telephone' => '999999999',
            'status' => 1,
            'enabled' => 1,
            'seller_id' => $sellerId,
            'updated_at' => now(),
        ]);

        $record = $this->table('persons')
            ->where('type', 'customers')
            ->where('number', $number)
            ->first();

        if ($record) {
            return (int) $record->id;
        }

        if ($this->hasColumn('persons', 'created_at')) {
            $base['created_at'] = now();
        }

        return (int) $this->table('persons')->insertGetId($base);
    }

    private function seedCustomerAddress($personId, $countryId, $departmentId, $provinceId, $districtId)
    {
        if (!$personId) {
            return;
        }
        if (!$this->hasTable('person_addresses')) {
            return;
        }

        $match = [
            'person_id' => $personId,
            'main' => 1,
        ];

        $payload = $this->filterColumns('person_addresses', [
            'person_id' => $personId,
            'country_id' => $countryId,
            'department_id' => $departmentId,
            'province_id' => $provinceId,
            'district_id' => $districtId,
            'address' => 'Direccion demo',
            'phone' => '999999999',
            'email' => 'cliente.demo@example.com',
            'main' => 1,
        ]);

        $record = $this->table('person_addresses')
            ->where($match)
            ->first();

        if ($record) {
            return;
        }

        $this->table('person_addresses')->insert($payload);
    }

    private function seedItem(array $itemData)
    {
        if (!$this->hasTable('items')) {
            return null;
        }

        $payload = $this->filterColumns('items', [
            'name' => $itemData['name'],
            'second_name' => $itemData['second_name'],
            'description' => $itemData['description'],
            'item_type_id' => $itemData['item_type_id'],
            'internal_id' => $itemData['internal_id'],
            'item_code' => $itemData['internal_id'],
            'item_code_gs1' => null,
            'unit_type_id' => $itemData['unit_type_id'],
            'currency_type_id' => $itemData['currency_type_id'],
            'sale_unit_price' => $itemData['sale_unit_price'],
            'purchase_unit_price' => $itemData['purchase_unit_price'],
            'has_isc' => 0,
            'amount_plastic_bag_taxes' => 0.10,
            'system_isc_type_id' => null,
            'percentage_isc' => 0,
            'suggested_price' => 0,
            'sale_affectation_igv_type_id' => $itemData['sale_affectation_igv_type_id'],
            'purchase_affectation_igv_type_id' => $itemData['purchase_affectation_igv_type_id'],
            'calculate_quantity' => 0,
            'has_igv' => 1,
            'sale_unit_price_set' => null,
            'is_set' => 0,
            'image' => 'imagen-no-disponible.jpg',
            'image_medium' => 'imagen-no-disponible.jpg',
            'image_small' => 'imagen-no-disponible.jpg',
            'stock' => $itemData['stock'],
            'stock_min' => $itemData['stock_min'],
            'lots_enabled' => 0,
            'lot_code' => null,
            'attributes' => json_encode([]),
            'status' => 1,
            'apply_store' => 1,
            'updated_at' => now(),
        ]);

        $record = $this->table('items')
            ->where('internal_id', $itemData['internal_id'])
            ->first();

        if ($record) {
            return (int) $record->id;
        }

        if ($this->hasColumn('items', 'created_at')) {
            $payload['created_at'] = now();
        }

        return (int) $this->table('items')->insertGetId($payload);
    }

    private function seedItemUnitType($itemId, $unitTypeId)
    {
        if (!$itemId || !$unitTypeId) {
            return;
        }
        if (!$this->hasTable('item_unit_types')) {
            return;
        }

        $exists = $this->table('item_unit_types')
            ->where('item_id', $itemId)
            ->where('unit_type_id', $unitTypeId)
            ->exists();

        if ($exists) {
            return;
        }

        $payload = $this->filterColumns('item_unit_types', [
            'description' => 'UND',
            'item_id' => $itemId,
            'unit_type_id' => $unitTypeId,
            'quantity_unit' => 1,
            'price1' => 0,
            'price2' => 0,
            'price3' => 0,
            'price_default' => 2,
        ]);

        $this->table('item_unit_types')->insert($payload);
    }

    private function resolveCountryId()
    {
        $countryId = $this->resolveId('countries', 'id', 'PE');
        if ($countryId) {
            return $countryId;
        }
        return $this->table('countries')->orderBy('id')->value('id');
    }

    private function resolveDepartmentId($countryId)
    {
        if (!$this->hasTable('departments')) {
            return null;
        }
        $query = $this->table('departments')->orderBy('id');
        if ($countryId && $this->hasColumn('departments', 'country_id')) {
            $query->where('country_id', $countryId);
        }
        return $query->value('id');
    }

    private function resolveProvinceId($departmentId)
    {
        if (!$this->hasTable('provinces')) {
            return null;
        }
        $query = $this->table('provinces')->orderBy('id');
        if ($departmentId && $this->hasColumn('provinces', 'department_id')) {
            $query->where('department_id', $departmentId);
        }
        return $query->value('id');
    }

    private function resolveDistrictId($provinceId)
    {
        if (!$this->hasTable('districts')) {
            return null;
        }
        $query = $this->table('districts')->orderBy('id');
        if ($provinceId && $this->hasColumn('districts', 'province_id')) {
            $query->where('province_id', $provinceId);
        }
        return $query->value('id');
    }

    private function resolveId($table, $column, $preferred)
    {
        if (!$this->hasTable($table) || !$this->hasColumn($table, $column)) {
            return null;
        }

        $preferredExists = $this->table($table)->where($column, $preferred)->exists();
        if ($preferredExists) {
            return $preferred;
        }

        return $this->table($table)->orderBy($column)->value($column);
    }

    private function existsById($table, $id)
    {
        if (!$this->hasTable($table)) {
            return false;
        }
        return $this->table($table)->where('id', $id)->exists();
    }

    private function table($table)
    {
        return DB::connection($this->connection)->table($table);
    }

    private function hasTable($table)
    {
        return Schema::connection($this->connection)->hasTable($table);
    }

    private function hasColumn($table, $column)
    {
        if (!$this->hasTable($table)) {
            return false;
        }
        return Schema::connection($this->connection)->hasColumn($table, $column);
    }

    private function filterColumns($table, array $data)
    {
        $filtered = [];
        foreach ($data as $column => $value) {
            if ($this->hasColumn($table, $column)) {
                $filtered[$column] = $value;
            }
        }
        return $filtered;
    }

    private function fillMissingColumns($record, array $data)
    {
        $updates = [];

        foreach ($data as $column => $value) {
            if (!property_exists($record, $column)) {
                continue;
            }

            $current = $record->{$column};
            if ($current === null || $current === '') {
                $updates[$column] = $value;
            }
        }

        return $updates;
    }

    private function envString($key, $default = '')
    {
        $value = env($key);
        if ($value === null || $value === '') {
            return $default;
        }
        return (string) $value;
    }

    private function envBool($key, $default = false)
    {
        $value = env($key, $default);

        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower((string) $value);
        return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
    }
}
