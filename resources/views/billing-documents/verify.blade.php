<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Validacion de comprobante {{ $summary['number'] }}</title>
    <style>
        :root {
            color-scheme: light;
            --ink: #1f2937;
            --muted: #667085;
            --line: #d0d5dd;
            --ok: #067647;
            --ok-bg: #ecfdf3;
            --bg: #f4f6f8;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            background: var(--bg);
            color: var(--ink);
            font-family: Arial, Helvetica, sans-serif;
            font-size: 15px;
        }
        .page {
            width: min(920px, calc(100vw - 32px));
            margin: 36px auto;
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 16px 36px rgba(16, 24, 40, .08);
        }
        .header {
            padding: 26px 30px;
            border-bottom: 1px solid var(--line);
            display: flex;
            justify-content: space-between;
            gap: 20px;
        }
        h1 {
            margin: 0 0 8px;
            font-size: 24px;
            line-height: 1.2;
        }
        .status {
            align-self: flex-start;
            color: var(--ok);
            background: var(--ok-bg);
            border: 1px solid #abefc6;
            border-radius: 999px;
            padding: 7px 12px;
            font-weight: 700;
            white-space: nowrap;
        }
        .muted { color: var(--muted); }
        .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0;
            border-bottom: 1px solid var(--line);
        }
        .cell {
            padding: 18px 30px;
            border-top: 1px solid var(--line);
        }
        .cell:nth-child(odd) { border-right: 1px solid var(--line); }
        .label {
            display: block;
            color: var(--muted);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: .04em;
            text-transform: uppercase;
            margin-bottom: 7px;
        }
        .value {
            font-weight: 700;
            overflow-wrap: anywhere;
        }
        .items {
            padding: 24px 30px 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }
        th, td {
            border-bottom: 1px solid var(--line);
            padding: 10px 8px;
            text-align: left;
            vertical-align: top;
        }
        th {
            font-size: 12px;
            text-transform: uppercase;
            color: var(--muted);
        }
        .right { text-align: right; }
        .footer {
            padding: 18px 30px;
            color: var(--muted);
            background: #f9fafb;
        }
        a { color: #175cd3; }
        @media (max-width: 720px) {
            .header { display: block; }
            .status { display: inline-block; margin-top: 14px; }
            .grid { grid-template-columns: 1fr; }
            .cell:nth-child(odd) { border-right: 0; }
        }
    </style>
</head>
<body>
    <main class="page">
        <section class="header">
            <div>
                <h1>{{ $summary['document_type'] }} {{ $summary['number'] }}</h1>
                <div class="muted">Validacion publica del comprobante de almacenamiento.</div>
            </div>
            <div class="status">Comprobante encontrado</div>
        </section>

        <section class="grid">
            <div class="cell">
                <span class="label">Empresa</span>
                <div class="value">{{ $summary['business_name'] }}</div>
                <div class="muted">RUC {{ $summary['business_ruc'] }}</div>
            </div>
            <div class="cell">
                <span class="label">Cliente</span>
                <div class="value">{{ $summary['customer_name'] }}</div>
                <div class="muted">{{ $summary['customer_document'] }}</div>
            </div>
            <div class="cell">
                <span class="label">Fechas</span>
                <div>Emision: <strong>{{ $summary['issue_date'] }}</strong></div>
                <div>Vencimiento: <strong>{{ $summary['due_date'] }}</strong></div>
            </div>
            <div class="cell">
                <span class="label">Estado</span>
                <div>Interno: <strong>{{ $summary['local_status'] }}</strong></div>
                <div>SUNAT/proveedor: <strong>{{ $summary['external_status'] }}</strong></div>
            </div>
            <div class="cell">
                <span class="label">Total</span>
                <div class="value">{{ $summary['currency'] }} {{ number_format($summary['total'], 2, '.', ',') }}</div>
                <div class="muted">Gravada {{ number_format($summary['subtotal'], 2, '.', ',') }} | IGV {{ number_format($summary['tax_amount'], 2, '.', ',') }}</div>
            </div>
            <div class="cell">
                <span class="label">XML fiscal</span>
                @if ($summary['xml_url'])
                    <a href="{{ $summary['xml_url'] }}" rel="noopener" target="_blank">{{ $summary['xml_url'] }}</a>
                @else
                    <div class="muted">Disponible cuando el proveedor genere el XML fiscal.</div>
                @endif
            </div>
        </section>

        <section class="items">
            <span class="label">Detalle</span>
            <table>
                <thead>
                    <tr>
                        <th>Codigo</th>
                        <th>Descripcion</th>
                        <th class="right">Cantidad</th>
                        <th class="right">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($document->items->where('status', true) as $item)
                        <tr>
                            <td>{{ $item->item_code ?: '-' }}</td>
                            <td>{{ $item->description ?: 'Servicio' }}</td>
                            <td class="right">{{ number_format((float) $item->quantity, 2, '.', ',') }}</td>
                            <td class="right">{{ number_format((float) $item->total, 2, '.', ',') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </section>

        <section class="footer">
            Este enlace valida que el comprobante existe en Kamary y que el token impreso en el PDF coincide con el registro.
        </section>
    </main>
</body>
</html>
