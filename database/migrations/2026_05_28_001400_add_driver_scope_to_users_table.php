<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        $this->addColumnIfMissing('users', 'is_driver', function () {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_driver')->default(false)->after(Schema::hasColumn('users', 'storage_client_id') ? 'storage_client_id' : 'phone');
            });
        });

        $this->addColumnIfMissing('users', 'driver_id', function () {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('driver_id')->nullable()->after(Schema::hasColumn('users', 'is_driver') ? 'is_driver' : 'phone');
            });
        });

        if (Schema::hasTable('drivers') && Schema::hasColumn('users', 'driver_id')) {
            $this->addForeignIfMissing(function () {
                Schema::table('users', function (Blueprint $table) {
                    $table->foreign('driver_id')->references('id')->on('drivers')->nullOnDelete();
                });
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        if (Schema::hasColumn('users', 'driver_id')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropForeign(['driver_id']);
                });
            } catch (\Throwable $exception) {
                // La columna puede existir sin FK si un deploy anterior quedo a medias.
            }

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('driver_id');
            });
        }

        if (Schema::hasColumn('users', 'is_driver')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_driver');
            });
        }
    }

    private function addColumnIfMissing(string $table, string $column, callable $callback): void
    {
        if (Schema::hasColumn($table, $column)) {
            return;
        }

        try {
            $callback();
        } catch (\Illuminate\Database\QueryException $exception) {
            if (!str_contains($exception->getMessage(), "Duplicate column name '{$column}'")) {
                throw $exception;
            }
        }
    }

    private function addForeignIfMissing(callable $callback): void
    {
        try {
            $callback();
        } catch (\Illuminate\Database\QueryException $exception) {
            if (!str_contains($exception->getMessage(), 'Duplicate key name')) {
                throw $exception;
            }
        }
    }
};
