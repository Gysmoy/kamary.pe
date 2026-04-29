<?php

namespace App\Services;
use App\Models\Billing\ConfigurationEcommerce;

class UserAdminService
{

    public function getUserAdmin()
    {
        return ConfigurationEcommerce::first();
    }


}
