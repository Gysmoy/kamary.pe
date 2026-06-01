#!/bin/bash
set -e

echo "========================================="
echo "Starting Application"
echo "========================================="

cd /var/www/html

run_artisan_with_retries() {
    label="$1"
    shift
    max_attempts="${ARTISAN_MAX_TRIES:-30}"
    retry_seconds="${ARTISAN_RETRY_SECONDS:-2}"

    for attempt in $(seq 1 "$max_attempts"); do
        echo "$label (attempt $attempt/$max_attempts)..."
        if php artisan "$@"; then
            return 0
        fi

        sleep "$retry_seconds"
    done

    echo "WARNING: $label failed after $max_attempts attempts, continuing anyway..."
    return 1
}

# 0. Ensure storage folders exist (por si volúmenes)
mkdir -p storage/logs
mkdir -p storage/framework/{sessions,views,cache,testing}
mkdir -p storage/framework/cache/data
mkdir -p bootstrap/cache
touch storage/logs/laravel.log

chown -R www-data:www-data storage bootstrap/cache
chmod -R 777 storage bootstrap/cache

# 1. Optional bootstrap tasks. Deploy runs these explicitly to avoid races.
if [ "${AUTO_RUN_MIGRATIONS:-false}" = "true" ]; then
    run_artisan_with_retries "Running migrations" migrate --force || true
else
    echo "Skipping startup migrations."
fi

if [ "${AUTO_SYNC_MODULE_PERMISSIONS:-false}" = "true" ]; then
    run_artisan_with_retries "Syncing module permissions" db:seed --class=ModulePermissionsSeeder --force || true
else
    echo "Skipping startup module permission sync."
fi

if [ "${AUTO_SEED_MAGISTRALES:-false}" = "true" ]; then
    run_artisan_with_retries "Seeding Magistrales initial data" db:seed --class=MagistralesProductionSeeder --force || true
else
    echo "Skipping startup Magistrales seed."
fi

# 2. Clear Caches
echo "Clearing caches..."
php artisan optimize:clear || true

# 3. Custom Storage Link (legacy project)
echo "Fixing legacy images symlink..."

rm -rf public/storage
mkdir -p public/storage

ln -s /var/www/html/storage/app/images public/storage/images

chown -h www-data:www-data public/storage/images

# 4. Start PHP-FPM
echo "Starting PHP-FPM..."
exec php-fpm
