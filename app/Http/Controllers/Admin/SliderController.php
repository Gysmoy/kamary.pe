<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Slider;
use App\Http\Requests\StoreSliderRequest;
use App\Http\Requests\UpdateSliderRequest;
use Illuminate\Http\Request;

class SliderController extends BasicController
{
    public $model = Slider::class;
    public $reactView = 'Admin/Sliders';
    public $imageFields = ['image'];

    public function setReactViewProperties(Request $request)
    {
        return [];
    }
}
