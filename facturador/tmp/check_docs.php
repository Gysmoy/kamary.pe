<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$docs = App\Models\Billing\Document::query()->latest('id')->take(10)->get(['id','series','number','date_of_issue','state_type_id','is_editable','user_id']);
foreach ($docs as $d) {
    echo $d->id.' '.$d->series.'-'.$d->number.' state='.$d->state_type_id.' editable='.(int)$d->is_editable.' date='.$d->date_of_issue.' user='.$d->user_id.PHP_EOL;
}
