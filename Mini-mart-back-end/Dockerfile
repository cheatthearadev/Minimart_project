FROM php:8.2-apache

WORKDIR /var/www/html

COPY . /var/www/html/

RUN docker-php-ext-install mysqli pdo pdo_mysql

RUN a2enmod rewrite

RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

RUN chown -R www-data:www-data /var/www/html

RUN mkdir -p /var/www/html/uploads && chmod 775 /var/www/html/uploads

EXPOSE 80

CMD ["apache2-foreground"]
