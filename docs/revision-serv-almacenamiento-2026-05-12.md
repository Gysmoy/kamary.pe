# Revision funcional Serv. Almacenamiento vs referencia

Fecha: 2026-05-12

Alcance: revision modulo a modulo de `Serv. Almacenamiento` usando solo artefactos locales ya extraidos de la referencia y codigo local. No se volvio a navegar la web remota para esta revision.

Fuentes locales usadas:

- `output/playwright/storage-forms.jsonl`: campos, tablas, botones y paginado extraidos previamente de la referencia.
- `output/video_review/transcript.txt`: observaciones del cliente en el video.
- Codigo local en `routes/web.php`, `routes/api.php`, `app/Http/Controllers/Admin/Storage/*` y `resources/js/Admin/*`.

## Conclusion corta

El menu y las rutas existen, pero no hay paridad funcional. En local, varios modulos de almacenamiento son envoltorios de modulos genericos de almacen/servicios. Para produccion, el mayor riesgo esta en `O. Servicio`, productos por cliente, notas de entrada/salida, kardex por cliente/ubicacion y control de facturacion.

Estado recomendado: no subir a produccion como cierre funcional de almacenamiento.

## Hallazgos transversales

- La referencia usa paginado DataTables con selector `Elementos` por modulo: varios usan `5/10/15/20`, y otros `20/30/40/50`. Local usa `dxDataGrid`, por lo que visualmente no coincide el paginado legacy.
- La referencia conecta almacenamiento por `cliente -> orden de servicio -> almacen -> ubicacion -> productos/lotes -> notas -> kardex -> prefactura/factura`.
- Local tiene endpoints separados bajo `/api/admin/storage/*`, pero muchos controladores solo cambian titulo/permiso y heredan logica generica.
- Segun el video, el cliente espera que los campos que no aplican a almacenamiento se oculten. En especial en clientes de almacenamiento no deberian aparecer campos comerciales que no corresponden.

## Comparacion modulo a modulo

### 1. Inventario

Referencia:

- Grilla: `ACCIONES`, `CODIGO`, `ALMACEN`, `USUARIO REGISTRO`, `FECHA REGISTRO`, `ESTADO`.
- Paginado: `5/10/15/20`.
- Formulario: `Almacen` requerido, `Ubicacion`, `Cliente`.
- Detalle del inventario: `ID`, `LOTE`, `F. VENCIMIENTO`, `ARTICULO`, `CLIENTE`, `U. MEDIDA`, `UBICACION`, `TEMPERATURA`, `STOCK SISTEMA`, `STOCK REAL`.

Local:

- `Admin\Storage\InventoryController` extiende el inventario generico.
- La pantalla local lista articulo/laboratorio/principio activo/unidad/entradas/salidas/stock.

Brecha:

- Falta inventario fisico por almacen, ubicacion y cliente.
- Falta temperatura por ubicacion.
- Falta stock real vs stock sistema en el conteo.
- Falta que el inventario salga de la relacion cliente + producto + lote + ubicacion.

Estado: falta funcionalidad critica.

### 2. Clientes

Referencia:

- Grilla: `PLATAFORMA`, `ID`, `TIPO DOCUMENTO`, `N DOCUMENTO`, `RAZON SOCIAL`, `EMAIL`, `DIRECCION`, `DIAS VCTO. CONTRATO`, `ESTADO`.
- Paginado: `5/10/15/20`.
- Filtro: texto por razon social o documento.
- Formulario: tipo documento, documento, razon social, codigo corto, direccion, correo, celular, estado, tarifario por cliente.
- Acciones por fila: contrato, ver contratos, mantenimiento de usuarios, convertir a plataforma, notificaciones por email, red de distribucion.

Local:

- `Admin\Storage\ClientController` fuerza `client_kind=regular` y `has_storage_service=true`.
- La pantalla local sigue siendo el cliente generico con campos comerciales adicionales.

Brecha:

- Falta contrato de almacenamiento como flujo propio.
- Falta vista/gestion de contratos por cliente.
- Falta mantenimiento de usuarios del cliente.
- Falta notificaciones por email en contexto almacenamiento.
- Falta red de distribucion conectada al cliente de almacenamiento.
- Falta limpiar campos no aplicables, segun observacion del cliente.

Estado: parcial, pero no equivalente.

### 3. O. Servicio

Referencia:

- Grilla: `ACCIONES`, `ESTADO`, `CODIGO`, `EMPRESA`, `CLIENTE`, `TIPO COMPROBANTE`, `MONEDA`, `FECHA REGISTRO`, `USUARIO REGISTRO`.
- Paginado: `20/30/40/50`.
- Filtros: empresa, cliente, fecha inicio, fecha fin.
- Formulario esperado: empresa, cliente, tipo documento, moneda, tipo de servicio.
- Bloques por almacen: `Almacen Km 1`, `Almacen Km 2`, `Almacen Km 3`, `Almacen Km 4`, `Oficina Administrativa`, `Almacen KM 5`.
- Por almacen/ubicacion: ubicacion, fecha inicio, numero de meses, fecha fin, cantidad m3, tarifa, importe mensual.

Local:

- `Admin\Storage\ServiceOrderController` extiende la orden de servicio generica.
- Formulario local: empresa, sede, cliente, fecha, programada, primera cuota, ciclo, comprobante, moneda, pago, cuotas, estado, facturacion, impuesto y servicios.

Brecha:

- Falta el concepto de contrato de almacenamiento por ubicacion.
- Falta seleccion de almacenes y ubicaciones.
- Falta bloqueo/disponibilidad de ubicacion asignada a un cliente.
- Falta m3, tarifa mensual, importe mensual y numero de meses.
- Falta generacion de calendario/prefacturacion automatica mensual desde la orden.
- Falta tipo de servicio de almacenamiento/adicional.

Estado: no coincide; prioridad maxima.

### 4. Und. de medida

Referencia:

- Grilla: `ID`, `DESCRIPCION`, `ESTADO`.
- Paginado: `20/30/40/50`.
- Formulario: descripcion, estado.

Local:

- `Admin\Storage\UnitController` extiende unidades genericas.
- Formulario local: nombre y simbolo.

Brecha:

- Diferencia menor: referencia maneja descripcion/estado, local maneja nombre/simbolo/estado.
- Revisar si debe mantener simbolo o adaptarse al legacy.

Estado: parcial, baja complejidad.

### 5. Creacion del producto

Referencia:

- Grilla: `CODIGO`, `CLIENTE`, `NOMBRE ARTICULO`, `UNIDAD`, `ESTADO`.
- Paginado: `20/30/40/50`.
- Filtro por cliente.
- Formulario: cliente requerido, codigo articulo, nombre, unidad, estado, observaciones.
- Detalle: `LOTE / SERIE`, `FECHA VENCIMIENTO`, `CONDICION ALMACENAMIENTO`, `FABRICANTE`, `ESTADO`.

Local:

- `Admin\Storage\ProductController` extiende articulos genericos.
- Pantalla local esta centrada en articulo generico: laboratorio, principio activo, unidad, precios, stock, lote default, etc.

Brecha:

- Falta producto por cliente.
- Falta lote/serie como subdetalle propio del producto de cliente.
- Falta condicion de almacenamiento y fabricante.
- Falta que las notas de entrada/salida solo inserten productos del cliente seleccionado.

Estado: falta funcionalidad critica.

### 6. Nota de entrada

Referencia:

- Grilla: `CODIGO`, `CLIENTE`, `ALMACEN`, `TIPO DE DOCUMENTO`, `SERIE`, `SECUENCIA`, `FECHA DE INGRESO`, usuario, fecha registro, estado.
- Paginado: `5/10/15/20`.
- Formulario: cliente, proveedor/distribuidor, almacen, fecha ingreso, tipo documento, serie, secuencia, fecha documento, invoice, invoice serie, invoice secuencia, invoice fecha, DUA, agencia transporte, chofer, brevete, placa, observaciones.
- Detalle: lote, vencimiento, articulo, unidad, stock, fabricante, condicion almacenamiento, ubicacion, cantidad solicitada, cantidad recibida.
- Acciones: aprobar/anular, editar, evidencias, PDF, acta.

Local:

- `Admin\Storage\EntryNoteController` extiende nota de entrada generica.
- Formulario local usa empresa, sede, almacen, proveedor, tipo documento, serie, secuencia, archivo, moneda, observaciones, guia de remision y lineas por lote/articulo.

Brecha:

- Falta cliente como eje principal de la nota.
- Falta proveedor/distribuidor como texto de referencia.
- Falta fecha ingreso y fecha documento obligatorias con flujo legacy.
- Falta invoice, DUA, agencia transporte, chofer, brevete y placa.
- Falta detalle con fabricante, condicion almacenamiento, cantidad solicitada y recibida.
- Falta que el detalle filtre productos por cliente.

Estado: parcial, requiere ajuste fuerte.

### 7. Nota de salida

Referencia:

- Grilla: `CODIGO`, `CLIENTE`, `ALMACEN ORIGEN`, `DESTINO`, `MOTIVO`, `TIPO DE DOCUMENTO`, `SERIE`, `SECUENCIA`, `FECHA SALIDA`, usuario, fecha registro, estado.
- Paginado: `5/10/15/20`.
- Formulario: cliente, almacen, fecha salida, motivo, tipo documento, serie, secuencia, fecha documento, observaciones.
- Detalle: lote, registro sanitario, vencimiento, articulo, unidad, stock, ubicacion, ubicacion destino, cantidad.
- Acciones: editar, evidencias, PDF.

Local:

- `Admin\Storage\ExitNoteController` extiende nota de salida generica.
- Formulario local usa empresa, sede, almacen, cliente como texto libre, motivos manuales, observaciones y lineas por lote.

Brecha:

- Cliente debe ser seleccion del maestro de clientes de almacenamiento, no texto libre.
- Falta tipo documento, serie, secuencia y fecha documento.
- Falta destino estructurado.
- Falta detalle con registro sanitario y ubicacion destino ligada a inventario.
- Falta filtro de lotes/productos por cliente.

Estado: parcial, requiere ajuste fuerte.

### 8. Kardex

Referencia:

- Grilla: `ACCIONES`, `INVENTARIO`, `LOTE`, `F.V.`, `U. MEDIDA`, `STOCK SISTEMA`, `UBICACION`, `ALMACEN`.
- Paginado: `5/10/15/20`.
- Filtros: cliente, almacen, stock.
- Acciones: buscar articulos, reporte para inventario.

Local:

- `Admin\Storage\KardexController` extiende kardex generico.
- Kardex local muestra articulo, stock, costos, movimientos, empresa, sede, lote, ubicacion.

Brecha:

- Falta kardex por cliente como primer filtro.
- Falta vista centrada en inventario/lote/ubicacion/almacen.
- Falta reporte de inventario equivalente.
- Falta conectar movimientos de almacenamiento con notas por cliente.

Estado: parcial, no equivalente.

### 9. Servicio General

Referencia:

- Grilla: `NOMBRE`, `DESCRIPCION`, `TARIFA`, usuario registro, fecha registro.
- Paginado: `5/10/15/20`.
- Formulario: nombre, descripcion, tarifa, estado.

Local:

- `Admin\Storage\GeneralServiceController` ya separa `serviceScope=storage_general`.
- Local aun conserva campos extra del catalogo generico: codigo, categoria, subcategoria, tipo, unidad, PEN/USD.

Brecha:

- Esta cerca, pero el formulario debe simplificarse a nombre, descripcion, tarifa y estado.
- Revisar si tarifa debe ser unica o por moneda.

Estado: parcial, baja/medio complejidad.

### 10. Control de Facturacion

Referencia:

- Grilla: `E. FACTURACION`, `CODIGO`, `COMPROBANTE`, `OS`, `TIPO`, `CLIENTE`, `IMPORTE`, `TIPO COMPROBANTE`, `MONEDA`, `F. FACTURACION`, `F. REGISTRO`.
- Paginado: `20/30/40/50`.
- Filtros: empresa, cliente, fecha inicio, fecha fin.
- Pantallas: prefacturas, facturas emitidas, facturas anuladas, notas de credito.
- Facturar en bloque: cliente, tipo documento, moneda, seleccionar todos, lista de pedidos/prefacturas.

Local:

- `Admin\Storage\BillingControlController` extiende comprobantes genericos.
- Local tiene emision, anulacion, nota de credito, descarga PDF/XML/CDR y payload de conector.

Brecha:

- Falta flujo de prefacturas de almacenamiento en bloque.
- Falta listar OS/tipo/cliente/importe con el mismo criterio de la referencia.
- Falta origen automatico desde cuotas mensuales de `O. Servicio`.
- Falta separacion visual de prefacturas, emitidas, anuladas y notas de credito como tabs legacy.

Estado: parcial, depende de rehacer `O. Servicio`.

### 11. O. Servicio General

Referencia:

- Grilla: `ESTADO`, `CODIGO`, `EMPRESA`, `CLIENTE`, `TIPO COMPROBANTE`, `MONEDA`, `FECHA REGISTRO`, `USUARIO REGISTRO`.
- Paginado: `5/10/15/20`.
- Formulario: empresa, cliente, tipo documento, moneda, total.
- Detalle: servicio, tarifa, cantidad, total.

Local:

- `Admin\Storage\GeneralServiceOrderController` ya separa `order_type=storage_general` y prefijo `OSG`.
- Formulario local de orden de servicio generica tiene servicios, cantidad, precio unitario, total.

Brecha:

- Esta es la pantalla mas cercana.
- Falta validar que solo use servicios de `storage_general`.
- Falta ajustar columnas/estados y flujo de aprobacion segun referencia.

Estado: parcial cercano.

## Conexiones funcionales que faltan

- `Clientes` debe alimentar `O. Servicio`, `Productos`, `Notas`, `Kardex` y `Facturacion`.
- `O. Servicio` debe reservar/asignar ubicaciones y generar cuotas/prefacturas.
- `Productos` deben depender del cliente y usarse en notas de entrada/salida.
- `Nota de entrada` debe crear stock por cliente, lote, ubicacion y condicion.
- `Nota de salida` debe descontar stock por cliente, lote y ubicacion.
- `Kardex` debe leer movimientos generados por notas de entrada/salida.
- `Control de Facturacion` debe facturar prefacturas generadas por OS y OSG.

## Prioridad recomendada

1. Rehacer `O. Servicio` de almacenamiento con contrato, almacenes, ubicaciones, m3, tarifa e importe mensual.
2. Crear modelo/relacion de ubicaciones asignadas a cliente y disponibilidad por almacen.
3. Ajustar clientes de almacenamiento: contrato, usuarios, notificaciones, red de distribucion y limpieza de campos.
4. Separar productos de almacenamiento por cliente y agregar lote/serie, vencimiento, condicion y fabricante.
5. Adaptar nota de entrada/salida al flujo de cliente + producto + ubicacion.
6. Recalcular kardex por cliente/ubicacion/lote.
7. Conectar control de facturacion con prefacturas generadas por OS/OSG.
8. Ajustar detalles visuales de grilla, paginado y botones para paridad con referencia.

## Observaciones del video fuera de almacenamiento

- Orden de compra: el cliente espera importar/leer ordenes de compra con muchos items y formatos variables, y usarlas como base para compras/recepcion.
- Muestras: falta completar tracking y flujo de pedido de muestras.
- Despacho: faltan estados/tracking y fechas operativas conectadas al pedido.
- Integraciones: se menciono Multivende/VTEX para recepcion de pedidos/lineas y envio/lectura de stock.

Estas partes deben revisarse despues del cierre de almacenamiento, porque el video las menciona como brechas adicionales.
