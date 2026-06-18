<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class StorageApiToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'name',
        'token_prefix',
        'token_hash',
        'encrypted_token',
        'abilities',
        'last_used_at',
        'expires_at',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'abilities' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
        'status' => 'boolean',
    ];

    public static function makePlainToken(): string
    {
        return 'kst_' . Str::random(64);
    }

    public static function hashToken(string $plainToken): string
    {
        return hash('sha256', trim($plainToken));
    }

    public static function encryptedToken(string $plainToken): string
    {
        return Crypt::encryptString(trim($plainToken));
    }

    public function plainToken(): ?string
    {
        $encrypted = trim((string) ($this->encrypted_token ?? ''));
        if ($encrypted === '') return null;

        try {
            return Crypt::decryptString($encrypted);
        } catch (\Throwable) {
            return null;
        }
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function isUsable(): bool
    {
        return (bool) $this->status
            && (!$this->expires_at || $this->expires_at->isFuture());
    }

    public function allows(?string $ability): bool
    {
        if (!$ability) return true;

        $abilities = $this->abilities ?: ['stock:read', 'orders:read', 'orders:write'];
        return in_array('*', $abilities, true) || in_array($ability, $abilities, true);
    }
}
