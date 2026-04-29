<?php

    namespace App\Traits;

    use App\Models\Billing\Document;
    use App\Models\Billing\Quotation;
    use App\Models\Billing\SaleNote;
    use Illuminate\Support\Facades\Schema;
    use Log;
    use Modules\Sale\Models\Contract;
    use Modules\Sale\Models\TechnicalService;
    use Throwable;

    /**
     *Se encarga de colocar el seller_id cuando no exista.
     */
    trait SellerIdTrait
    {


        /**
         * si seller_id esta vacio, ajusta el seler id al usuario.
         *
         * @param Document|Quotation|SaleNote|TechnicalService|Contract $model
         */
        public static function adjustSellerIdField(&$model): void
        {
            if (!empty($model->seller_id)) {
                return;
            }

            try {
                $table = method_exists($model, 'getTable') ? $model->getTable() : null;
                if (!$table) {
                    return;
                }

                if (!Schema::connection('tenant')->hasTable($table) ||
                    !Schema::connection('tenant')->hasColumn($table, 'seller_id')) {
                    return;
                }

                $model->seller_id = $model->user_id;
            } catch (Throwable $e) {
                // Lite mode can remove seller_id from some tables.
            }

        }

    }
