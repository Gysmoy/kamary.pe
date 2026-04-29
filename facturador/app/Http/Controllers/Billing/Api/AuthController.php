<?php

namespace App\Http\Controllers\Billing\Api;

use App\Http\Controllers\Controller;
use App\Models\Billing\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $validated = $validator->validate();

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], (string)$user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales invalidas.',
            ], 401);
        }

        if ((bool)$user->locked) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario bloqueado.',
            ], 403);
        }

        $user->updateToken();
        $user->save();

        return [
            'success' => true,
            'message' => 'Login API exitoso.',
            'token_type' => 'Bearer',
            'token' => $user->api_token,
            'data' => $this->transformUser($user),
        ];
    }

    public function me(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        if ((bool)$user->locked) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario bloqueado.',
            ], 403);
        }

        return [
            'success' => true,
            'message' => 'Token valido.',
            'data' => $this->transformUser($user),
        ];
    }

    public function logout(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        $user->api_token = null;
        $user->save();

        return [
            'success' => true,
            'message' => 'Token revocado.',
        ];
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => (int)$user->id,
            'name' => $user->name,
            'email' => $user->email,
            'type' => $user->type,
            'locked' => (bool)$user->locked,
        ];
    }
}
