<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Breakdown extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'visited',
        'started_test',
        'viewed_results',
        'clicked_buy',
        'selected_item',
        'selected_color',
        'selected_plan',
        'reached_checkout',
        'clicked_pay_button',
        'direct_payment',
        'order_generated',
        'subscription',
    ];

    static function active(string $field)
    {
        $request = request();
        $breakdownId = $request->cookie('breakdown_id');

        $breakdown = self::firstOrCreate(
            ['id' => $breakdownId],
            [
                'id' => $breakdownId,
                'started_test' => false,
                'viewed_results' => false,
                'clicked_buy' => false,
                'reached_checkout' => false,
                'clicked_pay_button' => false,
                'direct_payment' => false,
                'order_generated' => false,
                'subscription' => false,
            ]
        );

        // Define the sequence of fields that should be updated retroactively
        $sequence = [
            'started_test',
            'viewed_results',
            'clicked_buy', 
            'selected_item',
            'selected_color',
            'selected_plan',
            'reached_checkout',
            'clicked_pay_button'
        ];

        // Find the current field position in the sequence
        $position = array_search($field, $sequence);

        $updateFields = [];

        // If field is in the main sequence, update all previous fields
        if ($position !== false) {
            for ($i = 0; $i <= $position; $i++) {
                $updateFields[$sequence[$i]] = true;
            }
        } else {
            // For direct_payment, order_generated and subscription, just update the single field
            $updateFields[$field] = true;
        }

        $breakdown->update($updateFields);

        return $breakdown;
    }

    public function sale()
    {
        return $this->hasOne(Sale::class);
    }
}
