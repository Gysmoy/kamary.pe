<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\HandlesWebInbox;
use App\Http\Controllers\BasicController;
use App\Models\WebComplaint;
use App\Models\WebInquiry;
use App\Support\ModulePermissions;
use Illuminate\Http\Request;

// Bandeja "Consultas web": lo que llega de los formularios publicos (contacto, cotizaciones, trabaja con nosotros...).
class WebInquiryController extends BasicController
{
    use HandlesWebInbox;

    public $model = WebInquiry::class;
    public $reactView = 'Admin/WebInquiries';
    public $ignoreStatusFilter = true;
    public $softDeletion = false;

    public const STATUSES = ['new', 'in_process', 'attended', 'archived'];

    protected function fileFolder(): string
    {
        return 'web-inquiries';
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('web_inquiries.*')
            ->selectRaw("(file_path IS NOT NULL AND file_path <> '') AS has_file");
    }

    // PATCH /api/admin/web-inquiries/{id}: cambia el estado y/o las notas internas.
    public function updateInquiry(Request $request, string $id)
    {
        return $this->respondUpdate(function () use ($request, $id) {
            $request->validate([
                'status' => 'sometimes|in:' . implode(',', self::STATUSES),
                'internal_notes' => 'sometimes|nullable|string|max:5000',
            ], [
                'status.in' => 'El estado no es válido',
                'internal_notes.max' => 'Las notas internas no pueden superar los 5000 caracteres',
            ]);

            $jpa = WebInquiry::findOrFail($id);
            if ($request->has('status')) $jpa->status = $request->status;
            if ($request->has('internal_notes')) {
                $notes = trim((string) $request->internal_notes);
                $jpa->internal_notes = $notes === '' ? null : $notes;
            }
            $jpa->save();

            return $jpa->fresh();
        });
    }

    // GET /api/admin/web-pending: pendientes (estado "new") de cada bandeja que el usuario puede ver.
    public function pending(Request $request)
    {
        $user = $request->user();

        return response([
            'status' => 200,
            'data' => [
                'inquiries' => ModulePermissions::userCan($user, 'web-inquiries') ? WebInquiry::where('status', 'new')->count() : 0,
                'complaints' => ModulePermissions::userCan($user, 'web-complaints') ? WebComplaint::where('status', 'new')->count() : 0,
            ],
        ]);
    }
}
