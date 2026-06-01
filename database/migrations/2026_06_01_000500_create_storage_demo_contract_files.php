<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('client_contracts')) {
            return;
        }

        $contracts = DB::table('client_contracts')
            ->whereNotNull('file_path')
            ->where(function ($query) {
                $query
                    ->where('file_path', 'like', '%contracts/demo-%.pdf')
                    ->orWhere('file_name', 'like', 'contrato-storage-demo-%.pdf');
            })
            ->orderBy('id')
            ->get(['id', 'contract_code', 'starts_at', 'ends_at', 'file_path', 'file_name']);

        foreach ($contracts as $contract) {
            $path = $this->demoContractPath($contract);

            if (!Storage::disk('public')->exists($path)) {
                Storage::disk('public')->makeDirectory(dirname($path));
                Storage::disk('public')->put($path, $this->demoContractPdf($contract));
            }

            $payload = [
                'file_path' => $path,
                'file_name' => $contract->file_name ?: basename($path),
                'file_mime' => 'application/pdf',
            ];

            if (Schema::hasColumn('client_contracts', 'updated_at')) {
                $payload['updated_at'] = now();
            }

            DB::table('client_contracts')->where('id', $contract->id)->update($payload);
        }
    }

    public function down(): void
    {
        //
    }

    private function demoContractPath(object $contract): string
    {
        $fileName = basename((string)($contract->file_path ?: $contract->file_name ?: ''));
        if ($fileName === '' || $fileName === '.' || $fileName === '/') {
            $fileName = 'demo-' . (int) $contract->id . '.pdf';
        }

        return 'contracts/' . $fileName;
    }

    private function demoContractPdf(object $contract): string
    {
        $lines = [
            'Contrato demo de almacenamiento',
            'Codigo: ' . ($contract->contract_code ?: 'Sin codigo'),
            'Inicio: ' . ($contract->starts_at ?: '-'),
            'Fin: ' . ($contract->ends_at ?: '-'),
            'Documento generado automaticamente para los datos demo.',
        ];

        return $this->pdfFromLines($lines);
    }

    private function pdfFromLines(array $lines): string
    {
        $content = "BT\n/F1 12 Tf\n50 760 Td\n18 TL\n";
        foreach ($lines as $index => $line) {
            if ($index > 0) {
                $content .= "T*\n";
            }
            $content .= '(' . $this->pdfEscape((string) $line) . ") Tj\n";
        }
        $content .= "ET\n";

        $objects = [
            '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
            '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
            '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj',
            '4 0 obj << /Length ' . strlen($content) . " >> stream\n" . $content . 'endstream endobj',
            '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object . "\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 " . count($offsets) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i < count($offsets); $i++) {
            $pdf .= str_pad((string) $offsets[$i], 10, '0', STR_PAD_LEFT) . " 00000 n \n";
        }

        $pdf .= "trailer << /Size " . count($offsets) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xref}\n%%EOF\n";

        return $pdf;
    }

    private function pdfEscape(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);
    }
};
