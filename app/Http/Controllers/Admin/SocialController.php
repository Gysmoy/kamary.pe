<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Social;
use Illuminate\Http\Request;
use SoDe\Extend\File;
use SoDe\Extend\JSON;

class SocialController extends BasicController
{
    public $model = Social::class;
    public $reactView = 'Admin/Socials';

    public function setReactViewProperties(Request $request)
    {
        $icons = JSON::parse(File::get('../storage/app/utils/icons.json'));
        return [
            'icons' => $icons
        ];
    }
}
