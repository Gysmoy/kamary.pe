# Integracion Ecomsur OMS / Multivende

Implementado el 2026-05-17 como base de conexion WMS.

## Endpoints Kamary

Todos los endpoints requieren `Authorization: Bearer <ECOMSUR_INBOUND_TOKEN>` o header `X-Kamary-Integration-Token`.

### Recibir orden logistica

`POST /api/integrations/ecomsur/logistic-orders`

Entrada basada en el correo de Ecomsur:

```json
{
  "IdAlmacen": "ALM01",
  "IdBodega": "BOD01",
  "IdCuenta": "CMPC",
  "UsuarioReg": "OMS",
  "pedidos": [
    {
      "NroPedido": "123456789",
      "SubServicio": "Next Day",
      "TipoPago": "PREPAGADO",
      "Consignatario": "Cliente final",
      "LugarDespacho": "Referencia",
      "Direccion": "Av. Ejemplo 123",
      "Distrito": "Lima|Lima|Miraflores",
      "FechaDespacho": "2026-05-18",
      "Ecommerce": "VTEX",
      "TlfCliente": "999999999",
      "EmailCliente": "cliente@example.com",
      "DocCliente": "12345678",
      "TipDocFac": "03",
      "Items": [
        {
          "NroItem": 1,
          "Sku": "SKU-001",
          "Descripcion": "Producto",
          "Cantidad": 1,
          "Precio": 10,
          "Descuento": 0
        }
      ]
    }
  ]
}
```

Resultado:

- Crea o actualiza `commercial_orders` por `external_source + external_order_id`.
- Guarda `NroPedido` en `external_order_id`.
- Guarda `IdAlmacen`, `IdBodega`, `IdCuenta` en campos externos.
- Crea detalle en `commercial_order_items` por SKU.
- Registra payload y resultado en `integration_logs`.

### Consultar stock

`POST /api/integrations/ecomsur/stock`

```json
{
  "IdAlmacen": "ALM01",
  "IdBodega": "BOD01",
  "IdCuenta": "CMPC",
  "Sku": "%%"
}
```

`Sku = "%%"` devuelve hasta 500 articulos. Con SKU especifico filtra por codigo o nombre.

### Webhook Multivende

`POST /api/integrations/multivende/webhook`

Requiere `MULTIVENDE_WEBHOOK_TOKEN`. El webhook queda registrado en `integration_logs`; segun la documentacion publica de Multivende, el webhook notifica y luego se debe consultar/pollear la informacion del checkout.

## Mapeos necesarios

Se pueden configurar por `.env` si es una sola operacion:

```env
ECOMSUR_DEFAULT_BUSINESS_ID=
ECOMSUR_DEFAULT_BRANCH_ID=
ECOMSUR_DEFAULT_WAREHOUSE_ID=
ECOMSUR_DEFAULT_CLIENT_ID=
```

Para varios almacenes/cuentas, usar `integration_mappings`:

```bash
php artisan integrations:map ecomsur_oms warehouse "ALM01|BOD01" "App\\Models\\Warehouse" 1
php artisan integrations:map ecomsur_oms account "CMPC" "App\\Models\\Client" 1
```

## Pendiente para conexion real

Pedir a soporte Ecomsur/Multivende:

- URL de QA/Staging y Produccion.
- Metodo de autenticacion final: OAuth2, token bearer, API key o firma.
- Token/credenciales de QA.
- Catalogo real de `IdAlmacen`, `IdBodega`, `IdCuenta`.
- Catalogo de estados OMS y equivalencia con estados Kamary.
- Endpoints exactos de `PostOrderStateByWMSv2` y `PostOrderStateByDeliveryV1`.
- Ejemplo real de JSON de orden logistica con todos los campos.
- Si `NroPedido` es VTEX, checkout Multivende o ambos; y campos para `checkout_id` / `delivery_order_id`.
- Si Kamary debe consultar stock desde el OMS o el OMS consultara el endpoint de Kamary.
- Regla de anulaciones, devoluciones y notas de credito.
- Si el WMS debe emitir DTE directamente en Multivende o solo informar factura emitida.
