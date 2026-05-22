# Flujo de pruebas - modulo de pedidos Kamary

## Preparacion

1. Ejecutar migraciones:

```bash
php artisan migrate
```

2. Cargar datos demo solo en ambiente de prueba:

```bash
php artisan db:seed --class=KamaryOrderObservationsDemoSeeder
```

Este seeder crea:

- Cliente: `Cliente Demo Observaciones SAC`, RUC `20600000001`.
- Productos: `DEMO-PED-001`, `DEMO-PED-002`.
- Stock en `Almacen A/B/C/D`.
- Conductor: `DRV-DEMO-001 - Conductor Demo Kamary`.
- Vehiculo: `VEH-DEMO-001`, placa `DEM-001`.
- Pedidos:
  - `PED-DEMO-FLUJO-001`: pendiente, para probar desde picking.
  - `PED-DEMO-DESPACHO-001`: listo para despacho.

## Flujo principal

1. Entrar a `Pedidos comerciales`.
   - Ruta: `/admin/commercial-orders`.
   - Revisar `PED-DEMO-FLUJO-001`.
   - Debe verse en estado comercial `Pendiente`, entrega `Pendiente`, doc. venta `Factura`, total `118.00`, IGV `18.00`.

2. Crear o editar un pedido.
   - Empresa: `Kamary Peru`.
   - Almacen: `Almacen A`.
   - Cliente: `Cliente Demo Observaciones SAC`.
   - Red: `Red Demo Pedidos`.
   - Direccion: `Direccion Demo Lima Centro`.
   - Articulo: buscar `DEMO-PED`.
   - Deben aparecer articulos solo si hay stock en el almacen elegido.
   - Documento permitido: `Factura`, `Boleta` o `Nota de pedido`.

3. Entrar a `Picking`.
   - Ruta: `/admin/picking`.
   - Filtro: `Pendientes`.
   - En `PED-DEMO-FLUJO-001`, pulsar iniciar picking.
   - Cambiar filtro a `En preparacion`.
   - Pulsar completar picking.
   - El pedido debe pasar a `Despacho`.

4. Entrar a `Despacho`.
   - Ruta: `/admin/dispatch`.
   - Crear despacho.
   - Empresa: `Kamary Peru`.
   - Almacen: `Almacen A`.
   - Conductor: `DRV-DEMO-001`.
   - Vehiculo: `DEM-001`.
   - Zona: `Lima Centro`.
   - Agregar pedido: `PED-DEMO-FLUJO-001` o `PED-DEMO-DESPACHO-001`.
   - Guardar.

5. Generar manifiesto.
   - En la grilla de despacho, pulsar `Generar manifiesto y poner en ruta`.
   - Debe generar codigo `MNF-...`, cambiar a `En ruta` y abrir PDF de manifiesto.
   - Tambien debe preparar guias de remision asociadas.

6. Revisar guia de remision.
   - En `Despacho`, boton `Guias`.
   - Ver PDF local.
   - Emitir solo si el facturador demo/produccion esta configurado.

7. Entrar a `Ruta conductor`.
   - Ruta: `/admin/driver-routes`.
   - Filtro conductor: `DRV-DEMO-001`.
   - Estado: `En ruta`.
   - Debe listar el manifiesto, pedidos, direccion, contacto, boton `Mapa`, boton `PDF`.

8. Registrar entrega.
   - En `Ruta conductor`, pulsar `Entregar`.
   - Recibido por: `Recepcion Demo`.
   - Tipo doc.: `DNI`.
   - Numero: `70000002`.
   - Telefono: `999888777`.
   - Adjuntar foto o pegar enlace de evidencia.
   - Guardar entrega.
   - El pedido debe pasar a `Entregado`. Cuando todos los pedidos del despacho tienen evidencia, el despacho pasa a `Entregado`.

9. Revisar tracking.
   - Volver a `Pedidos comerciales`.
   - Boton `Tracking pedido`.
   - Debe mostrar eventos de preparacion, despacho/manifiesto, guia y entrega.

## Pendiente fiscal

La emision real de guia SUNAT depende de que el servicio hijo `facturador` tenga configurado modo demo o produccion, certificado, credenciales y series. Sin eso se puede validar PDF local y preparacion de guia, pero no envio real a SUNAT.
