<?php

namespace App\Observers;

use App\Models\User;

class UserNameObserver
{
    public function created(User $user)
    {
        User::where('id', $user->id)
            ->update([
                'fullname' => $user->name . ' ' . $user->lastname,
            ]);
    }

    // Registro de los cambios en el estado
    public function updating(User $user)
    {
        if ($user->isDirty('name') || $user->isDirty('lastname')) {
            User::where('id', $user->id)
                ->update([
                    'fullname' => $user->name . ' ' . $user->lastname,
                ]);
        }
    }
}
