<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // El borrado de BasicController es soft-delete (status = null), por eso la
    // columna status de estos catalogos debe permitir null.
    private array $tables = ['giros', 'sub_giros', 'request_reasons'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE `{$table}` MODIFY `status` TINYINT(1) NULL DEFAULT 1");
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE `{$table}` MODIFY `status` TINYINT(1) NOT NULL DEFAULT 1");
            }
        }
    }
};
