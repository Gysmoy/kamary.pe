<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Billing\Document;
use App\Models\Billing\DocumentPayment;
use App\Models\Billing\User;

use App\Models\Billing\Configuration;
use Exception;

class DocumentPaymentProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {

    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        $this->payments();
    }



    private function payments()
    {
        DocumentPayment::created(function ($document_payment) {
            $this->transaction_payment($document_payment);
        });

        DocumentPayment::deleted(function ($document_payment) {
            $this->transaction_payment($document_payment);
        });

    }

    private function transaction_payment($document_payment){

        $document = $document_payment->document;
        $total_payments = $document->payments->sum('payment');

        $balance = $document->total - $total_payments;

        if($balance <= 0){

            $document->total_canceled = true;
            $document->update();

        }else{

            $document->total_canceled = false;
            $document->update();
        }

    }
}
