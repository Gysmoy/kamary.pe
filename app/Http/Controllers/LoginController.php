<?php

namespace App\Http\Controllers;

use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class LoginController extends BasicController
{
    public $model = User::class;
    public $reactView = 'Login';
    public $reactRootView = 'auth';

    public function setReactViewProperties(Request $request)
    {
        if (Auth::check()) {
            return redirect('/');
        }
        return [];
    }

    public function send(Request $request)
    {
        DB::beginTransaction();
        $response = Response::simpleTryCatch(function () use ($request) {
            $email = parent::decode($request->email);

            $user = User::where('email', $email)->first();

            if (!$user) throw new Exception('Usuario no encontrado');
            if (!$user->status) throw new Exception('El usuario se encuentra inactivo');

            // Si el usuario es admin, no cambiamos su contraseña ni enviamos correo
            if ($user->hasRole('Admin')) {
                DB::commit();
                return;
            }

            $code = (string) random_int(111111, 999999);
            $user->password = bcrypt($code);
            $user->save();

            MailingController::simpleNotify(
                'mailing.code-email',
                $user->email,
                [
                    'title' => 'Código de autenticación - ' . env('APP_NAME'),
                    'code' => $code
                ]
            );
            DB::commit();
        }, fn() => DB::rollBack());
        return response($response->toArray(), $response->status);
    }

    public function login(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $username = self::decode($request->username);
            $password = self::decode($request->password);

            $userJpa = User::where('username', $username)->first();
            if (!$userJpa) throw new Exception('Este usuario no existe, cree una cuenta nueva');
            if ($userJpa->status == null) throw new Exception('Este usuario se encuentra baneado del sistema');
            if (!$userJpa->status) throw new Exception('Este usuario se encuentra inactivo');

            if (!Auth::attempt([
                'username' => $username,
                'password' => $password
            ])) {
                throw new Exception('Credenciales invalidas');
            }

            $request->session()->regenerate();

            return Auth::user();
        });
        return response($response->toArray(), $response->status);
    }
}
