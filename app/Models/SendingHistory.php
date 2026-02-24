<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SendingHistory extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'sending_history';

    protected $fillable = [
        'name',
        'type',
        'mapping',
        'completed',
        'failed',
        'total',
        'status',
        'mailing_template_id',
    ];

    protected $casts = [
        'mapping' => 'array',
    ];

    public function details()
    {
        return $this->hasMany(HistoryDetail::class, 'sending_history_id', 'id');
    }
}
