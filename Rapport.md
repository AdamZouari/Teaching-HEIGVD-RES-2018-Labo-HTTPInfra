# Rapport RES Labo HTTP

## Introduction

All our work have been saved in the repository:  https://github.com/SmithHeig/Teaching-HEIGVD-RES-2018-Labo-HTTPInfra

## Step 1: Static HTTP server apache httpd

The template used in this step is: https://startbootstrap.com/template-overviews/resume/

Our Dockerfile is:

```dockerfile
FROM php:5.6-apache # Php apache based image

RUN apt-get update && \
 apt-get install -y vim # Install vim in the container

COPY content/ /var/www/html/ # Copy the content of the web site in the directory where apache will load the files
```

## Step2: Dynamic HTTP server with express.js

For the generation of the animals, we used an express server:

``` js
var Chance = require('chance');
var chance = Chance();

var express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.send(generateAnimals());
});

app.listen(3000, function() {
    console.log('Accepting HTTP requests on port 3000.');
});

function generateAnimals() {
    var numberOfAnimals = chance.integer({
        min: 0,
        max: 10
    });

    console.log(numberOfAnimals);

    var animals = [];

    for(var i = 0; i < numberOfAnimals; ++i){
        animals.push({
            firstName : chance.animal(),
            lastName : chance.animal()
        });
    }

    console.log(animals);
    return animals;

}
```

The dockerfile for this server is:

```dockerfile
FROM node:4.4

RUN apt-get update && \
 apt-get install -y vim # Install vim

COPY src /opt/app # copy the app express into the container

WORKDIR /opt/app

CMD ["node","index.js"] # run the server
```

## Step 3: Reverse proxy with apache (static configuration)

The static configuration is bad because docker give dynamicaly ip addresse. So every time we lunch the dockers containers, we need to configure the proxy.

To configure the reverse proxy, we need to write a config file called 001-reverse-proxy.conf:

```
<VirtualHost *:80>
  ServerName demo.res.ch

  # Not available in this container
  # ErrorLog ${APACHE_LOG_DIR}/error.log
  # CustomLog ${APACHE_LOG_DIR}/access.log combined
  
  ProxyPass "/api/student/" "http://172.17.0.3:3000/" # hardcoded addresse dynamic server
  ProxyPassReverse "/api/students/" "http://172.17.0.3:3000/"# hardcoded addresse dynamic server

  ProxyPass "/" "http://172.17.0.2:80/" # hardcoded addresse static server
  ProxyPassReverse "/" "http://172.17.0.2:80/" # hardcoded addresse static server

</VirtualHost>
```

We need to enable mods in apache to have the proxy working. We directly did that in the Dockerfile:

```dockerfile
FROM php:5.6-apache

COPY conf/ /etc/apache2

RUN a2enmod proxy proxy_http # Install mods for the reverse proxy
RUN a2ensite 000-* 001-* # enable the configuration we wrote before
```

## Step 4 : AJAX requests with JQuery

We've changed the description of our static content to have a class animals:

```html
<span class="animals">Hello</span>
```

The script who will do the request to the dynamic HTTP server:

```js
$(function() {
  console.log("loading students");
  function loadAnimals() {
    $.getJSON( "/api/students/", function (animals ) {
      console.log(animals);
      var message= "No animals is here";
      if( animals.length > 0){
        message = animals[0].firstName + " " + animals[0].lastName;
      }
      $(".animals").text(message);
    });
  };
  loadAnimals();
  setInterval(loadAnimals, 2000);
});
```

This script need to found a balise with the class "animals".

To add the script to our page we add this line at the end of our index.html:

```html
<script src="js/students.js"></script>
```

## Step 5: Dynamic reverse proxy configuration 

To configure dynamicaly the ip addresss of our servers, we used the usefull -e from docker to add environnement variable.

We generate a .config 001-reverse-proxy with a php script:

```php
<?php
  $dynamic_app = getenv('DYNAMIC_APP');
  $static_app = getenv('STATIC_APP');
?>

<VirtualHost *:80>
  ServerName demo.res.ch

  # Not available in this container
  # ErrorLog ${APACHE_LOG_DIR}/error.log
  # CustomLog ${APACHE_LOG_DIR}/access.log combined
  
  ProxyPass '/api/students/' 'http://<?php print "$dynamic_app"?>/'
  ProxyPassReverse '/api/students/' 'http://<?php print "$dynamic_app"?>/'

  ProxyPass "/" "http://<?php print "$static_app"?>/"
  ProxyPassReverse "/" "http://<?php print "$static_app"?>/"

</VirtualHost>
```

To run our setup, we coded a script:

```bash
echo "\n### Kill all containers...\n"
docker kill $(docker ps -qa)

echo "\n### Remove all container...\n"
docker rm $(docker ps -qa)

echo "\n### Build apache_static\n"
docker build -t apache_static ./apache-php-image/

echo "\n### Build express_dynamic\n"
docker build -t express_dynamic ./express-image/

echo "\n### Build apache_rp\n"
docker build -t express_dynamic ./apache-reverse-proxy/

echo "\n### Run apache_static container\n"
docker run -d --name apache_static res/apache_php

echo "\n### Run express_dynamic\n"
docker run -d --name express_dynamic res/express

echo "\n### Run apache_rp"
static_app=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' apache_static`
dynamic_app=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' express_dynamic`

echo "## IP of injected: static $static_app and dynamic $dynamic_app\n" 
docker run -d -p 8080:80 -e STATIC_APP=$static_app:80 -e DYNAMIC_APP=$dynamic_app:3000 --name apache_rp res/apache_rp
```

In the line bellow, you can the the -e  :

```bash
docker run -d -p 8080:80 -e STATIC_APP=$static_app:80 -e DYNAMIC_APP=$dynamic_app:3000 --name apache_rp res/apache_rp
```

The Dockerfile need to be update:

```dockerfile
FROM php:5.6-apache

RUN apt-get update && \
 apt-get install -y vim

COPY apache2-foreground /usr/local/bin/

COPY conf/ /etc/apache2/
COPY templates/ /var/apache2/templates

RUN a2enmod proxy proxy_http
RUN a2ensite 000-* 001-*
```

## Load balancing: multiple server nodes

To do this part, we used this tutoriel: https://httpd.apache.org/docs/2.4/fr/mod/mod_proxy_balancer.html

We had to add some new mods:

``` dockerfile
FROM php:5.6-apache

RUN apt-get update && \
 apt-get install -y vim

COPY apache2-foreground /usr/local/bin/

COPY conf/ /etc/apache2/
COPY templates/ /var/apache2/templates

RUN a2enmod proxy proxy_http proxy_balancer lbmethod_byrequests status
RUN a2ensite 000-* 001-*
```

- **proxy_balancer**: mod to use the load balancer
- **lbmethod_byrequests**: algorithm used to balanced the charge. (required)
- **status**: will be usefull later for the admin interface

We dupplicate both server (dynamic and static). so we had to add 2 environement variable.

We modified our script:

```bash
echo "\n### Kill all containers...\n"
docker kill $(docker ps -qa)

echo "\n### Remove all container...\n"
docker rm $(docker ps -qa)

echo "\n### Build apache_static\n"
docker build -t res/apache_php ./apache-php-image/

echo "\n### Build express_dynamic\n"
docker build -t res/express ./express-image/

echo "\n### Build apache_rp\n"
docker build -t res/apache_rp ./apache-reverse-proxy/

echo "\n### Run apache_static containers\n"
docker run -d res/apache_php #useless
docker run -d res/apache_php #useless
docker run -d --name apache_static1 res/apache_php
docker run -d --name apache_static2 res/apache_php

echo "\n### Run express_dynamic containers\n"
docker run -d res/express #useless
docker run -d res/express #useless
docker run -d --name express_dynamic1 res/express
docker run -d --name express_dynamic2 res/express

echo "\n### Run apache_rp"
static_app1=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' apache_static1`
static_app2=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' apache_static2`
dynamic_app1=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' express_dynamic1`
dynamic_app2=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' express_dynamic2`

echo "## IP of injected: static $static_app1, $static_app2 and dynamic $dynamic_app1, $dynamic_app2\n" 
docker run -d -p 8080:80 -e STATIC_APP1=$static_app1:80 -e STATIC_APP2=$static_app2:80 -e DYNAMIC_APP1=$dynamic_app1:3000 -e DYNAMIC_APP2=$dynamic_app2:3000 --name apache_rp res/apache_rp
```

And changed the *php* script:

```php
<?php
  $dynamic_app1 = getenv('DYNAMIC_APP1');
  $dynamic_app2 = getenv('DYNAMIC_APP2');
  $static_app1 = getenv('STATIC_APP1');
  $static_app2 = getenv('STATIC_APP2');
?>

<VirtualHost *:80>
  ServerName demo.res.ch

  # Not available in this container
  # ErrorLog ${APACHE_LOG_DIR}/error.log
  # CustomLog ${APACHE_LOG_DIR}/access.log combined

  <Proxy "balancer://dynamic_app">
    BalancerMember 'http://<?php print "$dynamic_app1"?>'
    BalancerMember 'http://<?php print "$dynamic_app2"?>'
  </Proxy>
  <Proxy "balancer://static_app">
    BalancerMember 'http://<?php print "$static_app1"?>/'
    BalancerMember 'http://<?php print "$static_app2"?>/'
  </Proxy>

  ProxyPass '/api/students/' 'balancer://dynamic_app/'
  ProxyPassReverse '/api/students/' 'balancer://dynamic_app/'

  ProxyPass '/' 'balancer://static_app/'
  ProxyPassReverse '/' 'balancer://static_app/'

  # Ajouter dans httpd.conf
  # <Location "/balancer-manager">
  #   SetHandler balancer-manager
  #   Require host demo.res.ch
  # </Location>

</VirtualHost>
```

The \<Proxy\> defined a cluster of servers.

We changed the ProxyPass to go to the cluster.

### Tests

- Run the two containers per cluster
- Test if it works
- Kill one of them
- Look if it still work
- Kill both and look that stop responding

## Load balancing: round-robin vs sticky sessions

