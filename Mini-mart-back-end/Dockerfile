FROM php:8.2-apache

WORKDIR /var/www/html

COPY . /tmp/src/
RUN if [ -d /tmp/src/Mini-mart-back-end ]; then \
      cp -a /tmp/src/Mini-mart-back-end/. /var/www/html/; \
    else \
      cp -a /tmp/src/. /var/www/html/; \
    fi && rm -rf /tmp/src

RUN docker-php-ext-install mysqli pdo pdo_mysql

RUN a2enmod rewrite headers

RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

RUN printf '<IfModule mod_headers.c>\n\
  Header always set Access-Control-Allow-Origin "*"\n\
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"\n\
  Header always set Access-Control-Allow-Headers "Content-Type, Authorization"\n\
</IfModule>\n' > /etc/apache2/conf-available/cors.conf && a2enconf cors

RUN chown -R www-data:www-data /var/www/html

RUN mkdir -p /var/www/html/uploads && chmod 775 /var/www/html/uploads

EXPOSE 80

CMD ["apache2-foreground"]
