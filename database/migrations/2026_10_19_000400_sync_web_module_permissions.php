<?php

use App\Support\ModulePermissions;
use Illuminate\Database\Migrations\Migration;

// Crea los permisos web-inquiries y web-complaints y los asigna a los roles Admin y Root.
return new class extends Migration
{
    public function up(): void
    {
        ModulePermissions::sync();
    }

    public function down(): void
    {
        //
    }
};
