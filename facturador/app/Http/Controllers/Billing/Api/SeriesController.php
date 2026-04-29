<?php

namespace App\Http\Controllers\Billing\Api;

use App\Http\Controllers\Controller;
use App\Models\Billing\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SeriesController extends Controller
{
    public function index(Request $request)
    {
        $records = Series::query()->orderBy('establishment_id')->orderBy('document_type_id')->orderBy('number');

        if ($request->filled('establishment_id')) {
            $records->where('establishment_id', (int) $request->input('establishment_id'));
        }

        return [
            'success' => true,
            'data' => $records->get()->map(fn (Series $series) => $this->transform($series))->values(),
        ];
    }

    public function sync(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'records' => ['required', 'array', 'min:1'],
            'records.*.establishment_id' => ['required', 'integer', Rule::exists('establishments', 'id')],
            'records.*.document_type_id' => ['required', 'string', Rule::in(['01', '03', '07'])],
            'records.*.number' => ['required', 'string', 'max:10'],
        ])->validate();

        $synced = [];

        DB::connection('tenant')->transaction(function () use ($validated, &$synced) {
            foreach ($validated['records'] as $row) {
                $series = Series::query()->firstOrNew([
                    'establishment_id' => (int) $row['establishment_id'],
                    'document_type_id' => (string) $row['document_type_id'],
                    'number' => strtoupper(trim((string) $row['number'])),
                ]);

                $series->contingency = (bool) ($series->contingency ?? false);
                $series->save();

                $synced[] = $this->transform($series->fresh());
            }
        });

        return [
            'success' => true,
            'message' => 'Series sincronizadas correctamente.',
            'data' => $synced,
        ];
    }

    private function transform(Series $series): array
    {
        return [
            'id' => $series->id,
            'establishment_id' => $series->establishment_id,
            'document_type_id' => $series->document_type_id,
            'number' => $series->number,
        ];
    }
}
