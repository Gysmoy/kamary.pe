<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends BasicController
{
    public $model = Faq::class;
    public $reactView = 'Admin/Faqs';
    public $softDeletion = false;
}
