var countrySelectBox = document.getElementById("countries-box");
var stateSelectBox = document.getElementById("states-box");
var citySearchBox = document.getElementById("city-search-box");
var searchButton = document.getElementById("search-button");
var errorHeading = document.getElementById("error-heading");
var clearSearchHistoryButton = document.getElementById("clear-search-history")

var localStorageItemCounter = null

var errorFound = false;

var printedCityNamesMK2 = [];

stateSelectBox.disabled = true;
citySearchBox.disabled = true;

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

// This function populates the counter for the number of search histories that are in local storage.
function populateLocalStorageItemCounter(){

    var counter = localStorage.getItem("local-storage-item-counter") 
    
    if( counter === null){

        localStorageItemCounter = 0;

    } else {

        localStorageItemCounter = counter;
    }
}

// This function populates the countries dropdown box.
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

// This function populates the U.S. states dropdown box.
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

/* This function  calls the Open Weather Map geolocating API to determine city coordinates.  For each pair of coordinates that is returned,
the function plugs the coordinates back into the Open Weather Map API.  Each time the user submits a query, the first result of this second operation is always kept. 
However, for any subsequent reuslts, if the city names returned by the geolocating API and the weather API differ and one doesn't contain the other, the result will be discarded.  If the names
match or one contains the other for any subsequent results, those results will be kept.*/
async function determineGeographicCoordinatesAndCityNames(event){

    var foreignStateName = ""

    var numberOfSearchResultsOnPage = 0;

    errorHeading.textContent = "";

    event.preventDefault();

    var searchResults = document.getElementById("search-results");

    var buttons = searchResults.querySelectorAll('button');
    
    for(var counter = 0; counter < buttons.length; counter++){

        buttons[counter].remove();
    }

    event.preventDefault();

    var citySearchBoxValue = citySearchBox.value;

    // I implemented the replace method by using https://www.tutorialspoint.com/How-to-replace-all-occurrences-of-a-string-in-JavaScript#:~:text=To%20replace%20all%20occurrences%20of%20a%20string%20in%20JavaScript%20there,of%20the%20strings%20in%20JavaScript.
    var doctoredSearchBoxValue= citySearchBoxValue.replace(new RegExp("'", 'g'), '%27');

    doctoredSearchBoxValue = doctoredSearchBoxValue.replace(new RegExp(" ", 'g'), '+');
    doctoredSearchBoxValue = doctoredSearchBoxValue.replace(new RegExp("\\(", 'g'), '%28');
    doctoredSearchBoxValue = doctoredSearchBoxValue.replace(new RegExp("\\)", 'g'), '%29');

    // The Xpert Learning AI Assistant told me how to get the value out of a dropdown box option.
    if(countrySelectBox.value === "US"){

        var aPIString = 'https://api.openweathermap.org/geo/1.0/direct?q=' + doctoredSearchBoxValue +',' + stateSelectBox.value + ',US' + '&limit=5&appid=1b2bd4f01472b8f5040a1556773b2978';

    } else {

        var aPIString = 'https://api.openweathermap.org/geo/1.0/direct?q=' + doctoredSearchBoxValue + ',' + countrySelectBox.value + '&limit=5&appid=1b2bd4f01472b8f5040a1556773b2978';
    }

    document.getElementById("search-results-heading").textContent = "Searching...";
    
    fetch(aPIString).then(function (response){

        return checkForErrorCodes(response);
        
    }).then( async function(data){

        var foreignCityNameWithState  = false;

        var printedCityNames = [];
        

        if(stateSelectBox.value === ""){
            
            countryAndState =  countrySelectBox.options[countrySelectBox.selectedIndex].text;
        
        } else {

            countryAndState = stateSelectBox.options[stateSelectBox.selectedIndex].text + ", " + countrySelectBox.options[countrySelectBox.selectedIndex].text;
        }

        if(data.length === 0){

            errorHeading.textContent = "No Results Found!";
        }

        /* If the country is foreign and a state is returned by the geolocating API, the name of the state will be stored.
        This is for the purposes of differentiating cities from each other if there are two cities in the same country with the same name. */
        for (var counter = 0; counter < data.length; counter++){

            if((data[counter].state !== undefined)  && (countrySelectBox.value !== "US")){

                foreignStateName = data[counter].state;
                foreignCityNameWithState = true;
            
            } else {

                foreignCityNameWithState = false;
            }

            var cityName = data[counter].name;

            var stateName = "";

            if(data[counter].country === "US"){

                stateName = data[counter].state;
            } 

            var countryName = data[counter].country;

            /*To keep things, simple I rounded the latitude and longitude to four decimal places.  I was running into an issue where the system would round the coordinates
            to four decimal places.  The system rounds the coordiantes to four decimal places in the output data.  I thought this would reduce issues with outputs not being uniform. */
            roundedLatitude = data[counter].lat.toFixed(4);
            roundedLongitude = data[counter].lon.toFixed(4);
            var aPIString = "https://api.openweathermap.org/data/2.5/weather?lat=" +  roundedLatitude + "&lon=" + roundedLongitude + "&appid=1b2bd4f01472b8f5040a1556773b2978&units=imperial";
            console.log(aPIString);

            await fetch(aPIString).then(function (response){

                return checkForErrorCodes(response);

            /*To try to limit the number of edge cases and odd scenarios, I decided to  call the weather data API for each location that the geolocating API returned.  
            If the city name given by the geolocating API doesn't contain or match the name given by the weather data API or vice versa, the result will be discarded 
            from the list of search results, unless the result is the first one returned from an API call.  To give an example, I was searching the geolocating API for
            Vauxhall, United Kingdom, but when typing the provided coordinates back into the weather data API, I would receive city names of places such as Liverpool or Lambeth.  
            The reason for this seems to be that Vauxhall is a smaller region within Liverpool and Lambeth.*/
            }).then(function(weatherData){

                /* I added a check onto this condition to make sure the state matched, because, when searching for a city in a particular state, such as Denver, Colorado, 
                the API was also returning results in other states, such as Denver, Indiana, even though I had put the state code in the API call.  */
                if (((cityName.includes(weatherData.name) || weatherData.name.includes(cityName)) || counter === 0) && ((countrySelectBox.value === "US") ? (stateSelectBox.options[stateSelectBox.selectedIndex].text === stateName) : (true)) && (countrySelectBox.value ===countryName)){

                    var printedCityName =  weatherData.name + ", " + countryAndState;
                    var printedCityNameMK2 = "";
                    

                    if(foreignCityNameWithState === true){


                        printedCityNameMK2 = weatherData.name + ", " + foreignStateName + ", " + countryAndState

                        printedCityNamesMK2.push(printedCityNameMK2);
                    }

                    // I included this check because one result for Upernavik, Greenland came back with no city name in the returned data.
                    if(weatherData.name === ""){

                        printedCityName = countryAndState;
                    }

                    printedCityNames.push(printedCityName);
                
                    var searchResult = document.createElement("button");
                    searchResult.id = "search-history-" + counter;
                    searchResult.textContent = printedCityNames[counter];
                    searchResult.classList.add("btn");
                    searchResult.classList.add("btn-secondary");
                    searchResult.classList.add("my-2");
                    searchResult.classList.add("mx-4");
                    searchResult.setAttribute("data-cityid", weatherData.id);
                    searchResult.setAttribute("data-cityname", printedCityName);
                    searchResult.setAttribute("data-icon", weatherData.weather[0].icon)
                    searchResult.setAttribute("data-temp", weatherData.main.temp)
                    searchResult.setAttribute("data-humidity", weatherData.main.humidity)
                    searchResult.setAttribute("data-windspeed", weatherData.wind.speed)
                    searchResult.setAttribute("data-latitude", roundedLatitude);
                    searchResult.setAttribute("data-longitude", roundedLongitude);
                    searchResult.setAttribute("data-timezone", weatherData.timezone);
                    searchResult.addEventListener("click", displayCurrentWeather);
                    searchResult.addEventListener("click", obtainAndDisplayWeatherForecast);
                    searchResult.addEventListener("click", addQueriedCityToSearchHistory);
                    
                    var searchResults = document.getElementById("search-results");

                    searchResults.insertAdjacentElement('beforeend', searchResult);

                    numberOfSearchResultsOnPage++;

                    var searchResultButtons = searchResults.querySelectorAll('button')

                    for(var counter2 = 1; counter2 < searchResultButtons.length; counter2++){

                        if(searchResultButtons[counter2].textContent === searchResultButtons[counter2 - 1].textContent  && foreignCityNameWithState === true){

                            searchResultButtons[counter2].textContent = printedCityNamesMK2[counter2];
                            searchResultButtons[counter2].setAttribute("data-cityname", printedCityNamesMK2[counter2]);
                            searchResultButtons[counter2 - 1].textContent = printedCityNamesMK2[counter2 - 1];
                            searchResultButtons[counter2 - 1].setAttribute("data-cityname", printedCityNamesMK2[counter2 - 1]);
                        }
                    }

                } else {

                    printedCityNames.push(0);
                } 

            }).catch(function(error){

                catchErrors(error);
            });
        }

        if(numberOfSearchResultsOnPage > 0){

            document.getElementById("search-results-heading").textContent = "Search Results:";
        
        } else if(errorFound === false){

            document.getElementById("search-results-heading").textContent = "";
            errorHeading.textContent = "There were no results found for your search!";
        } 

    }).catch(function(error){

        catchErrors(error);
    });
}

/* This function checks other input fields when the country select box's value changes, and changes them
and disables them appropriately.*/
function checkCountrySelectBox(){

    if(countrySelectBox.value !== ""){
        
        if(countrySelectBox.value === "US"){

            stateSelectBox.disabled = false;
            citySearchBox.disabled = true;
            citySearchBox.value = "";
            searchButton.disabled = true;

        } else if (countrySelectBox.value !== "US"){

            stateSelectBox.disabled = true;
            stateSelectBox.value = "";
            citySearchBox.value = "";
            citySearchBox.disabled = false;
            searchButton.disabled = true;
        } 

    } else {

        stateSelectBox.disabled = true;
        stateSelectBox.value = "";
        citySearchBox.value = "";
        citySearchBox.disabled = true;
        searchButton.disabled = true;
    }
}

/* * This function checks other input fields when the state select box's value changes, and changes them
and disables them appropriately.*/
function checkStateSelectBox(){

    if(stateSelectBox.value !== ""){

        citySearchBox.disabled = false;

    } else{

        citySearchBox.disabled = true;
        citySearchBox.value = "";
        searchButton.disabled = true;
    }
}

// This function disables the search button appropriately if the city search box's value changes to an empty string.
function checkCitySearchBox(event){

    /* The reason for the 1 millisecond delay here is to give the city textbox time to populate, 
    so that the event wouldn't fire, and then then the system would see that the textbox had no characters 
    in it, fail to enable the Submit button, and then put the character in the textbox.  */
    setTimeout(function() {

        if(citySearchBox.value !== ""){

            searchButton.disabled = false;
    
        } else {
            
            searchButton.disabled = true;
        }

    }, 1)
}

// This function displays the current weather data for the city that the user clicks in the search results. 
function displayCurrentWeather(event){

    event.preventDefault();

    var mainWeatherIcon = document.getElementById("main-weather-icon");

    document.getElementById("main-city-name").textContent = event.target.dataset.cityname + " (" + dayjs().format('MM/DD/YYYY') +")";
    mainWeatherIcon.src = "https://openweathermap.org/img/wn/" + event.target.dataset.icon + "@2x.png";
    mainWeatherIcon.alt = "The weather icon for the current weather data.";

    mainWeatherIcon.classList.add("d-block");
    
    document.getElementById("main-city-name").classList.add("mb-0");
    document.getElementById("latitude-main").textContent = "Latitude: " + event.target.dataset.latitude + "°";
    document.getElementById("longitude-main").textContent = "Longitude: " + event.target.dataset.longitude + "°";
    document.getElementById("temp-main").textContent = "Temperature: " + event.target.dataset.temp + " °F";
    document.getElementById("wind-main").textContent = "Wind Speed: " + event.target.dataset.windspeed + " MPH";
    document.getElementById("humidity-main").textContent = "Humidity: " + event.target.dataset.humidity + "%";
   
}

/* This function calls the Open Weather Map forecast API and displays the data in the five red cards on the page. */
async function obtainAndDisplayWeatherForecast(event){

    var aPIString = "https://api.openweathermap.org/data/2.5/forecast?lat=" + event.target.dataset.latitude  + "&lon=" + event.target.dataset.longitude + "&appid=1b2bd4f01472b8f5040a1556773b2978&units=imperial";

    await fetch(aPIString).then(function (response){

        return checkForErrorCodes(response, true);

    }).then (function(forecast){

        console.log(forecast)

        var today = dayjs()

        for(var counter = 1; counter <= 5; counter++){

            var dayWeatherIcon = document.getElementById("weather-icon-day-" + (counter))

            var today = dayjs();
            var date = document.getElementById("date-day-" + (counter))

            date.textContent = today.add(counter + 1, 'day').format('MM/DD/YYYY');
            date.classList.add("my-0");

            /* When pulling the data from the forecast array, I used the counter as the number of days, and then multiplied it by eight 
            to calculate which of the 40 pieces of forecast data the page should be displaying.  The intent is to display the piece of
             forecast data that is closest to the current time, for each of the future five days.*/
            dayWeatherIcon.src = "https://openweathermap.org/img/wn/" + forecast.list[(counter * 8 - 1)].weather[0].icon + "@2x.png";
            dayWeatherIcon.alt = "The weather icon for the day " + counter + "weather forecast";
            dayWeatherIcon.classList.add("d-inline");
            document.getElementById("temp-day-" + (counter)).textContent = "Temperature: " + forecast.list[(counter * 8) - 1].main.temp + " °F";
            document.getElementById("wind-day-" + (counter)).textContent = "Wind Speed: " + forecast.list[(counter * 8) - 1].wind.speed + " MPH";
            document.getElementById("humidity-day-" + (counter)).textContent = "Humidity: " + forecast.list[(counter * 8) - 1].main.humidity + "%";
        }

    }).catch(function(error){

        catchErrors(error, true);
    });
}

// This function adds each search result that the user clicks to the system's local storage.
function addQueriedCityToSearchHistory(event){

    localStorageItemCounter = localStorage.length;

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

// This function gets the search history from the system's local storage and displays it on the page.
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
        newButton.addEventListener("click", displayCurrentWeather);
        newButton.addEventListener("click", obtainAndDisplayWeatherForecast);
        newButton.addEventListener("click", addQueriedCityToSearchHistory);
    }
}

// This function removes the search history buttons (except for the Clear Search History button) from the page when the user clicks the Clear Search History button.
function clearSearchHistoryButtons(){

    var currentSearchHistoryButtons = document.getElementById("search-history").getElementsByClassName("btn-secondary");

    var numberOfButtons = currentSearchHistoryButtons.length;
    
    for (var counter = 0; counter < numberOfButtons; counter++){

        currentSearchHistoryButtons[0].remove();
    }
}

/* This function removes the search history from the system's local storage when the user clicks the Clear Search History button.
It also hides the Clear Search History button and Search History heading.*/
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

/* This function displays the Search Results heading and Clear Search History button when appropriate. */
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

// This is code to display an error message if one is encountered.
function catchErrors(error, forecast = false){
        
    document.getElementById("error-heading").textContent = "Error returned: " + error.message;
    document.getElementById("search-results-heading").textContent = "";
    
    errorFound = true;

    if (forecast === true){

        document.getElementById("error-heading").textContent = "Error returned: " + error.message + ", forecast data API call failed!"
    }
}

// The purpose of this function is to display the response code if one other than 200 is received.
function checkForErrorCodes(response, forecast = false){
    
    if(response.status !== 200){
        
        document.getElementById("error-heading").textContent = response.status + " error returned!!";
        document.getElementById("search-results-heading").textContent = "";
        
        errorFound = true;

        if (forecast === true){

            document.getElementById("error-heading").textContent = response.status + " error returned! Forecast data API call failed!"
        }
    
    } else {

        document.getElementById("error-heading").textContent = "";
        
    }

    return response.json();
}

displaySearchHistory();
displaySearchResultsHeadingAndClearButton();