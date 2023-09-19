var countrySelectBox = document.getElementById("countries");
var stateSelectBox = document.getElementById("states");
var citySearchBox = document.getElementById("city-search-box");

function populateCountries(){
    var counter = 0;
    for(entry in countryListAllIsoData){
        var listItem = document.createElement("option");
        listItem.text = countryListAllIsoData[counter].name;
        listItem.value = countryListAllIsoData[counter].code;
        countrySelectBox.add(listItem);
        counter++;
    }
}

function populateStates(){

    var counter = 0;

    for(state in usStates){
        
        var listItem = document.createElement("option");
        listItem.text = usStates[counter].name;
        listItem.value = usStates[counter].abbreviation;
        stateSelectBox.appendChild(listItem);
        counter++
    }
}

populateCountries();
populateStates();

// countrySelectBox.addEventListener("focus", populateCountries);
// stateSelectBox.addEventListener("focus", populateStates);




