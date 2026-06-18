# API de almacenamiento para clientes

Esta API permite que un cliente de `Serv. Almacenamiento` consulte su stock y cree pedidos externos que descuentan stock en Kamary mediante una nota de salida aprobada.

Base URL:

```text
https://kamary.xplain.pe/api/external/storage
```

## Autenticacion

Enviar el token entregado por Kamary en cada request:

```http
Authorization: Bearer kst_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Tambien se acepta `X-Storage-Token`. El token queda asociado a un solo cliente, por lo que la API nunca devuelve ni descuenta stock de otro cliente.

Los tokens se gestionan desde el panel:

```text
/admin/storage-api-tokens
```

Desde ese modulo se puede elegir el cliente, generar token, visualizar el token cifrado ya registrado, renovar credenciales y desactivar accesos.

Tambien existe comando administrativo para generar un token:

```bash
php artisan storage-api:token 20123456789 --name="ERP Cliente"
```

Permisos disponibles:

- `stock:read`
- `orders:read`
- `orders:write`
- `*`

## Identificar token

`GET /me`

Respuesta:

```json
{
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
}
```

## Consultar stock

`GET /stock`

Filtros opcionales:

- `warehouse_id`: almacen interno.
- `q` o `search`: busca por SKU, nombre, registro sanitario, lote, ubicacion o cliente.
- `sku`: SKU exacto.
- `lot`: lote exacto.
- `location`: ubicacion exacta.
- `page`: pagina, por defecto `1`.
- `per_page`: registros por pagina, maximo `100`.

Ejemplo:

```bash
curl -H "Authorization: Bearer kst_xxx" \
  "https://kamary.xplain.pe/api/external/storage/stock?sku=SKU-001&per_page=20"
```

Respuesta:

```json
{
  "success": true,
  "message": "Operacion correcta",
  "data": {
    "items": [
      {
        "article_id": 120,
        "sku": "SKU-001",
        "name": "Producto demo",
        "health_registration": "RS-123",
        "laboratory": "Laboratorio",
        "active_principle": "",
        "unit": "UND",
        "warehouse": { "id": 2, "name": "Almacen Principal" },
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
}
```

## Crear pedido externo

`POST /orders`

Cuando el pedido se acepta, Kamary crea una nota de salida aprobada y el stock queda descontado. `external_reference` es idempotente por cliente y `source`: si se reenvia la misma referencia, no se descuenta dos veces; se devuelve el pedido existente con `idempotent: true`.

Payload:

```json
{
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
}
```

Reglas:

- Cada item debe enviar `sku` o `article_id`.
- `lot` es obligatorio.
- `warehouse_id` puede ir a nivel general o por item.
- `expiration_date` y `location` deben coincidir con la existencia real cuando el stock esta separado por vencimiento o ubicacion.
- Si no hay stock suficiente, la API responde `422` y no crea la salida.

Ejemplo:

```bash
curl -X POST "https://kamary.xplain.pe/api/external/storage/orders" \
  -H "Authorization: Bearer kst_xxx" \
  -H "Content-Type: application/json" \
  -d @pedido.json
```

Respuesta `201`:

```json
{
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
      "warehouse": { "id": 2, "name": "Almacen Principal" },
      "items": [
        {
          "article_id": 120,
          "sku": "SKU-001",
          "name": "Producto demo",
          "unit": "UND",
          "warehouse": { "id": 2, "name": "Almacen Principal" },
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
}
```

## Consultar pedido por referencia

`GET /orders/{external_reference}?source=erp_cliente`

Ejemplo:

```bash
curl -H "Authorization: Bearer kst_xxx" \
  "https://kamary.xplain.pe/api/external/storage/orders/ERP-000123?source=erp_cliente"
```

## Errores comunes

`401`: token faltante, invalido o expirado.

`403`: token sin permiso o cliente no habilitado para almacenamiento.

`422`: payload invalido, almacen no corresponde a Kamary Medicals, SKU no pertenece al cliente, lote/ubicacion no existe o stock insuficiente.
