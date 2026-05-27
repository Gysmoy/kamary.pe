<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Item;
use App\Models\Sale;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\View;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;
use SoDe\Extend\Text;

class TransactionController extends BasicController
{
    public $model = Transaction::class;
    public $reactView = 'Admin/Transactions';
    public $softDeletion = false;

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'expenses'];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::where('category', '<>', 'Ventas');
    }

    public function revenues()
    {
        $response = Response::simpleTryCatch(function () {
            $lastDate = DB::table('transactions')
                ->where('category', 'Ventas')
                ->where('automatically_created', true)
                ->max('date');

            if (!$lastDate) {
                $lastDate = Sale::min('sale_date');
            }

            $sales = Sale::selectRaw('sales.sale_date AS date')
                ->join('statuses', 'statuses.id', 'sales.status_id')
                ->where('statuses.is_ok', true)
                ->where('sales.sale_date', '>', $lastDate)
                ->where('sales.sale_date', '<', now()->toDateString())
                ->groupBy('date')
                ->get();

            foreach ($sales as $sale) {
                self::generateDailyReport($sale->date);
            }
        });
        return response($response->toArray(), $response->status);
    }

    public function report(Request $request, string $date)
    {
        $response = Response::simpleTryCatch(function () use ($date) {
            self::generateDailyReport($date);
        });
        return response($response->toArray(), $response->status);
    }

    /**
     * Generates a daily sales report for a specific date
     * 
     * @param string $date The date to generate the report for
     * @param float $dailyTotal The total amount for the day
     * @return void
     */
    private static function generateDailyReport(string $date)
    {
        // Get sales grouped by origin for this date
        $salesByOrigin = Sale::selectRaw('
            origin_id,
            COUNT(*) as count,
            SUM(total_amount) + SUM(upsell_amount) as total
        ')
            ->with(['origin'])
            ->join('statuses', 'statuses.id', 'sales.status_id')
            ->where('statuses.is_ok', true)
            ->where('sales.sale_date', $date)
            ->groupBy('origin_id')
            ->get();

        // Initialize counters
        $totalSales = 0;
        $totalAmount = 0;
        $adSales = 0;
        $adAmount = 0;

        $origins = [];
        foreach ($salesByOrigin as $originSale) {
            $totalSales += $originSale->count;
            $totalAmount += $originSale->total;

            if ($originSale->origin->is_advertising) {
                $adSales += $originSale->count;
                $adAmount += $originSale->total;
            }

            $origins[$originSale->origin->name] = [
                'count' => $originSale->count,
                'total' => $originSale->total,
            ];
        }

        $template = '------------------------------' . Text::lineBreak();
        $template .= 'FECHA: ' . date('d/m/Y', strtotime($date)) . Text::lineBreak();
        $template .= 'VENTAS: ' . $totalSales . Text::lineBreak();
        $template .= 'TOTAL: S/ ' . number_format($totalAmount, 2) . Text::lineBreak();
        $template .= 'V.PUBLI: ' . $adSales . ' (S/ ' . number_format($adAmount, 2) . ')' . Text::lineBreak();
        $template .= '------------------------------';

        foreach ($origins as $origin => $originData) {
            $template .= Text::lineBreak() . $origin . ': ' . $originData['count'] . ' (S/ ' . number_format($originData['total'], 2) . ')';
        }
        $template .= Text::lineBreak() . '------------------------------';

        $saleItems = Item::select('items.id', 'items.name', 'items.image')
            ->selectRaw('SUM(sale_details.quantity) as count')
            ->leftJoin('sale_details', 'sale_details.item_id', '=', 'items.id')
            ->join('sales', 'sales.id', '=', 'sale_details.sale_id')
            ->join('statuses', 'statuses.id', '=', 'sales.status_id')
            ->where('sales.sale_date', $date)
            ->where('statuses.is_ok', true)
            ->groupBy('items.id', 'items.name', 'items.image')
            ->get();

        $upsellItems = Item::select('items.id', 'items.name', 'items.image')
            ->selectRaw('SUM(sale_upsells.quantity) as count')
            ->leftJoin('sale_upsells', 'sale_upsells.item_id', '=', 'items.id')
            ->join('sales', 'sales.id', '=', 'sale_upsells.sale_id')
            ->join('statuses', 'statuses.id', '=', 'sales.status_id')
            ->where('sales.sale_date', $date)
            ->where('statuses.is_ok', true)
            ->groupBy('items.id', 'items.name', 'items.image')
            ->get();

        $items = $saleItems->concat($upsellItems)->groupBy('id')->map(function ($group) {
            return [
                'id' => $group->first()->id,
                'name' => $group->first()->name,
                'image' => $group->first()->image,
                'count' => $group->sum('count')
            ];
        })->values();

        $content = View::make('mailing.item-report', ['items' => $items])->render();

        new Fetch(env('WA_URL') . '/api/send', [
            'method' => 'POST',
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
            'body' => [
                'apiKey' => env('EVOAPI_APIKEY'),
                'from' => env('EVOAPI_INSTANCE'),
                'to' => [env('WAGROUP_VENTAS_ID')],
                'html' => $content,
                'content' => $template,
            ],
        ]);

        Transaction::updateOrCreate([
            'category_id' => '7f2f34a4-d2f4-4d9b-b3e2-6c8f3e3e6b90',
            'date' => $date
        ], [
            'category_id' => '7f2f34a4-d2f4-4d9b-b3e2-6c8f3e3e6b90',
            'category' => 'Ventas',
            'description' => env('APP_NAME') . ' - ' . $date,
            'date' => $date,
            'payment_method' => 'Tarjeta',
            'automatically_created' => 1,
            'note' => $template,
            'amount' => $totalAmount
        ]);
    }
}
