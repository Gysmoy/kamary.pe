<?php

namespace App\Jobs;

use App\Http\Controllers\WhatsAppController;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendSaleWhatsApp implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  private $data;
  private $send2client;
  private $send2group;

  public function __construct($data, bool $send2client = true, bool $send2group = true)
  {
    $this->data = $data;
    // $this->send2client = $send2client;
    $this->send2client = false;
    $this->send2group = $send2group;
  }

  public function handle()
  {
    $data = $this->data;
    $send2client = $this->send2client;
    $send2group = $this->send2group;
    try {
      WhatsAppController::sendSale($data, $send2client, $send2group);
    } catch (\Throwable $th) {
      // dump($th->getMessage());
    }
  }
}
