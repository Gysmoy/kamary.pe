<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasPermissions;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasPermissions, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'uuid',
        'username',
        'name',
        'lastname',
        'fullname',
        'email',
        'email_verified_at',
        'password',
        'scope',
        'storage_client_id',
        'document_type',
        'document_number',
        'phone_prefix',
        'phone',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'id',
        'password',
        'remember_token'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'scope' => 'array',
        'password' => 'hashed',
        'status' => 'boolean',
        'verified' => 'boolean'
    ];

    public function isRoot()
    {
        return $this->hasRole('Root');
    }

    public function isAdmin()
    {
        return $this->hasRole('Admin');
    }


    public function getRole()
    {
        return $this->getRoleNames()[0];
    }

    public function sales()
    {
        return $this->hasMany(Sale::class, 'seller_id')
            ->whereHas('status', function ($query) {
                $query->where('is_ok', true);
            });
    }

    public function points()
    {
        return $this->belongsToMany(
            DeliveryPoint::class,
            'user_has_points',
            'seller_id',
            'delivery_point_id'
        );
    }

    public function storageClient()
    {
        return $this->belongsTo(Client::class, 'storage_client_id');
    }
}
