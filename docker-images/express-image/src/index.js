var Chance = require('chance');
var chance = Chance();

var express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.send(generateStudents());
});

app.listen(3000, function() {
    console.log('Accepting HTTP requests on port 3000.');
});

function generateStudents() {
    var numberOfStudents = chance.integer({
        min: 0,
        max: 10
    });

    console.log(numberOfStudents);

    var students = [];

    for(var i = 0; i < numberOfStudents; ++i){
        students.push({
            firstName : chance.animal(),
            lastName : chance.animal()
        });
    }

    console.log(students);
    return students;

}
