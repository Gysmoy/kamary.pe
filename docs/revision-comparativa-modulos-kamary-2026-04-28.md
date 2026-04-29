# Revision comparativa de modulos contra kamary.l105.com

Fecha: 2026-04-28
Referencia revisada en modo solo lectura:
- https://kamary.l105.com/inicio/ingresar
- https://kamary.l105.com/almacen/proveedor
- https://kamary.l105.com/almacen/notaentradapagar
- https://kamary.l105.com/almacen/cliente
- https://kamary.l105.com/Clientes/clientesEventual
- https://kamary.l105.com/almacen/cuentaporpagar
- https://kamary.l105.com/almacen/caja
- https://kamary.l105.com/almacen/tarifario
- https://kamary.l105.com/Facturacion
- https://kamary.l105.com/OrdenServicio
- https://kamary.l105.com/Servicios
- https://kamary.l105.com/despacho
- https://kamary.l105.com/pedido_requerimiento/pedido
- https://kamary.l105.com/almacen/resumendiario

## Criterio
- `Igual base`: el modulo local ya cubre el circuito principal y la estructura de datos base.
- `Parcial`: existe modulo y datos, pero todavia no reproduce campos, acciones o subflujos relevantes de produccion.
- `Falta`: aun no existe el submodulo o sigue en `ComingSoon`.

## Facturacion y FacturadorPro5
Decision valida y correcta:
- Nuestra base de datos debe seguir siendo la fuente de verdad.
- `FacturadorPro5` debe quedar solo como servicio externo para emitir, anular, consultar y recibir estados SUNAT.

Estado actual local:
- Ya se guarda localmente el comprobante con `source_type`, `source_id`, cliente, importes, items y estados internos.
- Ya se construye un payload REST saliente para `FacturadorPro5`.
- Aun no existe la llamada real al proveedor ni el ciclo automatico de reintentos, anulacion y nota de credito.

Archivos clave:
- `app/Http/Controllers/Admin/BillingDocumentController.php`
- `app/Services/BillingDocumentService.php`
- `config/facturadorpro5.php`

## Resultado ejecutivo

### 4.3 Proveedores y Compras
- Proveedores: `Parcial alto`
  - La referencia muestra RUC, razon social, direccion, telefonos, correos, giro, tipo de facturacion, tipo de credito, banco, cuenta bancaria/CCI, sistema de pago y evaluacion.
  - Local ya tiene base para proveedor y flujo de compra, pero no se reviso en esta iteracion una paridad completa de todos esos campos en UI.
- Ordenes de compra: `Igual base`
  - Local ya soporta cabecera, proveedor, empresa, sede, almacen, fecha, pago, aprobacion, estado, items y totales.
- Recepciones de compra: `Igual base`
  - Local ya soporta OC origen, documento, guia, moneda, pago, cuotas, lote, vencimiento, ubicacion, cantidades y costo.
  - Ademas ya impacta stock real, kardex y lotes.
- Cuentas por pagar: `Igual base`
  - Local ya soporta saldo, a cuenta, cuotas, pagos, banco, nro operacion y archivo.
- Gasto: `Falta`
  - En referencia existe menu `Gasto`.
  - En local sigue en `ComingSoon`.

### 4.4 Clientes y Comercial
- Clientes regulares: `Parcial`
  - Produccion maneja mas que una ficha simple: red de distribucion, direcciones, giro/subgiro, contrato, servicio de almacenamiento, codigo corto, sucursales, locaciones, visitadores y maquinas.
  - Local cubre ficha base, plataforma, almacenamiento, canal, segmento, red de distribucion y direcciones, pero no llega aun a sucursales, locaciones, visitadores ni asignacion de maquinas.
- Clientes eventuales: `Parcial alto`
  - Local ya cubre tipo de documento, numero, razon social/nombre, email, celular, direccion y lookup DNI/RUC.
  - Falta exportacion y algunos refinamientos de la ficha comercial visibles en produccion.
- Tarifarios: `Parcial`
  - Local ya maneja empresa, sede, almacen, cliente regular/eventual, nodo, canal, segmento, reglas por articulo/laboratorio/categoria, precio fijo o margen y vigencia.
  - Produccion ademas tiene importacion/exportacion, variantes por segmento/nodo y operacion mas rica para bases tarifarias.
- Pedidos comerciales: `Parcial`
  - Local ya cubre cliente regular/eventual, nodo, direccion de entrega, ubigeo, contacto, pago, cuotas, items, stock y precio resuelto por tarifario.
  - Produccion ademas muestra checkout id, plataforma, e-commerce, pedido VTEX, visitador, orden de compra, guia remision, pagos I/II/III, lotes y mayor detalle operativo.
- Cuentas por cobrar: `Igual base`
  - Local ya soporta documento origen, cliente, fechas, saldo, cuotas, pagos, banco, nro operacion, archivo y estados.

### 4.5 Facturacion
- Control de facturacion: `Parcial`
  - Local ya tiene `billing_documents`, estados locales/externos, payload REST y auditoria de eventos.
  - Produccion ademas maneja prefactura/factura, detraccion, forma de pago, dias de plazo, nro de cuotas, email, fecha de emision, fecha de vencimiento, anulaciones, nota de credito, comprobante referencia, tipo/motivo de nota.
- Integracion SUNAT: `Falta`
  - Aun no se llama realmente a `FacturadorPro5`.
- Anulaciones y nota de credito: `Falta`
  - Solo existe el estado local/documental, no el flujo completo.

### 4.6 Servicios y Operaciones
- Servicios: `Parcial`
  - Local cubre codigo, nombre, categoria, subcategoria, tipo, unidad de cobro, valor PEN/USD, zona aplicable, vehiculo asociado y comisionable.
  - Produccion ademas maneja etapas del servicio.
- Ordenes de servicio: `Parcial alto`
  - Local cubre cliente, ciclo, comprobante esperado, moneda, pago, cuotas, items, detraccion por item, comision y CxC.
  - Produccion ademas agrega contrato, total de actividades, actividades sin tarifa, tarifa, vehiculo, zona, tipo y guia.
- Despacho: `Parcial`
  - Local cubre empresa, sede, almacen, fecha, turno, conductor, copiloto, vehiculo, placa, zona, manifiesto, pedidos asignados y salida tecnica.
  - Produccion tambien muestra y depende de estado SUNAT, cliente, comprobante, consolidacion y relaciones mas finas con facturacion.
- Actividad: `Falta`
  - Produccion tiene control de actividades con cliente, tipo, ubigeo, direcciones, latitud/longitud, vehiculo, conductor, bultos, peso, destinatario y tracking.
  - Local sigue en `ComingSoon`.
- Conductor: `Falta`
- Vehiculo / Zona: `Falta`

### 4.7 Reportes
- Reporte de ventas: `Igual base`
  - Local ya filtra por empresa, sede, origen, estado, comprobante y rango; lista importes, saldo, facturacion y estado operativo.
- Reporte de inventario: `Igual base`
  - Local ya consolida ingresos y salidas, stock por almacen/lote/ubicacion y costo de referencia.
- Resumen diario: `Parcial`
  - Local es un resumen agregado por fecha/empresa/sede con pedidos, OS, facturados, cobros, pagos y caja neta.
  - Produccion muestra una vista mas transaccional, con usuario, pedido, documento, utilidad, importe, banco, motivo, descripcion y archivo.

## Brechas mas importantes
1. Facturacion aun no esta a nivel de la referencia.
   - Falta el flujo completo de emision, anulacion y nota de credito con `FacturadorPro5`.
   - Faltan detraccion, cuotas visibles por comprobante y metadatos de emision.
2. Comercial todavia no replica todo el pedido de produccion.
   - Faltan checkout/plataforma/VTEX, multiples pagos, guia, orden de compra, visitador y lotes.
3. Operaciones esta incompleto.
   - `Actividad`, `Conductor` y `Vehiculo / Zona` siguen faltando como modulos propios.
4. Clientes aun no llega a la profundidad operativa de produccion.
   - Faltan locaciones, visitadores, sucursales y maquinas.
5. Resumen diario local existe, pero no es la misma vista operacional de produccion.

## Conclusiones
- La arquitectura de facturacion va en el sentido correcto: el facturador no gobierna el negocio; solo emite y devuelve estados.
- Compras y cuentas por pagar ya tienen una base suficientemente utilizable.
- Cuentas por cobrar tambien.
- Las mayores diferencias contra la web de referencia estan hoy en:
  - `Facturacion`
  - `Pedido`
  - `Actividad / Conductor / Vehiculo-Zona`
  - `Clientes` avanzados
  - `Resumen diario`

## Prioridad recomendada
1. Cerrar `Facturacion` real con `FacturadorPro5` como API externa.
2. Completar `Actividad`, `Conductor`, `Vehiculo / Zona`.
3. Completar `Pedido comercial` con campos y pagos de la referencia.
4. Completar `Clientes` avanzados y utilitarios comerciales.
5. Afinar `Resumen diario` para que tenga tambien vista transaccional.
