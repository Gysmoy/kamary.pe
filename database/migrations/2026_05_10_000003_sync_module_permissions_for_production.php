<?php

use App\Support\ModulePermissions;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        ModulePermissions::sync();
    }

    public function down(): void
    {
        // Intentionally left in place: permissions are production data and may be assigned to custom roles.
    }
};
