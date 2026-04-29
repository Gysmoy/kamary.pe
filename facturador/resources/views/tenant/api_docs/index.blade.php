@extends('tenant.layouts.app')

@section('content')
<div class="row">
    <div class="col-12">
        <section class="card">
            <header class="card-header">
                <h2 class="card-title mb-0">Documentacion API</h2>
            </header>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-2">
                        <strong>Base URL:</strong> <code>{{ $baseUrl }}</code>
                    </div>
                    <div class="col-md-3 mb-2">
                        <strong>Modo API:</strong>
                        <code>{{ $apiMode }} (SOAP {{ $soapType }})</code>
                    </div>
                    <div class="col-md-3 mb-2 text-md-right">
                        <strong>API_REQUIRE_AUTH:</strong>
                        <code>{{ $authRequiredByEnv ? 'true' : 'false' }}</code>
                    </div>
                </div>
                <div class="alert alert-info py-2 mb-3">
                    Para usar APIs en demo: en <strong>Configuración / Empresa</strong> define <strong>SOAP Tipo = Demo</strong>.
                    Las APIs de emisión usan ese entorno automáticamente.
                </div>
                <input id="api-doc-search" class="form-control" placeholder="Buscar por endpoint, metodo o descripcion">
            </div>
        </section>
    </div>

    @foreach($groups as $groupIndex => $group)
        <div class="col-12 api-doc-group mb-3" data-group="{{ strtolower($group['name']) }}">
            <section class="card">
                <header class="card-header">
                    <h2 class="card-title mb-0">{{ $group['name'] }}</h2>
                    @if(!empty($group['description']))
                        <p class="mb-0 mt-1 text-muted">{{ $group['description'] }}</p>
                    @endif
                </header>
                <div class="card-body">
                    @foreach($group['endpoints'] as $endpointIndex => $endpoint)
                        @php
                            $searchText = strtolower(
                                $endpoint['name'].' '.
                                $endpoint['method'].' '.
                                $endpoint['path'].' '.
                                ($endpoint['description'] ?? '')
                            );
                            $itemId = "api-doc-{$groupIndex}-{$endpointIndex}";
                        @endphp
                        <details class="card card-api-endpoint mb-3 api-endpoint-details"
                                 data-search="{{ $searchText }}">
                            <summary class="card-header d-flex align-items-center justify-content-between">
                                <div>
                                    <span class="badge {{ $endpoint['method_badge'] }} mr-2">{{ $endpoint['method'] }}</span>
                                    <strong>{{ $endpoint['name'] }}</strong>
                                    <div><code>{{ $endpoint['path'] }}</code></div>
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="badge {{ $endpoint['requires_auth'] ? 'badge-warning' : 'badge-secondary' }} mr-2">
                                        {{ $endpoint['requires_auth'] ? 'auth:api' : 'publico' }}
                                    </span>
                                    <small class="text-muted api-endpoint-toggle">Ver detalle</small>
                                </div>
                            </summary>
                            <div class="card-body">
                                @if(!empty($endpoint['description']))
                                    <p class="mb-3">{{ $endpoint['description'] }}</p>
                                @endif

                                <div class="mb-3">
                                    <div class="d-flex align-items-center justify-content-between mb-1">
                                        <strong>Payload ejemplo</strong>
                                        @if($endpoint['payload_pretty'])
                                            <button type="button" class="btn btn-xs btn-light" onclick="copyApiDoc('{{ $itemId }}-payload')">
                                                Copiar
                                            </button>
                                        @endif
                                    </div>
                                    @if($endpoint['payload_pretty'])
                                        <pre id="{{ $itemId }}-payload">{{ $endpoint['payload_pretty'] }}</pre>
                                    @else
                                        <pre id="{{ $itemId }}-payload">No aplica</pre>
                                    @endif
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex align-items-center justify-content-between mb-1">
                                        <strong>Response ejemplo</strong>
                                        @if($endpoint['response_pretty'])
                                            <button type="button" class="btn btn-xs btn-light" onclick="copyApiDoc('{{ $itemId }}-response')">
                                                Copiar
                                            </button>
                                        @endif
                                    </div>
                                    @if($endpoint['response_pretty'])
                                        <pre id="{{ $itemId }}-response">{{ $endpoint['response_pretty'] }}</pre>
                                    @else
                                        <pre id="{{ $itemId }}-response">No disponible</pre>
                                    @endif
                                </div>

                                <div>
                                    <div class="d-flex align-items-center justify-content-between mb-1">
                                        <strong>cURL ejemplo</strong>
                                        <button type="button" class="btn btn-xs btn-light" onclick="copyApiDoc('{{ $itemId }}-curl')">
                                            Copiar
                                        </button>
                                    </div>
                                    <pre id="{{ $itemId }}-curl">{{ $endpoint['curl_example'] }}</pre>
                                </div>
                            </div>
                        </details>
                    @endforeach
                </div>
            </section>
        </div>
    @endforeach
</div>
@endsection

@push('styles')
<style>
    .api-endpoint-details > summary {
        cursor: pointer;
        list-style: none;
    }
    .api-endpoint-details > summary::-webkit-details-marker {
        display: none;
    }
    .api-endpoint-details[open] .api-endpoint-toggle {
        color: #0056b3;
    }
    .card-api-endpoint pre {
        max-height: 280px;
        overflow: auto;
        margin: 0;
        padding: 12px;
        border-radius: 4px;
        background: #111827;
        color: #e5e7eb;
        font-size: 12px;
        line-height: 1.35;
    }
    .card-api-endpoint .badge {
        min-width: 55px;
        text-align: center;
    }
</style>
@endpush

@push('scripts')
<script>
    function copyApiDoc(elementId) {
        var target = document.getElementById(elementId);
        if (!target) return;

        var text = target.innerText || target.textContent;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text);
            return;
        }

        var temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var input = document.getElementById('api-doc-search');
        if (!input) return;

        input.addEventListener('input', function () {
            var query = (input.value || '').toLowerCase().trim();
            var endpointCards = document.querySelectorAll('.card-api-endpoint');
            var groups = document.querySelectorAll('.api-doc-group');

            endpointCards.forEach(function (card) {
                var searchable = card.getAttribute('data-search') || '';
                var visible = searchable.indexOf(query) !== -1;
                card.style.display = visible ? '' : 'none';
                if (query) {
                    card.open = visible;
                }
            });

            groups.forEach(function (group) {
                var cards = group.querySelectorAll('.card-api-endpoint');
                var hasVisible = false;

                cards.forEach(function (card) {
                    if (card.style.display !== 'none') {
                        hasVisible = true;
                    }
                });

                group.style.display = hasVisible ? '' : 'none';
            });
        });
    });
</script>
@endpush
