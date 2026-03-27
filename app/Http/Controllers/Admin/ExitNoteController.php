<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\Business;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class ExitNoteController extends BasicController
{
    public $model = ExitNote::class;
    public $reactView = 'Admin/ExitNotes';
    public $prefix4filter = 'exit_notes';

    private array $itemsPayload = [];

    public function setPaginationInstance(string $model)
    {
        return $model::select('exit_notes.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'items:id,exit_note_id,batch_code,article_id,warehouse_id,stock,expiration_date,location,destination_location,quantity,total,status',
                'items.article:id,code,name,laboratory_id,active_principle_id,unit_id',
                'items.article.laboratory:id,name',
                'items.article.activePrinciple:id,name',
                'items.article.unit:id,name,symbol',
                'items.warehouse:id,name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'exit_notes.created_by')
            ->join('users as updater', 'updater.id', '=', 'exit_notes.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();

        $businessId = $body['business_id'] ?? null;
        $branchId = $body['business_branch_id'] ?? null;
        $warehouseId = $body['warehouse_id'] ?? null;

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$warehouseId) throw new \Exception('El almacen es obligatorio');

        Business::findOrFail($businessId);
        $warehouse = Warehouse::findOrFail($warehouseId);

        $body['business_branch_id'] = ($branchId === '' || is_null($branchId)) ? null : (int)$branchId;
        if (!is_null($warehouse->business_branch_id)) {
            if (is_null($body['business_branch_id'])) {
                $body['business_branch_id'] = (int)$warehouse->business_branch_id;
            } else if ((int)$body['business_branch_id'] !== (int)$warehouse->business_branch_id) {
                throw new \Exception('El almacen seleccionado no pertenece a la sede elegida');
            }
        }
        if ($body['business_branch_id']) {
            $branch = Business::findOrFail($businessId)
                ->branches()
                ->where('id', $body['business_branch_id'])
                ->first();
            if (!$branch) throw new \Exception('La sede no pertenece a la empresa seleccionada');
        }

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;
        unset($body['items']);

        $rawMotives = $body['motives'] ?? [];
        if (is_string($rawMotives)) {
            $decodedMotives = json_decode($rawMotives, true);
            if (is_array($decodedMotives)) $rawMotives = $decodedMotives;
            else if (trim($rawMotives) === '') $rawMotives = [];
            else $rawMotives = [trim($rawMotives)];
        }
        if (!is_array($rawMotives)) $rawMotives = [];
        $motives = [];
        foreach ($rawMotives as $motive) {
            $text = trim((string)$motive);
            if ($text !== '') $motives[] = $text;
        }
        $body['motives'] = count($motives) ? $motives : null;

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }
        $body['updated_by'] = $userId;
        $body['client_name'] = trim((string)($body['client_name'] ?? '')) ?: null;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            ExitNoteItem::where('exit_note_id', $jpa->id)->delete();

            $inserted = 0;
            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;

                $articleId = $item['article_id'] ?? null;
                if (!$articleId) throw new \Exception('Cada linea debe tener articulo');
                Article::findOrFail($articleId);

                $warehouseId = $item['warehouse_id'] ?? $jpa->warehouse_id;
                if ($warehouseId) Warehouse::findOrFail($warehouseId);

                $stock = $this->toNullableDecimal($item['stock'] ?? null) ?? 0;
                $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
                $total = $this->toNullableDecimal($item['total'] ?? null) ?? 0;
                if ($quantity <= 0) throw new \Exception('La cantidad debe ser mayor a 0');

                $expirationDate = null;
                $rawExpirationDate = trim((string)($item['expiration_date'] ?? ''));
                if ($rawExpirationDate !== '') {
                    $timestamp = strtotime($rawExpirationDate);
                    if ($timestamp === false) throw new \Exception("Fecha de vencimiento invalida: {$rawExpirationDate}");
                    $expirationDate = date('Y-m-d', $timestamp);
                }

                ExitNoteItem::create([
                    'exit_note_id' => $jpa->id,
                    'batch_code' => trim((string)($item['batch_code'] ?? '')) ?: null,
                    'article_id' => $articleId,
                    'warehouse_id' => $warehouseId,
                    'stock' => $stock,
                    'expiration_date' => $expirationDate,
                    'location' => trim((string)($item['location'] ?? '')) ?: null,
                    'destination_location' => trim((string)($item['destination_location'] ?? '')) ?: null,
                    'quantity' => $quantity,
                    'total' => $total,
                    'status' => isset($item['status']) ? (bool)$item['status'] : true,
                ]);
                $inserted++;
            }

            if ($inserted === 0) {
                throw new \Exception('Debes agregar al menos una linea en la nota de salida');
            }

            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function branches(Request $request, string $businessId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = Business::findOrFail($businessId);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $business->branches()->whereNotNull('status')->orderBy('name')->get(['id', 'business_id', 'name', 'status']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();
            $this->model::where($this->identifier, $request->id)->update($data);
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            $this->model::where($this->identifier, $request->id)->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
    }
}
