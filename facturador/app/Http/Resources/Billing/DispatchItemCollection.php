<?php

namespace App\Http\Resources\Billing;

use App\Models\Billing\Configuration;
use Illuminate\Http\Resources\Json\ResourceCollection;
use phpDocumentor\Reflection\Types\True_;

/**
 * Class DispatchItemCollection
 *
 * @package App\Http\Resources\Billing
 * @mixin ResourceCollection
 */
class DispatchItemCollection extends ResourceCollection
{
	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return mixed
	 */
	public function toArray($request)
	{
        $configuration =  Configuration::first();
		return $this->collection->transform(function ($row, $key) use($configuration) {
		    /** @var \App\Models\Billing\DispatchItem $row */
            return $row->getCollectionData($configuration);

		});
	}
}

