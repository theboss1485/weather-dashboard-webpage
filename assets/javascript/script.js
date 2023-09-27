var countrySelectBox = document.getElementById("countries-box");
var stateSelectBox = document.getElementById("states-box");
var citySearchBox = document.getElementById("city-search-box");
var searchButton = document.getElementById("search-button");
var errorHeading = document.getElementById("error-heading");
var clearSearchHistoryButton = document.getElementById("clear-search-history")

var localStorageItemCounter = null

stateSelectBox.disabled = true;
citySearchBox.disabled = true;

var weatherData = [];
var countryAndState = "";


countrySelectBox.addEventListener('change', checkCountrySelectBox);
stateSelectBox.addEventListener('change', checkStateSelectBox);
citySearchBox.addEventListener('keydown', checkCitySearchBox);
citySearchBox.addEventListener('keyup', checkCitySearchBox);

stateSelectBox.disabled = true;
citySearchBox.disabled = true;

searchButton.disabled = true;

var parsedData = null;

searchButton.addEventListener('click', determineGeographicCoordinatesAndCityNames);
clearSearchHistoryButton.addEventListener('click', clearSearchHistory);

function populateLocalStorageItemCounter(){

    var counter = localStorage.getItem("local-storage-item-counter") 
    
    if( counter === null){

        localStorageItemCounter = 0;

    } else {

        localStorageItemCounter = counter;
    }
}

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

async function determineGeographicCoordinatesAndCityNames(event){

    errorHeading.textContent = "";

    event.preventDefault();

    var searchResults = document.getElementById("search-results");

    var buttons = searchResults.querySelectorAll('button');
    
    for(var counter = 0; counter < buttons.length; counter++){

        buttons[counter].remove();
    }

    event.preventDefault();

    // The Xpert Learning AI Assistant told me how to get the value out of a dropdown box option.
    if(countrySelectBox.value === "US"){

        var aPIString = 'http://api.openweathermap.org/geo/1.0/direct?q=' + citySearchBox.value +',' + stateSelectBox.value + ',US' + '&limit=5&appid=1b2bd4f01472b8f5040a1556773b2978';

    } else {

        var aPIString = 'http://api.openweathermap.org/geo/1.0/direct?q=' + citySearchBox.value + ',' + countrySelectBox.value + '&limit=5&appid=1b2bd4f01472b8f5040a1556773b2978';
    }
    

    fetch(aPIString).then(function (response){

        // This check prints any errors received when going to fetch data from the Weather Map API.
        if(response.status !== 200){

            errorHeading.textContent = response.status + " error returned!!";
        
        } else {

            errorHeading.textContent = "";
            return response.json()
        }
        
    }).then( async function(data){
        
        //parsedData = JSON.parse(data);
        var printedCityNames = [];
        

        if(stateSelectBox.value === ""){
            
            countryAndState =  countrySelectBox.options[countrySelectBox.selectedIndex].text;
        
        } else {

            countryAndState = countrySelectBox.options[countrySelectBox.selectedIndex].text + ", " + stateSelectBox.options[stateSelectBox.selectedIndex].text;
        }

        if(data.length === 0){

            errorHeading.textContent = "No Results Found!";
        
        } else {

            
        }

        

        /* This loop removes elements whose names don't contain the original city search box value.
        I implemented this because while searching for 'London', UK, I was receiving districts/parts of London,
        such as Vauxhall.*/

        for (var counter = 0; counter < data.length; counter++){

            var cityName = data[counter].name;

            // if(cityName.includes(citySearchBox.value) === true && cityName !== citySearchBox.value){

            //     printedCityNames.push(data[counter].name + ", " + countryAndState);
            
            // } else if(cityName.includes(citySearchBox.value) === false) {

            //     var localNames = data[counter].local_names;

            //     var values = Object.values(localNames)

            //     for (var counter2 = 0; counter2 < values.length; counter2++){

            //         if(values[counter2].includes(citySearchBox.value) === true){

            //             printedCityNames.push(values[counter2] + ", " + countryAndState);
            //             break;
            //         }
            //     }

            // } else if(cityName === citySearchBox.value){

                /*To keep things, simple I rounded the latitude and longitude to four decimal places.  I was running into an issue where the system would round the coordinates
                to four decimal places.  The system rounds the coordiantes to four decimal places in the output data.  I thought this would reduce issues with outputs not being uniform. */
                roundedLatitude = data[counter].lat.toFixed(4);
                roundedLongitude = data[counter].lon.toFixed(4);
                var aPIString = "https://api.openweathermap.org/data/2.5/weather?lat=" +  roundedLatitude + "&lon=" + roundedLongitude + "&appid=1b2bd4f01472b8f5040a1556773b2978&units=imperial";
                console.log(aPIString);


                await fetch(aPIString).then(function (response){

                    
                    if(response.status !== 200){
            
                        document.getElementById("error-heading").textContent = response.status + " error returned!!";
                    
                    } else {
            
                        document.getElementById("error-heading").textContent = "";
                        return response.json()
                    }
                /*Once again, to limit the number of edge cases and odd scenarios, I decided to  call the weather data API for each location that the geolocating API returned.  
                If the city name given by the geolocating API doesn't contain or match the name given by the weather data API or vice versa, the result will be discarded 
                from the list of search results.  To give an example, I was searching the geolocating API for Vauxhall, United Kingdom, but when typing the provided coordinates 
                back into the weather data API, I would receive city names of places such as Liverpool or Lambeth.  The reason for this seems to be that Vauxhall is a smaller
                region within Liverpool and Lambeth.  To keep things simple I wanted to display only the cities and districts that the weather API actually has data for.*/
                }).then(function(data2){

                    console.log(data2);

                    if (data2.name.includes(cityName) || cityName.includes(data2.name)){

                        printedCityNames.push(data2.name + ", " + countryAndState);

                        weatherData.push({identifer: "result-" + counter, name: data2, icon: data2.weather[0].icon, temp: data2.main.temp, humidity: data2.main.humidity, windSpeed : data2.wind.speed});
                    
                        var searchResult = document.createElement("button")
                        searchResult.id = "search-history-" + counter;
                        searchResult.textContent = printedCityNames[counter];
                        searchResult.classList.add("btn");
                        searchResult.classList.add("btn-secondary");
                        searchResult.classList.add("my-2");
                        searchResult.classList.add("mx-4");
                        searchResult.setAttribute("data-cityid", data2.id);
                        searchResult.setAttribute("data-cityname", data2.name + ", " + countryAndState)
                        searchResult.setAttribute("data-icon", data2.weather[0].icon)
                        searchResult.setAttribute("data-temp", data2.main.temp)
                        searchResult.setAttribute("data-humidity", data2.main.humidity)
                        searchResult.setAttribute("data-windspeed", data2.wind.speed)
                        searchResult.setAttribute("data-latitude", roundedLatitude);
                        searchResult.setAttribute("data-longitude", roundedLongitude);
                        searchResult.setAttribute("data-timezone", data2.timezone);
                        searchResult.addEventListener("click", displayCurrentWeather);
                        searchResult.addEventListener("click", obtainAndDisplayWeatherForcast);
                        searchResult.addEventListener("click", addQueriedCityToSearchHistory);
                        
                        var searchResults = document.getElementById("search-results");

                        searchResults.insertAdjacentElement('beforeend', searchResult);

                    } else{

                        printedCityNames.push(0);
                        weatherData.push(0);
                    } 

                    
                    
                 });

            // } else {

            //     printedCityNames.push(data[counter].name + ", " + countryAndState);
            // }
        }
        // displaySearchResults(data);
    });
}

function checkCountrySelectBox(){

    if(countrySelectBox.value !== ""){
        
        if(countrySelectBox.value === "US"){

            stateSelectBox.disabled = false;

            if(stateSelectBox.value === ""){

                citySearchBox.disabled = true;
                citySearchBox.value = "";
                searchButton.disabled = true;
            }

        } else {

            citySearchBox.disabled = false;
        }

    } else {
        stateSelectBox.value = "";
        citySearchBox.value = "";
        citySearchBox.disabled = true;
        stateSelectBox.disabled = true;
        searchButton.disabled = true;
    } 
}

function checkStateSelectBox(){

    if(stateSelectBox.value !== ""){

        citySearchBox.disabled = false;

    } else{

        citySearchBox.disabled = true;
        citySearchBox.value = "";
        searchButton.disabled = true;
    }
}

function checkCitySearchBox(event){

    /* The reason for the 1 millisecond delay here is to give the city textbox time to populate
    , so that the event wouldn't fire, and then then the system would see that the textbox had no characters 
    in it, fail to enable the Submit button, and then put the character in the textbox.  */
    setTimeout(function() {

            if(citySearchBox.value !== ""){
    
                searchButton.disabled = false;
        
            } else {
                
                searchButton.disabled = true;
            }

    }, 1)
}

function displaySearchResults(data){

    for(var counter = 0; counter < data.length; counter++){
        var section = document.createElement("section");
        section.setAttribute("id", "result-" + (counter + 1));

        var resultName = document.createElement("p");
        resultName.textContent = data[counter].name

        if(data[counter].local_names !== null){

            var regionFound = true;
            rrent
            for(var counter2 = 0; counter2 < data[counter].local_names.length; counter2++){


                if(data[counter].local_names[counter2] !== citySearchBox.value + ", " + data[counter].name){

                }
            }
        }

        section.appendChild()
        
    }
}

function displayCurrentWeather(event){

    event.preventDefault();

    var targetString = event.target.id;

    var targetButtonNumber = targetString.split("-")[2]

    var mainWeatherIcon = document.getElementById("main-weather-icon");

    document.getElementById("main-city-name").textContent = event.target.dataset.cityname;
    mainWeatherIcon.src = "https://openweathermap.org/img/wn/" + event.target.dataset.icon + "@2x.png";

    mainWeatherIcon.classList.add("d-inline");

    
    document.getElementById("temp-main").textContent = "Temperature: " + event.target.dataset.temp + " °F";
    document.getElementById("wind-main").textContent = "Wind Speed: " + event.target.dataset.windspeed + "MPH";
    document.getElementById("humidity-main").textContent = "Humidity: " + event.target.dataset.humidity + "%";
   
}

async function obtainAndDisplayWeatherForcast(event){

    var aPIString = "https://api.openweathermap.org/data/2.5/forecast?lat=" + event.target.dataset.latitude  + "&lon=" + event.target.dataset.longitude + "&appid=1b2bd4f01472b8f5040a1556773b2978&units=imperial";

    await fetch(aPIString).then(function (response){

        

                    
        if(response.status !== 200){

            document.getElementById("error-heading").textContent = response.status + " error returned!!";
        
        } else {

            document.getElementById("error-heading").textContent = "";
            return response.json()
        }

    }).then (function(forecast){

        console.log(forecast)

        /* In order to display the forecast correctly, we must get the offset in hours from the UTC for both 
        the target location and the timezone of the user's local machine.  We then add together the local time in hours and
        the negative of the local time UTC offset, to convert the local time to UTC time.*/

        var localTimeUTCHourOffset = dayjs().utcOffset() / 60

        // console.log(localTimeUTCHourOffset);
        // console.log(targetTimeUTCHourOffset);

        var today = dayjs()


        /* Next, we take the current time and divide it by three, and round it to the nearest whole number.  This tells us
        what the correct hour offset is for pulling the weather forecast information from the array of forecast data, since the forecast data is in UTC time,
        according to https://openweathermap.org/forecast5.  The weather forecast information is provided in increments of three hours.*/
        
        for(var counter = 1; counter <= 5; counter++){

            var dayWeatherIcon = document.getElementById("weather-icon-day-" + (counter))

            var today = dayjs();
            var date = document.getElementById("date-day-" + (counter))

            date.textContent = today.add(counter + 1, 'day').format('MM/DD/YYYY');
            date.classList.add("my-0");

            /* When pulling the data from the forecast array, we then use the counter times 8 as the number of days, and add the 
            hour offset to then calculate which of the eight pieces of forecast data we should be displaying for each day.  The intent is 
            to display the piece of forecast data that is closest to the current UTC time, which will then be the data that is closest tot the
            target location's current time, for each day.*/
            dayWeatherIcon.src = "https://openweathermap.org/img/wn/" + forecast.list[(counter * 8 - 1)].weather[0].icon + "@2x.png";
            dayWeatherIcon.classList.add("d-inline");
            document.getElementById("temp-day-" + (counter)).textContent = "Temperature: " + forecast.list[(counter * 8) - 1].main.temp + " °F";
            document.getElementById("wind-day-" + (counter)).textContent = "Wind Speed: " + forecast.list[(counter * 8) - 1].wind.speed + " MPH";
            document.getElementById("humidity-day-" + (counter)).textContent = "Humidity: " + forecast.list[(counter * 8) - 1].main.humidity + "%";
        }

    });
}

function addQueriedCityToSearchHistory(event){

    var buttonData = []

    clearSearchHistoryButtons();

    var buttonKeys = Object.keys(localStorage).filter(key => key.startsWith("search-history-")).sort();

    for(var counter2 = 0; counter2 < buttonKeys.length; counter2++){

        
    
        var currentButtonData = JSON.parse(localStorage.getItem(buttonKeys[counter2]));

        if(currentButtonData['data-cityId'] === event.target.dataset.cityid){


            localStorage.removeItem(buttonKeys[counter2]);
            var indexToRemove = buttonKeys.indexOf(buttonKeys[counter2]);
            buttonKeys.splice(indexToRemove, 1);

            for (var counter = 0; counter < buttonKeys.length; counter++){

                buttonData.push(JSON.parse(localStorage.getItem(buttonKeys[counter])));
                localStorage.removeItem(buttonKeys[counter]);
    
            }

            localStorageItemCounter = 0

            
            for (var counter3 = 0; counter3 < buttonData.length; counter3++){

                localStorageItemCounter++;
                localStorage.setItem("search-history-" + localStorageItemCounter, JSON.stringify(buttonData[counter3]));
            }

            break;
        }
    }


        localStorageItemCounter++;
    
    

    var storedButton = event.target;
    storedButton.id = "search-history-" + localStorageItemCounter;


    localStorage.setItem(storedButton.id, JSON.stringify({
        
        "classList": event.target.classList,
        "data-cityId": event.target.dataset.cityid, 
        "data-cityName": event.target.dataset.cityname, 
        "data-icon": event.target.dataset.icon,
        "data-temp": event.target.dataset.temp,
        "data-humidity": event.target.dataset.humidity,
        "data-windSpeed": event.target.dataset.windspeed,
        "data-latitude": event.target.dataset.latitude,
        "data-longitude": event.target.dataset.longitude,
        "data-timezone": event.target.dataset.timezone
    }));

    localStorageItemCounter = localStorage.length;

    displaySearchHistory();
    displaySearchResultsHeadingAndClearButton();
}

function displaySearchHistory(){

    var buttonKeys = Object.keys(localStorage).filter(key => key.startsWith("search-history-")).sort();

    for(var counter = buttonKeys.length - 1; counter >= 0 ; counter--){

        var buttonAttributes = JSON.parse(localStorage.getItem(buttonKeys[counter]));

        var newButton = document.createElement("button");
        newButton.id = "search-history" + counter


        for(var counter2 = 0; counter2 < Object.keys(buttonAttributes).length; counter2++){

            if(counter2 === 0){
                
                for(var counter3 = 0; counter3 < Object.keys(buttonAttributes.classList).length; counter3++){

                    newButton.classList.add(buttonAttributes.classList[counter3]);
                }

            } else {

                var buttonAttributesArray = Object.entries(buttonAttributes);

                newButton.setAttribute(buttonAttributesArray[counter2][0], buttonAttributesArray[counter2][1]);

                if(buttonAttributesArray[counter2][0] === "data-cityName"){

                    newButton.textContent = buttonAttributesArray[counter2][1];
                }
            }
        }

        document.getElementById("clear-search-history").insertAdjacentElement('beforeBegin', newButton);
        newButton
        newButton.addEventListener("click", displayCurrentWeather);
        newButton.addEventListener("click", obtainAndDisplayWeatherForcast);
        newButton.addEventListener("click", addQueriedCityToSearchHistory);
    }
}


function clearSearchHistoryButtons(){

    var currentSearchHistoryButtons = document.getElementById("search-history").getElementsByClassName("btn-secondary");

    var numberOfButtons = currentSearchHistoryButtons.length;
    
    for (var counter = 0; counter < numberOfButtons; counter++){

        currentSearchHistoryButtons[0].remove();

    }
}

function clearSearchHistory(event){

    event.preventDefault();

    var buttonKeys = Object.keys(localStorage).filter(key => key.startsWith("search-history-"));

    var buttonKeyslength = buttonKeys.length

    for (counter = 0; counter < buttonKeyslength; counter++){

        localStorage.removeItem(buttonKeys[counter])
    }

    document.getElementById("clear-search-history").classList.add("d-none");
    document.getElementById("clear-search-history").classList.remove("d-block");
    document.getElementById("search-history-heading").classList.add("d-none");
    document.getElementById("search-history-heading").classList.remove("d-block");

    localStorageItemCounter = 0;

    clearSearchHistoryButtons();

}

function displaySearchResultsHeadingAndClearButton(){

    for(var counter = 0; counter < localStorage.length; counter++){

        if(localStorage.key(counter).startsWith("search-history-") === true){

            document.getElementById("search-history-heading").classList.add("d-block");
            document.getElementById("search-history-heading").classList.remove("d-none");
            document.getElementById("clear-search-history").classList.add("d-block");
            document.getElementById("clear-search-history").classList.remove("d-none");
            
            break;
        }

        
    }
}

displaySearchHistory();
displaySearchResultsHeadingAndClearButton();







/*http://api.openweathermap.org/geo/1.0/direct?q=London,GB&limit=5&appid=461175098122abca5bd4e6f6925a0790



"http://api.openweathermap.org/geo/1.0/direct?q=Columbus,OH,US&limit=5&appid=ed8e580622c5507cea04345d02c232b2"

https://api.openweathermap.org/geo/1.0/direct?q=London,GB&limit=5&appid=ed8e580622c5507cea04345d02c232b2

https://api.openweathermap.org/data/3.0/onecall?lat=51.50853&lon=-0.12574&appid=1b2bd4f01472b8f5040a1556773b2978*/