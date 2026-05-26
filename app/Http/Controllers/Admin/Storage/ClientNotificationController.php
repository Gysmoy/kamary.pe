<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\BasicController;
use App\Models\ClientNotification;
use App\Models\MailingTemplate;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class ClientNotificationController extends BasicController
{
    public $model = ClientNotification::class;
    public $prefix4filter = 'client_notifications';

    public function setPaginationInstance(string $model)
    {
        return $model::query()
            ->select('client_notifications.*')
            ->whereHas('client', function ($query) {
                StorageScope::applyClientScope($query);
            })
            ->selectRaw("(SELECT TRIM(CONCAT(COALESCE(users.name, ''), ' ', COALESCE(users.lastname, ''))) FROM users WHERE users.id = client_notifications.created_by LIMIT 1) AS creator_label");
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $clientId = (int)($body['client_id'] ?? 0);

        StorageScope::assertClient($clientId);
        if (!empty($body['id'])) {
            $current = $this->storageNotificationQuery()->find($body['id']);
            if (!$current) throw new \Exception('Notificacion de almacenamiento no encontrada');
            if ($current && (int)$current->client_id !== $clientId) {
                throw new \Exception('No se puede cambiar el cliente de la notificacion de almacenamiento');
            }
        }

        $notificationKey = trim((string)($body['notification_key'] ?? ''));
        $notificationName = trim((string)($body['notification_name'] ?? ''));
        $mailingTemplateId = null;

        if ($notificationKey !== '' && Schema::hasTable('mailing_templates')) {
            $template = MailingTemplate::query()
                ->whereKey($notificationKey)
                ->where('status', true)
                ->first();

            if ($template) {
                $mailingTemplateId = $template->id;
                $notificationName = $notificationName ?: ($template->caption ?: $template->name);
            }
        }

        if ($notificationName === '') {
            throw new \Exception('La notificacion es obligatoria');
        }

        $toEmails = $this->normalizeEmailList($body['to_emails'] ?? '', 'Para', true);
        $ccEmails = $this->normalizeEmailList($body['cc_emails'] ?? '', 'Copia', false);

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        $body['client_id'] = $clientId;
        $body['notification_key'] = $notificationKey ?: null;
        $body['mailing_template_id'] = $mailingTemplateId;
        $body['notification_name'] = $notificationName;
        $body['to_emails'] = $toEmails;
        $body['cc_emails'] = $ccEmails;
        $body['updated_by'] = $userId;

        return $body;
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();

            $updated = $this->storageNotificationQuery()
                ->where($this->identifier, $request->id)
                ->update($data);
            if (!$updated) throw new \Exception('Notificacion no encontrada en almacenamiento');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            $updated = $this->storageNotificationQuery()
                ->where($this->identifier, $request->id)
                ->update([
                    'status' => $request->status ? 0 : 1,
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('Notificacion no encontrada en almacenamiento');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $updated = $this->storageNotificationQuery()
                ->where($this->identifier, $id)
                ->update([
                    'status' => null,
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('No se ha eliminado ningun registro');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function storageNotificationQuery()
    {
        return $this->model::query()
            ->whereHas('client', fn($query) => StorageScope::applyClientScope($query));
    }

    private function normalizeEmailList(mixed $value, string $label, bool $required): ?string
    {
        $parts = is_array($value)
            ? $value
            : preg_split('/[,\n;]+/', (string)($value ?? ''));

        $emails = [];
        $seen = [];

        foreach ($parts ?: [] as $part) {
            $email = trim((string)$part);
            if ($email === '') {
                continue;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new \Exception("{$label} contiene un correo invalido: {$email}");
            }

            $key = strtolower($email);
            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $emails[] = $email;
        }

        if ($required && count($emails) === 0) {
            throw new \Exception("{$label} es obligatorio");
        }

        return count($emails) ? implode(', ', $emails) : null;
    }
}
