# Modo Monoempresa (Sin Tenancy Operativo)

Este proyecto queda configurado para operar con una sola empresa por instancia.

## Que significa

- Se usa una sola base de datos principal.
- La conexion legacy llamada `tenant` apunta a la misma DB principal.
- Se desactiva la identificacion por hostname/middleware de tenancy.
- No se permite actualizar otra empresa distinta a la empresa principal activa.

## Reglas de uso

1. Configurar empresa una sola vez (RUC, SOAP, certificado, logo).
2. Emitir comprobantes sin reenviar datos de empresa en cada request.
3. Si hay cambio de certificado o credenciales, actualizar en endpoints de setup.

## Seeders recomendados

- `SEED_DEMO_DATA=false` para no cargar clientes/items demo.
- `SEED_COMPANY_DEFAULTS=true` para crear empresa base solo si no existe.
- `SEED_LEGACY_PLAN_DOCUMENTS=false` para evitar tablas de planes legacy.

## Endpoints recomendados

- Auth API: `docs/api-auth.md`
- Setup empresa API: `docs/api-company-setup.md`

## Nota tecnica

Se mantiene compatibilidad legacy con nombres `tenant` en algunas rutas/modelos, pero en modo monoempresa todas esas referencias operan sobre la misma DB principal.
Se elimino la dependencia `hyn/multi-tenant` y ya no se usa identificacion por hostname de tenancy.
