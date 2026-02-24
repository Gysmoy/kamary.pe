<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Subscription;

class SubscriptionController extends BasicController
{
   public $model = Subscription::class;
   public $reactView = 'Admin/Subscriptions';
}
