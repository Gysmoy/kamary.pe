<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const PRESENTATIONS = [
        'BOLSA',
        'CAJA',
        'CREMA',
        'FRASCO',
        'LIQUIDO',
        'POLVO',
        'POTE',
        'ROLLO',
        'TUBO',
        'UNIDAD',
    ];

    public function up(): void
    {
        if (!Schema::hasColumn('articles', 'magistral_presentation')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->string('magistral_presentation', 40)->nullable()->after('sub_category');
            });
        }

        if (!Schema::hasTable('magistral_formats')) return;

        DB::table('articles as article')
            ->leftJoin('magistral_formats as format', 'format.id', '=', 'article.magistral_format_id')
            ->whereNull('article.magistral_presentation')
            ->whereNotNull('article.magistral_format_id')
            ->select('article.id', 'format.description')
            ->orderBy('article.id')
            ->get()
            ->each(function ($row) {
                $presentation = $this->canonicalPresentation($row->description ?? null);
                if (!$presentation) return;

                DB::table('articles')
                    ->where('id', $row->id)
                    ->update(['magistral_presentation' => $presentation]);
            });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('articles', 'magistral_presentation')) return;

        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('magistral_presentation');
        });
    }

    private function canonicalPresentation(?string $value): ?string
    {
        $normalized = $this->normalize($value);
        if ($normalized === '') return null;

        foreach (self::PRESENTATIONS as $presentation) {
            if ($this->normalize($presentation) === $normalized) {
                return $presentation;
            }
        }

        $aliases = [
            'CREMA' => ['crema'],
            'LIQUIDO' => ['liquido', 'jarabe', 'solucion', 'suspension', 'gotas'],
            'POTE' => ['pote'],
            'TUBO' => ['tubo'],
            'UNIDAD' => ['unidad', 'und'],
        ];

        foreach ($aliases as $presentation => $needles) {
            foreach ($needles as $needle) {
                if (str_contains($normalized, $needle)) {
                    return $presentation;
                }
            }
        }

        return null;
    }

    private function normalize(?string $value): string
    {
        $text = mb_strtolower(trim((string) $value));
        $search = ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'];
        $replace = ['a', 'e', 'i', 'o', 'u', 'u', 'n'];

        return str_replace($search, $replace, $text);
    }
};
