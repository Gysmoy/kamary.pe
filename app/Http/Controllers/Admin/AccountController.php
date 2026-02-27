<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Response as HttpResponse;

class AccountController extends BasicController
{
  public $reactView = 'Admin/Account';

  public function username(Request $request): HttpResponse|ResponseFactory
  {
    $response = Response::simpleTryCatch(function () use ($request) {
      $jpa = User::find(Auth::user()->id);

      $password = parent::decode($request->password);
      if (!password_verify($password, $jpa->password)) {
        throw new Exception('La contraseña es incorrecta');
      }

      $jpa->username = $request->username;
      $jpa->save();
    });
    return response($response->toArray(), $response->status);
  }

  public function password(Request $request): HttpResponse|ResponseFactory
  {
    $response = new Response();
    try {

      $password = parent::decode($request->password);
      $newPassword = parent::decode($request->newPassword);
      $confirmPassword = parent::decode($request->confirmPassword);

      if ($newPassword != $confirmPassword) {
        throw new Exception("Las contraseña nueva y la contraseña de confirmacion deben ser iguales");
      }

      $jpa = User::find(Auth::user()->id);

      if (!password_verify($password, $jpa->password)) {
        throw new Exception('La contraseña anterior es incorrecta');
      }

      if ($password == $newPassword) {
        throw new Exception('La contraseña nueva debe ser diferente a la anterior');
      }

      $jpa->password = password_hash($newPassword, PASSWORD_DEFAULT);
      $jpa->save();

      $response->status = 200;
      $response->message = 'Operacion correcta';
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
