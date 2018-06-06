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
