<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Billing\Document;
use App\Models\Billing\User;

use App\Models\Billing\Configuration;
use Exception;
use Modules\Document\Helpers\DocumentHelper;
use Illuminate\Support\Facades\Schema;
use Throwable;


class LockedEmissionProvider extends ServiceProvider
{
    /**
     * @var array<string,bool>
     */
    private array $configurationColumnCache = [];

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
        $this->locked_emission();
        $this->locked_users();
        $this->update_quantity_documents();
    }

    private function hasConfigurationColumn(string $column): bool
    {
        if (array_key_exists($column, $this->configurationColumnCache)) {
            return $this->configurationColumnCache[$column];
        }

        try {
            $exists = Schema::connection('tenant')->hasTable('configurations')
                && Schema::connection('tenant')->hasColumn('configurations', $column);
        } catch (Throwable $e) {
            $exists = false;
        }

        $this->configurationColumnCache[$column] = $exists;

        return $exists;
    }


    private function update_quantity_documents()
    {
        Document::created(function ($document) {
            if (!$this->hasConfigurationColumn('quantity_documents')) {
                return;
            }
            
            $configuration = Configuration::first();
            if (!$configuration) {
                return;
            }
            $configuration->quantity_documents++; 
            $configuration->save();
        
        }); 
    }
    

    private function locked_emission()
    {

        Document::created(function ($document) {
            if (!$this->hasConfigurationColumn('locked_emission') || !$this->hasConfigurationColumn('limit_documents')) {
                return;
            }

            $configuration = Configuration::first();
            if (!$configuration) {
                return;
            }
            
            if($configuration->locked_emission)
            {
                $exceed_limit = DocumentHelper::exceedLimitDocuments($configuration);
                if($exceed_limit['success']) throw new Exception($exceed_limit['message']);
            }

            // $configuration = Configuration::first();
            // // $quantity_documents = Document::count();
            // $quantity_documents = $configuration->quantity_documents;

            // if($configuration->locked_emission && $configuration->limit_documents !== 0){
            //     if($quantity_documents >= $configuration->limit_documents)
            //         throw new Exception("Ha superado el límite permitido para la emisión de comprobantes");

            // }

        });

    }


    private function locked_users()
    {

        User::creating(function ($document) {
            if (!$this->hasConfigurationColumn('locked_users')) {
                return;
            }
            
            
            $configuration = Configuration::first();
            if (!$configuration) {
                return;
            }

            $quantity_users = User::count();

            if($configuration->locked_users && $configuration->plan && $configuration->plan->limit_users !== 0){

                if($quantity_users >= $configuration->plan->limit_users )
                {
                    throw new Exception("Ha superado el límite permitido para la creación de usuarios");
                }
            }

        });
    }
}
