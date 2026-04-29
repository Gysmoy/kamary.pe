<?php


    namespace App\Models\Billing\Catalogs;

    use App\Models\Billing\ModelTenant;
    use Carbon\Carbon;
    use App\Support\Database\UsesTenantConnection;

    /**
     * Class CatItemMoldCavity
     *
     * @property int         $id
     * @property string      $name
     * @property Carbon|null $created_at
     * @property Carbon|null $updated_at
     * @package App\Models
     */
    class CatItemMoldCavity extends ModelTenant
    {
        use UsesTenantConnection;

        protected $perPage = 25;

        protected $fillable = [
            'name'
        ];

        /**
         * @return string
         */
        public function getName(): string
        {
            return $this->name;
        }

        /**
         * @param string $name
         *
         * @return $this
         */
        public function setName(string $name): CatItemMoldCavity
        {
            $this->name = ucfirst(trim($name));
            return $this;
        }
    }

