FROM php:7.4-fpm

# Debian 11 (bullseye) llego a fin de soporte: sus paquetes de seguridad ya no existen en ningun
# mirror vivo (deb.debian.org, security.debian.org y archive.debian.org devuelven 404) y por eso
# el build moria aqui. Se quita el repositorio de seguridad y se apunta al archivo historico de
# Debian, que si conserva las versiones base. Probado contra esta misma imagen.
RUN set -eux; \
    sed -i '/-security/d' /etc/apt/sources.list; \
    sed -i 's|http://deb.debian.org/debian|http://archive.debian.org/debian|g' /etc/apt/sources.list; \
    echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99archive

RUN apt-get update && apt-get install -y \
    git unzip zip libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libonig-dev libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring zip bcmath gd soap \
    && rm -rf /var/lib/apt/lists/*

RUN { \
    echo "max_execution_time=900"; \
    echo "max_input_time=900"; \
    echo "memory_limit=512M"; \
    echo "date.timezone=America/Lima"; \
} > /usr/local/etc/php/conf.d/99-runtime.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock /var/www/html/
RUN mkdir -p /var/www/html/database/seeds/tenants /var/www/html/database/factories \
    && composer install --no-dev --prefer-dist --no-interaction --no-scripts --no-autoloader

COPY . /var/www/html
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative --no-scripts \
    && test -f /var/www/html/vendor/autoload.php

COPY docker/entrypoint.sh /usr/local/bin/app-entrypoint
COPY docker/php-fpm/zz-app.conf /usr/local/etc/php-fpm.d/zz-app.conf
RUN sed -i 's/\r$//' /usr/local/bin/app-entrypoint \
    && chmod +x /usr/local/bin/app-entrypoint

ENTRYPOINT ["app-entrypoint"]
CMD ["php-fpm", "-F"]
