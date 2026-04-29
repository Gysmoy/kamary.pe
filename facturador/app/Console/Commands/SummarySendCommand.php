<?php

namespace App\Console\Commands;

use GuzzleHttp\Client as ClientGuzzleHttp;
use Illuminate\Console\Command;
use App\Models\Billing\{
    Configuration,
    Document,
    Company,
    User
};
use Carbon\Carbon;
use Auth;
use Log;
use Illuminate\Support\Facades\Schema;

class SummarySendCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'summary:send';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatic send of summaries';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $this->info('The command was started');

        Auth::login(User::firstOrFail());

        $configuration = Configuration::first();
        if (!$configuration) {
            $this->info('No configuration found');
            return;
        }

        $cronEnabled = true;
        if (Schema::connection('tenant')->hasColumn('configurations', 'cron')) {
            $cronEnabled = (bool)$configuration->cron;
        }

        if ($cronEnabled) {

            $documents = Document::query()
                ->select('date_of_issue')
                ->where([
                    'soap_type_id' => Company::firstOrFail()->active()->soap_type_id,
                    'state_type_id' => '01',
                    'group_id' => '02'
                ])
                ->groupBy('date_of_issue')
                ->get();

            foreach ($documents as $document) {

                $constructor_params = [
                    'base_uri' => config('app.url'),
                    'verify' => false
                ];

                $clientGuzzleHttp = new ClientGuzzleHttp($constructor_params);

                $response = $clientGuzzleHttp->post('/api/summaries', [
                    'http_errors' => false,
                    'headers' => [
                        'Authorization' => 'Bearer ' . auth()->user()->api_token,
                        'Accept' => 'application/json',
                    ],
                    'form_params' => [
                        'fecha_de_emision_de_documentos' => Carbon::parse($document->date_of_issue)->format('Y-m-d'),
                        'codigo_tipo_proceso' => 1
                    ]
                ]);

                $res = json_decode($response->getBody()->getContents(), true);

                if (!$res['success']) {
                    $this->info("{$document->date_of_issue} - {$res['message']}");
                }
            }
        } else {
            $this->info('The crontab is disabled');
        }
        $this->info('The command is finished');
    }
}

