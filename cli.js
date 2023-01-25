#!/usr/bin/env node

let minimist = require("minimist");
let moment = require("moment-timezone");

let latitude;
let longitude;
let timezone;
let day;

let argv = minimist(process.argv.slice(2));

if (argv["h"]) {
    console.log(`Usage: galosh.js [options] -[n|s] LATITUDE -[e|w] LONGITUDE -z TIME_ZONE
    -h            Show this help message and exit.
    -n, -s        Latitude: N positive; S negative.
    -e, -w        Longitude: E positive; W negative.
    -z            Time zone: uses tz.guess() from moment-timezone by default.
    -d 0-6        Day to retrieve weather: 0 is today; defaults to 1.
    -j            Echo pretty JSON from open-meteo API and exit.`);
    process.exit(0);
}

if (argv["n"] && argv['s']) {
    console.log("Cannot specify LATITUDE twice");
    process.exit(1);
}
latitude = parseFloat(argv["n"] || -argv["s"] || 0).toFixed(1);

if (argv["e"] && argv['w']) {
    console.log("Cannot specify LONGITUDE twice");
    process.exit(1);
}
longitude = parseFloat(argv["e"] || -argv["w"] || 0).toFixed(1);

if (argv["z"]) {
    timezone = argv["z"];
} else {
    timezone = moment.tz.guess();
}

if (argv["d"]) {
    day = argv["d"];
} else {
    day = 1;
}

if (argv["j"]) {
    echoJson();
} else {
    galoshDecision();
}

async function echoJson() {
    console.log(await getWeatherJson());
}

async function getWeatherJson() {
    let URL = createURL();
    let weatherResponse = fetch(URL);
    return (await weatherResponse).json()
}

async function getDayPrecipHours(dayNum) {
    let weatherJson = await getWeatherJson();
    return weatherJson.daily.precipitation_hours[0];
}

async function galoshDecision() {
    precipHours = await getDayPrecipHours(day);

    let dayPhrase;
    switch (day) {
        case 0:
            dayPhrase = "today";
            break;
        case 1:
            dayPhrase = "tomorrow";
            break;
        default:
            dayPhrase = `in ${day} days`;
            break;
    }

    if (precipHours > 0) {
        console.log(`You might need your galoshes ${dayPhrase}`);
    } else {
        console.log(`You probably won't need your galoshes ${dayPhrase}`);
    }
}


function createURL() {
    return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_hours&timezone=${timezone}`;
}