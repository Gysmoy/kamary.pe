<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\HandlesWebInbox;
use App\Http\Controllers\BasicController;
use App\Models\WebComplaint;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

// Bandeja "Libro de reclamaciones". La norma exige responder en 15 dias habiles.
class WebComplaintController extends BasicController
{
    use HandlesWebInbox;

    public $model = WebComplaint::class;
    public $reactView = 'Admin/WebComplaints';
    public $ignoreStatusFilter = true;
    public $softDeletion = false;

    public const STATUSES = ['new', 'in_process', 'answered', 'closed'];

    protected function fileFolder(): string
    {
        return 'web-complaints';
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('web_complaints.*')
            ->selectRaw("(file_path IS NOT NULL AND file_path <> '') AS has_file")
            // Se compara contra la hora de la app (no la del servidor MySQL) para no descuadrar por zona horaria.
            ->selectRaw('DATEDIFF(?, created_at) AS age_days', [now()->toDateTimeString()]);
    }

    // PATCH /api/admin/web-complaints/{id}: estado, respuesta y fecha de respuesta.
    public function updateComplaint(Request $request, string $id)
    {
        return $this->respondUpdate(function () use ($request, $id) {
            $request->validate([
                'status' => 'sometimes|in:' . implode(',', self::STATUSES),
                'response_text' => 'sometimes|nullable|string|max:5000',
                'responded_at' => 'sometimes|nullable|date',
            ], [
                'status.in' => 'El estado no es válido',
                'response_text.max' => 'La respuesta no puede superar los 5000 caracteres',
                'responded_at.date' => 'La fecha de respuesta no es válida',
            ]);

            $jpa = WebComplaint::findOrFail($id);
            if ($request->has('status')) $jpa->status = $request->status;
            if ($request->has('response_text')) {
                $text = trim((string) $request->response_text);
                $jpa->response_text = $text === '' ? null : $text;
            }
            if ($request->has('responded_at')) {
                $jpa->responded_at = $request->responded_at ? Carbon::parse($request->responded_at) : null;
            }
            // Al marcarlo como respondido sin fecha, se registra el momento actual.
            if ($jpa->status === 'answered' && !$jpa->responded_at) {
                $jpa->responded_at = now();
            }
            $jpa->save();

            return $jpa->fresh();
        });
    }
}
