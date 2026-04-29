<?php

declare(strict_types=1);

$baseUrl = rtrim((string) getenv('SMOKE_BASE_URL'), '/');
if ($baseUrl === '') {
    $baseUrl = 'http://localhost';
}

$apiToken = trim((string) getenv('SMOKE_API_TOKEN'));
$authHeader = $apiToken !== '' ? 'Authorization: Bearer ' . $apiToken : null;

$failed = false;

pass('Base URL: ' . $baseUrl);

$ping = requestJson($baseUrl . '/api/ping', 'GET', null, $authHeader);
assertJsonSuccess($ping, 'Ping', $failed);

$mode = requestJson($baseUrl . '/api/mode', 'GET', null, $authHeader);
assertJsonSuccess($mode, 'Mode', $failed);

$series = resolveSeries();
if ($series === null) {
    fail('Series', 'No series found in tenant database.', $failed);
    finish($failed);
}
pass('Series selected: ' . $series['number'] . ' (doc_type=' . $series['document_type_id'] . ')');

$documentTypeId = $series['document_type_id'];
$customer = ensureCustomer($baseUrl, $documentTypeId, $authHeader, $failed);
$item = ensureItem($baseUrl, $authHeader, $failed);

if ($customer === null || $item === null) {
    finish(true);
}

$payload = buildDocumentPayload($series['number'], $documentTypeId, $customer, $item);
$emit = requestJson($baseUrl . '/api/documents', 'POST', $payload, $authHeader);
assertJsonSuccess($emit, 'Emit document', $failed);

if (!($emit['json']['success'] ?? false)) {
    finish(true);
}

$externalId = (string) ($emit['json']['data']['external_id'] ?? '');
$seriesNumber = (string) ($emit['json']['data']['number'] ?? '');
if ($externalId === '' || $seriesNumber === '') {
    fail('Emit document', 'Missing external_id or number in response.', $failed, $emit['body']);
    finish(true);
}
pass('Document emitted: ' . $seriesNumber . ' (' . $externalId . ')');

$lists = requestJson($baseUrl . '/api/documents/lists', 'GET', null, $authHeader);
assertJsonSuccess($lists, 'List documents', $failed);
if ($lists['ok']) {
    $found = false;
    foreach (($lists['json']['data'] ?? []) as $row) {
        if ((string) ($row['external_id'] ?? '') === $externalId) {
            $found = true;
            break;
        }
    }
    if ($found) {
        pass('List documents contains emitted external_id.');
    } else {
        fail('List documents', 'Emitted external_id not found in list.', $failed);
    }
}

$send = requestJson($baseUrl . '/api/documents/send', 'POST', ['external_id' => $externalId], $authHeader);
assertJsonSuccess($send, 'Send document', $failed);

$status = requestJson(
    $baseUrl . '/api/documents/status',
    'POST',
    [
        'external_id' => $externalId,
        'serie_number' => $seriesNumber,
    ],
    $authHeader
);
assertJsonSuccess($status, 'Document status', $failed);

$pdfUrl = firstNonEmpty([
    $status['json']['links']['pdf'] ?? null,
    $emit['json']['links']['pdf'] ?? null,
    '/downloads/document/pdf/' . $externalId,
]);
$xmlUrl = firstNonEmpty([
    $status['json']['links']['xml'] ?? null,
    $emit['json']['links']['xml'] ?? null,
    '/downloads/document/xml/' . $externalId,
]);

$pdfCheck = requestRaw(normalizeDownloadUrl($baseUrl, $pdfUrl), 'GET', $authHeader);
if ($pdfCheck['status'] >= 200 && $pdfCheck['status'] < 400 && strncmp($pdfCheck['body'], '%PDF', 4) === 0) {
    pass('PDF download OK.');
} else {
    fail('PDF download', 'Invalid PDF response.', $failed, shortBody($pdfCheck['body']));
}

$xmlCheck = requestRaw(normalizeDownloadUrl($baseUrl, $xmlUrl), 'GET', $authHeader);
$xml = trim($xmlCheck['body']);
if ($xmlCheck['status'] >= 200 && $xmlCheck['status'] < 400 && $xml !== '' && looksLikeXml($xml)) {
    $parsed = @simplexml_load_string($xml);
    if ($parsed !== false) {
        pass('XML download and parse OK.');
    } else {
        fail('XML download', 'XML could not be parsed.', $failed, shortBody($xml));
    }
} else {
    fail('XML download', 'Invalid XML response.', $failed, shortBody($xml));
}

finish($failed);

function resolveSeries(): ?array
{
    $host = (string) getenv('DB_HOST');
    $port = (string) getenv('DB_PORT');
    $db = (string) getenv('DB_DATABASE');
    $user = (string) getenv('DB_USERNAME');
    $pass = (string) getenv('DB_PASSWORD');

    if ($host === '' || $port === '' || $db === '' || $user === '') {
        return null;
    }

    try {
        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8', $host, $port, $db),
            $user,
            $pass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );

        $sql = "SELECT number, document_type_id FROM series WHERE document_type_id IN ('01','03') ORDER BY CASE WHEN document_type_id = '01' THEN 0 ELSE 1 END, id ASC LIMIT 1";
        $row = $pdo->query($sql)->fetch();
        if (!$row) {
            return null;
        }

        return [
            'number' => (string) $row['number'],
            'document_type_id' => (string) $row['document_type_id'],
        ];
    } catch (Throwable $e) {
        return null;
    }
}

function ensureCustomer(string $baseUrl, string $documentTypeId, ?string $authHeader, bool &$failed): ?array
{
    $records = requestJson($baseUrl . '/api/persons/customers/records', 'GET', null, $authHeader);
    assertJsonSuccess($records, 'Customers records', $failed);
    if (!$records['ok']) {
        return null;
    }

    $customers = $records['json']['data'] ?? [];

    if ($documentTypeId === '01') {
        foreach ($customers as $customer) {
            if ((string) ($customer['identity_document_type_id'] ?? '') === '6') {
                return $customer;
            }
        }

        $ruc = '20' . str_pad((string) random_int(1, 999999999), 9, '0', STR_PAD_LEFT);
        $body = [
            'type' => 'customers',
            'identity_document_type_id' => '6',
            'number' => $ruc,
            'name' => 'CLIENTE API E2E ' . date('His'),
            'country_id' => 'PE',
            'district_id' => '010101',
            'address' => 'Direccion demo',
            'email' => 'cliente.e2e@example.com',
            'telephone' => '999999999',
        ];

        $create = requestJson($baseUrl . '/api/persons', 'POST', $body, $authHeader);
        assertJsonSuccess($create, 'Create customer for E2E', $failed);
        if ($create['ok'] && ($create['json']['success'] ?? false)) {
            return $create['json']['data'] ?? null;
        }

        return null;
    }

    if (!empty($customers)) {
        return $customers[0];
    }

    $dni = str_pad((string) random_int(1, 99999999), 8, '0', STR_PAD_LEFT);
    $body = [
        'type' => 'customers',
        'identity_document_type_id' => '1',
        'number' => $dni,
        'name' => 'CLIENTE DNI E2E ' . date('His'),
        'country_id' => 'PE',
        'district_id' => '010101',
        'address' => 'Direccion demo',
        'email' => 'cliente.dni.e2e@example.com',
        'telephone' => '999999999',
    ];

    $create = requestJson($baseUrl . '/api/persons', 'POST', $body, $authHeader);
    assertJsonSuccess($create, 'Create customer for E2E', $failed);
    if ($create['ok'] && ($create['json']['success'] ?? false)) {
        return $create['json']['data'] ?? null;
    }

    return null;
}

function ensureItem(string $baseUrl, ?string $authHeader, bool &$failed): ?array
{
    $records = requestJson($baseUrl . '/api/items/records', 'GET', null, $authHeader);
    assertJsonSuccess($records, 'Items records', $failed);
    if (!$records['ok']) {
        return null;
    }

    $items = $records['json']['data'] ?? [];
    if (!empty($items)) {
        return $items[0];
    }

    $internalId = 'E2E-' . random_int(1000, 9999);
    $body = [
        'description' => 'PRODUCTO API E2E',
        'internal_id' => $internalId,
        'unit_type_id' => 'NIU',
        'currency_type_id' => 'PEN',
        'sale_unit_price' => 118,
        'purchase_unit_price' => 100,
        'sale_affectation_igv_type_id' => '10',
        'purchase_affectation_igv_type_id' => '10',
        'stock' => 20,
        'stock_min' => 1,
    ];

    $create = requestJson($baseUrl . '/api/items', 'POST', $body, $authHeader);
    assertJsonSuccess($create, 'Create item for E2E', $failed);
    if ($create['ok'] && ($create['json']['success'] ?? false)) {
        return $create['json']['data'] ?? null;
    }

    return null;
}

function buildDocumentPayload(string $seriesNumber, string $documentTypeId, array $customer, array $item): array
{
    $date = date('Y-m-d');
    $time = date('H:i:s');

    $base = 100.0;
    $igv = 18.0;
    $total = 118.0;

    return [
        'serie_documento' => $seriesNumber,
        'numero_documento' => '#',
        'fecha_de_emision' => $date,
        'hora_de_emision' => $time,
        'codigo_tipo_documento' => $documentTypeId,
        'codigo_tipo_operacion' => '0101',
        'fecha_de_vencimiento' => $date,
        'codigo_tipo_moneda' => 'PEN',
        'factor_tipo_de_cambio' => 1,
        'datos_del_cliente_o_receptor' => [
            'codigo_tipo_documento_identidad' => (string) ($customer['identity_document_type_id'] ?? ($documentTypeId === '01' ? '6' : '1')),
            'numero_documento' => (string) ($customer['number'] ?? ''),
            'apellidos_y_nombres_o_razon_social' => (string) ($customer['name'] ?? 'CLIENTE E2E'),
            'nombre_comercial' => (string) ($customer['trade_name'] ?? ($customer['name'] ?? 'CLIENTE E2E')),
            'codigo_pais' => (string) ($customer['country_id'] ?? 'PE'),
            'ubigeo' => (string) ($customer['district_id'] ?? '010101'),
            'direccion' => (string) ($customer['address'] ?? 'Direccion demo'),
            'correo_electronico' => (string) ($customer['email'] ?? 'cliente.e2e@example.com'),
            'telefono' => (string) ($customer['telephone'] ?? '999999999'),
        ],
        'totales' => [
            'total_anticipos' => 0,
            'total_descuentos' => 0,
            'total_cargos' => 0,
            'total_exportacion' => 0,
            'total_operaciones_gratuitas' => 0,
            'total_operaciones_gravadas' => $base,
            'total_operaciones_inafectas' => 0,
            'total_operaciones_exoneradas' => 0,
            'total_igv' => $igv,
            'total_igv_operaciones_gratuitas' => 0,
            'total_base_isc' => 0,
            'total_isc' => 0,
            'total_base_otros_impuestos' => 0,
            'total_otros_impuestos' => 0,
            'total_impuestos_bolsa_plastica' => 0,
            'total_impuestos' => $igv,
            'total_valor' => $base,
            'subtotal_venta' => $total,
            'total_venta' => $total,
            'total_pendiente_pago' => 0,
        ],
        'items' => [
            [
                'codigo_interno' => (string) ($item['internal_id'] ?? 'E2E-ITEM-1'),
                'descripcion' => (string) ($item['description'] ?? 'ITEM E2E'),
                'codigo_tipo_item' => '01',
                'codigo_producto_sunat' => (string) ($item['item_code'] ?? ''),
                'unidad_de_medida' => (string) ($item['unit_type_id'] ?? 'NIU'),
                'cantidad' => 1,
                'valor_unitario' => $base,
                'codigo_tipo_precio' => '01',
                'precio_unitario' => $total,
                'codigo_tipo_afectacion_igv' => '10',
                'total_base_igv' => $base,
                'porcentaje_igv' => 18,
                'total_igv' => $igv,
                'total_impuestos' => $igv,
                'total_valor_item' => $base,
                'total_item' => $total,
            ],
        ],
        'acciones' => [
            'enviar_email' => false,
            'formato_pdf' => 'a4',
        ],
        'pagos' => [
            [
                'fecha_de_emision' => $date,
                'codigo_metodo_pago' => '01',
                'codigo_destino_pago' => 'cash',
                'monto' => $total,
            ],
        ],
    ];
}

function assertJsonSuccess(array $result, string $name, bool &$failed): void
{
    if (!$result['ok']) {
        fail($name, 'HTTP ' . $result['status'] . ' invalid JSON response.', $failed, shortBody($result['body']));
        return;
    }

    if (!($result['json']['success'] ?? false)) {
        fail($name, 'Endpoint returned success=false.', $failed, shortBody($result['body']));
        return;
    }

    pass($name . ' OK');
}

function requestJson(string $url, string $method, ?array $payload, ?string $authHeader): array
{
    $raw = requestRawWithRetry($url, $method, $authHeader, $payload);
    $json = json_decode($raw['body'], true);

    return [
        'status' => $raw['status'],
        'body' => $raw['body'],
        'json' => $json,
        'ok' => $raw['status'] >= 200 && $raw['status'] < 400 && is_array($json),
    ];
}

function requestRaw(string $url, string $method, ?string $authHeader, ?array $payload = null): array
{
    $headers = ['Accept: application/json'];
    if ($authHeader) {
        $headers[] = $authHeader;
    }

    $content = null;
    if ($payload !== null) {
        $headers[] = 'Content-Type: application/json';
        $content = json_encode($payload, JSON_UNESCAPED_SLASHES);
    }

    $options = [
        'http' => [
            'method' => $method,
            'ignore_errors' => true,
            'header' => implode("\r\n", $headers) . "\r\n",
            'timeout' => 30,
        ],
    ];

    if ($content !== null) {
        $options['http']['content'] = $content;
    }

    $context = stream_context_create($options);
    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        $body = '';
    }

    $status = 0;
    $responseHeaders = $http_response_header ?? [];
    if (isset($responseHeaders[0]) && preg_match('/\s(\d{3})\s/', $responseHeaders[0], $m)) {
        $status = (int) $m[1];
    } elseif ($body !== '') {
        $status = 200;
    }

    return [
        'status' => $status,
        'body' => $body,
    ];
}

function requestRawWithRetry(string $url, string $method, ?string $authHeader, ?array $payload = null): array
{
    $attempts = 3;
    $last = ['status' => 0, 'body' => ''];

    for ($i = 1; $i <= $attempts; $i++) {
        $last = requestRaw($url, $method, $authHeader, $payload);
        if ($last['status'] >= 200 && $last['status'] < 400) {
            return $last;
        }
        if ($i < $attempts) {
            usleep(500000);
        }
    }

    return $last;
}

function normalizeDownloadUrl(string $baseUrl, ?string $url): string
{
    if ($url === null || trim($url) === '') {
        return rtrim($baseUrl, '/') . '/';
    }

    $url = trim($url);
    if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) {
        $parts = parse_url($url);
        $path = $parts['path'] ?? '/';
        $query = isset($parts['query']) ? '?' . $parts['query'] : '';

        return rtrim($baseUrl, '/') . $path . $query;
    }

    if ($url[0] === '/') {
        return rtrim($baseUrl, '/') . $url;
    }

    return rtrim($baseUrl, '/') . '/' . $url;
}

function looksLikeXml(string $content): bool
{
    if (strpos($content, '<?xml') === 0) {
        return true;
    }

    return strpos($content, '<Invoice') !== false || strpos($content, '<CreditNote') !== false || strpos($content, '<DebitNote') !== false;
}

function shortBody(string $body): string
{
    $trimmed = trim((string) preg_replace('/\s+/', ' ', $body));
    if (strlen($trimmed) > 220) {
        return substr($trimmed, 0, 217) . '...';
    }

    return $trimmed;
}

function firstNonEmpty(array $values): ?string
{
    foreach ($values as $value) {
        if ($value !== null && trim((string) $value) !== '') {
            return (string) $value;
        }
    }

    return null;
}

function pass(string $message): void
{
    echo '[PASS] ' . $message . PHP_EOL;
}

function fail(string $name, string $message, bool &$failed, string $details = ''): void
{
    $failed = true;
    echo '[FAIL] ' . $name . ': ' . $message . PHP_EOL;
    if ($details !== '') {
        echo '       ' . $details . PHP_EOL;
    }
}

function finish(bool $failed): void
{
    if ($failed) {
        exit(1);
    }

    echo 'E2E document smoke checks OK' . PHP_EOL;
    exit(0);
}
