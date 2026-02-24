<?php

namespace App\Jobs;

use App\Http\Controllers\MailingController;
use App\Models\Formula;
use App\Models\Sale;
use App\Models\UserFormula;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\View;
use SoDe\Extend\Crypto;
use SoDe\Extend\Fetch;

class SendSaleEmail implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  private Sale $data;
  private $send2client;
  private $send2group;

  public function __construct(Sale $data, bool $send2client = true, bool $send2group = true)
  {
    $this->data = $data;
    $this->send2client = $send2client;
    $this->send2group = $send2group;
  }

  public function handle()
  {
    $data = $this->data;
    $send2client = $this->send2client;
    $send2group = $this->send2group;
    try {

      $jpa  = Sale::with([
        'formula',
        'formula.hasTreatment',
        'formula.scalpType',
        'formula.hairType',
        'formula.hairThickness',
        'formula.fragrance',
        'status',
        'details',
        'details.item',
        'renewal',
        'bundle',
        'coupon'
      ])->find($data->id);
      $hairGoals = Formula::whereIn('id', $jpa->formula->hair_goals ?? [])->get();
      if (!$jpa->formula) $jpa->formula = new UserFormula();
      $jpa->formula->hair_goals_list = $hairGoals;

      $data =  [
        'sale' => $jpa
      ];

      $content = View::make('mailing.sale-done', $data)->render();

      $res = new Fetch(\env('WA_URL') . '/api/utils/html2image', [
        'method' => 'POST',
        'headers' => [
          'Content-Type' => 'application/json'
        ],
        'body' => ['html' => $content]
      ]);

      $binary = $res->blob();

      $imageName = Crypto::short() . '.webp';
      $path = storage_path('app/images/mailing/' . $imageName);
      if (!file_exists(dirname($path))) {
        mkdir(dirname($path), 0755, true);
      }
      file_put_contents($path, $binary);

      if ($send2client) {
        MailingController::simpleNotify('mailing.sale-done-mail', $jpa->email, [
          'title' => 'Resumen de tu pedido ' . $jpa->code,
          'image' => $imageName
        ], $send2group ? [
          'pedidos@vua.pe'
        ] : []);
        $send2group = false;
      }
      if ($send2group) {
        MailingController::simpleNotify('mailing.sale-done', 'pedidos@vua.pe', [
          'title' => 'Resumen de tu pedido ' . $jpa->code,
          'image' => $imageName
        ]);
      }
    } catch (\Throwable $th) {
      dump($th->getMessage());
    }
  }
}
