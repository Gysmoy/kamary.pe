#!/bin/sh
set -e

log() {
  echo "[entrypoint] $*"
}

cd /var/www/html

# Default web command for the app container.
if [ $# -eq 0 ]; then
  set -- php-fpm -F
fi

# Allow custom commands, e.g. `docker run ... php -v`
if [ "$1" != "php-fpm" ]; then
  exec "$@"
fi

mkdir -p \
  storage/app/public/uploads \
  storage/app/tenancy/tenants \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

read_env_value() {
  key="$1"
  if [ -f .env ]; then
    value="$(grep -m1 "^${key}=" .env | cut -d '=' -f2-)"
    value="$(printf '%s' "$value" | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
    printf '%s' "$value"
  fi
}

DB_HOST="${DB_HOST:-$(read_env_value DB_HOST)}"
DB_PORT="${DB_PORT:-$(read_env_value DB_PORT)}"
DB_DATABASE="${DB_DATABASE:-$(read_env_value DB_DATABASE)}"
DB_USERNAME="${DB_USERNAME:-$(read_env_value DB_USERNAME)}"
DB_PASSWORD="${DB_PASSWORD:-$(read_env_value DB_PASSWORD)}"

APP_ENV_VALUE="${APP_ENV:-production}"
IS_PRODUCTION=false
if [ "$APP_ENV_VALUE" = "production" ]; then
  IS_PRODUCTION=true
fi

if [ -z "${AUTO_RUN_COMPOSER_INSTALL+x}" ]; then
  if [ "$IS_PRODUCTION" = "true" ]; then
    AUTO_RUN_COMPOSER_INSTALL="false"
  else
    AUTO_RUN_COMPOSER_INSTALL="true"
  fi
fi

if [ -z "${AUTO_RUN_MIGRATIONS+x}" ]; then
  AUTO_RUN_MIGRATIONS="true"
fi

if [ -z "${AUTO_RUN_SEEDERS+x}" ]; then
  if [ "$IS_PRODUCTION" = "true" ]; then
    AUTO_RUN_SEEDERS="false"
  else
    AUTO_RUN_SEEDERS="true"
  fi
fi

if [ -z "${AUTO_RUN_OPTIMIZE+x}" ]; then
  if [ "$IS_PRODUCTION" = "true" ]; then
    AUTO_RUN_OPTIMIZE="true"
  else
    AUTO_RUN_OPTIMIZE="false"
  fi
fi

if [ -z "${AUTO_RUN_SMOKE_TESTS+x}" ]; then
  if [ "$IS_PRODUCTION" = "true" ]; then
    AUTO_RUN_SMOKE_TESTS="false"
  else
    AUTO_RUN_SMOKE_TESTS="true"
  fi
fi

if [ -z "${AUTO_RUN_E2E_DOCUMENT_SMOKE+x}" ]; then
  AUTO_RUN_E2E_DOCUMENT_SMOKE="false"
fi

if [ -z "${AUTO_RUN_CONFIG_CACHE+x}" ]; then
  if [ "$IS_PRODUCTION" = "true" ]; then
    AUTO_RUN_CONFIG_CACHE="true"
  else
    AUTO_RUN_CONFIG_CACHE="false"
  fi
fi

if [ -z "${AUTO_RUN_ROUTE_CACHE+x}" ]; then
  AUTO_RUN_ROUTE_CACHE="false"
fi

if [ -z "${AUTO_RUN_VIEW_CACHE+x}" ]; then
  AUTO_RUN_VIEW_CACHE="false"
fi

if [ -z "${AUTO_RUN_STORAGE_LINK+x}" ]; then
  AUTO_RUN_STORAGE_LINK="true"
fi

if [ -z "${AUTO_RUN_OPTIMIZE_CLEAR+x}" ]; then
  AUTO_RUN_OPTIMIZE_CLEAR="true"
fi

if [ -z "${AUTO_RUN_DB_CLEANUP+x}" ]; then
  AUTO_RUN_DB_CLEANUP="true"
fi

if [ -z "${DB_CLEANUP_PROFILE+x}" ]; then
  DB_CLEANUP_PROFILE="single_company"
fi

if [ "$AUTO_RUN_OPTIMIZE_CLEAR" = "true" ] && [ -f artisan ]; then
  log "Clearing Laravel cache artifacts..."
  php artisan optimize:clear >/dev/null 2>&1 || log "optimize:clear failed, continuing startup."
fi

if [ "$AUTO_RUN_COMPOSER_INSTALL" = "true" ]; then
  CURRENT_HASH=""
  if [ -f composer.lock ]; then
    CURRENT_HASH="$(md5sum composer.lock | awk '{print $1}')"
  fi

  HASH_FILE="storage/framework/.composer_lock_hash_${APP_ENV_VALUE}"
  STORED_HASH=""
  if [ -f "$HASH_FILE" ]; then
    STORED_HASH="$(cat "$HASH_FILE")"
  fi

  if [ ! -f vendor/autoload.php ] || [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
    log "Installing PHP dependencies..."
    if [ "$IS_PRODUCTION" = "true" ]; then
      composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
    else
      composer install --prefer-dist --no-interaction
    fi

    if [ -n "$CURRENT_HASH" ]; then
      echo "$CURRENT_HASH" > "$HASH_FILE"
    fi
  else
    log "Dependencies are up to date."
  fi
fi

if [ "$AUTO_RUN_STORAGE_LINK" = "true" ] && [ -f artisan ]; then
  if [ -L public/storage ]; then
    log "Storage symlink already exists."
  elif [ -e public/storage ]; then
    log "public/storage exists and is not a symlink. Recreating storage symlink..."
    rm -rf public/storage
    php artisan storage:link || true
  else
    log "Creating storage symlink..."
    php artisan storage:link || true
  fi
fi

DB_READY=true
if [ -n "${DB_HOST:-}" ] && [ -n "${DB_PORT:-}" ] && [ -n "${DB_DATABASE:-}" ] && [ -n "${DB_USERNAME:-}" ]; then
  DB_WAIT_MAX_TRIES="${DB_WAIT_MAX_TRIES:-30}"
  DB_WAIT_SECONDS="${DB_WAIT_SECONDS:-2}"
  ATTEMPT=0

  log "Waiting for database ${DB_HOST}:${DB_PORT}/${DB_DATABASE}..."
  until php -r '
$host=getenv("DB_HOST");
$port=(int)getenv("DB_PORT");
$db=getenv("DB_DATABASE");
$user=getenv("DB_USERNAME");
$pass=getenv("DB_PASSWORD");
try{
  $resolvedHost = gethostbyname($host);
  if ($resolvedHost === $host && !filter_var($host, FILTER_VALIDATE_IP)) {
    exit(2);
  }
  new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass, [PDO::ATTR_TIMEOUT => 3]);
  exit(0);
}catch(Throwable $e){
  $message = $e->getMessage();
  if (stripos($message, "getaddrinfo failed") !== false || stripos($message, "Name or service not known") !== false) {
    exit(2);
  }
  exit(1);
}
'; do
    STATUS="$?"
    if [ "$STATUS" -eq 2 ]; then
      DB_READY=false
      log "Database host '${DB_HOST}' cannot be resolved. Skipping DB-dependent startup tasks."
      break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    if [ "$ATTEMPT" -ge "$DB_WAIT_MAX_TRIES" ]; then
      DB_READY=false
      log "Database is not reachable after ${ATTEMPT} attempts."
      break
    fi
    sleep "$DB_WAIT_SECONDS"
  done
else
  DB_READY=false
  log "Database variables are not set in environment or .env. Skipping DB-dependent startup tasks."
fi

if [ "$AUTO_RUN_MIGRATIONS" = "true" ] && [ -f artisan ] && [ "$DB_READY" = "true" ]; then
  MIGRATION_MAX_TRIES="${MIGRATION_MAX_TRIES:-5}"
  ATTEMPT=0
  log "Running non-destructive migrations..."
  until false; do
    set +e
    MIGRATE_OUTPUT="$(php artisan migrate --force --no-interaction 2>&1)"
    MIGRATE_STATUS="$?"
    set -e

    if [ "$MIGRATE_STATUS" -eq 0 ]; then
      echo "$MIGRATE_OUTPUT"
      break
    fi

    echo "$MIGRATE_OUTPUT"

    # Non-retryable schema conflicts (example: table already exists)
    if echo "$MIGRATE_OUTPUT" | grep -qi "Base table or view already exists\|already exists"; then
      log "Non-retryable migration conflict detected. Skipping further migration retries."
      break
    fi

    ATTEMPT=$((ATTEMPT + 1))
    if [ "$ATTEMPT" -ge "$MIGRATION_MAX_TRIES" ]; then
      log "Migrations failed after ${ATTEMPT} attempts. Continuing startup to avoid downtime."
      break
    fi
    sleep 3
  done
elif [ "$AUTO_RUN_MIGRATIONS" = "true" ] && [ -f artisan ]; then
  log "Skipping migrations because database is not reachable."
fi

if [ "$AUTO_RUN_DB_CLEANUP" = "true" ] && [ -f docker/db-cleanup-single-company.php ] && [ "$DB_READY" = "true" ]; then
  log "Running database cleanup profile: ${DB_CLEANUP_PROFILE}"
  set +e
  DB_CLEANUP_OUTPUT="$(php docker/db-cleanup-single-company.php 2>&1)"
  DB_CLEANUP_STATUS="$?"
  set -e
  echo "$DB_CLEANUP_OUTPUT"
  if [ "$DB_CLEANUP_STATUS" -ne 0 ]; then
    log "Database cleanup failed. Continuing startup to avoid downtime."
  fi
elif [ "$AUTO_RUN_DB_CLEANUP" = "true" ] && [ "$DB_READY" != "true" ]; then
  log "Skipping DB cleanup because database is not reachable."
fi

if [ "$AUTO_RUN_SEEDERS" = "true" ] && [ -f artisan ] && [ "$DB_READY" = "true" ]; then
  log "Running demo/base seeders..."
  set +e
  SEED_OUTPUT="$(php artisan db:seed --force --no-interaction 2>&1)"
  SEED_STATUS="$?"
  set -e
  echo "$SEED_OUTPUT"
  if [ "$SEED_STATUS" -ne 0 ]; then
    log "Seeding failed. Continuing startup to avoid downtime."
  fi
elif [ "$AUTO_RUN_SEEDERS" = "true" ] && [ -f artisan ]; then
  log "Skipping seeders because database is not reachable."
fi

if [ "${AUTO_RUN_SEND_PENDING:-false}" = "true" ] && [ -f artisan ] && [ "$DB_READY" = "true" ]; then
  log "Sending pending SUNAT documents..."
  php artisan online:send-all || log "Pending SUNAT send failed. Continuing startup to avoid downtime."
fi

if [ "$AUTO_RUN_OPTIMIZE" = "true" ] && [ -f artisan ] && [ "$IS_PRODUCTION" = "true" ] && [ "$DB_READY" = "true" ]; then
  log "Caching framework metadata for production..."
  if [ "$AUTO_RUN_CONFIG_CACHE" = "true" ]; then
    php artisan config:cache || true
  fi
  if [ "$AUTO_RUN_ROUTE_CACHE" = "true" ]; then
    php artisan route:cache || true
  fi
  if [ "$AUTO_RUN_VIEW_CACHE" = "true" ]; then
    php artisan view:cache || true
  fi
elif [ "$AUTO_RUN_OPTIMIZE" = "true" ] && [ -f artisan ] && [ "$IS_PRODUCTION" = "true" ]; then
  log "Skipping production cache build because database is not reachable."
fi

if [ "$AUTO_RUN_SMOKE_TESTS" = "true" ] && [ -f artisan ]; then
  log "Running startup smoke checks..."
  set +e
  php artisan route:list >/dev/null 2>&1
  ROUTES_STATUS="$?"
  php artisan schedule:run --no-interaction >/dev/null 2>&1
  SCHEDULE_STATUS="$?"
  set -e

  if [ "$ROUTES_STATUS" -ne 0 ]; then
    log "Smoke check failed: route:list"
  fi

  if [ "$SCHEDULE_STATUS" -ne 0 ]; then
    log "Smoke check failed: schedule:run"
  fi

  if [ "$ROUTES_STATUS" -eq 0 ] && [ "$SCHEDULE_STATUS" -eq 0 ]; then
    log "Smoke checks passed."
  fi
fi

if [ "$AUTO_RUN_E2E_DOCUMENT_SMOKE" = "true" ] && [ -f docker/smoke_e2e_documents.php ] && [ "$DB_READY" = "true" ]; then
  log "Running E2E document smoke check..."
  set +e
  php docker/smoke_e2e_documents.php >/dev/null 2>&1
  E2E_STATUS="$?"
  set -e
  if [ "$E2E_STATUS" -eq 0 ]; then
    log "E2E document smoke check passed."
  else
    log "E2E document smoke check failed."
  fi
fi

exec "$@"
