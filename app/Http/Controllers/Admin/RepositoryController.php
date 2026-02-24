<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use Illuminate\Http\Request;

class RepositoryController extends BasicController
{
    public $model = 'Repository';
    public $imageFields = ['file'];
    // public $useIntervention = false;

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return [
            'url' => 'repository/' . $jpa->file,
        ];
    }
}
