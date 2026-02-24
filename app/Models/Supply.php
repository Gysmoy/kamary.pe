<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supply extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    static function byFormula(string $test, mixed $answer)
    {
        if (\gettype($answer) == 'array') {
            return Formula::where('name', $test)
                ->whereIn('correlative', $answer)
                ->first()?->supplies ?? collect();
        } else {
            return Formula::where('name', $test)
                ->where('correlative', $answer)
                ->first()?->supplies ?? collect();
        }
    }
}
