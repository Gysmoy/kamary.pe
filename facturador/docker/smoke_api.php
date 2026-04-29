<?php

declare(strict_types=1);

$baseUrl = rtrim((string)getenv('SMOKE_BASE_URL'), '/');
if ($baseUrl === '') {
    $baseUrl = 'http://localhost';
}

$tests = [
    ['name' => 'Ping', 'method' => 'GET', 'path' => '/api/ping'],
    ['name' => 'Mode', 'method' => 'GET', 'path' => '/api/mode'],
    ['name' => 'Items records', 'method' => 'GET', 'path' => '/api/items/records'],
    ['name' => 'Persons customers records', 'method' => 'GET', 'path' => '/api/persons/customers/records'],
    ['name' => 'Documents lists', 'method' => 'GET', 'path' => '/api/documents/lists'],
];

$failed = false;

foreach ($tests as $test) {
    $result = requestJsonWithRetry($baseUrl . $test['path'], $test['method']);
    $status = $result['status'];
    $body = $result['body'];
    $json = json_decode($body, true);

    $ok = $status >= 200 && $status < 400 && is_array($json);
    if (!$ok) {
        $failed = true;
        echo "[FAIL] {$test['name']} ({$test['method']} {$test['path']}) status={$status}\n";
        echo "       body=" . shortBody($body) . "\n";
        continue;
    }

    echo "[PASS] {$test['name']} ({$test['method']} {$test['path']}) status={$status}\n";
}

if ($failed) {
    exit(1);
}

echo "Smoke API checks OK\n";

function requestJson(string $url, string $method = 'GET', ?array $payload = null): array
{
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];

    $options = [
        'http' => [
            'method' => $method,
            'ignore_errors' => true,
            'header' => implode("\r\n", $headers) . "\r\n",
            'timeout' => 15,
        ],
    ];

    if ($payload !== null) {
        $options['http']['content'] = json_encode($payload, JSON_UNESCAPED_SLASHES);
    }

    $context = stream_context_create($options);
    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        $body = '';
    }

    $status = 0;
    $responseHeaders = $http_response_header ?? [];
    if (isset($responseHeaders[0]) && preg_match('/\s(\d{3})\s/', $responseHeaders[0], $matches)) {
        $status = (int)$matches[1];
    } elseif ($body !== '') {
        $status = 200;
    }

    return [
        'status' => $status,
        'body' => $body,
    ];
}

function requestJsonWithRetry(string $url, string $method = 'GET', ?array $payload = null): array
{
    $attempts = 3;
    $last = ['status' => 0, 'body' => ''];

    for ($i = 1; $i <= $attempts; $i++) {
        $last = requestJson($url, $method, $payload);
        if ($last['status'] >= 200 && $last['status'] < 400) {
            return $last;
        }
        if ($i < $attempts) {
            usleep(500000);
        }
    }

    return $last;
}

function shortBody(string $body): string
{
    $trimmed = trim(preg_replace('/\s+/', ' ', $body));
    if (strlen($trimmed) > 180) {
        return substr($trimmed, 0, 177) . '...';
    }
    return $trimmed;
}
