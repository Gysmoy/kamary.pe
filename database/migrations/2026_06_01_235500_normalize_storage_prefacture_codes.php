<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('billing_documents') || !Schema::hasTable('service_orders')) {
            return;
        }

        DB::transaction(function () {
            $sequence = max($this->configuredStart() - 1, $this->currentMaxPrefactureSequence());

            $documents = DB::table('billing_documents as document')
                ->join('service_orders as service_order', 'service_order.id', '=', 'document.service_order_id')
                ->whereNotNull('document.status')
                ->where('document.source_type', 'service_order')
                ->whereIn('service_order.order_type', ['storage_service', 'storage_general'])
                ->whereRaw("LOWER(REPLACE(TRIM(COALESCE(document.document_type, '')), '_', ' ')) <> 'nota de credito'")
                ->where(function ($query) {
                    $query->whereNull('document.code')
                        ->orWhere('document.code', 'not like', 'PF%');
                })
                ->orderBy('document.id')
                ->get(['document.id']);

            foreach ($documents as $document) {
                do {
                    $sequence++;
                    $code = $this->formatPrefactureCode($sequence);
                } while (DB::table('billing_documents')->where('code', $code)->where('id', '<>', $document->id)->exists());

                DB::table('billing_documents')
                    ->where('id', $document->id)
                    ->update([
                        'code' => $code,
                        'updated_at' => now(),
                    ]);
            }
        });
    }

    public function down(): void
    {
        // No se revierten codigos operativos ya expuestos al usuario.
    }

    private function configuredStart(): int
    {
        return max(1, (int) config('billing.storage_prefacture_code_start', env('STORAGE_PREFACTURE_CODE_START', 7750)));
    }

    private function currentMaxPrefactureSequence(): int
    {
        $max = 0;
        foreach (DB::table('billing_documents')->where('code', 'like', 'PF%')->pluck('code') as $code) {
            if (preg_match('/^PF(\d+)$/', (string) $code, $matches)) {
                $max = max($max, (int) $matches[1]);
            }
        }

        return $max;
    }

    private function formatPrefactureCode(int $sequence): string
    {
        return 'PF' . str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }
};
