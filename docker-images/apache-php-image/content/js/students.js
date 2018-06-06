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

