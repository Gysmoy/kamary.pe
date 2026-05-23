<?php

namespace Tests\Unit;

use App\Models\DeliveryEvidence;
use PHPUnit\Framework\TestCase;

class DeliveryEvidenceTest extends TestCase
{
    public function test_uses_delivery_evidences_table(): void
    {
        $this->assertSame('delivery_evidences', (new DeliveryEvidence())->getTable());
    }
}
