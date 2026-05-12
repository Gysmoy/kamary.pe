<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\BasicController;
use App\Models\Client;
use App\Models\ClientNotification;
use App\Models\MailingTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class ClientNotificationController extends BasicController
{
    public $model = ClientNotification::class;
    public $prefix4filter = 'client_notifications';

    public function setPaginationInstance(string $model)
    {
        return $model::query()
            ->select('client_notifications.*')
            ->selectRaw("(SELECT TRIM(CONCAT(COALESCE(users.name, ''), ' ', COALESCE(users.lastname, ''))) FROM users WHERE users.id = client_notifications.created_by LIMIT 1) AS creator_label");
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $clientId = (int)($body['client_id'] ?? 0);

        $clientExists = Client::query()
            ->whereKey($clientId)
            ->whereNotNull('status')
            ->exists();

        if (!$clientExists) {
            throw new \Exception('Cliente no encontrado');
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
