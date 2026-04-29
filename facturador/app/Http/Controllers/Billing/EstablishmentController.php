<?php
namespace App\Http\Controllers\Billing;

use App\Models\Billing\Catalogs\Country;
use App\Models\Billing\Catalogs\Department;
use App\Models\Billing\Catalogs\District;
use App\Models\Billing\Catalogs\Province;
use App\Models\Billing\Establishment;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\EstablishmentRequest;
use App\Http\Resources\Billing\EstablishmentResource;
use App\Http\Resources\Billing\EstablishmentCollection;
use App\Models\Billing\Warehouse;
use App\Models\Billing\Person;
use Illuminate\Support\Facades\Schema;

class EstablishmentController extends Controller
{
    public function index()
    {
        return view('tenant.establishments.index');
    }

    public function create()
    {
        return view('tenant.establishments.form');
    }

    public function tables()
    {
        $countries = Country::whereActive()->orderByDescription()->get();
        $departments = Department::whereActive()->orderByDescription()->get();
        $provinces = Province::whereActive()->orderByDescription()->get();
        $districts = District::whereActive()->orderByDescription()->get();

        $customers = Person::whereType('customers')->orderBy('name')->take(1)->get()->transform(function($row) {
            return [
                'id' => $row->id,
                'description' => $row->number.' - '.$row->name,
                'name' => $row->name,
                'number' => $row->number,
                'identity_document_type_id' => $row->identity_document_type_id,
            ];
        });

        return compact('countries', 'departments', 'provinces', 'districts', 'customers');
    }

    public function record($id)
    {
        $record = new EstablishmentResource(Establishment::findOrFail($id));

        return $record;
    }

    public function store(EstablishmentRequest $request)
    {
        $id = $request->input('id');
        $establishment = Establishment::firstOrNew(['id' => $id]);
        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            $request->validate(['file' => 'mimes:jpeg,png,jpg|max:1024']);
            $file = $request->file('file');
            $ext = $file->getClientOriginalExtension();
            $filename = time() . '.' . $ext;
            $file->storeAs('public/uploads/logos', $filename);
            $path = 'storage/uploads/logos/' . $filename;
            $request->merge(['logo' => $path]);
        }
        $payload = $request->except(['file']);

        // Keep compatibility with tenants that still do not have optional columns.
        if (!Schema::hasColumn('establishments', 'customer_id')) {
            unset($payload['customer_id']);
        }

        if (!Schema::hasColumn('establishments', 'is_subject_to_igv_31556')) {
            unset($payload['is_subject_to_igv_31556']);
        }

        $establishment->fill($payload);

        $establishment->save();

        if (
            !$id &&
            class_exists(Warehouse::class) &&
            Schema::connection('tenant')->hasTable('warehouses') &&
            Schema::connection('tenant')->hasColumn('warehouses', 'establishment_id') &&
            Schema::connection('tenant')->hasColumn('warehouses', 'description')
        ) {
            $warehouse = new Warehouse();
            $warehouse->establishment_id = $establishment->id;
            $warehouse->description = 'AlmacÃ©n - '.$establishment->description;
            $warehouse->save();
        }

        return [
            'success' => true,
            'message' => ($id)?'Establecimiento actualizado':'Establecimiento registrado'
        ];
    }

    public function records()
    {
        $records = Establishment::all();

        return new EstablishmentCollection($records);
    }

    public function destroy($id)
    {
        $establishment = Establishment::findOrFail($id);
        $establishment->delete();

        return [
            'success' => true,
            'message' => 'Establecimiento eliminado con Ã©xito'
        ];
    }
}

