<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Una nota de entrada aprobada ya sumo stock real. Anularla borrando la nota lo haria desaparecer
// sin rastro en kardex, asi que la anulacion se hace con una nota de salida espejo (contrasiento):
// la entrada sigue aprobada y la salida compensa. Esta columna guarda ese vinculo para poder
// marcarla como anulada en la grilla y para impedir que se anule dos veces.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entry_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('entry_notes', 'voided_exit_note_id')) {
                $table->unsignedBigInteger('voided_exit_note_id')->nullable()->after('entry_status');
                $table->foreign('voided_exit_note_id')->references('id')->on('exit_notes')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('entry_notes', function (Blueprint $table) {
            if (Schema::hasColumn('entry_notes', 'voided_exit_note_id')) {
                $table->dropForeign(['voided_exit_note_id']);
                $table->dropColumn('voided_exit_note_id');
            }
        });
    }
};
