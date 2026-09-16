FROM php:8.2-apache

WORKDIR /var/www/html

COPY . /var/www/html/

RUN docker-php-ext-install mysqli pdo pdo_mysql

RUN a2enmod rewrite headers

RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

RUN echo '<IfModule mod_headers.c>' > /etc/apache2/conf-available/cors.conf && \
    echo 'Header always set Access-Control-Allow-Origin "*"' >> /etc/apache2/conf-available/cors.conf && \
    echo 'Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"' >> /etc/apache2/conf-available/cors.conf && \
    echo 'Header always set Access-Control-Allow-Headers "Content-Type, Authorization"' >> /etc/apache2/conf-available/cors.conf && \
    echo '</IfModule>' >> /etc/apache2/conf-available/cors.conf && \
    a2enconf cors

RUN chown -R www-data:www-data /var/www/html

RUN mkdir -p /var/www/html/uploads && chmod 775 /var/www/html/uploads

EXPOSE 80

CMD ["apache2-foreground"]
