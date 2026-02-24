<?php

namespace App\Jobs;

use App\Helpers\EmailConfig;
use App\Http\Controllers\MailingController;
use App\Models\HistoryDetail;
use App\Models\MailingTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\SendingHistory;
use Exception;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Text;
use SMTPValidateEmail\Validator as SMTP_Validate_Email;

class SendMessagesJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  private SendingHistory $historyJpa;
  private array $rows;

  public function __construct(SendingHistory $historyJpa, array $rows)
  {
    $this->historyJpa = $historyJpa;
    $this->rows = $rows;
  }

  public function handle()
  {
    $historyJpa = $this->historyJpa;
    try {
      $templateJpa = MailingTemplate::find($historyJpa->mailing_template_id);

      if ($historyJpa->type == 'Email') {
        $this->sendEmail($templateJpa, $historyJpa);
      }
      if ($historyJpa->type == 'WhatsApp') {
        $this->sendWhatsApp($templateJpa, $historyJpa);
      }

      $historyJpa->completed = HistoryDetail::where('sending_history_id', $historyJpa->id)->where('status', true)->count();
      $historyJpa->failed = HistoryDetail::where('sending_history_id', $historyJpa->id)->where('status', false)->count();
      $historyJpa->status = true;
    } catch (\Throwable $th) {
      dump($th->getMessage());
      $historyJpa->status = false;
    } finally {
      $historyJpa->save();
    }
  }

  public function sendEmail($templateJpa)
  {
    $historyJpa = $this->historyJpa;

    // INICIO: SMTP Config
    // $mail = EmailConfig::config();
    // if (!$mail->smtpConnect()) throw new Exception('No se pudo conectar a SMTP');
    // FIN: SMTP Config

    foreach ($this->rows as $row) {
      $success = false;
      $error = 'Error desconocido';

      $emailField = $historyJpa->mapping['waves_send_to'] ?? 'email';
      $email = $row[$emailField];
      try {

        // $dominio = substr(strrchr($email, "@"), 1);
        // if (!checkdnsrr($dominio, "MX")) throw new Exception("Dominio sin servidor de correo");

        // $validator = new SMTP_Validate_Email();
        // $result = $validator->validate([$email], 'tu-correo@tudominio.com');

        // if (!$result[$email]) throw new Exception("El correo no existe o no es válido");

        $data = [];
        foreach ($templateJpa->vars as $var) {
          $data[$var] = $row[$historyJpa->mapping[$var]];
        }

        $html = Text::replaceData($templateJpa->content, $data);

        // if (env('APP_ENV') == 'production') $mail->addAddress($email);
        // else $mail->addAddress('gamboapalominocarlosmanuel@gmail.com');
        // $mail->Subject = $templateJpa->name;
        // $mail->Body = $html;
        // $mail->isHTML(true);
        // $mail->send();

        // $success = true;
        // $error = null;

        if (env('APP_ENV') == 'production') {
          [$success, $error] = MailingController::send($email, $templateJpa->name, $html);
        } else {
          [$success, $error] = MailingController::send('gamboapalominocarlosmanuel@gmail.com', $templateJpa->name, $html);
        }

        if (!$success) throw new Exception($error);

        $historyJpa->completed++;
      } catch (\Throwable $th) {
        dump($th->getMessage());
        $error = $th->getMessage();
        $historyJpa->failed++;
      } finally {
        try {
          // $mail->clearAddresses();
          $historyJpa->save();
          HistoryDetail::create([
            'sending_history_id' => $historyJpa->id,
            'sent_to' => $email,
            'data' => $row,
            'status' => $success,
            'error' => $error,
          ]);
        } catch (\Throwable $th) {
          dump($th->getMessage());
        }
      }
    }
    // $mail->smtpClose();
  }

  public function sendWhatsApp($templateJpa)
  {
    $historyJpa = $this->historyJpa;

    foreach ($this->rows as $row) {
      $success = false;
      $error = 'Error desconocido';
      $phoneField = $historyJpa->mapping['waves_send_to'];
      $phone = Text::keep($row[$phoneField], '0123456789');

      try {
        $data = [];
        foreach ($templateJpa->vars as $var) {
          $data[$var] = $row[$historyJpa->mapping[$var]];
        }

        $html = Text::replaceData($templateJpa->content, $data);

        $res = new Fetch(env('WA_URL') . '/api/send', [
          'method' => 'POST',
          'headers' => [
            'Content-Type' => 'application/json'
          ],
          'body' => [
            'apiKey' => env('EVOAPI_APIKEY'),
            'from' => env('EVOAPI_INSTANCE'),
            'to' => [$phone],
            'html' => $html,
          ]
        ]);

        if (!$res->ok) {
          $data = JSON::parseable($res->text());
          throw new Exception($data['message'] ?? 'Error desconocido');
        }

        $success = true;
        $error = null;
      } catch (\Throwable $th) {
        $error = $th->getMessage();
      } finally {
        HistoryDetail::create([
          'history_id' => $historyJpa->id,
          'sent_to' => $phone,
          'data' => $row,
          'status' => $success,
          'error' => $error,
        ]);
      }
    }
  }
}
