<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Manual API de almacenamiento | Kamary</title>
    <link rel="icon" type="image/svg+xml" href="/assets/img/icons/icon.svg">
    <style>
        :root {
            --bg: #f4f7fb;
            --panel: #ffffff;
            --panel-soft: #f8fafc;
            --line: #dce5f0;
            --line-strong: #c7d3e2;
            --text: #13233a;
            --muted: #607086;
            --soft-text: #7a8798;
            --primary: #0b7fe8;
            --primary-dark: #075ba8;
            --green: #15845a;
            --orange: #a15b00;
            --red: #b42318;
            --code-bg: #111c2f;
            --code-text: #edf4ff;
            color: var(--text);
            font-family: Inter, "Segoe UI", Arial, Helvetica, sans-serif;
            line-height: 1.55;
        }

        * {
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            background: var(--bg);
            margin: 0;
        }

        a {
            color: var(--primary);
        }

        code,
        pre {
            font-family: Consolas, Monaco, "Courier New", monospace;
        }

        code {
            background: #edf3fb;
            border: 1px solid #dce8f5;
            border-radius: 5px;
            color: #113250;
            font-size: 0.92em;
            padding: 2px 6px;
        }

        pre {
            background: var(--code-bg);
            border-radius: 8px;
            color: var(--code-text);
            font-size: 13px;
            line-height: 1.55;
            margin: 14px 0 0;
            overflow-x: auto;
            padding: 16px;
        }

        pre code {
            background: transparent;
            border: 0;
            color: inherit;
            font-size: inherit;
            padding: 0;
        }

        h1,
        h2,
        h3,
        h4 {
            line-height: 1.18;
            margin: 0;
        }

        h1 {
            font-size: 34px;
            letter-spacing: 0;
        }

        h2 {
            font-size: 25px;
            margin-top: 0;
        }

        h3 {
            font-size: 18px;
            margin-top: 22px;
        }

        h4 {
            font-size: 15px;
            margin-top: 18px;
        }

        p {
            color: var(--muted);
            margin: 10px 0 0;
        }

        ul {
            color: var(--muted);
            margin: 10px 0 0;
            padding-left: 22px;
        }

        li + li {
            margin-top: 4px;
        }

        .shell {
            display: grid;
            grid-template-columns: 278px minmax(0, 1fr);
            min-height: 100vh;
        }

        .sidebar {
            background: var(--panel);
            border-right: 1px solid var(--line);
            height: 100vh;
            overflow-y: auto;
            padding: 28px 22px;
            position: sticky;
            top: 0;
        }

        .brand {
            align-items: center;
            display: flex;
            gap: 12px;
            margin-bottom: 28px;
        }

        .brand img {
            height: 34px;
            width: auto;
        }

        .brand strong {
            display: block;
            font-size: 12px;
            letter-spacing: 0;
        }

        .brand span {
            color: var(--soft-text);
            display: block;
            font-size: 12px;
            margin-top: 2px;
        }

        .nav-label {
            color: #8a97aa;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: .08em;
            margin: 24px 0 8px;
            text-transform: uppercase;
        }

        .sidebar a {
            align-items: center;
            border-radius: 7px;
            color: #48586d;
            display: flex;
            font-size: 14px;
            gap: 8px;
            min-height: 34px;
            padding: 7px 9px;
            text-decoration: none;
        }

        .sidebar a:hover {
            background: #edf5ff;
            color: var(--primary-dark);
        }

        .method-dot {
            border-radius: 4px;
            color: #ffffff;
            flex: 0 0 auto;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .03em;
            min-width: 38px;
            padding: 2px 4px;
            text-align: center;
        }

        .method-dot.get {
            background: var(--primary);
        }

        .method-dot.post {
            background: var(--green);
        }

        .content {
            min-width: 0;
            padding: 34px 42px 72px;
        }

        .hero {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 28px;
        }

        .eyebrow {
            color: var(--primary-dark);
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .1em;
            margin: 0 0 10px;
            text-transform: uppercase;
        }

        .hero p {
            font-size: 16px;
            max-width: 880px;
        }

        .quick-grid {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            margin-top: 22px;
        }

        .quick-card {
            background: var(--panel-soft);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 14px;
        }

        .quick-card span {
            color: var(--soft-text);
            display: block;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 6px;
            text-transform: uppercase;
        }

        .quick-card strong {
            color: var(--text);
            display: block;
            font-size: 14px;
            overflow-wrap: anywhere;
        }

        .section {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 8px;
            margin-top: 18px;
            padding: 26px;
            scroll-margin-top: 24px;
        }

        .section.lead {
            margin-top: 22px;
        }

        .section-title {
            align-items: center;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .badge {
            border-radius: 999px;
            display: inline-flex;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .04em;
            padding: 5px 10px;
            text-transform: uppercase;
        }

        .badge.get {
            background: #e7f2ff;
            color: var(--primary-dark);
        }

        .badge.post {
            background: #e8f7f0;
            color: #0d6846;
        }

        .badge.info {
            background: #f0f4f8;
            color: #43546a;
        }

        .endpoint-line {
            align-items: center;
            background: #f8fbff;
            border: 1px solid var(--line);
            border-radius: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 14px;
            padding: 10px 12px;
        }

        .endpoint-line code {
            background: transparent;
            border: 0;
            color: #10223a;
            font-size: 14px;
            padding: 0;
        }

        .two-col {
            display: grid;
            gap: 16px;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            margin-top: 14px;
        }

        .info-box {
            background: #f8fbff;
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 15px;
        }

        .info-box.warning {
            background: #fff8ec;
            border-color: #f0d2a2;
        }

        .info-box.danger {
            background: #fff3f2;
            border-color: #f3b8b2;
        }

        .info-box strong {
            color: var(--text);
            display: block;
            margin-bottom: 5px;
        }

        .table-wrap {
            border: 1px solid var(--line);
            border-radius: 8px;
            margin-top: 14px;
            overflow-x: auto;
        }

        table {
            border-collapse: collapse;
            min-width: 760px;
            width: 100%;
        }

        th,
        td {
            border-bottom: 1px solid var(--line);
            padding: 11px 12px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background: #f3f7fc;
            color: #48586d;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .04em;
            text-transform: uppercase;
        }

        td {
            color: var(--muted);
            font-size: 14px;
        }

        tr:last-child td {
            border-bottom: 0;
        }

        td:first-child {
            color: var(--text);
            font-weight: 700;
            white-space: nowrap;
        }

        .status {
            border-radius: 999px;
            display: inline-block;
            font-size: 12px;
            font-weight: 800;
            padding: 3px 8px;
        }

        .status.ok {
            background: #e8f7f0;
            color: #0d6846;
        }

        .status.warn {
            background: #fff3d7;
            color: var(--orange);
        }

        .status.err {
            background: #fff0ef;
            color: var(--red);
        }

        .split-code {
            display: grid;
            gap: 16px;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            margin-top: 14px;
        }

        .caption {
            color: var(--soft-text);
            font-size: 13px;
            font-weight: 700;
            margin-top: 16px;
        }

        .footer {
            color: var(--soft-text);
            font-size: 13px;
            margin-top: 24px;
            text-align: center;
        }

        @@media (max-width: 1080px) {
            .shell {
                grid-template-columns: 1fr;
            }

            .sidebar {
                border-bottom: 1px solid var(--line);
                border-right: 0;
                height: auto;
                position: relative;
            }

            .sidebar nav {
                display: grid;
                gap: 4px;
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .nav-label {
                grid-column: 1 / -1;
            }

            .content {
                padding: 24px 18px 52px;
            }

            .quick-grid,
            .two-col,
            .split-code {
                grid-template-columns: 1fr;
            }
        }

        @@media (max-width: 560px) {
            h1 {
                font-size: 28px;
            }

            .hero,
            .section {
                padding: 20px;
            }

            .sidebar nav {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>
    <div class="shell">
        <aside class="sidebar">
            <div class="brand">
                <img src="/assets/img/logo.svg" alt="Kamary">
                <div>
                    <strong>KAMARY PERU SAC</strong>
                    <span>Manual para integraciones</span>
                </div>
            </div>

            <nav aria-label="Menu de documentacion">
                <div class="nav-label">Inicio</div>
                <a href="#resumen">Resumen</a>
                <a href="#autenticacion">Autenticacion</a>
                <a href="#convenciones">Convenciones</a>
                <a href="#respuestas">Formato de respuesta</a>

                <div class="nav-label">Endpoints</div>
                <a href="#me"><span class="method-dot get">GET</span>Identificar token</a>
                <a href="#stock"><span class="method-dot get">GET</span>Consultar stock</a>
                <a href="#crear-pedido"><span class="method-dot post">POST</span>Crear pedido</a>
                <a href="#consultar-pedido"><span class="method-dot get">GET</span>Consultar pedido</a>

                <div class="nav-label">Referencia</div>
                <a href="#errores">Errores</a>
                <a href="#checklist">Checklist</a>
            </nav>
        </aside>

        <main class="content">
            <section class="hero" id="resumen">
                <p class="eyebrow">API externa de almacenamiento</p>
                <h1>Manual API para consulta de stock y creacion de pedidos</h1>
                <p>
                    Esta API permite que el software de un cliente consulte su stock disponible en Kamary y cree pedidos externos.
                    Cada token pertenece a un solo cliente, por eso las respuestas y descuentos de inventario quedan aislados por cliente.
                </p>

                <div class="quick-grid">
                    <div class="quick-card">
                        <span>Base URL</span>
                        <strong>{{ url('/api/external/storage') }}</strong>
                    </div>
                    <div class="quick-card">
                        <span>Formato</span>
                        <strong>JSON UTF-8</strong>
                    </div>
                    <div class="quick-card">
                        <span>Autenticacion</span>
                        <strong>Bearer Token</strong>
                    </div>
                </div>
            </section>

            <section class="section lead" id="autenticacion">
                <div class="section-title">
                    <h2>Autenticacion</h2>
                    <span class="badge info">Requerido</span>
                </div>
                <p>
                    Kamary entrega un token por cliente. El integrador debe enviarlo en cada request usando el header
                    <code>Authorization</code>. No se usan cookies ni credenciales del panel administrativo.
                </p>

                <pre><code>Authorization: Bearer kst_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Accept: application/json
Content-Type: application/json</code></pre>

                <div class="two-col">
                    <div class="info-box">
                        <strong>Header principal</strong>
                        <p><code>Authorization: Bearer {token}</code>. Es la forma recomendada para todas las integraciones.</p>
                    </div>
                    <div class="info-box">
                        <strong>Header alternativo</strong>
                        <p><code>X-Storage-Token: {token}</code>. Solo usarlo si el sistema externo no puede enviar Bearer Token.</p>
                    </div>
                </div>

                <h3>Permisos del token</h3>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Permiso</th>
                                <th>Permite</th>
                                <th>Endpoint</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>stock:read</code></td>
                                <td>Consultar stock disponible del cliente asociado al token.</td>
                                <td><code>GET /stock</code></td>
                            </tr>
                            <tr>
                                <td><code>orders:write</code></td>
                                <td>Crear pedidos externos y descontar stock mediante nota de salida aprobada.</td>
                                <td><code>POST /orders</code></td>
                            </tr>
                            <tr>
                                <td><code>orders:read</code></td>
                                <td>Consultar un pedido externo ya creado por referencia.</td>
                                <td><code>GET /orders/{external_reference}</code></td>
                            </tr>
                            <tr>
                                <td><code>*</code></td>
                                <td>Acceso completo a todos los endpoints de esta API.</td>
                                <td>Todos</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="section" id="convenciones">
                <h2>Convenciones y limites generales</h2>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Regla</th>
                                <th>Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Formato</td>
                                <td>Enviar y recibir JSON con codificacion UTF-8. Para requests con body usar <code>Content-Type: application/json</code>.</td>
                            </tr>
                            <tr>
                                <td>Fechas</td>
                                <td>Enviar fechas como <code>YYYY-MM-DD</code>. Las respuestas usan <code>YYYY-MM-DD</code> o ISO 8601 en campos de fecha y hora.</td>
                            </tr>
                            <tr>
                                <td>Cantidades</td>
                                <td>Enviar numeros positivos. Usar punto decimal, por ejemplo <code>3.5</code>. El stock disponible se calcula con precision de 3 decimales.</td>
                            </tr>
                            <tr>
                                <td>Cliente</td>
                                <td>El cliente se obtiene desde el token. No se debe enviar <code>client_id</code> en los pedidos externos.</td>
                            </tr>
                            <tr>
                                <td>Almacen</td>
                                <td>El <code>warehouse_id</code> debe corresponder a un almacen de Kamary Medical SAC habilitado para almacenamiento.</td>
                            </tr>
                            <tr>
                                <td>Idempotencia</td>
                                <td>La combinacion <code>cliente + source + external_reference</code> evita duplicar descuentos si el integrador reintenta el mismo pedido.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="section" id="respuestas">
                <h2>Formato de respuesta</h2>
                <p>Todas las respuestas usan un contenedor comun.</p>

                <div class="split-code">
                    <div>
                        <p class="caption">Respuesta exitosa</p>
                        <pre><code>{
  "success": true,
  "message": "Operacion correcta",
  "data": {}
}</code></pre>
                    </div>
                    <div>
                        <p class="caption">Respuesta con error</p>
                        <pre><code>{
  "success": false,
  "message": "Payload invalido.",
  "errors": {
    "items.0.quantity": [
      "The items.0.quantity field must be greater than 0."
    ]
  }
}</code></pre>
                    </div>
                </div>
            </section>

            <section class="section" id="me">
                <div class="section-title">
                    <h2>Identificar token</h2>
                    <span class="badge get">GET</span>
                </div>
                <p>Devuelve el cliente asociado al token y los permisos activos. Sirve para validar que las credenciales fueron configuradas correctamente.</p>
                <div class="endpoint-line">
                    <span class="badge get">GET</span>
                    <code>{{ url('/api/external/storage/me') }}</code>
                </div>

                <p class="caption">Ejemplo request</p>
                <pre><code>curl -s "{{ url('/api/external/storage/me') }}" \
  -H "Authorization: Bearer kst_xxx" \
  -H "Accept: application/json"</code></pre>

                <p class="caption">Ejemplo response 200</p>
                <pre><code>{
  "success": true,
  "message": "Operacion correcta",
  "data": {
    "client": {
      "id": 15,
      "document_type": "RUC",
      "document_number": "20123456789",
      "full_name": "CLIENTE SAC"
    },
    "token": {
      "name": "ERP Cliente",
      "prefix": "kst_abcd1234",
      "abilities": ["stock:read", "orders:read", "orders:write"],
      "expires_at": null
    }
  }
}</code></pre>
            </section>

            <section class="section" id="stock">
                <div class="section-title">
                    <h2>Consultar stock</h2>
                    <span class="badge get">GET</span>
                </div>
                <p>
                    Devuelve el stock disponible del cliente asociado al token. Solo se listan existencias con stock mayor a cero.
                    El resultado viene separado por producto, almacen, lote, vencimiento y ubicacion.
                </p>
                <div class="endpoint-line">
                    <span class="badge get">GET</span>
                    <code>{{ url('/api/external/storage/stock') }}</code>
                </div>

                <h3>Query parameters</h3>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Campo</th>
                                <th>Tipo</th>
                                <th>Requerido</th>
                                <th>Reglas / limites</th>
                                <th>Ejemplo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>warehouse_id</code></td>
                                <td>integer</td>
                                <td>No</td>
                                <td>Debe existir y pertenecer a un almacen valido de almacenamiento.</td>
                                <td><code>2</code></td>
                            </tr>
                            <tr>
                                <td><code>q</code></td>
                                <td>string</td>
                                <td>No</td>
                                <td>Busqueda parcial por SKU, nombre, registro sanitario, lote, ubicacion o cliente. Alias de <code>search</code>.</td>
                                <td><code>paracetamol</code></td>
                            </tr>
                            <tr>
                                <td><code>search</code></td>
                                <td>string</td>
                                <td>No</td>
                                <td>Equivalente a <code>q</code>. Si ambos se envian, se usa <code>q</code>.</td>
                                <td><code>LOT-001</code></td>
                            </tr>
                            <tr>
                                <td><code>sku</code></td>
                                <td>string</td>
                                <td>No</td>
                                <td>Filtro exacto por codigo de articulo. Tambien se acepta <code>article_code</code>.</td>
                                <td><code>SKU-001</code></td>
                            </tr>
                            <tr>
                                <td><code>lot</code></td>
                                <td>string</td>
                                <td>No</td>
                                <td>Filtro exacto por lote.</td>
                                <td><code>L-001</code></td>
                            </tr>
                            <tr>
                                <td><code>location</code></td>
                                <td>string</td>
                                <td>No</td>
                                <td>Filtro exacto por ubicacion.</td>
                                <td><code>A-01</code></td>
                            </tr>
                            <tr>
                                <td><code>page</code></td>
                                <td>integer</td>
                                <td>No</td>
                                <td>Minimo <code>1</code>. Por defecto <code>1</code>.</td>
                                <td><code>1</code></td>
                            </tr>
                            <tr>
                                <td><code>per_page</code></td>
                                <td>integer</td>
                                <td>No</td>
                                <td>Minimo <code>1</code>, maximo <code>100</code>. Por defecto <code>50</code>.</td>
                                <td><code>20</code></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p class="caption">Ejemplo request</p>
                <pre><code>curl -s "{{ url('/api/external/storage/stock?sku=SKU-001&per_page=20') }}" \
  -H "Authorization: Bearer kst_xxx" \
  -H "Accept: application/json"</code></pre>

                <p class="caption">Ejemplo response 200</p>
                <pre><code>{
  "success": true,
  "message": "Operacion correcta",
  "data": {
    "items": [
      {
        "article_id": 120,
        "sku": "SKU-001",
        "name": "Producto demo",
        "health_registration": "RS-123",
        "laboratory": "Laboratorio Demo",
        "active_principle": "Principio activo",
        "unit": "UND",
        "warehouse": {
          "id": 2,
          "name": "Almacen Principal"
        },
        "lot": "L-001",
        "expiration_date": "2027-12-31",
        "location": "A-01",
        "temperature_range": "15-25 C",
        "available_stock": 25
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 1,
      "last_page": 1
    }
  }
}</code></pre>

                <h3>Campos de cada item de stock</h3>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Campo</th>
                                <th>Tipo</th>
                                <th>Descripcion</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>article_id</code></td>
                                <td>integer</td>
                                <td>ID interno del producto. Puede usarse para crear pedidos en lugar del SKU.</td>
                            </tr>
                            <tr>
                                <td><code>sku</code></td>
                                <td>string</td>
                                <td>Codigo del producto del cliente.</td>
                            </tr>
                            <tr>
                                <td><code>name</code></td>
                                <td>string</td>
                                <td>Nombre del producto.</td>
                            </tr>
                            <tr>
                                <td><code>warehouse.id</code></td>
                                <td>integer</td>
                                <td>ID del almacen que se debe enviar al crear un pedido para esta existencia.</td>
                            </tr>
                            <tr>
                                <td><code>lot</code></td>
                                <td>string</td>
                                <td>Lote disponible. Debe coincidir al crear el pedido.</td>
                            </tr>
                            <tr>
                                <td><code>expiration_date</code></td>
                                <td>string|null</td>
                                <td>Fecha de vencimiento en formato <code>YYYY-MM-DD</code>. Si viene <code>null</code>, omitirla o enviar <code>null</code> en el pedido.</td>
                            </tr>
                            <tr>
                                <td><code>location</code></td>
                                <td>string</td>
                                <td>Ubicacion de almacenamiento. Debe coincidir al crear el pedido.</td>
                            </tr>
                            <tr>
                                <td><code>available_stock</code></td>
                                <td>number</td>
                                <td>Cantidad disponible para esa combinacion exacta de producto, almacen, lote, vencimiento y ubicacion.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="section" id="crear-pedido">
                <div class="section-title">
                    <h2>Crear pedido externo</h2>
                    <span class="badge post">POST</span>
                </div>
                <p>
                    Crea una nota de salida aprobada en Kamary y descuenta stock. La API valida que cada producto pertenezca al cliente del token
                    y que exista stock suficiente para la combinacion exacta enviada.
                </p>
                <div class="endpoint-line">
                    <span class="badge post">POST</span>
                    <code>{{ url('/api/external/storage/orders') }}</code>
                </div>

                <div class="info-box warning">
                    <strong>Idempotencia obligatoria</strong>
                    <p>
                        <code>external_reference</code> debe ser unica por <code>source</code>. Si el mismo pedido se reintenta, Kamary responde el pedido ya creado con
                        <code>idempotent: true</code> y no descuenta stock dos veces.
                    </p>
                </div>

                <h3>Body JSON</h3>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Campo</th>
                                <th>Tipo</th>
                                <th>Requerido</th>
                                <th>Reglas / limites</th>
                                <th>Ejemplo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>external_reference</code></td>
                                <td>string</td>
                                <td>Si</td>
                                <td>Maximo 120 caracteres. Identificador unico del pedido en el sistema externo.</td>
                                <td><code>ERP-000123</code></td>
                            </tr>
                            <tr>
                                <td><code>source</code></td>
                                <td>string|null</td>
                                <td>No</td>
                                <td>Maximo 60 caracteres. Identifica el sistema origen. Recomendado: letras, numeros, <code>_</code>, <code>.</code> o <code>-</code>. Por defecto <code>storage_client_api</code>.</td>
                                <td><code>erp_cliente</code></td>
                            </tr>
                            <tr>
                                <td><code>warehouse_id</code></td>
                                <td>integer|null</td>
                                <td>Condicional</td>
                                <td>Almacen general del pedido. Es obligatorio si los items no envian <code>warehouse_id</code>.</td>
                                <td><code>2</code></td>
                            </tr>
                            <tr>
                                <td><code>exit_date</code></td>
                                <td>date|null</td>
                                <td>No</td>
                                <td>Formato <code>YYYY-MM-DD</code>. Si no se envia, se usa la fecha actual del servidor.</td>
                                <td><code>2026-06-18</code></td>
                            </tr>
                            <tr>
                                <td><code>document_date</code></td>
                                <td>date|null</td>
                                <td>No</td>
                                <td>Formato <code>YYYY-MM-DD</code>. Si no se envia, se usa <code>exit_date</code>.</td>
                                <td><code>2026-06-18</code></td>
                            </tr>
                            <tr>
                                <td><code>observations</code></td>
                                <td>string|null</td>
                                <td>No</td>
                                <td>Maximo 2000 caracteres.</td>
                                <td><code>Pedido creado desde ERP</code></td>
                            </tr>
                            <tr>
                                <td><code>items</code></td>
                                <td>array</td>
                                <td>Si</td>
                                <td>Minimo 1 item.</td>
                                <td><code>[{...}]</code></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>Campos de <code>items[]</code></h3>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Campo</th>
                                <th>Tipo</th>
                                <th>Requerido</th>
                                <th>Reglas / limites</th>
                                <th>Ejemplo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>article_id</code></td>
                                <td>integer|null</td>
                                <td>Condicional</td>
                                <td>Enviar <code>article_id</code> o <code>sku</code>. Debe pertenecer al cliente del token.</td>
                                <td><code>120</code></td>
                            </tr>
                            <tr>
                                <td><code>sku</code></td>
                                <td>string|null</td>
                                <td>Condicional</td>
                                <td>Maximo 60 caracteres. Enviar <code>sku</code> o <code>article_id</code>. Debe coincidir con el codigo del producto del cliente.</td>
                                <td><code>SKU-001</code></td>
                            </tr>
                            <tr>
                                <td><code>article_code</code></td>
                                <td>string|null</td>
                                <td>No</td>
                                <td>Alias de <code>sku</code>. Maximo 60 caracteres.</td>
                                <td><code>SKU-001</code></td>
                            </tr>
                            <tr>
                                <td><code>warehouse_id</code></td>
                                <td>integer|null</td>
                                <td>Condicional</td>
                                <td>Obligatorio si no se envia <code>warehouse_id</code> general. Debe coincidir con una existencia disponible.</td>
                                <td><code>2</code></td>
                            </tr>
                            <tr>
                                <td><code>lot</code></td>
                                <td>string</td>
                                <td>Si</td>
                                <td>Maximo 80 caracteres. Debe coincidir con el lote disponible.</td>
                                <td><code>L-001</code></td>
                            </tr>
                            <tr>
                                <td><code>expiration_date</code></td>
                                <td>date|null</td>
                                <td>No</td>
                                <td>Formato <code>YYYY-MM-DD</code>. Debe coincidir con el stock consultado. Si el stock no tiene vencimiento, omitir o enviar <code>null</code>.</td>
                                <td><code>2027-12-31</code></td>
                            </tr>
                            <tr>
                                <td><code>location</code></td>
                                <td>string|null</td>
                                <td>No</td>
                                <td>Maximo 255 caracteres. Debe coincidir con la ubicacion disponible cuando el stock esta separado por ubicacion.</td>
                                <td><code>A-01</code></td>
                            </tr>
                            <tr>
                                <td><code>destination_location</code></td>
                                <td>string|null</td>
                                <td>No</td>
                                <td>Maximo 255 caracteres. Referencia opcional para el destino indicado por el cliente.</td>
                                <td><code>Cliente final</code></td>
                            </tr>
                            <tr>
                                <td><code>quantity</code></td>
                                <td>number</td>
                                <td>Si</td>
                                <td>Debe ser mayor a 0 y no puede superar el <code>available_stock</code> de la combinacion exacta.</td>
                                <td><code>3</code></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p class="caption">Ejemplo payload</p>
                <pre><code>{
  "external_reference": "ERP-000123",
  "source": "erp_cliente",
  "warehouse_id": 2,
  "exit_date": "2026-06-18",
  "document_date": "2026-06-18",
  "observations": "Pedido creado desde ERP del cliente",
  "items": [
    {
      "sku": "SKU-001",
      "lot": "L-001",
      "expiration_date": "2027-12-31",
      "location": "A-01",
      "quantity": 3
    },
    {
      "article_id": 121,
      "warehouse_id": 2,
      "lot": "L-002",
      "expiration_date": null,
      "location": "",
      "quantity": 1.5
    }
  ]
}</code></pre>

                <p class="caption">Ejemplo request</p>
                <pre><code>curl -s -X POST "{{ url('/api/external/storage/orders') }}" \
  -H "Authorization: Bearer kst_xxx" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "external_reference": "ERP-000123",
    "source": "erp_cliente",
    "warehouse_id": 2,
    "items": [
      {
        "sku": "SKU-001",
        "lot": "L-001",
        "expiration_date": "2027-12-31",
        "location": "A-01",
        "quantity": 3
      }
    ]
  }'</code></pre>

                <p class="caption">Ejemplo response 201</p>
                <pre><code>{
  "success": true,
  "message": "Operacion correcta",
  "data": {
    "idempotent": false,
    "order": {
      "id": 450,
      "code": "NS00450",
      "external_reference": "ERP-000123",
      "source": "erp_cliente",
      "status": "approved",
      "exit_date": "2026-06-18",
      "document": {
        "type": "Pedido externo",
        "series": "API",
        "sequence": "ERP-000123",
        "date": "2026-06-18"
      },
      "warehouse": {
        "id": 2,
        "name": "Almacen Principal"
      },
      "items": [
        {
          "article_id": 120,
          "sku": "SKU-001",
          "name": "Producto demo",
          "unit": "UND",
          "warehouse": {
            "id": 2,
            "name": "Almacen Principal"
          },
          "lot": "L-001",
          "expiration_date": "2027-12-31",
          "location": "A-01",
          "destination_location": null,
          "quantity": 3
        }
      ],
      "created_at": "2026-06-18T16:10:00-05:00"
    }
  }
}</code></pre>

                <p class="caption">Ejemplo response 200 por reintento idempotente</p>
                <pre><code>{
  "success": true,
  "message": "Operacion correcta",
  "data": {
    "idempotent": true,
    "order": {
      "id": 450,
      "code": "NS00450",
      "external_reference": "ERP-000123",
      "source": "erp_cliente",
      "status": "approved",
      "items": []
    }
  }
}</code></pre>

                <div class="info-box danger">
                    <strong>Validacion de stock</strong>
                    <p>
                        Para descontar correctamente, el item debe coincidir con <code>article_id</code> o <code>sku</code>, <code>warehouse_id</code>, <code>lot</code>,
                        <code>expiration_date</code> y <code>location</code> vistos en <code>GET /stock</code>.
                    </p>
                </div>
            </section>

            <section class="section" id="consultar-pedido">
                <div class="section-title">
                    <h2>Consultar pedido por referencia</h2>
                    <span class="badge get">GET</span>
                </div>
                <p>Devuelve el pedido externo creado previamente por <code>external_reference</code> y <code>source</code>.</p>
                <div class="endpoint-line">
                    <span class="badge get">GET</span>
                    <code>{{ url('/api/external/storage/orders/{external_reference}') }}?source=erp_cliente</code>
                </div>

                <h3>Path y query parameters</h3>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Campo</th>
                                <th>Tipo</th>
                                <th>Requerido</th>
                                <th>Reglas / limites</th>
                                <th>Ejemplo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>external_reference</code></td>
                                <td>string</td>
                                <td>Si</td>
                                <td>Referencia externa usada al crear el pedido. Debe ir codificada en URL si contiene espacios o caracteres especiales.</td>
                                <td><code>ERP-000123</code></td>
                            </tr>
                            <tr>
                                <td><code>source</code></td>
                                <td>string|null</td>
                                <td>No</td>
                                <td>Debe coincidir con el <code>source</code> enviado al crear el pedido. Si se omitio, usar <code>storage_client_api</code> o no enviarlo.</td>
                                <td><code>erp_cliente</code></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p class="caption">Ejemplo request</p>
                <pre><code>curl -s "{{ url('/api/external/storage/orders/ERP-000123?source=erp_cliente') }}" \
  -H "Authorization: Bearer kst_xxx" \
  -H "Accept: application/json"</code></pre>

                <p class="caption">Ejemplo response 200</p>
                <pre><code>{
  "success": true,
  "message": "Operacion correcta",
  "data": {
    "idempotent": false,
    "order": {
      "id": 450,
      "code": "NS00450",
      "external_reference": "ERP-000123",
      "source": "erp_cliente",
      "status": "approved",
      "exit_date": "2026-06-18",
      "items": [
        {
          "article_id": 120,
          "sku": "SKU-001",
          "lot": "L-001",
          "expiration_date": "2027-12-31",
          "location": "A-01",
          "quantity": 3
        }
      ],
      "created_at": "2026-06-18T16:10:00-05:00"
    }
  }
}</code></pre>
            </section>

            <section class="section" id="errores">
                <h2>Errores</h2>
                <p>Los errores mantienen el mismo contenedor JSON y cambian el codigo HTTP segun el caso.</p>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>HTTP</th>
                                <th>Causa</th>
                                <th>Ejemplo de respuesta</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="status err">401</span></td>
                                <td>Token faltante, invalido o expirado.</td>
                                <td><code>{"success":false,"message":"Token de almacenamiento requerido."}</code></td>
                            </tr>
                            <tr>
                                <td><span class="status err">403</span></td>
                                <td>El token no tiene permiso para la accion o el cliente no esta habilitado para almacenamiento.</td>
                                <td><code>{"success":false,"message":"El token no tiene permiso para esta accion."}</code></td>
                            </tr>
                            <tr>
                                <td><span class="status warn">404</span></td>
                                <td>Pedido externo no encontrado por referencia y origen.</td>
                                <td><code>{"success":false,"message":"Pedido externo no encontrado."}</code></td>
                            </tr>
                            <tr>
                                <td><span class="status warn">422</span></td>
                                <td>Payload invalido, almacen incorrecto, SKU ajeno al cliente, lote/ubicacion sin stock o stock insuficiente.</td>
                                <td><code>{"success":false,"message":"Payload invalido.","errors":{...}}</code></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p class="caption">Ejemplo 422 por stock insuficiente</p>
                <pre><code>{
  "success": false,
  "message": "Stock insuficiente para SKU SKU-001, lote L-001. Disponible: 2"
}</code></pre>
            </section>

            <section class="section" id="checklist">
                <h2>Checklist de integracion</h2>
                <ul>
                    <li>Confirmar que el token entregado por Kamary responde correctamente en <code>GET /me</code>.</li>
                    <li>Consultar <code>GET /stock</code> antes de crear pedidos y guardar los valores exactos de <code>warehouse.id</code>, <code>lot</code>, <code>expiration_date</code> y <code>location</code>.</li>
                    <li>Generar un <code>external_reference</code> unico por pedido en el sistema externo.</li>
                    <li>Reintentar con la misma referencia si hay timeout de red. No crear una referencia nueva para el mismo pedido.</li>
                    <li>Enviar cantidades con punto decimal y validar que no superen <code>available_stock</code>.</li>
                    <li>Registrar el <code>order.code</code> devuelto por Kamary para trazabilidad.</li>
                </ul>
            </section>

            <p class="footer">Kamary API de almacenamiento para clientes</p>
        </main>
    </div>
</body>

</html>
