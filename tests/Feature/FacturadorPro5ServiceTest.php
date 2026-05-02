<?php

namespace Tests\Feature;

use App\Models\BillingDocument;
use App\Models\BillingDocumentItem;
use App\Models\BusinessBranch;
use App\Models\Client;
use App\Services\FacturadorPro5Service;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FacturadorPro5ServiceTest extends TestCase
{
    public function test_build_issue_request_body_does_not_call_remote_establishments_when_branch_is_not_synced(): void
    {
        config([
            'facturadorpro5.mode' => 'production',
            'facturadorpro5.base_url' => 'https://facturador.test/api',
            'facturadorpro5.auth_mode' => 'login',
            'facturadorpro5.api_email' => 'admin@example.test',
            'facturadorpro5.api_password' => 'secret',
        ]);

        Http::fake();

        $document = $this->makeDocument([
            'branch' => new BusinessBranch([
                'name' => 'Principal',
                'establishment_code' => '0000',
                'ubigeo' => '150101',
                'address' => 'Av. Demo 123',
                'facturador_establishment_id' => null,
            ]),
        ]);

        $payload = app(FacturadorPro5Service::class)->buildIssueRequestBody($document);

        $this->assertArrayNotHasKey('establishment_id', $payload);
        Http::assertNothingSent();
    }

    public function test_build_issue_request_body_uses_cached_establishment_id_when_available(): void
    {
        config([
            'facturadorpro5.mode' => 'production',
            'facturadorpro5.base_url' => 'https://facturador.test/api',
            'facturadorpro5.auth_mode' => 'login',
        ]);

        Http::fake();

        $document = $this->makeDocument([
            'branch' => new BusinessBranch([
                'name' => 'Principal',
                'establishment_code' => '0000',
                'ubigeo' => '150101',
                'address' => 'Av. Demo 123',
                'facturador_establishment_id' => 15,
            ]),
        ]);

        $payload = app(FacturadorPro5Service::class)->buildIssueRequestBody($document);

        $this->assertSame(15, $payload['establishment_id'] ?? null);
        Http::assertNothingSent();
    }

    private function makeDocument(array $relations = []): BillingDocument
    {
        $document = new BillingDocument([
            'source_type' => 'commercial_order',
            'document_type' => 'Factura',
            'series' => 'F001',
            'sequence' => '00000001',
            'issue_date' => '2026-05-02',
            'due_date' => '2026-05-02',
            'currency' => 'PEN',
            'payment_condition' => 'Contado',
            'payment_method' => 'Transferencia',
            'customer_email' => 'cliente@example.test',
            'subtotal' => 100,
            'tax_amount' => 18,
            'total' => 118,
            'metadata' => [],
            'status' => true,
        ]);

        $document->setRelation('client', new Client([
            'full_name' => 'Cliente Demo SAC',
            'document_type' => 'RUC',
            'document_number' => '20123456789',
            'email' => 'cliente@example.test',
            'phone' => '999888777',
            'ubigeo' => '150101',
            'full_address' => 'Av. Cliente 456',
        ]));
        $document->setRelation('eventualClient', null);
        $document->setRelation('commercialOrder', null);
        $document->setRelation('serviceOrder', null);
        $document->setRelation('referenceDocument', null);
        $document->setRelation('branch', $relations['branch'] ?? new BusinessBranch([
            'name' => 'Principal',
            'establishment_code' => '0000',
            'ubigeo' => '150101',
            'address' => 'Av. Demo 123',
            'facturador_establishment_id' => null,
        ]));
        $document->setRelation('items', new EloquentCollection([
            new BillingDocumentItem([
                'id' => 1,
                'item_type' => 'article',
                'item_code' => 'ITEM-001',
                'description' => 'Producto demo',
                'quantity' => 1,
                'unit_price' => 100,
                'total' => 100,
                'metadata' => ['unit_code' => 'NIU'],
                'status' => true,
            ]),
        ]));

        return $document;
    }
}
