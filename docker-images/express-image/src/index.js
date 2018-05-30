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
    var numberOfStrudents = chance.integer({
        min: 0,
        max: 10
    });

    console.log(numberOfStrudents);

    var students = [];

    for(var i = 0; i < numberOfStrudents; ++i){
        var gender = chance.gender();
        var birthYear = chance.year({
            min: 1986,
            max: 1996
        });
        students.push({
            firstName : chance.first({
                gender: gender
            }),
            lastName : chance.last(),
            gender: gender,
            birthday: chance.birthday({
                year: birthYear
            })
        });
    }

    console.log(students);
    return students;

}