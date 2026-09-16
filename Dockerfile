FROM php:8.1-fpm

# deb.debian.org dejo de entregar los paquetes de bullseye-security (404 al descargarlos);
# security.debian.org si los tiene. Se cubren los dos formatos de sources (el clasico y el
# nuevo .sources) y termina en 'true' para que un archivo ausente jamas tumbe el build.
RUN sh -c 'for f in /etc/apt/sources.list /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources; do [ -f "$f" ] && sed -i "s|deb.debian.org/debian-security|security.debian.org/debian-security|g" "$f"; done; true'

# 1. Instalar dependencias
RUN apt-get update && apt-get install -y \
  libpng-dev \
  libjpeg62-turbo-dev \
  libfreetype6-dev \
  libzip-dev \
  libwebp-dev \
  zlib1g-dev \
  zip \
  unzip \
  nano

# 2. Configurar y instalar extensiones PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp
RUN docker-php-ext-install -j$(nproc) gd pdo pdo_mysql zip bcmath
COPY docker-compose/php/local.ini /usr/local/etc/php/conf.d/local.ini

# 3. Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer 

# 4. Set working directory
WORKDIR /var/www/html

# 5. Copy application code
COPY . /var/www/html

# 5.1 Prepare Laravel runtime directories before Composer scripts run
RUN mkdir -p \
  /var/www/html/storage/framework/cache/data \
  /var/www/html/storage/framework/sessions \
  /var/www/html/storage/framework/views \
  /var/www/html/storage/framework/testing \
  /var/www/html/bootstrap/cache

# 6. Install PHP dependencies
# RUN composer install --no-interaction --no-dev --optimize-autoloader
RUN composer install --no-interaction --optimize-autoloader

# 7. Set permissions
RUN chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 8. Copy and set entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 9. Expose FPM port
EXPOSE 9000

# 10. Start via Entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# 11. Default command (start php-fpm)
CMD ["php-fpm"]
