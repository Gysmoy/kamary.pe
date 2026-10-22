# =====================================================================
# PHP 7.4 parcheado: CVE-2026-109618 / CVE-2026-109619 (RCE critico sin autenticacion).
# PHP 7.4 esta EOL y php:7.4-fpm trae 7.4.33 con la falla; no hay imagen oficial parcheada.
# php-src publico el backport oficial en la rama PHP-7.4-CVE-2026-109618-109619. Esta etapa
# compila ese commit fijado (tarball verificado por sha256) con las MISMAS opciones de configure
# que el PHP de la imagen oficial (php-config --configure-options), y la etapa final copia solo
# los binarios php y php-fpm encima. Las extensiones .so siguen valiendo porque la API (20190902
# NTS) no cambia. Misma tecnica que el repo nubo (commit d17091d).
# =====================================================================
FROM php:7.4-fpm AS php-cve-build

# bullseye ya es EOL: sus paquetes (incluidos los de seguridad) solo existen en archive.debian.org
# y el indice esta vencido, de ahi Check-Valid-Until=false.
RUN set -eux; \
    rm -f /etc/apt/sources.list.d/*; \
    printf "%s\n" \
        "deb http://archive.debian.org/debian bullseye main" \
        "deb http://archive.debian.org/debian-security bullseye-security main" \
        > /etc/apt/sources.list; \
    echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99archive

ARG PHP_CVE_COMMIT=712e60f9edfd03f0960fc4fc3c2c375f42b90aa2
ARG PHP_CVE_SHA256=c85c8cae6cd97c8688eb0bb2385d2341b74606153d19c3c8688183c3bc760d47
# Igual a 'php-config --configure-options' de php:7.4-fpm (7.4.33) y del PHP que corre en este facturador.
ARG PHP_CVE_CONFIGURE="--build=x86_64-linux-gnu --with-config-file-path=/usr/local/etc/php --with-config-file-scan-dir=/usr/local/etc/php/conf.d --enable-option-checking=fatal --with-mhash --with-pic --enable-ftp --enable-mbstring --enable-mysqlnd --with-password-argon2 --with-sodium=shared --with-pdo-sqlite=/usr --with-sqlite3=/usr --with-curl --with-iconv --with-openssl --with-readline --with-zlib --disable-phpdbg --with-pear --with-libdir=lib/x86_64-linux-gnu --disable-cgi --enable-fpm --with-fpm-user=www-data --with-fpm-group=www-data build_alias=x86_64-linux-gnu"

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        autoconf automake bison ca-certificates curl dpkg-dev file g++ gcc libc-dev libtool make pkg-config re2c \
        libargon2-dev libcurl4-openssl-dev libonig-dev libreadline-dev libsodium-dev libsqlite3-dev \
        libssl-dev libxml2-dev zlib1g-dev; \
    rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    curl -fsSL "https://codeload.github.com/php/php-src/tar.gz/${PHP_CVE_COMMIT}" -o /tmp/php-src.tar.gz; \
    echo "${PHP_CVE_SHA256}  /tmp/php-src.tar.gz" | sha256sum -c -; \
    mkdir -p /usr/src/php-cve; \
    tar -xzf /tmp/php-src.tar.gz -C /usr/src/php-cve --strip-components=1; \
    rm /tmp/php-src.tar.gz

WORKDIR /usr/src/php-cve

# PHP_CFLAGS / PHP_CPPFLAGS / PHP_LDFLAGS vienen como ENV de la imagen php oficial.
RUN set -eux; \
    ./buildconf --force; \
    CFLAGS="$PHP_CFLAGS" CPPFLAGS="$PHP_CPPFLAGS" LDFLAGS="$PHP_LDFLAGS" ./configure ${PHP_CVE_CONFIGURE}

RUN set -eux; nice -n 19 make -j3

RUN set -eux; \
    make install INSTALL_ROOT=/out; \
    strip --strip-all /out/usr/local/bin/php /out/usr/local/sbin/php-fpm; \
    /out/usr/local/bin/php -v

# =====================================================================
# Imagen del facturador
# =====================================================================
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

# Parche de PHP (ver php-cve-build): reemplaza php y php-fpm por los compilados del backport
# oficial (7.4.34-dev). Va al final para no invalidar la cache de composer ni de las extensiones.
COPY --from=php-cve-build /out/usr/local/bin/php /usr/local/bin/php
COPY --from=php-cve-build /out/usr/local/sbin/php-fpm /usr/local/sbin/php-fpm

# Mitigaciones oficiales de CVE-2026-109618 / CVE-2026-109619 (reducen la superficie; el arreglo es
# el PHP parcheado de arriba). zz-cve.ini carga despues de 99-runtime.ini y zz-cve.conf despues de
# zz-app.conf. Los limites de subida se dejan en los valores que ya regian (8M/2M): solo se cierra
# session.upload_progress y se fija memory_limit del pool sin limite (php_admin_value).
COPY docker/php/zz-cve.ini /usr/local/etc/php/conf.d/zz-cve.ini
COPY docker/php-fpm/zz-cve.conf /usr/local/etc/php-fpm.d/zz-cve.conf

LABEL cve_patch="CVE-2026-109618,CVE-2026-109619" \
      cve_patch_source="php/php-src PHP-7.4-CVE-2026-109618-109619@712e60f9edfd03f0960fc4fc3c2c375f42b90aa2"

RUN php -v && php-fpm -v && php-fpm -t
