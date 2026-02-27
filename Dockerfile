FROM php:8.1-fpm

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

# 3. Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer 

# 4. Set working directory
WORKDIR /var/www/html

# 5. Copy application code
COPY . /var/www/html

# 6. Install PHP dependencies
RUN composer install --no-interaction --no-dev --optimize-autoloader

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
