#!/bin/bash
set -e

echo "========================================="
echo "Starting Application"
echo "========================================="

cd /var/www/html

# 0. Ensure storage folders exist (por si volúmenes)
mkdir -p storage/logs
mkdir -p storage/framework/{sessions,views,cache,testing}
mkdir -p storage/framework/cache/data
mkdir -p bootstrap/cache
touch storage/logs/laravel.log

chown -R www-data:www-data storage bootstrap/cache
chmod -R 777 storage bootstrap/cache

# 1. Run Migrations
echo "Running migrations..."
php artisan migrate --force || echo "WARNING: Migrations failed, continuing anyway..."

# 1.1 Sync module permissions
echo "Syncing module permissions..."
php artisan db:seed --class=ModulePermissionsSeeder --force || echo "WARNING: Module permissions seeder failed, continuing anyway..."

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
