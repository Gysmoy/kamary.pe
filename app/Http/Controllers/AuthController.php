<?php

namespace App\Http\Controllers;

use App\Http\Services\ReCaptchaService;
use App\Models\User;
use App\Models\PreUser;
use App\Models\Subscription;
use Exception;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use SoDe\Extend\Crypto;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Trace;
use Spatie\Permission\Models\Role;

class AuthController extends Controller
{

  public function send(Request $request)
  {
    DB::beginTransaction();
    $response = Response::simpleTryCatch(function () use ($request) {
      $email = parent::decode($request->email);

      $user = User::where('email', $email)->first();
      if (!$user) throw new Exception('Usuario no encontrado');

      $code = (string) random_int(111111, 999999);
      $user->password = bcrypt($code);
      $user->save();

      MailingController::simpleNotify(
        'mailing.code-email',
        // $user->email,
        'gamboapalominocarlosmanuel@gmail.com',
        [
          'title' => 'Código de autenticación - ' . env('APP_NAME'),
          'code' => $code
        ]
      );
      DB::commit();
    }, fn() => DB::rollBack());
    return response($response->toArray(), $response->status);
  }

  public function loginView(Request $request)
  {
    if (Auth::check()) {
      $userJpa = User::find(Auth::user()->id);
      switch ($userJpa->getRole()) {
        case 'Admin':
          return redirect('/admin');
          break;
        case 'Seller':
          return redirect('/seller');
          break;
        case 'Customer':
          return redirect('/customer');
          break;

        default:
          Auth::guard('web')->logout();
          $request->session()->invalidate();
          $request->session()->regenerateToken();
          return redirect('/login');
          break;
      }
    };

    return Inertia::render('Login', [
      'message' => $message ?? null,
      'global' => [
        // 'PUBLIC_RSA_KEY' => ,
        'APP_NAME' => env('APP_NAME', 'Trasciende'),
        'APP_URL' => env('APP_URL'),
        'APP_DOMAIN' => env('APP_DOMAIN'),
        'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
      ],
    ])->rootView('public');
  }

  public function registerView()
  {
    if (Auth::check()) return redirect('/home');

    return Inertia::render('Register', [
      'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
      // 'PUBLIC_RSA_KEY' => parent::$PUBLIC_RSA_KEY,
      'RECAPTCHA_SITE_KEY' => env('RECAPTCHA_SITE_KEY'),
      'global' => [
        'APP_NAME' => env('APP_NAME', 'Trasciende'),
        'APP_URL' => env('APP_URL'),
        'APP_DOMAIN' => env('APP_DOMAIN'),
        'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
      ]
    ])->rootView('public');
  }

  public function confirmEmailView(Request $request, string $token)
  {
    if (Auth::check()) return redirect('/home');

    $preUserJpa = PreUser::where('token', $token)->first();
    if (!$preUserJpa) return redirect('/login');

    return Inertia::render('ConfirmEmail', [
      'email' => $preUserJpa->email,
      'global' => [
        'APP_NAME' => env('APP_NAME', 'Trasciende'),
        'APP_URL' => env('APP_URL'),
        'APP_DOMAIN' => env('APP_DOMAIN'),
        'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
      ]
    ])->rootView('auth');
  }

  /**
   * Handle an incoming authentication request.
   */
  public function login(Request $request): HttpResponse | ResponseFactory | RedirectResponse
  {
    $response = Response::simpleTryCatch(function (Response $response) use ($request) {
      $email = parent::decode($request->email);
      $password = parent::decode($request->password);

      $userJpa = User::where('email', $email)->first();
      if (!$userJpa) throw new Exception('Este usuario no existe, cree una cuenta nueva');
      if ($userJpa->status == null) throw new Exception('Este usuario se encuentra baneado del sistema');
      if (!$userJpa->status) throw new Exception('Este usuario se encuentra inactivo');

      if (!Auth::attempt([
        'email' => $email,
        'password' => $password
      ])) {
        throw new Exception('Credenciales invalidas');
      }

      $request->session()->regenerate();

      return Auth::user();
    });
    return response($response->toArray(), $response->status);
  }

  public function signup(Request $request): HttpResponse | ResponseFactory | RedirectResponse
  {
    $response = Response::simpleTryCatch(function () use ($request) {
      $request->validate([
        'name' => 'required|string|max:255',
        'lastname' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string',
        'confirmation' => 'required|string',
        'captcha' => 'required|string',
      ]);

      $body = $request->all();

      if (!isset($request->password) || !isset($request->confirmation)) throw new Exception('Debes ingresar una contraseña para el nuevo usuario');
      // if (Controller::decode($request->password) != Controller::decode($request->confirmation)) throw new Exception('Las contraseñas deben ser iguales');

      if (!ReCaptchaService::verify($request->captcha)) throw new Exception('Captcha invalido. Seguro que no eres un robot?');

      $roleJpa = Role::where('name', 'Customer')->first();

      if (!$roleJpa) throw new Exception('El rol que ingresaste no existe, que intentas hacer?');

      $preUserJpa = PreUser::updateOrCreate([
        'email' => $body['email']
      ], [
        'name' => $body['name'],
        'lastname' => $body['lastname'],
        'birth_day' => $body['day'],
        'birth_month' => $body['month'],
        'email' => $body['email'],
        'role' => $roleJpa->relative_id,
        // 'password' => Controller::decode($body['password']),
        'confirmation_token' => $request->type == 'direct'
          // ? strtoupper(substr(str_shuffle('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 6))
          ? strtoupper(substr(str_shuffle('123456789ABCDEFGHIJKLMNPQRSTUVWXYZ'), 0, 6))
          : Crypto::randomUUID(),
        'notify_me' => $body['notify_me'],
        'token' => Crypto::randomUUID(),
      ]);

      MailingController::simpleNotify(
        $request->type == 'direct'
          ? 'mailing.code-email'
          : 'mailing.confirm-email',
        $preUserJpa->email,
        [
          'title' => 'Confirmacion - ' . env('APP_NAME'),
          'preUser' => $preUserJpa->toArray()
        ]
      );

      return $preUserJpa->token;
    });

    return response($response->toArray(), $response->status);
  }

  public function verifyCode(Request $request)
  {
    $response = Response::simpleTryCatch(function () use ($request) {
      DB::beginTransaction();

      $preUserJpa = PreUser::select()
        ->where('email', $request->email)
        ->where('confirmation_token', $request->code)
        ->first();

      if (!$preUserJpa) throw new Exception('El codigo de confirmacion no es valido');

      $roleJpa = Role::where('relative_id', $preUserJpa->role)->first();

      $userJpa = User::create([
        'uuid' => Crypto::randomUUID(),
        'name' => $preUserJpa->name,
        'lastname' => $preUserJpa->lastname,
        'email' => $preUserJpa->email,
        'birth_day' => $preUserJpa->birth_day,
        'birth_month' => $preUserJpa->birth_month,
        'email_verified_at' => Trace::getDate('mysql'),
        'password' => $preUserJpa->password,
        'notify_me' => $preUserJpa->notify_me,
        'status' => true
      ])->assignRole($roleJpa->name);

      Subscription::updateOrCreate([
        'description' => $userJpa->email,
        'name' => Text::getEmailProvider($userJpa->email)
      ], [
        'is_user' => true
      ]);

      $preUserJpa->delete();

      // Attempt authentication after user creation
      if (!Auth::attempt([
        'email' => $userJpa->email,
        'password' => $preUserJpa->password
      ])) {
        throw new Exception('Error al iniciar sesión automáticamente');
      }

      $request->session()->regenerate();

      DB::commit();

      return Auth::user();
    });

    return response($response->toArray(), $response->status);
  }

  /**
   * Destroy an authenticated session.
   */
  public function destroy(Request $request)
  {
    $response = new Response();
    try {
      Auth::guard('web')->logout();

      $request->session()->invalidate();
      $request->session()->regenerateToken();

      $response->status = 200;
      $response->message = 'Cierre de sesion exitoso';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }
}
