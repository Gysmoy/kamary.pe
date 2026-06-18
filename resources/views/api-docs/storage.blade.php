<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>API de almacenamiento | Kamary</title>
    <link rel="icon" type="image/svg+xml" href="/assets/img/icons/icon.svg">
    <style>
        :root {
            color: #172033;
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.5;
        }

        body {
            background: #f5f7fa;
            margin: 0;
        }

        header {
            background: #ffffff;
            border-bottom: 1px solid #dfe7f0;
            padding: 24px;
        }

        main {
            margin: 0 auto;
            max-width: 1120px;
            padding: 28px 24px 56px;
        }

        h1,
        h2,
        h3 {
            line-height: 1.2;
            margin: 0;
        }

        h1 {
            font-size: 30px;
            margin-top: 18px;
        }

        h2 {
            border-top: 1px solid #dfe7f0;
            font-size: 22px;
            margin-top: 34px;
            padding-top: 28px;
        }

        h3 {
            font-size: 17px;
            margin-top: 24px;
        }

        p {
            color: #4a5668;
            margin: 10px 0 0;
        }

        a {
            color: #0b7fe8;
        }

        code,
        pre {
            font-family: Consolas, Monaco, monospace;
        }

        code {
            background: #eef3f8;
            border-radius: 4px;
            padding: 2px 5px;
        }

        pre {
            background: #172033;
            border-radius: 8px;
            color: #e7edf5;
            overflow-x: auto;
            padding: 16px;
        }

        .brand {
            align-items: center;
            display: flex;
            gap: 14px;
            margin: 0 auto;
            max-width: 1120px;
        }

        .brand img {
            height: 34px;
        }

        .subtitle {
            color: #5d697a;
            max-width: 780px;
        }

        .toc {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 20px;
        }

        .toc a {
            background: #ffffff;
            border: 1px solid #dfe7f0;
            border-radius: 6px;
            color: #2f3b4d;
            padding: 8px 10px;
            text-decoration: none;
        }

        .endpoint {
            background: #ffffff;
            border: 1px solid #dfe7f0;
            border-radius: 8px;
            margin-top: 16px;
            padding: 18px;
        }

        .method {
            background: #0b7fe8;
            border-radius: 4px;
            color: #ffffff;
            display: inline-block;
            font-size: 12px;
            font-weight: 700;
            margin-right: 8px;
            padding: 3px 7px;
        }

        .method.post {
            background: #16875a;
        }

        .flow {
            counter-reset: step;
            display: grid;
            gap: 12px;
            margin-top: 16px;
        }

        .flow div {
            background: #ffffff;
            border: 1px solid #dfe7f0;
            border-radius: 8px;
            padding: 16px 16px 16px 52px;
            position: relative;
        }

        .flow div::before {
            background: #0b7fe8;
            border-radius: 50%;
            color: #ffffff;
            content: counter(step);
            counter-increment: step;
            font-weight: 700;
            height: 26px;
            left: 16px;
            line-height: 26px;
            position: absolute;
            text-align: center;
            top: 16px;
            width: 26px;
        }

        .note {
            background: #fff8e6;
            border: 1px solid #f0d58b;
            border-radius: 8px;
            color: #624b12;
            margin-top: 16px;
            padding: 14px 16px;
        }

        ul {
            color: #4a5668;
        }
    </style>
</head>

<body>
    <header>
        <div class="brand">
            <img src="/assets/img/logo.svg" alt="Kamary">
            <div>
                <strong>KAMARY PERU SAC</strong>
                <h1>API de almacenamiento para clientes</h1>
                <p class="subtitle">
                    Contrato publico para consultar stock de Serv. Almacenamiento y crear pedidos externos que descuentan stock en Kamary.
                </p>
            </div>
        </div>
    </header>

    <main>
        <p><strong>Base URL:</strong> <code>{{ url('/api/external/storage') }}</code></p>

        <nav class="toc">
            <a href="#flujo">Flujo</a>
            <a href="#auth">Autenticacion</a>
            <a href="#stock">Stock</a>
            <a href="#orders">Pedidos</a>
            <a href="#errors">Errores</a>
        </nav>

        <section id="flujo">
            <h2>Flujo operativo</h2>
            <div class="flow">
                <div>
                    <strong>Kamary crea un token por cliente.</strong>
                    <p>El token se genera desde <code>/admin/storage-api-tokens</code>, queda asociado a un cliente de almacenamiento y define permisos como <code>stock:read</code> y <code>orders:write</code>.</p>
                </div>
                <div>
                    <strong>El sistema externo consulta stock.</strong>
                    <p>La API devuelve solo stock del cliente dueño del token, separado por SKU, almacen, lote, vencimiento y ubicacion.</p>
                </div>
                <div>
                    <strong>El sistema externo crea el pedido.</strong>
                    <p>Debe enviar una <code>external_reference</code> unica, el SKU o articulo, lote, vencimiento, ubicacion y cantidad.</p>
                </div>
                <div>
                    <strong>Kamary valida y descuenta.</strong>
                    <p>Si hay stock, se crea una nota de salida aprobada. Si no hay stock, responde <code>422</code> y no mueve inventario.</p>
                </div>
                <div>
                    <strong>Los reintentos no duplican salida.</strong>
                    <p>La combinacion cliente, <code>source</code> y <code>external_reference</code> es idempotente.</p>
                </div>
            </div>
        </section>

        <section id="auth">
            <h2>Autenticacion</h2>
            <p>Enviar el token en cada request.</p>
            <pre>Authorization: Bearer kst_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</pre>
            <p>Tambien se acepta el header <code>X-Storage-Token</code>.</p>
            <h3>Gestionar tokens</h3>
            <p>En el panel administrativo usar <code>/admin/storage-api-tokens</code> para elegir cliente, generar, ver, renovar o desactivar tokens.</p>
            <h3>Comando alternativo</h3>
            <pre>php artisan storage-api:token 20123456789 --name="ERP Cliente"</pre>
        </section>

        <section>
            <h2>Endpoints</h2>

            <div class="endpoint">
                <h3><span class="method">GET</span><code>/me</code></h3>
                <p>Devuelve el cliente asociado al token y los permisos del token.</p>
            </div>

            <div class="endpoint" id="stock">
                <h3><span class="method">GET</span><code>/stock</code></h3>
                <p>Consulta stock disponible del cliente.</p>
                <p>Filtros: <code>warehouse_id</code>, <code>q</code>, <code>search</code>, <code>sku</code>, <code>lot</code>, <code>location</code>, <code>page</code>, <code>per_page</code>.</p>
                <pre>curl -H "Authorization: Bearer kst_xxx" "{{ url('/api/external/storage/stock?sku=SKU-001&per_page=20') }}"</pre>
            </div>

            <div class="endpoint" id="orders">
                <h3><span class="method post">POST</span><code>/orders</code></h3>
                <p>Crea un pedido externo y descuenta stock creando una nota de salida aprobada.</p>
                <pre>{
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
    }
  ]
}</pre>
                <p>Reglas: cada item debe tener <code>sku</code> o <code>article_id</code>; <code>lot</code> es obligatorio; <code>warehouse_id</code> puede ir general o por item.</p>
            </div>

            <div class="endpoint">
                <h3><span class="method">GET</span><code>/orders/{external_reference}?source=erp_cliente</code></h3>
                <p>Consulta el pedido externo creado por referencia.</p>
            </div>
        </section>

        <section id="errors">
            <h2>Errores</h2>
            <ul>
                <li><code>401</code>: token faltante, invalido o expirado.</li>
                <li><code>403</code>: token sin permiso o cliente no habilitado.</li>
                <li><code>422</code>: payload invalido, SKU ajeno al cliente, almacen incorrecto o stock insuficiente.</li>
            </ul>
            <div class="note">
                La documentacion completa tambien queda versionada en <code>docs/api-almacenamiento-clientes.md</code>.
            </div>
        </section>
    </main>
</body>

</html>
