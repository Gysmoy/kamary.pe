# Plan Operativo de Modulos 4.3 a 4.7

Fecha: 2026-04-28

## 1. Objetivo

Este documento define lo que necesitamos construir en el sistema local para replicar la logica operativa del sistema productivo en los bloques:

4.3 Proveedores y Compras
4.4 Clientes y Comercial
4.5 Facturacion
4.6 Servicios y Operaciones
4.7 Reportes

La meta no es copiar pantalla por pantalla sin criterio. La meta es reconstruir el flujo operativo completo para que el sistema local soporte:

- maestros
- procesos
- estados
- trazabilidad
- integracion con facturacion
- reportes base

## 2. Decision de arquitectura vigente

Esta decision queda cerrada para este proyecto:

- no se modifican los modulos actuales ya operativos
- no se rompen tablas ni CRUDs existentes
- los nuevos bloques se construyen en modulos y tablas nuevas
- lo existente se usa como referencia, maestro o integracion, pero no como objetivo principal de reescritura

Esto cambia el enfoque original del plan. El proyecto ya no va a "extender" agresivamente `entry_notes`, `orders`, `clients` o `suppliers`. Va a construir alrededor de ellos.

## 3. Fuente de verdad usada

Este plan se arma con dos fuentes:

1. Produccion `https://kamary.l105.com/`, revisada solo en modo lectura el 2026-04-28.
2. Proyecto local actual Laravel, revisando rutas, controladores, modelos, migraciones y pantallas React.

## 4. Estado actual del proyecto local

### 4.1 Base reusable que ya existe

Estos modulos ya tienen base tecnica reutilizable:

- `suppliers`
  - CRUD
  - importacion masiva
  - consulta RUC por API externa
- `clients`
  - CRUD
  - consulta DNI/RUC por API externa
- `entry_notes`
  - cabecera y detalle
  - ingreso de stock
  - relacion con empresa, sede, almacen y proveedor
- `orders`
  - cabecera y detalle
  - validacion de stock por almacen
  - totales basicos
- `inventory`
  - calculo de entradas, salidas y stock
- `kardex`
  - base de movimientos
- maestros de soporte
  - empresas
  - sedes
  - almacenes
  - articulos
  - laboratorios
  - unidades

### 4.2 Como se usara esa base existente

Los modulos actuales se usaran asi:

- `suppliers` como maestro de proveedores
- `clients` como maestro de clientes regulares
- `entry_notes` como referencia logistica ya existente
- `orders` como referencia del pedido actual, sin convertirlo en el pedido comercial final
- `inventory` y `kardex` como destino de integracion para movimientos confirmados

### 4.3 Modulos que hoy siguen incompletos o en placeholder

Estas pantallas estan en `ComingSoon` o no tienen backend funcional real:

- cuentas por pagar
- gastos
- resumen diario
- clientes eventuales
- cuentas por cobrar
- tarifarios
- despacho
- actividad operativa
- conductores
- vehiculos / zonas
- clientes de servicios
- facturacion de servicios
- ordenes de servicio
- catalogo de servicios
- control de facturacion de almacenamiento

### 4.4 Conclusion tecnica

La base local actual sirve como soporte, pero no debe ser intervenida como primera estrategia.

La nueva linea de trabajo es:

- crear documentos operativos nuevos
- enlazarlos con maestros existentes
- integrar stock, kardex, cobranza y facturacion por capas
- evitar romper contratos actuales

### 4.5 Avance implementado al 2026-04-28

Ya quedaron construidos estos modulos nuevos, sin reemplazar los CRUDs existentes:

- `purchase_orders`
  - orden de compra con cabecera, detalle, estados y correlativo
  - relacion con empresa, sede, almacen, proveedor y articulos
- `purchase_receipts`
  - recepcion de compra vinculable a orden de compra
  - documento de compra, guia, cuotas, observaciones y detalle por item
  - recalculo de cantidades recepcionadas por item de OC
- `accounts_payable`
  - deuda generada automaticamente desde recepciones confirmadas
  - cuotas generadas segun condicion de pago
  - eliminacion automatica de la deuda si la recepcion vuelve a borrador, se desactiva o se anula
  - registro de pagos parciales
  - recalculo de cuotas, pagado y saldo
  - bloqueo de anulacion o desactivacion de la recepcion si ya existen pagos registrados

Esto deja cerrado el primer circuito nuevo:

- orden de compra
- recepcion de compra
- cuenta por pagar

Adicionalmente, ya quedaron construidos en el bloque comercial, servicios y facturacion:

- modulo nuevo `accounts_receivable` + `accounts_receivable_installments` + `receivable_payments`
- integracion financiera de `service_orders` con `accounts_receivable`
- modulo nuevo `billing_documents` + `billing_document_items` + `billing_events`
- preparacion de payload REST para `facturadorpro5`
- modulo nuevo `services`
- modulo nuevo `service_orders`
- modulo nuevo `dispatches` + `dispatch_assignments`
- reportes nuevos:
  - `sales_report`
  - `inventory_report`
  - `daily_summary`

Adicionalmente, ya quedo integrado y validado:

- impacto automatico en `inventory`, `kardex` y `batches` desde `purchase_receipts` confirmadas
- consumo de ese stock desde `exit_notes` y validaciones de stock disponible
- bloqueo de paso a `draft`, desactivacion o anulacion de recepcion si eso dejaria stock negativo
- modulo nuevo `eventual_clients` con maestro separado y consulta documental
- modulo nuevo `client_distribution_networks` + `client_delivery_addresses`
- modulo nuevo `price_lists` + `price_list_items` para reglas por cliente, eventual, nodo, laboratorio y articulo
- modulo nuevo `commercial_orders` + `commercial_order_items`

La validacion se hizo con una prueba transaccional real sobre Laravel:

- recepcion confirmada de compra
- alta automatica de lote
- reflejo en `currentStock`, `stockByWarehouse`, `inventory` y `kardex`
- salida posterior consumiendo ese stock
- bloqueo correcto al intentar retroceder la recepcion
- alta de cliente eventual
- alta de red de distribucion con multiples direcciones y default unico
- alta de tarifario con reglas mixtas de precio fijo y margen
- pedido comercial con precio resuelto desde tarifario o fallback de presentacion
- alta automatica de cuenta por cobrar al confirmar el pedido
- pagos parciales de cuenta por cobrar con recalculo de cuotas y saldo
- alta automatica de cuenta por cobrar al aprobar una orden de servicio
- pago parcial reversible sobre cuenta por cobrar de orden de servicio
- cambio de `billing_status` a `billed` en orden de servicio al aceptar un comprobante
- respuesta operativa en reporte de ventas, reporte de inventario y resumen diario

## 5. Referencia funcional observada en produccion

### 5.1 Proveedores

En produccion se observan al menos estos datos visibles:

- RUC
- razon social
- direccion
- telefono
- email
- cuenta bancaria / CCI
- estado

### 5.2 Nota de entrada por compra

En produccion la nota de entrada ya opera como documento logistico y financiero. Se observaron estos campos:

- empresa
- sede
- almacen
- proveedor
- tipo de documento
- serie
- secuencia
- archivo del documento
- moneda
- fecha de primera cuota
- total
- cuotas
- observaciones
- guia serie
- guia secuencia
- guia RUC
- archivo de guia

Y en detalle:

- codigo de lote
- lote
- articulo
- laboratorio / principio activo
- unidad
- stock
- almacen
- fecha vencimiento
- precio costo unitario
- ubicacion
- cantidad
- total
- unidad por caja
- cantidad de cajas

### 5.3 Clientes

En produccion el cliente maneja datos que hoy no estan completos en local:

- tipo documento
- numero documento
- razon social
- email
- direccion
- indicador de plataforma
- dias de vencimiento de contrato
- estado
- filtro de servicio de almacenamiento

### 5.4 Clientes eventuales

Existe un listado separado de clientes eventuales. Dado que no vamos a tocar agresivamente `clients`, lo correcto es tratarlos como modulo nuevo o maestro separado.

### 5.5 Pedidos

En produccion el modulo de pedidos ya junta logica comercial, pago y facturacion. Se observaron:

- estado de pago
- estado operativo
- comprobante
- serie
- numeracion
- tipo documento
- cliente
- razon social
- numero de documento
- total
- tipo de pago
- usuario
- fecha registro
- datos de multiples pagos
- exportacion a Excel
- reporte asociado

### 5.6 Tarifario

En produccion el tarifario no es un simple precio por articulo. Tiene segmentacion:

- codigo
- empresa
- almacen
- canal
- cliente
- segmento / nodo
- laboratorio
- items tarifario
- items catalogo
- margen porcentual
- usuario registro
- usuario activacion
- fechas de activacion y desactivacion

Tambien tiene:

- carga de archivos
- descarga de formato
- importacion
- cliente corporativo
- segmento
- articulo
- categoria
- subcategoria

### 5.7 Facturacion

Produccion separa varios subprocesos:

- prefacturas pendientes por emitir
- facturas emitidas
- facturas anuladas
- notas de credito
- filtros por cliente y fechas
- campos de pago, email, usuario emision, fecha vencimiento

### 5.8 Ordenes de servicio

Produccion muestra que una orden de servicio necesita:

- cliente
- contrato
- ciclo de facturacion
- moneda
- comprobante
- servicios
- total prefacturas
- total servicio
- total facturado
- detraccion
- forma de pago
- dia de facturacion
- cuotas
- dias de plazo
- vendedor
- comision
- division de prefactura

### 5.9 Servicios

El maestro de servicios en produccion contempla:

- codigo servicio
- nombre servicio
- descripcion o glosa
- valor unitario en soles
- valor unitario en dolares
- categoria
- subcategoria
- tipo servicio
- zona
- vehiculo
- si paga comision al vendedor

### 5.10 Despacho y actividades

Produccion tiene dos piezas separadas:

- control de despacho
- control de actividades

Con datos visibles como:

- fecha entrega
- turno
- vehiculo
- conductores
- zona
- manifiesto
- cliente
- tipo
- ubigeo
- direccion
- fecha traslado
- bultos
- peso bruto
- destinatario
- tracking del pedido

### 5.11 Resumen diario

Produccion consolida operaciones del dia en un solo modulo:

- pedidos
- facturacion
- pagos
- gastos
- utilidades
- importes
- usuario
- fecha facturacion
- fecha registro

### 5.12 Brecha validada contra produccion

Esta brecha se arma contrastando lo ya visto en produccion contra el estado real del proyecto local al 2026-04-28.

#### 5.12.1 Proveedores

El maestro local ya sirve como base, pero produccion todavia muestra campos operativos que conviene contemplar si buscamos paridad funcional:

- telefono celular separado
- segundo email
- giro
- tipo de facturacion
- tipo de credito
- sistema de pago
- evaluacion del proveedor

Conclusion:

- no hace falta crear un modulo nuevo de proveedores
- si mas adelante estos campos afectan compras o cuentas por pagar, se agregan de forma aditiva y controlada

#### 5.12.2 Recepciones de compra

El modulo nuevo `purchase_receipts` ya cubre buena parte de lo visto en produccion:

- proveedor
- documento, serie y secuencia
- moneda
- vencimiento y cuotas
- observaciones
- lote, vencimiento, ubicacion, unidades por caja y cajas

Lo que sigue faltando para quedar cerca de produccion:

- RUC de guia
- generacion y visualizacion real de cuotas en interfaz
- impresion o reporte del documento origen
- flujo mas directo de lote y presentacion
- refinamiento visual del seguimiento logistico

Conclusion:

- compras ya tiene reflejo operativo real
- el siguiente hueco real de este bloque pasa a ser experiencia de cuotas, pagos y documento origen

#### 5.12.3 Cuentas por pagar

El modulo nuevo `accounts_payable` ya existe, ya nace desde recepciones confirmadas y ya permite registrar pagos parciales con recalculo de cuotas y saldo. Lo que aun falta para parecerse a produccion es:

- mejorar catalogo de tipos de pago
- mejorar experiencia de adjunto y consulta de evidencia
- impresion o acceso al documento origen como accion principal
- anulacion o reversa de pagos con trazabilidad
- vista mas cercana al flujo de `a cuenta` y `saldo` de produccion

Conclusion:

- la estructura base ya esta, pero la cobranza de proveedor todavia necesita madurar

#### 5.12.4 Clientes

El maestro local `clients` no alcanza todavia la operacion visible en produccion. Faltan piezas relacionales y logisticas:

- codigo corto del cliente
- bandera operativa de servicio de almacenamiento
- red de distribucion por cliente
- direcciones de entrega por nodo
- ubigeo
- latitud y longitud
- referencia de entrega
- sucursales o puntos de atencion
- configuraciones de notificacion

Conclusion:

- el problema ya no es solo la ficha del cliente
- necesitamos tablas hijas para red de distribucion y direcciones de entrega

#### 5.12.5 Clientes eventuales

Produccion los maneja como listado separado. En local ya quedo creado como modulo nuevo independiente.

Lo minimo que se debe cubrir:

- tipo y numero de documento
- razon social o nombre
- email
- celular
- direccion
- contacto
- estado

Conclusion:

- ya quedo listo como base rapida para el pedido comercial nuevo

#### 5.12.6 Tarifarios

La evidencia de produccion muestra que el tarifario real no es una simple lista de precios. En local ya quedo montada la base operativa del modulo.

Debe soportar:

- tarifario por segmento
- tarifario por nodo o red de distribucion
- uno o varios laboratorios
- margen porcentual
- importacion y exportacion por archivo
- activacion y desactivacion
- duplicado
- vista de articulos tarifados

Conclusion:

- `price_lists` ya existe como cabecera con reglas hijas
- la siguiente mejora real ya no es el CRUD base, sino resolver importacion/exportacion y motor de aplicacion sobre pedidos

#### 5.12.7 Pedidos comerciales

Este es hoy el hueco mas grande respecto a produccion. El pedido real observado junta:

- estado operativo
- estado de pago
- cliente
- documento
- tipo de pago
- direccion de entrega
- ubigeo
- latitud y longitud
- referencia
- persona de contacto
- celular de contacto
- orden de compra del cliente
- guia de remision referencial
- observaciones
- tarifario aplicado
- facturacion
- cobranza
- evidencias
- confirmacion en ruta

Conclusion:

- el pedido comercial nuevo no puede ser solo cabecera y detalle
- debe nacer ya pensado como hub comercial, logistica ligera y origen de facturacion/cobranza

#### 5.12.8 Facturacion

La pantalla de produccion muestra que la facturacion necesita convivir con:

- tipos de comprobante multiples
- tipos de pago con contado y credito
- fecha de primera cuota
- numero de cuotas
- generacion de cuotas
- relacion con pedido

Conclusion:

- el contrato con el modulo externo debe contemplar no solo emision, sino tambien vencimientos y tipo de pago

#### 5.12.9 Dataset minimo de prueba

Para validar lo que construyamos sin usar datos de produccion, conviene trabajar con un set sintetico pero parecido en forma:

- 3 proveedores
  - uno contado
  - uno credito 15 dias
  - uno credito 30 dias con CCI y dos correos
- 2 ordenes de compra
  - una recepcion total
  - una recepcion parcial con dos lotes
- 2 recepciones de compra
  - una con factura y guia
  - una con 2 cuotas
- 1 cuenta por pagar con pago parcial
  - total
  - a cuenta
  - saldo
  - banco
  - numero de operacion
- 2 clientes corporativos
  - uno con servicio de almacenamiento
  - uno sin servicio de almacenamiento
- 1 cliente con red de distribucion y 2 direcciones de entrega
  - ubigeo
  - referencia
  - latitud y longitud
- 2 clientes eventuales
  - uno DNI
  - uno RUC
- 2 tarifarios
  - uno por segmento
  - uno por nodo
- 2 pedidos comerciales
  - uno contado
  - uno credito con fecha de vencimiento y contacto de entrega

Este dataset no reemplaza pruebas unitarias. Sirve para pruebas funcionales de punta a punta y para detectar temprano si aun faltan columnas o relaciones.

## 6. Alcance funcional por modulo

### 6.1 Proveedores y Compras

#### Objetivo

Controlar todo el circuito de abastecimiento desde proveedor hasta ingreso valorizado a almacen y generacion de deuda.

#### Lo que debemos tener

- gestion de proveedores
- ordenes de compra
- recepcion de compra
- cuentas por pagar derivadas de compra
- trazabilidad entre compra, recepcion y deuda

#### Entidades requeridas

- `suppliers`
- `purchase_orders`
- `purchase_order_items`
- `purchase_receipts`
- `purchase_receipt_items`
- `accounts_payable`
- `accounts_payable_installments`
- `purchase_documents`

#### Lo reusable hoy

- `suppliers` ya existe y se reutiliza como maestro
- `entry_notes` existe como referencia logistica, pero no sera el modulo principal nuevo
- `inventory` y `kardex` existen como integraciones destino

#### Lo que falta en compras

- orden de compra formal
- correlativo de orden de compra
- estado de orden de compra
- aprobacion
- recepcion parcial
- recepcion total
- relacion orden de compra -> recepcion
- generacion automatica de cuenta por pagar
- cuotas y vencimientos reales
- subtotal, IGV, total y detracciones cuando aplique

#### Pantallas necesarias

- listado de proveedores
- listado de ordenes de compra
- formulario de orden de compra
- listado de recepciones de compra
- formulario de recepcion
- listado de cuentas por pagar
- detalle de deuda y cuotas

#### Reglas operativas

- no debe existir proveedor duplicado por RUC
- una orden de compra debe permitir varios items
- una orden puede recepcionarse parcial o totalmente
- la recepcion confirmada es la que impacta stock
- el costo unitario ingresado debe quedar trazable por lote
- una compra al credito debe generar cuotas
- una compra al contado debe cerrar la deuda en el mismo registro
- si se anula una recepcion confirmada, debe existir reversa operativa y financiera

#### Campos minimos recomendados

Para `purchase_orders`:

- business_id
- business_branch_id
- warehouse_id
- supplier_id
- code
- issue_date
- expected_date
- currency
- payment_condition
- status
- approval_status
- observations
- subtotal
- tax_amount
- total
- created_by
- updated_by

Para `purchase_order_items`:

- purchase_order_id
- article_id
- requested_quantity
- received_quantity
- price_unit
- total
- status

Para `purchase_receipts`:

- purchase_order_id
- business_id
- business_branch_id
- warehouse_id
- supplier_id
- code
- document_type
- series
- sequence
- issue_date
- payment_condition
- first_due_date
- installments
- currency
- subtotal
- tax_amount
- total
- observations
- status

Para `purchase_receipt_items`:

- purchase_receipt_id
- article_id
- batch_id opcional
- lot
- expiration_date
- warehouse_id
- stock_before
- quantity
- units_per_box
- boxes_quantity
- cost_unit
- total
- location
- status

Para `accounts_payable`:

- supplier_id
- source_type
- source_id
- document_type
- series
- sequence
- issue_date
- due_date
- currency
- subtotal
- tax_amount
- total
- paid_amount
- balance_amount
- payment_status
- status

#### Integraciones

- `inventory`
- `kardex`
- `batches`
- `suppliers`
- reportes financieros

#### Criterio de terminado

- puedo generar orden de compra
- puedo recepcionar parcial o total
- el stock sube correctamente al confirmar recepcion
- el stock recibido puede consumirse desde salidas
- no puedo retroceder la recepcion si eso rompe stock
- la deuda queda creada
- el reporte de compras cuadra con recepciones y deuda

### 6.2 Clientes y Comercial

#### Objetivo

Tener un circuito comercial usable desde cliente hasta pedido, con condiciones comerciales, clientes eventuales y cobranza.

#### Lo que debemos tener

- clientes regulares
- clientes eventuales
- tarifarios
- pedidos comerciales
- cuentas por cobrar

#### Entidades requeridas

- `clients`
- `eventual_clients`
- `price_lists`
- `price_list_items`
- `price_list_assignments`
- `commercial_orders`
- `commercial_order_items`
- `accounts_receivable`
- `accounts_receivable_installments`
- `receivable_payments`

#### Lo reusable hoy

- `clients` ya existe y se reutiliza como maestro de cliente regular
- `orders` existe como referencia, pero no sera el pedido comercial final de esta nueva etapa

#### Lo que falta en comercial

- maestro separado de cliente eventual
- tarifario con vigencias y prioridad
- pedido comercial con correlativo y estados
- multiples pagos
- relacion a cuenta por cobrar
- relacion a comprobante emitido
- control de despacho y estado de atencion

#### Pantallas necesarias

- clientes eventuales
- tarifarios
- pedidos comerciales
- cuentas por cobrar
- detalle de cobranza por documento

#### Reglas operativas

- un cliente eventual debe poder usarse sin cargar toda la ficha corporativa
- un pedido debe tomar precios desde tarifario si existe coincidencia
- si no existe tarifario especifico, debe caer en una regla general controlada
- el pedido no debe facturarse si no esta validado comercialmente
- el pedido debe generar cuenta por cobrar cuando la venta no quede completamente pagada
- el pedido debe poder quedar en estados como borrador, confirmado, en preparacion, despachado, facturado, cerrado, anulado

#### Tarifarios: definicion operativa recomendada

El tarifario debe soportar al menos estos niveles:

- por empresa
- por sede o almacen
- por cliente
- por canal
- por segmento
- por laboratorio
- por articulo

Y estas reglas:

- vigencia desde / hasta
- moneda
- margen o precio fijo
- prioridad de aplicacion
- activacion y desactivacion

#### Campos minimos recomendados

Para `eventual_clients`:

- document_type
- document_number
- business_name
- email
- phone
- address
- contact_name
- status

Para `price_lists`:

- code
- business_id
- business_branch_id
- warehouse_id
- client_id opcional
- eventual_client_id opcional
- channel
- segment
- currency
- priority
- starts_at
- ends_at
- status

Para `price_list_items`:

- price_list_id
- article_id opcional
- laboratory_id opcional
- category
- subcategory
- fixed_price opcional
- margin_percent opcional
- status

Para `commercial_orders`:

- code
- business_id
- business_branch_id
- warehouse_id
- client_id opcional
- eventual_client_id opcional
- seller_id
- order_status
- payment_status
- dispatch_status
- billing_status
- price_list_id
- payment_method
- issue_date
- promised_delivery_at
- subtotal
- tax_amount
- total
- paid_amount
- balance_amount
- observations
- approved_at
- billed_at
- status

Para `accounts_receivable`:

- client_id opcional
- eventual_client_id opcional
- source_type
- source_id
- document_type
- series
- sequence
- issue_date
- due_date
- currency
- total
- paid_amount
- balance_amount
- payment_status

#### Criterio de terminado

- puedo registrar cliente eventual
- el pedido toma precio correcto
- el pedido controla stock y estado comercial
- el pedido genera deuda si queda saldo
- puedo ver por cobrar por cliente y por vencimiento

### 6.3 Facturacion

#### Objetivo

Integrar el modulo externo de facturacion con la logica operativa local sin duplicar responsabilidades.

#### Decision de arquitectura

El modulo de facturacion externo debe encargarse de:

- emision del comprobante
- comunicacion con el proveedor fiscal o SUNAT
- anulacion
- notas de credito

El sistema local debe encargarse de:

- decidir que se factura
- preparar payload
- guardar estado interno
- registrar respuesta externa
- reflejar impacto comercial y financiero

#### Lo que necesitamos en local

- cola o registro de documentos por emitir
- relacion entre pedido comercial u orden de servicio y comprobante
- seguimiento de estado de facturacion
- control de errores de integracion
- reintentos controlados
- anulacion logica interna
- notas de credito ligadas a documento origen

#### Entidades recomendadas

- `billing_documents`
- `billing_document_items`
- `billing_events`
- `credit_notes`
- `credit_note_items`

Si no queremos duplicar lineas, al menos necesitamos una tabla minima de control:

- tipo origen
- id origen
- tipo comprobante
- serie
- numero
- estado local
- estado externo
- payload request
- payload response
- emitted_at
- cancelled_at
- error_message

#### Estados operativos recomendados

- pendiente de emitir
- enviado
- aceptado
- observado
- rechazado
- anulado
- con nota de credito

#### Reglas operativas

- no se debe emitir comprobante si el origen no esta aprobado
- un pedido o servicio debe saber si ya fue facturado parcial o totalmente
- la anulacion debe actualizar cuentas por cobrar y reportes
- una nota de credito debe apuntar al comprobante origen
- la facturacion debe dejar traza auditable de request y response

#### Lo que NO debemos hacer

- mezclar reglas fiscales del modulo externo dentro del pedido
- recalcular manualmente estados externos sin sincronizacion
- dejar el pedido en facturado si el servicio externo fallo

#### Criterio de terminado

- un pedido u OS emite comprobante via integracion
- el sistema guarda el id externo y el estado
- puedo listar emitidos, anulados y observados
- puedo rastrear errores de facturacion

### 6.4 Servicios y Operaciones

#### Objetivo

Construir el circuito de servicio desde catalogo hasta ejecucion, despacho y control operativo.

#### Lo que debemos tener

- catalogo de servicios
- ordenes de servicio
- prefacturacion asociada
- despacho y asignacion
- control de actividades

#### Entidades requeridas

- `services`
- `service_categories`
- `service_subcategories`
- `service_orders`
- `service_order_items`
- `service_order_schedules`
- `dispatches`
- `dispatch_assignments`
- `drivers`
- `vehicles`
- `zones`
- `activities`
- `activity_items`
- `service_execution_logs`

#### Lo que hoy no existe en local

Este bloque practicamente no existe en backend ni frontend operativo.

#### Orden de servicio: logica requerida

Una orden de servicio debe soportar:

- cliente
- contrato
- ciclo de facturacion
- moneda
- comprobante esperado
- uno o varios servicios
- glosa
- valor unitario
- detraccion
- cuotas
- plazo
- vendedor
- comision
- prefacturas parciales

#### Catalogo de servicios: logica requerida

Cada servicio debe tener:

- codigo
- nombre
- categoria
- subcategoria
- tipo de servicio
- unidad de cobro
- valor unitario PEN
- valor unitario USD
- zona aplicable
- vehiculo asociado si corresponde
- si comisiona o no
- estado

#### Despacho: logica requerida

Un despacho debe permitir:

- agrupar actividades o pedidos
- asignar fecha de entrega
- turno
- vehiculo
- conductor
- copiloto
- zona
- manifiesto
- estado operativo

#### Actividades: logica requerida

La actividad operativa debe capturar:

- cliente
- tipo
- fecha de traslado
- direccion de partida
- direccion de llegada
- ubigeo
- latitud y longitud
- bultos
- peso bruto
- destinatario
- observaciones
- detalle de carga o servicio
- tracking

#### Reglas operativas

- una OS puede tener varias ejecuciones
- una OS puede prefacturarse por partes
- un despacho no debe cerrarse sin conductor y vehiculo
- una actividad debe quedar ligada al despacho o a la OS
- los cambios de estado deben quedar auditados

#### Estados recomendados

Para `service_orders`:

- borrador
- aprobada
- programada
- en ejecucion
- prefacturada
- facturada
- cerrada
- anulada

Para `dispatches`:

- en espera
- asignado
- en ruta
- entregado
- incidenciado
- cerrado
- anulado

#### Criterio de terminado

- puedo registrar servicios
- puedo generar una orden de servicio
- puedo asignarla a despacho
- puedo registrar actividad o ejecucion
- puedo dejarla lista para facturacion

### 6.5 Reportes

#### Objetivo

Dar salida operativa minima a gerencia y operacion sin esperar BI externo.

#### Reportes incluidos en esta etapa

- reporte de ventas
- reporte de inventario
- resumen diario de operaciones

#### Reporte de ventas

Debe filtrar por:

- empresa
- sede
- almacen
- cliente
- vendedor
- fecha inicio
- fecha fin
- estado
- tipo comprobante

Debe mostrar:

- pedido
- cliente
- comprobante
- fecha
- subtotal
- IGV
- total
- pago
- saldo
- estado

#### Reporte de inventario

Debe filtrar por:

- empresa
- sede
- almacen
- laboratorio
- articulo
- estado

Debe mostrar:

- codigo
- descripcion
- unidad
- lote
- stock entrada
- stock salida
- stock actual
- costo unitario referencial
- ubicacion

#### Resumen diario

Debe consolidar:

- pedidos registrados
- pedidos facturados
- importes del dia
- pagos del dia
- gastos del dia
- utilidades basicas
- anulaciones
- incidencias

#### Reglas operativas

- todos los reportes deben exportar a Excel
- los totales deben salir de tablas operativas, no de campos manuales
- el resumen diario debe ser recalculable por rango de fechas

#### Criterio de terminado

- el reporte de inventario cuadra con kardex
- el reporte de ventas cuadra con pedidos y comprobantes
- el resumen diario consolida sin duplicar movimientos

## 7. Requerimientos transversales

Esto hay que construir una sola vez y reutilizar en todos los modulos.

- correlativos por modulo
- estados normalizados
- auditoria `created_by`, `updated_by`, fechas y cambio de estado
- adjuntos por documento
- filtros por empresa, sede y almacen
- permisos por modulo y accion
- exportacion Excel
- importacion masiva donde tenga sentido
- observaciones y trazabilidad
- integracion con clientes y proveedores por API de documentos

## 8. Propuesta de construccion por fases

### Fase 1

Infraestructura transversal y compras nuevas.

- definir estados operativos
- definir correlativos por modulo
- crear `purchase_orders`
- crear `purchase_order_items`
- crear `purchase_receipts`
- crear `purchase_receipt_items`
- crear `accounts_payable`
- crear `accounts_payable_installments`

### Fase 2

Comercial nuevo.

- crear `eventual_clients`
- crear `price_lists`
- crear `price_list_items`
- crear `price_list_assignments`
- crear `commercial_orders`
- crear `commercial_order_items`
- crear `accounts_receivable`
- crear `accounts_receivable_installments`
- crear `receivable_payments`

### Fase 3

Integracion de facturacion.

- `billing_documents`
- sincronizacion de estado
- anulacion
- notas de credito
- conector REST real con `facturadorpro5`

### Fase 4

Servicios y operaciones.

- `services`
- `service_orders`
- `dispatches`
- `activities`
- catalogos operativos
- conductores, vehiculos y zonas
- evidencias y bitacora operativa

### Fase 5

Reportes y cierre.

- reporte ventas
- reporte inventario
- resumen diario
- ajustes de consistencia
- exportacion y filtros finos

## 9. Backlog priorizado para esta semana

### Prioridad 1

- crear `price_list_assignments`
- definir importacion y exportacion de tarifarios
- definir tipos de pago y vencimientos reutilizables para ventas y facturacion
- integrar `commercial_orders` y `service_orders` con facturacion externa
- modelar descuento real de stock por despacho o salida comercial

### Prioridad 2

- notas de credito y anulaciones
- reintentos y control de errores de integracion
- anulacion y notas de credito
- catalogos operativos faltantes de servicios y despacho
- conductores, vehiculos y zonas

### Prioridad 3

- `activities`
- `service_execution_logs`
- exportacion y afinado de reportes

## 10. Decisiones recomendadas antes de programar

Estas decisiones conviene cerrarlas antes de tocar codigo:

- si el cliente eventual vivira solo en `eventual_clients` o luego se podra promover a `clients`
- si el pedido comercial descontara stock al confirmar, al preparar o al despachar
- si cuentas por cobrar y pagar se generaran siempre automaticas
- si el tarifario resolvera por prioridad o por combinacion exacta
- si la detraccion se calcula en el sistema local o llega del modulo externo
- si la red de distribucion sera propia del cliente corporativo o tambien aplicara a clientes eventuales
- si el pedido comercial almacenara evidencia de pago, evidencia de entrega y eventos de ruta dentro del mismo modulo o en tablas separadas

## 11. Resultado esperado al cerrar este bloque

Cuando terminemos estos modulos, el sistema local debe poder operar este flujo completo:

1. registrar proveedor
2. emitir orden de compra
3. recepcionar compra
4. generar cuenta por pagar
5. registrar cliente eventual o regular
6. aplicar tarifario
7. generar pedido comercial
8. generar cuenta por cobrar o pago
9. emitir comprobante via integracion
10. ejecutar servicio o despacho si aplica
11. consultar reportes de ventas, inventario y resumen diario

## 12. Nota final de implementacion

La mejor estrategia para este proyecto no es empezar por facturacion. La prioridad correcta es:

- modelo operativo
- documentos origen nuevos
- estados
- deudas
- integracion fiscal

Y una restriccion adicional ya confirmada:

- no romper modulos existentes
- no mezclar una refactorizacion de lo actual con la construccion de los modulos nuevos

Si no respetamos eso, cada avance en compras o comercial va a venir con riesgo de regresion sobre inventario, pedidos o clientes que hoy ya existen.
