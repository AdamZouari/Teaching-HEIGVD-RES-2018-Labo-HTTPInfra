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

We've changed the description of our static content to have a class animals:

```html
<span class="animals">Hello</span>
```

The script who will do the request to the dynamic HTTP server:

``` js
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