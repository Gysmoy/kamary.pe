<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Business;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\User;
use App\Support\BusinessScope;
use App\Support\SamplesWarehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Puebla el "Almacen Muestras" con articulos de prueba para validar los
 * estados del modulo Muestras (Registrado -> Aprobado -> ... -> Entregado).
 *
 * Es idempotente (re-ejecutable) y funciona en local y en produccion:
 *   php artisan db:seed --class=SamplesTestStockSeeder
 *
 * Resuelve ids de forma dinamica:
 *   - empresa por business_key = 'kamary_peru'
 *   - almacen fijo de Muestras via SamplesWarehouse (sede Principal)
 *
 * Crea 3 grupos de articulos:
 *   - stock alto  -> permiten pedidos COMPLETOS (se pueden Aprobar y avanzar)
 *   - stock bajo  -> permiten pedidos INCOMPLETOS (no se deben poder aprobar)
 *   - sin stock   -> no aparecen en el buscador de articulos del pedido
 */
class SamplesTestStockSeeder extends Seeder
{
    private const ENTRY_NOTE_CODE = 'NE-MUESTRAS-TEST';
    private const EXPIRATION_DATE = '2027-12-31';

    /** code => [name, stock]. stock = 0 significa "sin entrada" (no aparece en el buscador). */
    private const ARTICLES = [
        ['code' => 'MUESTRA-001', 'name' => 'Muestra Paracetamol 500mg', 'stock' => 50],
        ['code' => 'MUESTRA-002', 'name' => 'Muestra Ibuprofeno 400mg', 'stock' => 35],
        ['code' => 'MUESTRA-003', 'name' => 'Muestra Amoxicilina 250mg', 'stock' => 30],
        ['code' => 'MUESTRA-004', 'name' => 'Muestra Loratadina 10mg', 'stock' => 2],
        ['code' => 'MUESTRA-005', 'name' => 'Muestra Omeprazol 20mg', 'stock' => 1],
        ['code' => 'MUESTRA-006', 'name' => 'Muestra Vitamina C 1g', 'stock' => 0],
        ['code' => 'MUESTRA-007', 'name' => 'Muestra Crema Hidratante 50g', 'stock' => 0],
        ['code' => 'MUESTRA-008', 'name' => 'Muestra Naproxeno 550mg', 'stock' => 18],
        ['code' => 'MUESTRA-009', 'name' => 'Muestra Cetirizina 10mg', 'stock' => 12],
        ['code' => 'MUESTRA-010', 'name' => 'Muestra Azitromicina 500mg', 'stock' => 25],
        ['code' => 'MUESTRA-011', 'name' => 'Muestra Metformina 850mg', 'stock' => 60],
        ['code' => 'MUESTRA-012', 'name' => 'Muestra Losartan 50mg', 'stock' => 8],
        ['code' => 'MUESTRA-013', 'name' => 'Muestra Atorvastatina 20mg', 'stock' => 22],
        ['code' => 'MUESTRA-014', 'name' => 'Muestra Salbutamol inhalador', 'stock' => 5],
        ['code' => 'MUESTRA-015', 'name' => 'Muestra Diclofenaco 50mg', 'stock' => 40],
        ['code' => 'MUESTRA-016', 'name' => 'Muestra Ranitidina 300mg', 'stock' => 3],
        ['code' => 'MUESTRA-017', 'name' => 'Muestra Amoxicilina + Ac. Clavulanico 1g', 'stock' => 15],
        ['code' => 'MUESTRA-018', 'name' => 'Muestra Acido Folico 5mg', 'stock' => 0],
        ['code' => 'MUESTRA-019', 'name' => 'Muestra Ibuprofeno jarabe 100mg/5ml', 'stock' => 28],
        ['code' => 'MUESTRA-020', 'name' => 'Muestra Complejo B', 'stock' => 10],
    ];

    public function run(): void
    {
        $business = Business::query()
            ->where('business_key', BusinessScope::KAMARY_PERU)
            ->whereNotNull('status')
            ->first();
        if (!$business) {
            $this->command?->error('No existe la empresa kamary_peru. Aborta el seeder.');
            return;
        }

        $warehouse = SamplesWarehouse::warehouse();
        $userId = User::query()->orderBy('id')->value('id');
        $unitId = $this->resolveUnitId($userId);
        $laboratoryId = $this->resolveLaboratoryId($userId);

        DB::transaction(function () use ($business, $warehouse, $userId, $unitId, $laboratoryId) {
            $note = EntryNote::query()->updateOrCreate(
                ['code' => self::ENTRY_NOTE_CODE],
                [
                    'business_id' => $business->id,
                    'business_branch_id' => $warehouse->business_branch_id,
                    'warehouse_id' => $warehouse->id,
                    'document_type' => 'Nota de entrada',
                    'currency' => 'PEN',
                    'entry_date' => now()->toDateString(),
                    'observations' => 'Nota de entrada de prueba del modulo Muestras (seeder).',
                    'entry_status' => 'approved',
                    'status' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]
            );

            foreach (self::ARTICLES as $spec) {
                $article = Article::query()->updateOrCreate(
                    ['module_scope' => 'standard', 'code' => $spec['code']],
                    [
                        'name' => $spec['name'],
                        'business_id' => $business->id,
                        'laboratory_id' => $laboratoryId,
                        'unit_id' => $unitId,
                        'volume' => 1,
                        'unit_weight' => 0.05,
                        'units_per_article' => 1,
                        'margin_rule' => false,
                        'igv_rule' => false,
                        'status' => true,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]
                );

                if ((float) $spec['stock'] > 0) {
                    EntryNoteItem::query()->updateOrCreate(
                        ['entry_note_id' => $note->id, 'article_id' => $article->id],
                        [
                            'warehouse_id' => $warehouse->id,
                            'lot' => 'LOTE-' . $spec['code'],
                            'batch_code' => 'LOTE-' . $spec['code'],
                            'expiration_date' => self::EXPIRATION_DATE,
                            'stock' => 0,
                            'cost_unit' => 0,
                            'requested_quantity' => $spec['stock'],
                            'received_quantity' => $spec['stock'],
                            'quantity' => $spec['stock'],
                            'total' => 0,
                            'status' => true,
                        ]
                    );
                } else {
                    // Articulo "sin stock": aseguramos que no quede ninguna entrada previa.
                    EntryNoteItem::query()
                        ->where('entry_note_id', $note->id)
                        ->where('article_id', $article->id)
                        ->delete();
                }
            }
        });

        $this->printSummary($warehouse->name);
    }

    private function resolveUnitId($userId): int
    {
        $unitId = Unit::query()->whereNotNull('status')->orderBy('id')->value('id');
        if ($unitId) return (int) $unitId;

        return (int) Unit::query()->firstOrCreate(
            ['symbol' => 'UND'],
            [
                'module_scope' => 'standard',
                'name' => 'Unidad',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]
        )->id;
    }

    private function resolveLaboratoryId($userId): int
    {
        $laboratoryId = Laboratory::query()->whereNotNull('status')->orderBy('id')->value('id');
        if ($laboratoryId) return (int) $laboratoryId;

        return (int) Laboratory::query()->firstOrCreate(
            ['code' => 'MUESTRALAB'],
            [
                'name' => 'Laboratorio Muestras',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]
        )->id;
    }

    private function printSummary(string $warehouseName): void
    {
        $this->command?->info("Almacen Muestras poblado: {$warehouseName}");
        foreach (self::ARTICLES as $spec) {
            $stock = (float) $spec['stock'];
            $tag = $stock <= 0 ? 'sin stock'
                : ($stock < 5 ? 'stock bajo'
                : ($stock < 20 ? 'stock medio' : 'stock alto'));
            $this->command?->line(str_pad($spec['code'] . ' ' . $spec['name'], 44, '.')
                . ' ' . str_pad((string) $spec['stock'], 4, ' ', STR_PAD_LEFT)
                . "  ({$tag})");
        }
    }
}
