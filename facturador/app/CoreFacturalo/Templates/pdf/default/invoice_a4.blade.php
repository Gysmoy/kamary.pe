@php
    $customer = $document->customer ?? null;
    $establishment = $document->establishment ?? null;
    $document_type = optional($document->document_type)->description ?? 'COMPROBANTE ELECTRONICO';
    $document_number = trim(($document->series ?? '').'-'.str_pad((string)($document->number ?? 0), 8, '0', STR_PAD_LEFT), '-');
    $currency_symbol = optional($document->currency_type)->symbol ?? 'S/';
    $items = $document->items ?? collect();

    $raw_legends = $document->legends ?? [];
    if (is_string($raw_legends)) {
        $decoded = json_decode($raw_legends, true);
        $legends = collect(is_array($decoded) ? $decoded : []);
    } else {
        $legends = collect($raw_legends);
    }
@endphp
<html>
<body>
<table class="full-width">
    <tr>
        <td width="60%">
            <h4 class="mt-0 mb-0">{{ optional($company)->name }}</h4>
            <div>RUC: {{ optional($company)->number }}</div>
            <div>{{ optional($establishment)->address }}</div>
            @if(!empty(optional($establishment)->email))
                <div>{{ $establishment->email }}</div>
            @endif
        </td>
        <td width="40%" class="text-right">
            <h4 class="mt-0 mb-0">{{ $document_type }}</h4>
            <h3 class="mt-0 mb-0">{{ $document_number }}</h3>
            <div>Fecha: {{ optional($document->date_of_issue)->format('Y-m-d') }}</div>
        </td>
    </tr>
</table>

<table class="full-width mt-10">
    <tr>
        <td width="16%">Cliente</td>
        <td width="2%">:</td>
        <td width="82%">{{ optional($customer)->name }}</td>
    </tr>
    <tr>
        <td>{{ optional(optional($customer)->identity_document_type)->description ?? 'Documento' }}</td>
        <td>:</td>
        <td>{{ optional($customer)->number }}</td>
    </tr>
    <tr>
        <td>Direccion</td>
        <td>:</td>
        <td>{{ optional($customer)->address }}</td>
    </tr>
</table>

<table class="full-width mt-10 border-box">
    <thead>
    <tr>
        <th class="text-left">#</th>
        <th class="text-left">Descripcion</th>
        <th class="text-right">Unidad</th>
        <th class="text-right">Cantidad</th>
        <th class="text-right">P. Unitario</th>
        <th class="text-right">Total</th>
    </tr>
    </thead>
    <tbody>
    @forelse($items as $index => $row)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ data_get($row, 'item.description') ?? data_get($row, 'item_description') ?? '-' }}</td>
            <td class="text-right">{{ data_get($row, 'unit_type_id') ?? data_get($row, 'item.unit_type_id') ?? '-' }}</td>
            <td class="text-right">{{ number_format((float)($row->quantity ?? 0), 2, '.', '') }}</td>
            <td class="text-right">{{ $currency_symbol }} {{ number_format((float)($row->unit_price ?? 0), 2, '.', '') }}</td>
            <td class="text-right">{{ $currency_symbol }} {{ number_format((float)($row->total ?? 0), 2, '.', '') }}</td>
        </tr>
    @empty
        <tr>
            <td colspan="6" class="text-center">Sin items</td>
        </tr>
    @endforelse
    </tbody>
</table>

<table class="full-width mt-10">
    <tr>
        <td width="70%"></td>
        <td width="30%">
            <table class="full-width">
                <tr>
                    <td>Op. Gravada</td>
                    <td class="text-right">{{ $currency_symbol }} {{ number_format((float)($document->total_taxed ?? 0), 2, '.', '') }}</td>
                </tr>
                <tr>
                    <td>IGV</td>
                    <td class="text-right">{{ $currency_symbol }} {{ number_format((float)($document->total_igv ?? 0), 2, '.', '') }}</td>
                </tr>
                <tr>
                    <td><strong>Total</strong></td>
                    <td class="text-right"><strong>{{ $currency_symbol }} {{ number_format((float)($document->total ?? 0), 2, '.', '') }}</strong></td>
                </tr>
            </table>
        </td>
    </tr>
</table>

@if($legends->count() > 0)
    <table class="full-width mt-10">
        @foreach($legends as $legend)
            <tr>
                <td>{{ data_get($legend, 'value', data_get($legend, 'description', '')) }}</td>
            </tr>
        @endforeach
    </table>
@endif
</body>
</html>
