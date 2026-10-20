<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Campos de gestion interna para las bandejas "Consultas web" y "Libro de reclamaciones" del admin.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('web_inquiries', function (Blueprint $table) {
            if (!Schema::hasColumn('web_inquiries', 'internal_notes')) {
                $table->text('internal_notes')->nullable()->after('status');
            }
        });

        Schema::table('web_complaints', function (Blueprint $table) {
            if (!Schema::hasColumn('web_complaints', 'response_text')) {
                $table->text('response_text')->nullable()->after('status');
            }
            if (!Schema::hasColumn('web_complaints', 'responded_at')) {
                $table->timestamp('responded_at')->nullable()->after('response_text');
            }
        });
    }

    public function down(): void
    {
        Schema::table('web_inquiries', function (Blueprint $table) {
            $table->dropColumn('internal_notes');
        });

        Schema::table('web_complaints', function (Blueprint $table) {
            $table->dropColumn(['response_text', 'responded_at']);
        });
    }
};
