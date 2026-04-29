<?php

namespace App\Support\Database;

use Illuminate\Database\Eloquent\Model;

abstract class SystemModel extends Model
{
    use UsesSystemConnection;
}
