<?php
namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\SeriesRequest;
use App\Http\Resources\Billing\SeriesCollection;
use App\Models\Billing\Catalogs\DocumentType;
use App\Models\Billing\Series;

class SeriesController extends Controller
{
    public function create()
    {
        return view('tenant.series.form');
    }

    public function records($establishmentId, $document_type = null)
    {
        $records = Series::FilterEstablishment($establishmentId);
        if(!empty($document_type)){
            $records->FilterDocumentType($document_type);
        }
        $records = $records->get();

        return new SeriesCollection($records);
    }

    public function tables()
    {
        $document_types = DocumentType::OnlyAvaibleDocuments()->get();

        return compact('document_types');
    }

    public function store(SeriesRequest $request)
    {
        $id = $request->input('id');

        $record = Series::where('document_type_id', $request->document_type_id)
            ->where('establishment_id', $request->establishment_id)
            ->where('number', strtoupper($request->number))
            ->when($id, function ($query) use ($id) {
                return $query->where('id', '!=', $id);
            })
            ->first();

        if($record){
            return [
                'success' => false,
                'message' => 'La serie ya ha sido registrada'
            ];
        }

        $series = Series::firstOrNew(['id' => $id]);
        $series->fill($request->all());
        $series->save();

        return [
            'success' => true,
            'message' => ($id)?'Serie editada con Ã©xito':'Serie registrada con Ã©xito'
        ];
    }

    public function destroy($id)
    {
        $item = Series::findOrFail($id);
        $item->delete();

        return [
            'success' => true,
            'message' => 'Serie eliminada con Ã©xito'
        ];
    }
}

