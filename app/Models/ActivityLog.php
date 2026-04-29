<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'activity_status',
        'logged_at',
        'message',
        'payload',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
        'payload' => 'array',
        'status' => 'boolean',
    ];

    public function activity() { return $this->belongsTo(Activity::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
