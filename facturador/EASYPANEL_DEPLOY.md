# Deploy en EasyPanel (Git + Dockerfile)

Esta guia deja Factu Lite en EasyPanel con:
- `app` (web Laravel + React build)
- `scheduler` (job cada minuto para `schedule:run`)
- MySQL externo (ya existente en tu servidor)

## 1) Usar tu MySQL ya desplegado

Solo necesitas tener listos estos datos:
- Host
- Puerto
- Base de datos
- Usuario
- Password

## 2) Crear servicio APP desde Git

En tu servicio tipo `App`:
- Fuente: `Git`
- URL repositorio: tu repo
- Rama: `main`
- Ruta de compilacion: `/`
- Tipo de build: `Dockerfile` (usa `Dockerfile` del root)
- Puerto interno: `80`

Variables de entorno:
- Copia `.env.easypanel.example` y pega sus variables en EasyPanel.
- Ajusta como minimo:
  - `APP_KEY` (obligatorio)
  - `APP_URL_BASE`
  - `APP_URL`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_DATABASE`
  - `DB_USERNAME`
  - `DB_PASSWORD`

Persistencia recomendada (volumenes):
- `/var/www/html/storage/app/public/uploads`
- `/var/www/html/storage/app/tenancy`
- `/var/www/html/storage/framework/sessions`
- `/var/www/html/storage/logs`
- `/var/www/html/bootstrap/cache`

## 3) Crear servicio SCHEDULER

Crea otro servicio desde el mismo repo/branch con el mismo Dockerfile y:
- Sin dominio publico.
- Command: `scheduler-loop`
- Mismas variables DB/APP del servicio app.

Recomendado para scheduler:
- `AUTO_RUN_STORAGE_LINK=false`
- `AUTO_RUN_MIGRATIONS=false`
- `AUTO_RUN_SEEDERS=false`
- `AUTO_RUN_SMOKE_TESTS=false`
- `AUTO_RUN_OPTIMIZE=false`

Recomendado para app:
- `AUTO_RUN_OPTIMIZE_CLEAR=true` (limpia cache de Laravel/PHP en cada arranque del contenedor antes de recachear)
- `AUTO_RUN_DB_CLEANUP=true` (aplica limpieza de tablas/campos legacy de tenancy en modo monoempresa)
- `DB_CLEANUP_PROFILE=single_company`
- `SEED_DEMO_DATA=false` (evita cargar clientes/items demo al ejecutar seeders)

## 4) APP_KEY (si no la tienes)

Si `APP_KEY` esta vacia, en consola del contenedor `app`:

```bash
php artisan key:generate --show
```

Copia el valor `base64:...` a `APP_KEY` en EasyPanel y redeploy.

## 5) Orden de despliegue

1. APP
2. SCHEDULER

## 6) Notas operativas

- El entrypoint espera DB antes de correr migraciones.
- En produccion los seeders quedan desactivados por defecto.
- El scheduler ejecuta:

```bash
php artisan schedule:run --no-interaction
```

cada `SCHEDULER_INTERVAL_SECONDS` (default `60`).
