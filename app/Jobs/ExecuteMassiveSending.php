<?php

namespace App\Jobs;

use App\Http\Controllers\Admin\SendingHistoryController;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Http\Request;

class ExecuteMassiveSending implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private $templates;

    public function __construct($templates)
    {
        $this->templates = $templates;
    }

    public function handle()
    {
        foreach ($this->templates as $tmp) {
            try {
                $controller = new SendingHistoryController();
                $request = new Request();
                $request->merge([
                    'template_id' => $tmp->id,
                ]);
                $controller->save($request);
            } catch (\Throwable $th) {
                dump($th->getMessage()); 
            }
        }
    }
}
