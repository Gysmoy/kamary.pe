<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\WebComplaint;
use App\Models\WebInquiry;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use SoDe\Extend\Response;
use Throwable;

// Formularios publicos de la web (sin autenticacion). Responden con el mismo formato que el resto del ERP.
class WebFormController extends Controller
{
  private const INQUIRY_TYPES = 'contacto,magistrales,corporativas,logistico,distribucion,importacion,almacen,asesoria,trabaja';
  private const FILE_RULE = 'nullable|file|mimes:pdf,jpg,jpeg,png,webp|max:10240';

  // POST /api/web/inquiries (multipart)
  public function inquiries(Request $request): HttpResponse|ResponseFactory
  {
    // Honeypot: un bot que llena el campo "website" recibe un OK sin que se guarde nada.
    if ($request->filled('website')) {
      return $this->success('Operación correcta', ['id' => null]);
    }

    $validator = Validator::make($request->all(), [
      'type' => 'required|string|in:' . self::INQUIRY_TYPES,
      'name' => 'required|string|max:255',
      'last_name' => 'nullable|string|max:255',
      'email' => 'required|email|max:255',
      'phone' => 'required|string|max:30',
      'subject' => 'nullable|string|max:255',
      'message' => 'nullable|string|max:5000',
      'file' => self::FILE_RULE,
      'accepted_privacy' => 'accepted',
    ], $this->messages(), [
      'type' => 'tipo de formulario',
      'name' => 'nombre',
      'last_name' => 'apellido',
      'email' => 'correo electrónico',
      'phone' => 'teléfono',
      'subject' => 'asunto',
      'message' => 'mensaje',
      'file' => 'archivo',
      'accepted_privacy' => 'política de privacidad',
    ]);

    if ($validator->fails()) {
      return $this->invalid($validator);
    }

    $data = $validator->validated();
    $filePath = null;

    try {
      if ($request->hasFile('file')) {
        $filePath = $request->file('file')->store('web-inquiries');
      }

      $inquiry = WebInquiry::create([
        'type' => $data['type'],
        'name' => $data['name'],
        'last_name' => $data['last_name'] ?? null,
        'email' => $data['email'],
        'phone' => $data['phone'],
        'subject' => $data['subject'] ?? null,
        'message' => $data['message'] ?? null,
        'file_path' => $filePath,
        'payload' => [
          'accepted_privacy' => true,
        ],
        'ip' => $request->ip(),
        'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
        'status' => 'new',
      ]);

      return $this->success('Recibimos tu consulta. Te responderemos a la brevedad.', ['id' => $inquiry->id]);
    } catch (Throwable $th) {
      $this->discardFile($filePath);
      Log::error('Error guardando web inquiry', ['error' => $th->getMessage()]);
      return $this->failure('No se pudo registrar tu consulta. Intenta nuevamente.');
    }
  }

  // POST /api/web/complaints (multipart) - Libro de Reclamaciones
  public function complaints(Request $request): HttpResponse|ResponseFactory
  {
    if ($request->filled('website')) {
      return $this->success('Operación correcta', ['code' => null]);
    }

    $validator = Validator::make($request->all(), [
      'person_type' => 'required|string|in:natural,juridica',
      'first_name' => 'required_if:person_type,natural|string|max:255',
      'last_name' => 'required_if:person_type,natural|string|max:255',
      'document_type' => 'required|string|in:DNI,RUC',
      'document_number' => 'required|string|max:20',
      'business_name' => 'required_if:person_type,juridica|string|max:255',
      'address' => 'required|string|max:255',
      'district' => 'required|string|max:120',
      'department' => 'required|string|max:120',
      'phone' => 'required|string|max:30',
      'email' => 'required|email|max:255',
      'claim_type' => 'required|string|in:reclamo,queja',
      'good_type' => 'required|string|in:producto,servicio',
      'product_detail' => 'required|string|max:5000',
      'claim_detail' => 'nullable|string|max:5000',
      'file' => self::FILE_RULE,
      'declaration' => 'accepted',
    ], $this->messages(), [
      'person_type' => 'tipo de persona',
      'first_name' => 'nombres',
      'last_name' => 'apellidos',
      'document_type' => 'tipo de documento',
      'document_number' => 'número de documento',
      'business_name' => 'razón social',
      'address' => 'dirección',
      'district' => 'distrito',
      'department' => 'departamento',
      'phone' => 'teléfono',
      'email' => 'correo electrónico',
      'claim_type' => 'tipo (reclamo o queja)',
      'good_type' => 'bien contratado',
      'product_detail' => 'detalle del producto o servicio',
      'claim_detail' => 'detalle del reclamo o queja',
      'file' => 'archivo',
      'declaration' => 'declaración jurada',
    ]);

    if ($validator->fails()) {
      return $this->invalid($validator);
    }

    $data = $validator->validated();
    $filePath = null;

    try {
      if ($request->hasFile('file')) {
        $filePath = $request->file('file')->store('web-complaints');
      }

      // El correlativo se asigna dentro de la transaccion: se inserta con un codigo temporal
      // unico y luego se reemplaza por LR-<id>. El id autoincremental no se repite, asi que
      // no hay carreras entre dos envios simultaneos.
      $complaint = DB::transaction(function () use ($data, $request, $filePath) {
        $complaint = WebComplaint::create([
          'code' => 'TMP-' . Str::random(12),
          'person_type' => $data['person_type'],
          'first_name' => $data['first_name'] ?? null,
          'last_name' => $data['last_name'] ?? null,
          'document_type' => $data['document_type'],
          'document_number' => $data['document_number'],
          'business_name' => $data['business_name'] ?? null,
          'address' => $data['address'],
          'district' => $data['district'],
          'department' => $data['department'],
          'phone' => $data['phone'],
          'email' => $data['email'],
          'claim_type' => $data['claim_type'],
          'good_type' => $data['good_type'],
          'product_detail' => $data['product_detail'],
          'claim_detail' => $data['claim_detail'] ?? null,
          'file_path' => $filePath,
          'payload' => [
            'declaration' => true,
          ],
          'ip' => $request->ip(),
          'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
          'status' => 'new',
        ]);

        $complaint->code = sprintf('LR-%06d', $complaint->id);
        $complaint->save();

        return $complaint;
      });

      return $this->success(
        "Tu reclamo fue registrado con el código {$complaint->code}. Guárdalo como constancia.",
        ['code' => $complaint->code]
      );
    } catch (Throwable $th) {
      $this->discardFile($filePath);
      Log::error('Error guardando web complaint', ['error' => $th->getMessage()]);
      return $this->failure('No se pudo registrar tu reclamo. Intenta nuevamente.');
    }
  }

  private function messages(): array
  {
    return [
      'required' => 'El campo :attribute es obligatorio.',
      'required_if' => 'El campo :attribute es obligatorio.',
      'string' => 'El campo :attribute no es válido.',
      'max' => 'El campo :attribute no debe superar :max caracteres.',
      'in' => 'El valor de :attribute no es válido.',
      'email' => 'Ingresa un correo electrónico válido.',
      'accepted' => 'Debes aceptar la :attribute para continuar.',
      'file' => 'El archivo no es válido.',
      'mimes' => 'El archivo debe ser PDF, JPG, JPEG, PNG o WEBP.',
      'max.file' => 'El archivo no debe pesar más de 10 MB.',
    ];
  }

  private function invalid($validator): HttpResponse|ResponseFactory
  {
    $response = new Response();
    $response->status = 422;
    $response->message = $validator->errors()->first();
    $response->data = $validator->errors()->toArray();
    return response($response->toArray(), 422);
  }

  private function success(string $message, array $data): HttpResponse|ResponseFactory
  {
    $response = new Response();
    $response->status = 200;
    $response->message = $message;
    $response->data = $data;
    return response($response->toArray(), 200);
  }

  private function failure(string $message): HttpResponse|ResponseFactory
  {
    $response = new Response();
    $response->status = 500;
    $response->message = $message;
    return response($response->toArray(), 500);
  }

  // Si la BD falla despues de guardar el archivo, se borra para no dejar huerfanos.
  private function discardFile(?string $path): void
  {
    if ($path) {
      Storage::delete($path);
    }
  }
}
