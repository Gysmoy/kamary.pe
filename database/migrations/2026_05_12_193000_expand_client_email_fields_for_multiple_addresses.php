<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!$this->supportsModifyColumn()) {
            return;
        }

        if (Schema::hasTable('clients')) {
            if (Schema::hasColumn('clients', 'email')) {
                DB::statement('ALTER TABLE clients MODIFY email TEXT NULL');
            }
            if (Schema::hasColumn('clients', 'billing_email')) {
                DB::statement('ALTER TABLE clients MODIFY billing_email TEXT NULL');
            }
        }

        if (Schema::hasTable('billing_documents') && Schema::hasColumn('billing_documents', 'customer_email')) {
            DB::statement('ALTER TABLE billing_documents MODIFY customer_email TEXT NULL');
        }
    }

    public function down(): void
    {
        if (!$this->supportsModifyColumn()) {
            return;
        }

        if (Schema::hasTable('clients')) {
            if (Schema::hasColumn('clients', 'email')) {
                DB::statement('ALTER TABLE clients MODIFY email VARCHAR(255) NULL');
            }
            if (Schema::hasColumn('clients', 'billing_email')) {
                DB::statement('ALTER TABLE clients MODIFY billing_email VARCHAR(255) NULL');
            }
        }

        if (Schema::hasTable('billing_documents') && Schema::hasColumn('billing_documents', 'customer_email')) {
            DB::statement('ALTER TABLE billing_documents MODIFY customer_email VARCHAR(255) NULL');
        }
    }

    private function supportsModifyColumn(): bool
    {
        return DB::connection()->getDriverName() === 'mysql';
    }
};
