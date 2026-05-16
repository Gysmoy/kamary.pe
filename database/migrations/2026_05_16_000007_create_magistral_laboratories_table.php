<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('magistral_laboratories')) {
            Schema::create('magistral_laboratories', function (Blueprint $table) {
                $table->id();
                $table->string('description');
                $table->string('code', 40)->unique();
                $table->boolean('status')->nullable()->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        $this->addArticleColumn();
        $this->backfillMagistralLaboratories();
        $this->makeGeneralLaboratoryNullable();
    }

    public function down(): void
    {
        if (Schema::hasColumn('articles', 'magistral_laboratory_id')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropForeign(['magistral_laboratory_id']);
                $table->dropColumn('magistral_laboratory_id');
            });
        }

        Schema::dropIfExists('magistral_laboratories');

        if (Schema::hasColumn('articles', 'laboratory_id')) {
            $fallbackId = DB::table('laboratories')->orderBy('id')->value('id');
            if ($fallbackId) {
                DB::table('articles')->whereNull('laboratory_id')->update(['laboratory_id' => $fallbackId]);
            }

            try {
                Schema::table('articles', fn(Blueprint $table) => $table->dropForeign(['laboratory_id']));
            } catch (\Throwable $th) {
                //
            }

            if (DB::getDriverName() === 'mysql') {
                DB::statement('ALTER TABLE articles MODIFY laboratory_id BIGINT UNSIGNED NOT NULL');
            } else {
                try {
                    Schema::table('articles', function (Blueprint $table) {
                        $table->unsignedBigInteger('laboratory_id')->nullable(false)->change();
                    });
                } catch (\Throwable $th) {
                    //
                }
            }

            try {
                Schema::table('articles', function (Blueprint $table) {
                    $table->foreign('laboratory_id')->references('id')->on('laboratories');
                });
            } catch (\Throwable $th) {
                //
            }
        }
    }

    private function addArticleColumn(): void
    {
        if (Schema::hasColumn('articles', 'magistral_laboratory_id')) return;

        Schema::table('articles', function (Blueprint $table) {
            $table->foreignId('magistral_laboratory_id')
                ->nullable()
                ->after('laboratory_id')
                ->constrained('magistral_laboratories')
                ->nullOnDelete();
        });
    }

    private function backfillMagistralLaboratories(): void
    {
        if (!Schema::hasColumn('articles', 'module_scope')) return;

        $articleLaboratoryIds = DB::table('articles')
            ->where('module_scope', 'magistrales')
            ->whereNotNull('laboratory_id')
            ->pluck('laboratory_id')
            ->filter()
            ->unique()
            ->values();

        $sourceLabs = DB::table('laboratories')
            ->where('code', 'like', 'MAGLAB-%')
            ->when($articleLaboratoryIds->isNotEmpty(), fn($query) => $query->orWhereIn('id', $articleLaboratoryIds))
            ->get();

        $idMap = [];
        foreach ($sourceLabs as $lab) {
            $code = trim((string)($lab->code ?? ''));
            if ($code === '') continue;

            $existingId = DB::table('magistral_laboratories')->where('code', $code)->value('id');
            $payload = [
                'description' => trim((string)($lab->name ?? '')) ?: $code,
                'status' => $lab->status,
                'updated_by' => $lab->updated_by ?? null,
                'updated_at' => now(),
            ];

            if ($existingId) {
                DB::table('magistral_laboratories')->where('id', $existingId)->update($payload);
                $idMap[$lab->id] = $existingId;
                continue;
            }

            $idMap[$lab->id] = DB::table('magistral_laboratories')->insertGetId(array_merge($payload, [
                'code' => $code,
                'created_by' => $lab->created_by ?? null,
                'created_at' => now(),
            ]));
        }

        foreach ($idMap as $oldLaboratoryId => $magistralLaboratoryId) {
            DB::table('articles')
                ->where('module_scope', 'magistrales')
                ->where('laboratory_id', $oldLaboratoryId)
                ->update([
                    'magistral_laboratory_id' => $magistralLaboratoryId,
                    'active_principle_id' => null,
                ]);
        }
    }

    private function makeGeneralLaboratoryNullable(): void
    {
        if (!Schema::hasColumn('articles', 'laboratory_id')) return;

        try {
            Schema::table('articles', fn(Blueprint $table) => $table->dropForeign(['laboratory_id']));
        } catch (\Throwable $th) {
            //
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE articles MODIFY laboratory_id BIGINT UNSIGNED NULL');
        } else {
            try {
                Schema::table('articles', function (Blueprint $table) {
                    $table->unsignedBigInteger('laboratory_id')->nullable()->change();
                });
            } catch (\Throwable $th) {
                //
            }
        }

        DB::table('articles')
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->update([
                'laboratory_id' => null,
                'active_principle_id' => null,
            ]);

        try {
            Schema::table('articles', function (Blueprint $table) {
                $table->foreign('laboratory_id')->references('id')->on('laboratories');
            });
        } catch (\Throwable $th) {
            //
        }
    }
};
