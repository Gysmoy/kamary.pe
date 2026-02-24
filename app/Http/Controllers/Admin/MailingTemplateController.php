<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\HistoryDetail;
use App\Models\MailingTemplate;
use Illuminate\Http\Request;

class MailingTemplateController extends BasicController
{
    public $model = MailingTemplate::class;
    public $reactView = 'Admin/MailingTemplates';

    public function setReactViewProperties(Request $request)
    {
        return [
            'TINYMCE_KEY' => \env('TINYMCE_KEY')
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select([
            'id',
            'name',
            'caption',
            'description',
            'model',
            'type',
            'filters',
            'auto_send',
            'status',
        ]);
    }
}
