# Checklist de modulos contra kamary.l105.com

Fecha de revision: 2026-05-09

Referencia revisada: `https://kamary.l105.com`

El menu local fue alineado al orden visible de referencia:

1. Inicio
2. Sistemas
3. Almacen
4. Administracion
5. Comercial
6. Serv. Almacenamiento
7. Despacho
8. Servicios
9. Muestras
10. Magistrales

## Estado general

- [x] Menu local reordenado con la misma cantidad de bloques principales.
- [x] Entradas faltantes agregadas al menu local cuando ya existia ruta.
- [x] Permisos agrupados en Roles segun el nuevo orden del menu.
- [x] Trabajo dividido en 4 etapas de desarrollo.
- [x] Recomparacion 2026-05-09 contra `https://kamary.l105.com/principal`: mismos 10 bloques principales, misma cantidad de submodulos y mismo orden visible.
- [x] PHPUnit ejecutado en base separada `kamary_test`: 12 tests, 40 assertions, OK.
- [x] Revisar permisos reales por rol despues de desplegar el nuevo menu: se agrego sincronizador/seed/migracion de permisos y test de readiness.
- [x] Implementar los modulos que hoy apuntan a `ComingSoon`.
- [x] Separar Magistrales de Almacen normal. En referencia usa datos y flujos distintos; ya hay rutas/API separadas, tablas operativas propias y stock base para ingresos/salidas/ventas.

## Recomparacion de menu 2026-05-09

Referencia autenticada con usuario de validacion en `https://kamary.l105.com/inicio/ingresar`.

- [x] Bloques principales coinciden en cantidad y orden: Inicio, Sistemas, Almacen, Administracion, Comercial, Serv. Almacenamiento, Despacho, Servicios, Muestras, Magistrales.
- [x] Sistemas coincide: Gestion de Usuarios.
- [x] Almacen coincide: Articulos, Inventario, Kardex, Laboratorios, Lotes, Nota de Entrada, Nota de Salida, Proveedores, Und. de medida.
- [x] Administracion coincide: Cuentas por pagar, Gasto, Resumen diario.
- [x] Comercial coincide: Cliente, Clientes Eventual, Cuenta por Cobrar, Pedido, Tarifario.
- [x] Serv. Almacenamiento coincide: Inventario, Clientes, O. Servicio, Und. de medida, Creacion del producto, Nota de entrada, Nota de salida, Kardex, Servicio General, Control de Facturacion, O. Servicio General.
- [x] Despacho coincide: Actividad, Conductor, Despacho, Vehiculo / Zona.
- [x] Servicios coincide: Cliente, Facturacion, Orden de servicio, Servicios.
- [x] Muestras coincide: Pedido.
- [x] Magistrales coincide: Articulos, Categoria, Formatos, Formulas, Ingresos, Inventario, Kardex, Laboratorio, O. Compra, O. Produccion, Proveedor, Responsable, Salidas, Unidad, Ventas.
- [x] Diferencia esperada registrada: las URLs no son iguales porque la referencia usa rutas legacy `kamary.l105.com/...` y local usa rutas Laravel `/admin/...`; se valido paridad de modulos, no equivalencia exacta de URL.

## Etapas de desarrollo

### Etapa 1 - Administracion y almacenamiento base

- [x] Administracion / Gasto: conectado a pantalla y API de gastos.
- [x] Serv. Almacenamiento / Inventario: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / Clientes: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / O. Servicio: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / Und. de medida: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / Creacion del producto: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / Nota de entrada: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / Nota de salida: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / Kardex: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / Servicio General: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / Control de Facturacion: conectado a pantalla y API separada.
- [x] Serv. Almacenamiento / O. Servicio General: conectado a pantalla y API separada.

### Etapa 2 - Servicios y muestras

- [x] Servicios / Cliente: conectado a pantalla y API separada.
- [x] Muestras / Pedido: creado CRUD inicial con modelo, migracion, controlador, API y pantalla.

### Etapa 3 - Magistrales catalogos y compras

- [x] Magistrales / Articulos: alcance magistral separado y campos base agregados.
- [x] Magistrales / Categoria: CRUD inicial conectado con modelo, migracion, controlador, API y pantalla.
- [x] Magistrales / Formatos: CRUD inicial conectado con modelo, migracion, controlador, API y pantalla.
- [x] Magistrales / Formulas: CRUD inicial conectado con modelo, migracion, controlador, API, pantalla e historial.
- [x] Magistrales / Ingresos: CRUD inicial conectado con modelo, migracion, controlador, API y pantalla.
- [x] Magistrales / Laboratorio: conectado con endpoint magistral y permisos propios.
- [x] Magistrales / O. Compra: alcance magistral separado y comprador agregado.
- [x] Magistrales / Proveedor: alcance magistral separado y condicion de pago agregada.

### Etapa 4 - Magistrales produccion, almacen y ventas

- [x] Magistrales / Inventario: conectado con controlador/API propios y filtro de articulos magistrales.
- [x] Magistrales / Kardex: conectado con controlador/API propios y filtro de movimientos magistrales.
- [x] Magistrales / O. Produccion: CRUD inicial con modelo, migracion, controlador, API y pantalla.
- [x] Magistrales / Responsable: CRUD inicial con modelo, migracion, controlador, API y pantalla.
- [x] Magistrales / Salidas: CRUD inicial con modelo, migracion, controlador, API y pantalla.
- [x] Magistrales / Unidad: conectada con controlador/API propios y `module_scope = magistrales`.
- [x] Magistrales / Ventas: CRUD inicial con modelo, migracion, controlador, API y pantalla.

## Sistemas

- [x] Gestion de Usuarios aparece en el menu.
- [ ] Revisar paridad funcional con referencia.
  - Referencia: tabla con usuario, nombres, apellidos, email, telefono, perfil, tipo cuenta y estado.
  - Local: existe `/admin/users`; roles queda disponible por permiso pero no como entrada separada de referencia.

## Almacen

- [x] Articulos aparece en el orden de referencia.
  - Referencia: codigo, laboratorio, principio activo, descripcion, unidad y estado.
  - Local: existe `/admin/articles`.
  - [ ] Validar filtros por laboratorio, principio activo y codigo.
- [x] Inventario aparece en el orden de referencia.
  - Referencia: codigo, almacen, laboratorio, usuario registro, fecha registro y estado.
  - Local: existe `/admin/inventory`.
  - [ ] Validar columnas, documentos y estados.
- [x] Kardex aparece en el orden de referencia.
  - Referencia: empresa, sede, almacen, laboratorio, stock, lote, ubicacion, MT2/MT3, valor y total.
  - Local: existe `/admin/kardex`.
  - [ ] Validar filtros y reporte por articulo.
- [x] Laboratorios aparece en el orden de referencia.
  - Referencia: descripcion, codigo, estado y principio activo.
  - Local: existe `/admin/laboratories`.
  - [ ] Validar manejo de principio activo.
- [x] Lotes aparece en el orden de referencia.
  - Referencia: empresa, codigo de lote, lote, articulo, fecha vencimiento y estado.
  - Local: existe `/admin/batches`.
  - [ ] Validar vencimientos y relacion articulo/laboratorio.
- [x] Nota de Entrada aparece en el orden de referencia.
  - Referencia: empresa, proveedor, total, serie, secuencia, tipo documento, usuario, fecha y estado.
  - Local: existe `/admin/entry-note`.
  - [ ] Validar documentos, pagos y estados.
- [x] Nota de Salida aparece en el orden de referencia.
  - Referencia: empresa, motivo, fecha, usuario y estado.
  - Local: existe `/admin/exit-note`.
  - [ ] Validar motivos y aprobaciones.
- [x] Proveedores aparece en el orden de referencia.
  - Referencia: RUC, razon social, direccion, telefono, email, cuenta bancaria/CCI y estado.
  - Local: existe `/admin/suppliers`.
  - [ ] Validar datos bancarios y condiciones.
- [x] Und. de medida aparece en el orden de referencia.
  - Referencia: descripcion, nombre corto y estado.
  - Local: existe `/admin/units`.
  - [ ] Validar abreviaturas/nombre corto.

## Administracion

- [x] Cuentas por pagar aparece en el menu.
  - Referencia: estado pago, codigo, total, saldo a pagar, a cuenta, empresa, proveedor, usuario y fecha.
  - Local: existe `/admin/accounts-payable`.
  - [ ] Validar pagos parciales y estados pendiente/pagado.
- [x] Gasto aparece en el menu.
  - Referencia: motivo, descripcion, monto, archivo, fecha y empresa.
  - Local: `/admin/expenses` usa la pantalla `Admin/Transactions` y endpoints `/api/admin/transactions`.
  - [x] Implementar CRUD de gastos o conectar con modulo existente si aplica.
- [x] Resumen diario aparece en el menu.
  - Referencia: pedidos facturados, operaciones bancarias, gastos, imprimir, generar resumen y reporte.
  - Local: existe `/admin/daily-summary`.
  - [ ] Validar generacion de resumen e impresion.

## Comercial

- [x] Cliente aparece en el menu.
  - Referencia: plataforma, tipo documento, razon social, email, direccion, vencimiento contrato y red de distribucion.
  - Local: existe `/admin/clients`.
  - [ ] Validar red de distribucion y notificaciones.
- [x] Clientes Eventual aparece como entrada separada.
  - Referencia: cliente eventual separado del cliente regular.
  - Local: existe `/admin/eventual-clients`.
  - [ ] Confirmar que no se siga mezclando con Cliente regular en la UI.
- [x] Cuenta por Cobrar aparece en el menu.
  - Referencia: pedido, monto, tipo, banco, nro operacion, archivo, empresa, cliente, total, a cuenta, saldo, vencimiento y estado.
  - Local: existe `/admin/accounts-receivable`.
  - [ ] Validar pagos, archivos y saldos.
- [x] Pedido aparece en el menu.
  - Referencia: estado, comprobante, tipo documento, cliente, total, tipo pago, usuario, codigo y empresa.
  - Local: existe `/admin/commercial-orders`.
  - [ ] Validar estados, comprobantes, exportacion Excel y reporte.
- [x] Tarifario aparece en el menu.
  - Referencia: cliente, segmento/nodo, laboratorio, items tarifario/catalogo, margen, activacion/desactivacion.
  - Local: existe `/admin/pricing`.
  - [ ] Validar activacion, items y vigencias.

## Serv. Almacenamiento

- [x] El menu local ahora muestra las 11 entradas de referencia.
- [x] Inventario conectado. Ruta local `/admin/storage-inventory` usa `Admin\Storage\InventoryController` y `/api/admin/storage/inventory`.
  - [ ] Validar columnas exactas de referencia y filtros por almacen/usuario/fecha.
- [x] Clientes conectado. Ruta local `/admin/storage-clients` usa `Admin\Storage\ClientController` y `/api/admin/storage/clients`.
  - [ ] Validar contrato, red de distribucion, plataforma y datos propios de almacenamiento.
- [x] O. Servicio conectado. Ruta local `/admin/service-orders` usa `Admin\Storage\ServiceOrderController` y `/api/admin/storage/service-orders`.
  - [ ] Validar si el flujo local coincide con almacenamiento, no solo con servicios generales.
- [x] Und. de medida conectado. Ruta local `/admin/storage-units` usa `Admin\Storage\UnitController` y `/api/admin/storage/units`.
  - [ ] Validar abreviatura/descripcion contra referencia.
- [x] Creacion del producto conectado. Ruta local `/admin/storage-products` usa `Admin\Storage\ProductController` y `/api/admin/storage/articles`.
  - [ ] Validar que el formulario quede centrado en cliente, nombre articulo, unidad y estado.
- [x] Nota de entrada conectada. Ruta local `/admin/storage-entry-note` usa `Admin\Storage\EntryNoteController` y `/api/admin/storage/entry-notes`.
  - [ ] Validar campos cliente, almacen, documento, serie, secuencia y fecha ingreso.
- [x] Nota de salida conectada. Ruta local `/admin/storage-exit-note` usa `Admin\Storage\ExitNoteController` y `/api/admin/storage/exit-notes`.
  - [ ] Validar campos cliente, almacen, documento, serie, secuencia y fecha salida.
- [x] Kardex conectado. Ruta local `/admin/storage-kardex` usa `Admin\Storage\KardexController` y `/api/admin/storage/kardex`.
  - [ ] Validar inventario, lote, vencimiento, unidad, stock sistema, ubicacion y almacen.
- [x] Servicio General conectado. Ruta local `/admin/storage-general-service` usa `Admin\Storage\GeneralServiceController` y `/api/admin/storage/general-service`.
  - [ ] Validar catalogo propio de servicios generales de almacenamiento.
- [x] Control de Facturacion conectado. Ruta local `/admin/storage-billing-control` usa `Admin\Storage\BillingControlController` y `/api/admin/storage/billing-control`.
  - [ ] Validar estado facturacion, OS, comprobante, importe, moneda y fechas.
- [x] O. Servicio General conectado. Ruta local `/admin/storage-general-service-orders` usa `Admin\Storage\GeneralServiceOrderController` y `/api/admin/storage/general-service-orders`.
  - [ ] Validar flujo exacto de orden de servicio general.

Campos visibles en referencia para priorizar:

- Inventario: codigo, almacen, usuario, fecha, estado.
- Clientes: cliente tipo plataforma, direccion, email, contrato, red de distribucion.
- O. Servicio: empresa, cliente, tipo comprobante, moneda, fecha, usuario, estado.
- Producto: cliente, nombre articulo, unidad, estado.
- Notas: cliente, almacen, tipo documento, serie, secuencia, fecha ingreso/salida, estado.
- Kardex: inventario, lote, fecha vencimiento, unidad, stock sistema, ubicacion, almacen.
- Facturacion: estado facturacion, codigo, comprobante, OS, tipo, cliente, importe, moneda, fechas.

## Despacho

- [x] Actividad aparece en el menu.
  - Referencia: estado pedido, codigo, manifiesto, cliente, tipo, ubigeo, direccion, fecha traslado.
  - Local: existe `/admin/activity`.
  - [ ] Validar manifiesto, ubigeo y reporte.
- [x] Conductor aparece en el menu.
  - Referencia: documento, nombres completos, licencia y estado.
  - Local: existe `/admin/driver`.
  - [ ] Validar licencia y asignaciones.
- [x] Despacho aparece en el menu.
  - Referencia: estado, codigo, fecha entrega, turno, vehiculo, conductores, zona.
  - Local: existe `/admin/dispatch`.
  - [ ] Validar turnos, vehiculos, conductores y zonas.
- [x] Vehiculo / Zona aparece en el menu.
  - Referencia: placa, marca, modelo, color, peso neto/bruto.
  - Local: existe `/admin/vehicle-zone`.
  - [ ] Validar separacion vehiculos/zonas y pesos.

## Servicios

- [x] Cliente aparece en el menu.
  - Referencia: RUC, razon social, direccion fiscal, codigo corto, contrato, tarifario y notificaciones.
  - Local: `/admin/services-client` usa `Admin\ServiceClientController` y `/api/admin/services-client`.
  - [ ] Validar separacion real de clientes de servicios, contrato, tarifario y notificaciones.
- [x] Facturacion aparece en el menu.
  - Referencia: prefactura, factura, RUC, cliente, moneda, monto, IGV, orden servicio, contrato y fecha ejecucion.
  - Local: existe `/admin/services-billing`.
  - [ ] Validar prefacturacion y facturas por orden de servicio.
- [x] Orden de servicio aparece en el menu.
  - Referencia: ciclo facturacion, doc cliente, servicios, total prefacturas, total servicio, total facturado y contrato.
  - Local: existe `/admin/services-service-order`.
  - [ ] Validar ciclo de facturacion y contrato.
- [x] Servicios aparece en el menu.
  - Referencia: codigo, servicio, valores unitarios S/ y USD, categoria, subcategoria, tipo servicio.
  - Local: existe `/admin/services-services`.
  - [ ] Validar categorias, subcategorias y monedas.

## Muestras

- [x] Pedido aparece en el menu.
  - Referencia: estado pedido/email, guia remision, peso bruto total, nro pedido, canal, documento, cliente, pedido completo, fechas, supervisor y motivo anulacion.
  - Local: `/admin/sample-orders` usa `Admin\SampleOrderController`, `/api/admin/sample-orders` y tabla `sample_orders`.
  - [x] Implementar CRUD inicial de pedido de muestras.
  - [x] Ejecutar migracion `2026_05_09_000001_create_sample_orders_table.php`.
  - [ ] Validar guia de remision, flujo email, pedido completo, fechas, supervisor y anulacion contra referencia.

## Magistrales

Magistrales debe desarrollarse como sistema aparte. En referencia no es una copia de Almacen: usa rutas de produccion, columnas distintas y flujos propios de farmacia/produccion.

- [x] El menu local ahora muestra las 15 entradas de referencia.
- [x] Definir modelos/tablas propios o alcance de datos propio para Magistrales.
- [x] Definir permisos granulares por modulo magistral.
- [x] Crear rutas, controladores y endpoints API separados para Articulos, Inventario, Kardex, O. Compra y Proveedor magistrales.
- [x] Crear CRUD inicial separado para Categoria, Formatos, Formulas, Ingresos y Laboratorio magistrales.
- [x] Agregar `module_scope` y campos propios iniciales para Articulos, Proveedor y O. Compra magistrales.
- [x] Evitar reutilizar modelos/tablas de Almacen normal cuando el flujo magistral tenga campos o reglas diferentes.
- [x] Agregar datos iniciales idempotentes para produccion sin informacion sensible.
  - `MagistralesProductionSeeder` crea 10 registros por modulo operativo y se ejecuta automaticamente desde Docker despues de migrar.

### QA funcional Magistrales 2026-05-09

Referencia autenticada en `https://kamary.l105.com/inicio/ingresar` con el usuario de validacion. Se revisaron los 15 submodulos de Magistrales desde la web de referencia y se contrastaron con las pantallas locales.

### Recomparacion controlada Magistrales 2026-05-10

Metodologia: revision manual asistida con navegador, modulo por modulo, extrayendo solo encabezados, labels y botones visibles. No se registraron filas de negocio como insumo de trabajo.

- [x] Articulos: referencia confirma grilla con Acciones, codigo, tipo, presentacion, via adm., articulo, laboratorio, afecto IGV, F. venc., lote y estado. Local ajustado con Acciones al inicio, accion Mostrar/Editar, Estado visible en modal y Unidades por caja.
- [x] Categoria: referencia confirma grilla principal y administracion de subcategorias. Local ajustado con Acciones al inicio, Estado visible en modal, nueva tabla `magistral_subcategories`, endpoints y UI de subcategorias con conteo de articulos por subcategoria.
- [x] Formatos: referencia confirma Acciones, descripcion, cantidad y estado; modal con descripcion, cantidad y estado. Local ajustado con Acciones al inicio y Estado visible en modal.
- [x] Formulas: referencia confirma Acciones al inicio, botones Detalle formula e Historial de actualizaciones, tabla de insumos y campos SOP de preparacion/conservacion/uso. Local ajustado con Acciones/Historial, tabla `magistral_formula_items`, campos SOP y snapshot de historial.

- [x] Articulos: referencia usa datos maestros propios de formulas magistrales: codigo, tipo, presentacion, via adm., articulo, laboratorio, IGV, vencimiento, lote y estado; modal con composicion, categoria, sub categoria, R. sanitario, stock min/max, moneda, precios y equivalencias.
  - [x] Local actualizado: tabla visible alineada al orden de referencia, modal con campos operativos, migracion aplicada y prueba de guardado/limpieza por controlador OK.
- [x] Ingresos: referencia tiene cabecera documental completa, guia de remision y detalle de articulos con lote/vencimiento/precios.
  - [x] Local actualizado: cabecera extendida, guia de remision, detalle de articulos, totales subtotal/IGV/total, modelo de items y prueba de guardado/limpieza por controlador OK.
- [x] Inventario: referencia registra conteo fisico por almacen con stock sistema vs stock real.
  - [x] Local actualizado: tabla de conteos propia, detalle por articulo/lote/vencimiento, stock sistema, stock real y diferencia.
- [x] Kardex: referencia muestra valorizacion mensual por articulo con stock, unidad, min/max, moneda, costo unitario y total, mas detalle de transacciones con saldo.
  - [x] Local actualizado: vista de valorizacion magistral con stock base desde ingresos, salidas, ventas y produccion finalizada.
  - [x] Local actualizado: modal de transacciones con ingreso/salida/venta/produccion/consumo de produccion en orden cronologico y saldo acumulado.
- [x] O. Produccion: referencia registra fecha entrega, almacen destino, responsable, formato, cantidad tanda y detalle por formula.
  - [x] Local actualizado: cabecera extendida, almacen destino, formato, cantidad tanda y detalle de articulos/formula.
- [x] Salidas: referencia registra motivo, observacion y detalle de articulos con lote/vencimiento/stock/cantidad.
  - [x] Local actualizado: detalle de articulos, lote/vencimiento, stock, unidad, cantidad y total.
- [x] Ventas: referencia trabaja como farmacia con paciente, doctor, politica descuento, alergia/intolerancia, detalle de articulos, cotizacion/venta e impuestos.
  - [x] Local actualizado: paciente/doctor, politicas, flags clinicos, detalle, totales y modo cotizacion/venta.
- [x] QA 2026-05-09: migraciones aplicadas, `npm run build` OK, prueba backend temporal OK para inventario/produccion/salida/venta/kardex con limpieza de datos QA, y verificacion local en navegador OK para las 5 pantallas.

Checklist por modulo:

- [x] Articulos magistrales.
  - Referencia: codigo, tipo, presentacion, via adm., articulo, laboratorio, afecto IGV, fecha vencimiento, lote y estado.
  - Local: `/admin/magistrales/articles` usa controlador y API propios bajo `Admin\Magistrales`, `module_scope = magistrales`, columnas visibles alineadas a referencia y campos operativos de articulo magistral.
  - [x] Agregar composicion, sub categoria, R. sanitario, stock minimo/maximo, moneda, stock con vencimiento, stock con lote, precio costo, precio venta y equivalencias.
  - [x] Ajustar unicidad de codigo por alcance (`module_scope + code`) para separar Almacen normal de Magistrales.
  - [ ] Validar si lote/vencimiento debe vivir solo en movimientos/lotes o tambien como dato maestro.
- [x] Categoria magistral.
  - Referencia: descripcion, codigo, almacen, material para venta y estado.
  - Local: `/admin/magistrales-category` usa `Admin\Magistrales\CategoryController`, `/api/admin/magistrales/categories` y tabla `magistral_categories`.
  - [x] Columnas visibles ajustadas a referencia: ID, descripcion, codigo, almacen, material para venta y estado.
  - [x] Subcategorias agregadas segun referencia: descripcion, articulos con esta subcategoria, estado y acciones.
  - [ ] Validar almacen y material para venta contra datos reales de produccion.
- [x] Formatos.
  - Referencia: descripcion, cantidad y estado.
  - Local: `/admin/magistrales-formats` usa `Admin\Magistrales\FormatController`, `/api/admin/magistrales/formats` y tabla `magistral_formats`.
  - [x] Tabla local ya coincide en campos principales: descripcion, cantidad y estado.
  - [x] Modal local ajustado con estado visible.
  - [ ] Validar reglas de cantidad y formatos usados por produccion.
- [x] Formulas.
  - Referencia: receta por articulo, fecha ultima edicion, usuario ultima edicion, detalle formula e historial.
  - Local: `/admin/magistrales-formulas` usa `Admin\Magistrales\FormulaController`, `/api/admin/magistrales/formulas`, tabla `magistral_formulas` e historial en `magistral_formula_histories`.
  - [x] Columnas visibles ajustadas a referencia: codigo, articulo, fecha ultima edicion y usuario ultima edicion; detalle queda en modal/historial.
  - [x] Agregar detalle estructurado de insumos y campos SOP visibles en referencia: condiciones especiales, equipos, instrucciones, metodo, conservacion, estabilidad, uso y otros.
  - [x] Agregar items de receta `magistral_formula_items` con unidades totales, codigo, articulo, cantidad, presentacion, cantidad total, precio y subtotal.
  - [x] Versionado local ampliado con motivo de cambio y snapshot de insumos/campos SOP.
  - [ ] Validar receta estructurada por insumos contra datos reales de produccion y reglas finales de versionado.
- [x] Ingresos.
  - Referencia: codigo, comprobante/guia, empresa, almacen, proveedor, usuario, fecha y estado.
  - Local: `/admin/magistrales-incomes` usa `Admin\Magistrales\IncomeController`, `/api/admin/magistrales/incomes` y tabla `magistral_incomes`.
  - [x] Agregar campos de orden de compra, forma de pago, archivo, procedencia, moneda, afecto IGV y guia de remision.
  - [x] Agregar detalle de articulos con cantidad, presentacion, vencimiento, lote, precio sin/con IGV y subtotal.
  - [x] Prueba de guardado por controlador OK: cabecera + 1 item + calculo subtotal/IGV/total + limpieza de datos QA.
  - [x] Conectar afectacion real de stock base al confirmar ingreso.
  - [x] Stock base ya permite consulta por lote/vencimiento para consumo estrictamente loteado en salidas e inventario.
- [x] Inventario magistral.
  - Referencia: codigo, almacen, usuario, fecha y estado.
  - Local: `/admin/magistrales/inventory` usa `Admin\Magistrales\InventoryController`, `/api/admin/magistrales/inventory` y filtra articulos con `module_scope = magistrales`.
  - [x] Tabla propia `magistral_inventory_counts` con items `magistral_inventory_count_items`.
  - [x] Modal local registra almacen, fecha, observacion, articulo, lote, vencimiento, stock sistema, stock real y diferencia.
  - [x] Stock sistema se recalcula en servidor por articulo/almacen/lote/vencimiento al guardar, evitando diferencias basadas en datos editados manualmente en el navegador.
  - [x] UI consulta `/api/admin/magistrales/inventory/stock` al cambiar articulo, almacen, lote o vencimiento y deja `Stock sistema` como valor calculado.
  - [ ] Validar auditoria avanzada de ajustes de stock fisico contra reglas finales de produccion.
- [x] Kardex magistral.
  - Referencia: codigo, nombre, stock, unidad, min/max, moneda, costo unitario, total costo y almacen.
  - Local: `/admin/magistrales/kardex` usa `Admin\Magistrales\KardexController`, `/api/admin/magistrales/kardex` y calcula valorizacion de articulos `module_scope = magistrales`.
  - [x] Stock base considera ingresos, salidas, ventas no cotizadas, produccion finalizada y consumo de insumos de produccion finalizada.
  - [x] Costo unitario usa promedio de ingresos y fallback al costo maestro del articulo.
  - [x] Detalle de transacciones agregado con fecha, documento, operacion, lote, vencimiento, entrada, salida, saldo y unidad.
  - [ ] Validar costo final con reglas contables reales si se requiere PEPS/lotes.
- [x] Laboratorio magistral.
  - Referencia: descripcion, codigo y estado.
  - Local: `/admin/magistrales-laboratory` usa `Admin\Magistrales\LaboratoryController` y `/api/admin/magistrales/laboratories`.
  - Falta: confirmar si debe compartir catalogo con Almacen o tener tabla propia.
- [x] O. Compra magistral.
  - Referencia: estado, codigo, comprador, proveedor, moneda, total, usuario y fecha.
  - Local: `/admin/magistrales/purchase-orders` usa controlador y API propios bajo `Admin\Magistrales`, `module_scope = magistrales` y campo `buyer_name`.
  - Falta: validar aprobaciones, recepcion, pagos y flujo de compra de produccion.
- [x] O. Produccion.
  - Referencia: codigo, estado, responsable, destino, producto y fecha registro.
  - Local: `/admin/magistrales-production-order` y `/admin/magistrales/production-orders` usan `Admin\Magistrales\ProductionOrderController`, `/api/admin/magistrales/production-orders` y tabla `magistral_production_orders`.
  - [x] Cabecera extendida con fecha entrega, almacen destino, formato y cantidad tanda.
  - [x] Detalle propio `magistral_production_order_items` con articulo, vencimiento, cantidad, formula y total.
  - [x] Produccion finalizada suma producto terminado y descuenta insumos del detalle en el stock base/Kardex.
  - [x] Bloquea finalizacion cuando los insumos superan el stock disponible, permitiendo reeditar el documento actual sin falso negativo.
  - [ ] Validar merma, aprobaciones y cierre de produccion si negocio lo exige.
- [x] Proveedor magistral.
  - Referencia: RUC, razon social, direccion, condicion de pago, telefono, email y estado.
  - Local: `/admin/magistrales/suppliers` usa controlador y API propios bajo `Admin\Magistrales`, `module_scope = magistrales` y campo `payment_condition`.
  - Falta: validar si comparte padron SUNAT con proveedores generales o si debe permitir RUC duplicado por alcance.
- [x] Responsable.
  - Referencia: documento, nombre y estado.
  - Local: `/admin/magistrales-responsible` y `/admin/magistrales/responsibles` usan `Admin\Magistrales\ResponsibleController`, `/api/admin/magistrales/responsibles` y tabla `magistral_responsibles`.
  - Falta: validar documento unico, permisos y si debe relacionarse con usuarios del sistema.
- [x] Salidas.
  - Referencia: codigo, almacen origen, destino, motivo, observacion, usuario, fecha y estado.
  - Local: `/admin/magistrales-outputs` y `/admin/magistrales/outputs` usan `Admin\Magistrales\OutputController`, `/api/admin/magistrales/outputs` y tabla `magistral_outputs`.
  - [x] Detalle propio `magistral_output_items` con articulo, lote, vencimiento, stock, unidad, cantidad y total.
  - [x] Descuenta del stock base usado por Kardex.
  - [x] Bloquea guardados que exceden el stock disponible, permitiendo reeditar el documento actual sin falso negativo.
  - [x] Bloquea guardados que exceden el stock disponible del lote/vencimiento indicado, ademas del total global del articulo.
  - [ ] Validar motivos y aprobaciones si negocio lo exige.
- [x] Unidad.
  - Referencia: abreviatura y descripcion.
  - Local: `/admin/magistrales-unit` y `/admin/magistrales/units` usan `Admin\Magistrales\UnitController`, `/api/admin/magistrales/units` y `units.module_scope = magistrales`.
  - [x] Unidades iniciales agregadas por `MagistralesProductionSeeder` con abreviaturas propias `MAG*` para evitar choque con Almacen.
- [x] Ventas.
  - Referencia: farmacia, empresa, codigo, estado pago, documento, paciente, total, usuario y fecha.
  - Local: `/admin/magistrales-sales` y `/admin/magistrales/sales` usan `Admin\Magistrales\SaleController`, `/api/admin/magistrales/sales` y tabla `magistral_sales`.
  - [x] Cabecera extendida con doctor, politica descuento, tipo venta, alergia, intolerancia, impuestos y cotizacion.
  - [x] Detalle propio `magistral_sale_items` con almacen, articulo, stock, cantidad, precio, descuento y subtotal.
  - [x] Ventas no cotizadas descuentan del stock base usado por Kardex.
  - [x] Cotizaciones no descuentan stock y ventas reales bloquean stock insuficiente.
  - [ ] Validar comprobante fiscal y cobranza si negocio lo exige.

## Correcciones tecnicas necesarias

- [x] Crear controladores y pantallas reales para los modulos `ComingSoon`.
- [x] Separar rutas, modelos y permisos de Magistrales cuando el modulo tenga reglas diferentes.
- [x] Revisar `permissionScope.js`; ahora detecta rutas con `/admin/magistrales/` y rutas planas `/admin/magistrales-*`.
- [x] Ejecutar migracion `2026_05_09_000002_create_magistrales_stage3_tables.php`.
- [x] Ejecutar migracion `2026_05_09_000003_add_magistrales_scope_fields.php`.
- [x] Ejecutar migracion `2026_05_09_000004_create_magistrales_stage4_tables.php`.
- [x] Ejecutar migracion `2026_05_09_000007_expand_magistrales_operational_flows.php`.
- [x] Ejecutar migracion `2026_05_10_000002_expand_magistral_formulas_structured_detail.php`.
- [x] Compilar assets de produccion con `npm run build`.
- [x] QA local de pantallas Magistrales: Inventario, Kardex, O. Produccion, Salidas y Ventas cargan con rutas y titulos correctos.
- [x] Revisar seeds/migraciones de permisos para que todos los permisos del menu existan en ambientes nuevos.
  - `ModulePermissionsSeeder` y `2026_05_10_000003_sync_module_permissions_for_production.php` sincronizan permisos y asignacion Admin/Root.
- [x] Agregar pruebas de permisos de menu para Magistrales.
  - `MagistralesModuleReadinessTest` valida permisos, presencia en `Menu.jsx`/`Roles.jsx`, orden visible y rutas.
- [x] Agregar pruebas/QA visual para confirmar que el orden del menu no cambie.
  - Cubierto como prueba estatica de orden de rutas visibles en `Menu.jsx`; queda pendiente solo QA visual manual post-deploy si se requiere.
- [x] Agregar seeders de datos iniciales Magistrales para ambientes vacios.
  - `MagistralesProductionSeeder` cubre catalogos y flujos con 10 registros por modulo.
- [x] Agregar pruebas de seeders Magistrales.
  - `MagistralesProductionSeederTest` valida poblado, stock/kardex basico e idempotencia.
