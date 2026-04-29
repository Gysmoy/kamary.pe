# Contexto de Transferencia Privado

Fecha: 2026-04-29
Proyecto: `c:\xampp\htdocs\kamary.pe`

## Importante

- Este archivo es privado.
- Contiene credenciales, accesos y tokens de trabajo.
- No debe publicarse ni subirse a un repositorio remoto sin limpieza previa.

## 1. Objetivo real del proyecto

Este proyecto local busca replicar funcionalmente el sistema productivo:

- `https://kamary.l105.com/`
- login de referencia: `https://kamary.l105.com/inicio/ingresar`

La meta no es copiar solo pantallas. La meta es reconstruir la logica operacional completa en nuestra propia base de datos:

- compras
- comercial
- facturacion
- servicios
- despacho
- reportes

La regla cerrada de arquitectura es esta:

- la fuente de verdad es nuestra BD local
- el facturador externo solo sera un servicio agregado
- no se deben romper los modulos existentes
- lo nuevo se construye de forma aditiva, alrededor de la base ya existente

## 2. Accesos y credenciales de trabajo

### 2.1 Web de referencia en produccion

Uso autorizado solo en modo lectura. No tocar datos.

- URL login: `https://kamary.l105.com/inicio/ingresar`
- usuario: `jcarrillo`
- clave: `JMCG2025`

Notas:

- ya se ingreso antes en modo lectura
- no se ejecutaron altas, ediciones ni eliminaciones
- se revisaron modulos y pantallas solo para comparar flujos

### 2.2 Login local del proyecto

El login local autentica por `username`, no por email.

Usuarios verificados en seeders/BD:

- usuario: `kamary`
- clave: `4ccessme`

- usuario: `xplain`
- clave: `4ccessme`

### 2.3 API externa de personas

Se dejo configurada para consultas DNI/RUC.

- `DEVEX_PEOPLE_API_BASE_URL=https://devex.pe/client-api/people`
- `DEVEX_PEOPLE_API_URL=https://devex.pe/client-api/people/ruc`
- `DEVEX_PEOPLE_API_TOKEN=dvx_proj_cb5ubgRmCIS8jgw7ar5rDD6Zxh7k0bXn2SOL3M3P3GqNdyTe`

Se valido por `curl` el DNI `71895392` y respondio `200 OK`.

## 3. Estado general del entorno local

### 3.1 Ajuste local con XAMPP

Se trabajo el proyecto para entorno local XAMPP.

Puntos importantes:

- `APP_ENV=local`
- `APP_PROTOCOL=http`
- `APP_DOMAIN=localhost`
- `DB_HOST=127.0.0.1`
- `DB_DATABASE=kamary_db`
- `DB_USERNAME=root`
- `DB_PASSWORD=`

### 3.2 URLs de acceso local

Hay dos formas practicas de entrar:

1. `http://localhost:8000/login`
2. `http://localhost/kamary.pe/public/login`

Nota importante:

- `http://localhost/kamary.pe/...` todavia no esta fino sin `/public`
- hay un problema de rewrite/base path en XAMPP

## 4. Documentos ya creados dentro del proyecto

Leer primero estos dos:

- [plan-operativo-modulos-comercial-facturacion-servicios.md](C:/xampp/htdocs/kamary.pe/docs/plan-operativo-modulos-comercial-facturacion-servicios.md)
- [revision-comparativa-modulos-kamary-2026-04-28.md](C:/xampp/htdocs/kamary.pe/docs/revision-comparativa-modulos-kamary-2026-04-28.md)

Este archivo resume el contexto conversacional y operativo completo para arrancar otro chat sin perder hilo.

## 5. Decision tecnica ya cerrada

Esto no se debe reabrir sin motivo fuerte:

- no rehacer agresivamente `suppliers`, `clients`, `entry_notes`, `orders`
- no romper CRUDs existentes
- construir modulos nuevos donde falte logica nueva
- integrar con inventario, kardex, lotes y cuentas por cobrar/pagar sin destruir lo que ya funciona
- `FacturadorPro5` sera solo servicio externo de emision/anulacion/nota de credito/consulta SUNAT

## 6. Modulos que ya quedaron implementados

### 6.1 Compras y abastecimiento

- `Ordenes de compra`
- `Recepciones de compra`
- `Cuentas por pagar`
- `Pagos de cuentas por pagar`

### 6.2 Comercial

- `Clientes eventuales`
- `Red de distribucion`
- `Direcciones de entrega`
- `Tarifarios`
- `Pedidos comerciales`
- `Cuentas por cobrar`
- `Pagos de cuentas por cobrar`

### 6.3 Integraciones internas de stock

- `purchase_receipts` ya impacta:
  - inventario
  - kardex
  - lotes

### 6.4 Servicios y operaciones

- `Servicios`
- `Ordenes de servicio`
- `Despacho`
- `Actividad`
- `Conductor`
- `Vehiculo / Zona`

### 6.5 Facturacion interna

- `billing_documents`
- emision simulada
- anulacion simulada
- nota de credito simulada
- request/response almacenado
- eventos de facturacion almacenados
- estado de facturacion sincronizado al documento origen

### 6.6 Reportes

- `Reporte de ventas`
- `Reporte de inventario`
- `Resumen diario`

## 7. Modulos que siguen parciales o pendientes

### 7.1 Pendientes funcionales

- integracion real HTTP con `FacturadorPro5`
- anulaciones y nota de credito reales contra proveedor
- `Gasto`
- afinado de `Pedido comercial` para parecerse aun mas a produccion
- afinado de `Servicios` y `Ordenes de servicio`
- afinado de `Resumen diario`

### 7.2 Pendientes tecnicos/higiene

- `routes/free.php` sigue con imports/controladores rotos viejos
- `web.php` tiene una ruta a `AdminHomeController@getSales` que historicamente no existia
- el root de XAMPP sin `/public` sigue mal
- siguen warnings viejos de frontend en:
  - `resources/js/Admin/Generals.jsx`
  - `resources/js/Catalog.jsx`

## 8. Facturacion: como quedo pensada

La facturacion no depende de que el proveedor externo sea la fuente de verdad.

Flujo cerrado:

1. se crea `billing_document` en nuestra BD
2. se copian cliente, origen, importes e items
3. se genera payload REST saliente
4. se guarda request/response/eventos
5. se sincroniza el estado del documento origen

Hoy existe modo `demo`, no llamada real.

Archivos clave:

- [BillingDocumentController.php](C:/xampp/htdocs/kamary.pe/app/Http/Controllers/Admin/BillingDocumentController.php)
- [BillingDocumentService.php](C:/xampp/htdocs/kamary.pe/app/Services/BillingDocumentService.php)
- [FacturadorPro5Service.php](C:/xampp/htdocs/kamary.pe/app/Services/FacturadorPro5Service.php)
- [facturadorpro5.php](C:/xampp/htdocs/kamary.pe/config/facturadorpro5.php)

### 8.1 Variables previstas para FacturadorPro5

En `.env.example` ya se dejaron:

- `FACTURADORPRO5_MODE=demo`
- `FACTURADORPRO5_BASE_URL=https://demo.facturadorpro5.local/api`
- `FACTURADORPRO5_TOKEN=`
- `FACTURADORPRO5_TIMEOUT=20`
- `FACTURADORPRO5_ISSUE_ENDPOINT=/documents`
- `FACTURADORPRO5_CANCEL_ENDPOINT=/documents/cancel`
- `FACTURADORPRO5_CREDIT_NOTE_ENDPOINT=/documents/credit-note`
- `FACTURADORPRO5_DEMO_TEMPLATE_PATH=demo/facturadorpro5`
- `FACTURADORPRO5_SERIES_FACTURA=F001`
- `FACTURADORPRO5_SERIES_BOLETA=B001`
- `FACTURADORPRO5_SERIES_NOTA_CREDITO=FC01`

### 8.2 Simulacion local actual

Se usan plantillas demo:

- [issue-response.json](C:/xampp/htdocs/kamary.pe/storage/app/demo/facturadorpro5/issue-response.json)
- [cancel-response.json](C:/xampp/htdocs/kamary.pe/storage/app/demo/facturadorpro5/cancel-response.json)
- [credit-note-response.json](C:/xampp/htdocs/kamary.pe/storage/app/demo/facturadorpro5/credit-note-response.json)

## 9. Modulos y rutas importantes ya activas

### 9.1 Compras / administracion

- `/admin/purchase-orders`
- `/admin/purchase-receipts`
- `/admin/accounts-payable`

### 9.2 Comercial

- `/admin/clients`
- `/admin/eventual-clients`
- `/admin/client-distribution`
- `/admin/pricing`
- `/admin/commercial-orders`
- `/admin/accounts-receivable`

### 9.3 Operaciones

- `/admin/activity`
- `/admin/driver`
- `/admin/vehicle-zone`
- `/admin/dispatch`
- `/admin/services-services`
- `/admin/services-service-order`
- `/admin/services-billing`
- `/admin/billing-documents`

### 9.4 Reportes

- `/admin/reports/sales`
- `/admin/reports/inventory`
- `/admin/daily-summary`

## 10. Seeders demo que ya existen

Orden recomendado para dejar data demo:

```bash
php artisan db:seed --class=DemoOperationalModulesSeeder
php artisan db:seed --class=DemoOperationalPhase2Seeder
php artisan db:seed --class=DemoOperationalPhase3Seeder
```

### 10.1 Que carga cada uno

`DemoOperationalModulesSeeder`

- proveedores demo
- clientes demo
- clientes eventuales demo
- red de distribucion
- direcciones
- tarifarios
- ordenes de compra
- recepciones
- cuentas por pagar
- pedidos comerciales
- cuentas por cobrar
- maestros base

`DemoOperationalPhase2Seeder`

- servicios demo
- ordenes de servicio demo
- despachos demo
- billing documents demo

`DemoOperationalPhase3Seeder`

- conductores demo
- zonas demo
- vehiculos demo
- actividades demo
- asignacion de maestros en despachos
- simulacion de documentos emitidos, anulados y nota de credito

## 11. Validaciones ya ejecutadas

Se ejecutaron en este trabajo:

- `php artisan migrate --force`
- `php artisan db:seed --class=DemoOperationalPhase2Seeder`
- `php artisan db:seed --class=DemoOperationalPhase3Seeder`
- `npm run build`

Validaciones concretas ya comprobadas:

- migraciones nuevas OK
- seeders nuevos OK
- build OK
- facturacion demo con mezcla de estados OK
- actividades/categorias operativas con data demo OK

Conteo verificado al 2026-04-29:

- `drivers`: 10
- `zones`: 10
- `vehicles`: 10
- `activities`: 10
- `dispatches_with_driver`: 6
- `activity_items`: 20

Estado demo de `billing_documents` verificado:

- `Boleta accepted`: 2
- `Boleta pending`: 1
- `Factura accepted`: 2
- `Factura cancelled`: 1
- `Factura pending`: 3
- `Nota de credito accepted`: 1

## 12. Comparacion contra la web de referencia

Resumen ejecutivo:

- `Igual base`
  - ordenes de compra
  - recepciones de compra
  - cuentas por pagar
  - cuentas por cobrar
  - reporte de ventas base
  - reporte de inventario base

- `Parcial`
  - clientes
  - clientes eventuales
  - tarifarios
  - pedidos comerciales
  - facturacion
  - servicios
  - ordenes de servicio
  - despacho
  - resumen diario

- `Falta`
  - gasto
  - afinados de algunos subflujos de produccion
  - integracion real SUNAT por API

### 12.1 Sitios revisados en produccion

- `https://kamary.l105.com/inicio/ingresar`
- `https://kamary.l105.com/almacen/proveedor`
- `https://kamary.l105.com/almacen/notaentradapagar`
- `https://kamary.l105.com/almacen/cliente`
- `https://kamary.l105.com/Clientes/clientesEventual`
- `https://kamary.l105.com/almacen/cuentaporpagar`
- `https://kamary.l105.com/almacen/caja`
- `https://kamary.l105.com/almacen/tarifario`
- `https://kamary.l105.com/Facturacion`
- `https://kamary.l105.com/OrdenServicio`
- `https://kamary.l105.com/Servicios`
- `https://kamary.l105.com/despacho`
- `https://kamary.l105.com/pedido_requerimiento/pedido`
- `https://kamary.l105.com/almacen/resumendiario`

## 13. Archivos clave que otro chat deberia revisar primero

### 13.1 Planeamiento y comparacion

- [plan-operativo-modulos-comercial-facturacion-servicios.md](C:/xampp/htdocs/kamary.pe/docs/plan-operativo-modulos-comercial-facturacion-servicios.md)
- [revision-comparativa-modulos-kamary-2026-04-28.md](C:/xampp/htdocs/kamary.pe/docs/revision-comparativa-modulos-kamary-2026-04-28.md)

### 13.2 Rutas y menu

- [web.php](C:/xampp/htdocs/kamary.pe/routes/web.php)
- [api.php](C:/xampp/htdocs/kamary.pe/routes/api.php)
- [Menu.jsx](C:/xampp/htdocs/kamary.pe/resources/js/Components/Adminto/Menu.jsx)

### 13.3 Facturacion

- [BillingDocumentController.php](C:/xampp/htdocs/kamary.pe/app/Http/Controllers/Admin/BillingDocumentController.php)
- [BillingDocumentService.php](C:/xampp/htdocs/kamary.pe/app/Services/BillingDocumentService.php)
- [FacturadorPro5Service.php](C:/xampp/htdocs/kamary.pe/app/Services/FacturadorPro5Service.php)
- [BillingDocuments.jsx](C:/xampp/htdocs/kamary.pe/resources/js/Admin/BillingDocuments.jsx)

### 13.4 Operaciones

- [DispatchController.php](C:/xampp/htdocs/kamary.pe/app/Http/Controllers/Admin/DispatchController.php)
- [ActivityController.php](C:/xampp/htdocs/kamary.pe/app/Http/Controllers/Admin/ActivityController.php)
- [Dispatches.jsx](C:/xampp/htdocs/kamary.pe/resources/js/Admin/Dispatches.jsx)
- [Activities.jsx](C:/xampp/htdocs/kamary.pe/resources/js/Admin/Activities.jsx)
- [Drivers.jsx](C:/xampp/htdocs/kamary.pe/resources/js/Admin/Drivers.jsx)
- [VehicleZones.jsx](C:/xampp/htdocs/kamary.pe/resources/js/Admin/VehicleZones.jsx)

## 14. Contexto de decisiones importantes del chat

- inicialmente se penso extender mas los modulos existentes
- luego el usuario corrijio el enfoque
- desde ese punto quedo cerrado que:
  - no romper existentes
  - no mover agresivamente `entry_notes` ni `orders`
  - construir nuevo alrededor
- se reviso la web productiva y se alineo el backlog con sus flujos
- el usuario dejo claro que `FacturadorPro5` sera solo facturador, no base de datos de negocio
- se pidio expresamente que quede listo como si ya estuviera conectado, usando demo local mientras tanto

## 15. Riesgos o puntos delicados

- este repo sigue con bastante historial sucio y cambios grandes no committeados
- `public/build` cambia cada vez que se corre `npm run build`
- el proyecto tiene deuda vieja no necesariamente ligada a estos modulos
- no usar la cuenta de produccion para escribir datos
- si otro chat toca `.env`, rutas o modulos viejos, debe hacerlo con cuidado para no romper lo que ya se monto

## 16. Siguiente paso recomendado para otro chat

Orden recomendado:

1. revisar en navegador los modulos nuevos con data demo
2. comparar campo por campo con `kamary.l105.com`
3. cerrar huecos de UI/validacion que aun falten
4. recien despues conectar `FacturadorPro5` real por API
5. dejar limpieza final de rutas viejas y acceso XAMPP

## 17. Nota final para otro chat

Si otro chat necesita retomar rapido, la instruccion correcta seria algo como:

> Lee `docs/contexto-transferencia-chat-2026-04-29-privado.md`, `docs/plan-operativo-modulos-comercial-facturacion-servicios.md` y `docs/revision-comparativa-modulos-kamary-2026-04-28.md`. Asume que la arquitectura ya esta cerrada: BD local como fuente de verdad, FacturadorPro5 solo como servicio externo, y modulos nuevos construidos sin romper existentes. Continua desde el estado actual del proyecto.

