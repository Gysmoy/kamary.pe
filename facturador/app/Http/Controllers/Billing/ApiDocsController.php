<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Billing\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class ApiDocsController extends Controller
{
    public function index()
    {
        $context = $this->buildDocsContext();
        $groups = $this->buildGroups($context['baseUrl']);

        $baseUrl = $context['baseUrl'];
        $authRequiredByEnv = $context['authRequiredByEnv'];
        $apiMode = $context['apiMode'];
        $soapType = $context['soapType'];
        return view('tenant.api_docs.index', compact('groups', 'baseUrl', 'authRequiredByEnv', 'apiMode', 'soapType'));
    }

    public function data(): JsonResponse
    {
        $context = $this->buildDocsContext();

        return response()->json([
            'success' => true,
            'title' => (string)config('api_docs.title', 'Factu Lite API'),
            'version' => (string)config('api_docs.version', '1.0'),
            'base_url' => $context['baseUrl'],
            'auth_required_by_env' => $context['authRequiredByEnv'],
            'api_mode' => $context['apiMode'],
            'soap_type_id' => $context['soapType'],
            'groups' => $this->buildGroups($context['baseUrl']),
        ]);
    }

    private function toPrettyJson(array $value)
    {
        return json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    private function methodBadgeClass($method)
    {
        switch ($method) {
            case 'GET':
                return 'badge-primary';
            case 'POST':
                return 'badge-success';
            case 'PUT':
            case 'PATCH':
                return 'badge-warning';
            case 'DELETE':
                return 'badge-danger';
            default:
                return 'badge-secondary';
        }
    }

    private function buildCurlExample($baseUrl, $method, $path, $payload, $requiresAuth, $contentType = 'application/json')
    {
        $lines = [
            'curl --request ' . $method,
            '  --url "' . $baseUrl . $path . '"',
            '  --header "Accept: application/json"',
        ];

        if ($requiresAuth) {
            $lines[] = '  --header "Authorization: Bearer {token}"';
        }

        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) && !empty($payload)) {
            if ($contentType === 'multipart/form-data') {
                foreach ((array)$payload as $key => $value) {
                    $lines[] = '  --form "' . $key . '=' . $value . '"';
                }
            } else {
                $lines[] = '  --header "Content-Type: application/json"';
                $lines[] = "  --data '" . json_encode($payload, JSON_UNESCAPED_SLASHES) . "'";
            }
        }

        return implode(" \\\n", $lines);
    }

    private function buildDocsContext(): array
    {
        $baseUrl = rtrim((string)config('api_docs.base_url', config('app.url', 'http://localhost:8080')), '/');
        $authRequiredByEnv = (bool)env('API_REQUIRE_AUTH', false);
        $company = Company::active();
        $soapType = $company ? (string)$company->soap_type_id : '';
        $apiMode = 'PRODUCCION';

        if ($soapType === '01') {
            $apiMode = 'DEMO';
        } elseif ($soapType === '03') {
            $apiMode = 'OSE';
        }

        return compact('baseUrl', 'authRequiredByEnv', 'soapType', 'apiMode');
    }

    private function buildGroups(string $baseUrl): array
    {
        return collect(config('api_docs.groups', []))
            ->map(function ($group) use ($baseUrl) {
                $group['endpoints'] = $this->normalizeEndpoints(
                    collect($group['endpoints'] ?? []),
                    $baseUrl
                );

                return $group;
            })
            ->values()
            ->all();
    }

    private function normalizeEndpoints(Collection $endpoints, string $baseUrl): array
    {
        return $endpoints
            ->map(function ($endpoint) use ($baseUrl) {
                $method = strtoupper((string)($endpoint['method'] ?? 'GET'));
                $payload = $endpoint['payload'] ?? null;
                $response = $endpoint['response'] ?? null;
                $requiresAuth = (bool)($endpoint['requires_auth'] ?? false);
                $path = (string)($endpoint['path'] ?? '/');
                $contentType = (string)($endpoint['content_type'] ?? 'application/json');

                $endpoint['method'] = $method;
                $endpoint['path'] = $path;
                $endpoint['requires_auth'] = $requiresAuth;
                $endpoint['content_type'] = $contentType;
                $endpoint['payload_pretty'] = $payload ? $this->toPrettyJson($payload) : null;
                $endpoint['response_pretty'] = $response ? $this->toPrettyJson($response) : null;
                $endpoint['curl_example'] = $this->buildCurlExample($baseUrl, $method, $path, $payload, $requiresAuth, $contentType);
                $endpoint['method_badge'] = $this->methodBadgeClass($method);

                return $endpoint;
            })
            ->values()
            ->all();
    }
}
