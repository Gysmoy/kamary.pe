<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exit_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('exit_notes', 'code')) {
                $table->string('code', 20)->nullable()->after('id');
            }
            if (!Schema::hasColumn('exit_notes', 'client_id')) {
                $table->foreignId('client_id')->nullable()->after('warehouse_id')->constrained('clients')->nullOnDelete();
            }
            if (!Schema::hasColumn('exit_notes', 'exit_date')) {
                $table->date('exit_date')->nullable()->after('motives');
            }
            if (!Schema::hasColumn('exit_notes', 'document_type')) {
                $table->string('document_type', 30)->nullable()->after('exit_date');
            }
            if (!Schema::hasColumn('exit_notes', 'document_series')) {
                $table->string('document_series', 20)->nullable()->after('document_type');
            }
            if (!Schema::hasColumn('exit_notes', 'document_sequence')) {
                $table->string('document_sequence', 40)->nullable()->after('document_series');
            }
            if (!Schema::hasColumn('exit_notes', 'document_date')) {
                $table->date('document_date')->nullable()->after('document_sequence');
            }
            if (!Schema::hasColumn('exit_notes', 'exit_status')) {
                $table->string('exit_status', 20)->default('approved')->after('status');
            }
        });

        if (Schema::hasColumn('exit_notes', 'code')) {
            DB::statement("UPDATE exit_notes SET code = CONCAT('NS', LPAD(id, 5, '0')) WHERE code IS NULL OR code = ''");
        }
        if (Schema::hasColumn('exit_notes', 'exit_status')) {
            DB::table('exit_notes')->whereNull('exit_status')->update(['exit_status' => 'approved']);
        }
    }

    public function down(): void
    {
        Schema::table('exit_notes', function (Blueprint $table) {
            if (Schema::hasColumn('exit_notes', 'client_id')) {
                $table->dropConstrainedForeignId('client_id');
            }
            foreach ([
                'exit_status',
                'document_date',
                'document_sequence',
                'document_series',
                'document_type',
                'exit_date',
                'code',
            ] as $column) {
                if (Schema::hasColumn('exit_notes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
