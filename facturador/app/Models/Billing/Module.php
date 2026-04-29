<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Builder;

/**
 * Class Module
 *
 * @package App\Models\Billing
 * @mixin ModelTenant
 * @method static Builder|Module newModelQuery()
 * @method static Builder|Module newQuery()
 * @method static Builder|Module query()
 */
class Module extends ModelTenant
{
    protected $fillable = [
        'value',
        'description',
    ];
}

