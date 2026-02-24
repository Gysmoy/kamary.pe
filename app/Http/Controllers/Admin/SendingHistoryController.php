<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Jobs\ExecuteMassiveSending;
use App\Jobs\SendMessagesJob;
use App\Models\dxDataGrid;
use App\Models\MailingTemplate;
use App\Models\SendingHistory;
use Illuminate\Http\Request;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Trace;

class SendingHistoryController extends BasicController
{
    public $model = SendingHistory::class;
    public $reactView = 'Admin/SendingHistory';
    public $ignoreStatusFilter = true;

    public function execute(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $templates = MailingTemplate::select('id')
                ->where('auto_send', true)
                ->where('status', true)
                ->get();
            ExecuteMassiveSending::dispatchAfterResponse($templates);
        });

        return response($response->toArray(), $response->status);
    }

    public function setPaginationInstance(string $model)
    {
        SendingHistory::whereNull('status')
            ->whereIn('id', function ($query) {
                $query->select('sending_history_id')
                    ->from('history_details as d1')
                    ->whereRaw('d1.created_at = (
                        SELECT MAX(created_at) 
                        FROM history_details as d2 
                        WHERE d2.sending_history_id = d1.sending_history_id
                    )')
                    ->where('created_at', '<=', now()->subMinutes(2));
            })
            ->update(['status' => false]);

        return $model::query();
    }

    public function beforeSave(Request $request)
    {
        $templateJpa = MailingTemplate::find($request->input('template_id'));

        if ($templateJpa->auto_send && $templateJpa->model) {
            $model = 'App\\Models\\' . $templateJpa->model;
            $fillable = (new $model)->getFillable();
            $mapping = [];
            foreach ($fillable as $field) {
                $mapping[$field] = $field;
            }
            $instance  = $model::select();
            $instance->where(function ($query) use ($templateJpa) {
                dxDataGrid::filter($query, $templateJpa->filters ?? [], false);
            });
            $data = $instance->get()->toArray();
        } else {
            $mapping = JSON::parse($request->input('mapping'));
            $data = JSON::parse(file_get_contents($request->file('data')));
        }

        $traceId = Trace::getDate('mysql');
        $modelName = $templateJpa->model ?? 'Externo';

        return [
            'mailing_template_id' => $templateJpa->id,
            'name' =>  "[{$modelName}] {$templateJpa->name} > {$traceId}",
            'type' => $templateJpa->type,
            'mapping' => $mapping,
            'total' => count($data),
            'status' => count($data) == 0 ? true : null,
        ];
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        $templateJpa = MailingTemplate::find($jpa->mailing_template_id);
        if ($templateJpa->auto_send && $templateJpa->model) {
            $model = 'App\\Models\\' . $templateJpa->model;
            $instance  = $model::distinct();
            $instance->where(function ($query) use ($templateJpa) {
                dxDataGrid::filter($query, $templateJpa->filters ?? [], false);
            });
            $data = $instance->get()->toArray();
        } else {
            $data = JSON::parse(file_get_contents($request->file('data')));
        }

        if (count($data) > 0) {

            $path = public_path('uploads/mailing-data');
            if (!file_exists($path)) {
                mkdir($path, 0777, true);
            }
            $filename = $jpa->id . '.json';
            file_put_contents("{$path}/{$filename}", JSON::stringify($data));

            try {
                $res = new Fetch(env('WA_URL') . '/api/send/massive', [
                    'method' => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json'
                    ],
                    'body' => $jpa->toArray()
                ]);
                if (!$res->ok) {
                    $jpa->status = false;
                    $jpa->save();
                }
            } catch (\Throwable $th) {
            }
        } else {
            $jpa->status = true;
            $jpa->save();
        }
    }
}
