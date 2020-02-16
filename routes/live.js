var express = require('express');
var router = express.Router();
const influx = require("influx");

const cors = require("cors");

const DATABASE_NAME = 'weatherStationDB'

const influxClient = new influx.InfluxDB("http://localhost:8086/" + DATABASE_NAME);

router.get('/', cors(), function(req, res, next) {
  // Allow cross origin access
  res.header("Access-Control-Allow-Origin", "*");

  // Initializing variables
  let measurement = ["coordinate"]
  let measurements = {}
  let lat;
  let lng;
  let date_GPS;

  try{
    // Get sensors input from the URL
    cap = req.query.capteurs.split(",");
    if(cap.includes("all")){
      measurement = ["temperature","humidity","pressure","rain","luminosity", 'wind_heading','wind_speed_avg','wind_speed_max','wind_speed_min', "coordinate"]
      measurements = {
        "temperature":0,
        "humidity":0,
        "pressure":0,
        "rain":0,
        "luminosity":0,
        "wind":{
          description : [],
          units : ["date"],
          data : []
        }
      }
    }
    else{
      if(cap.includes("tem")){
        measurement.push("temperature");
        measurements = Object.assign({
          "temperature":0
        })
      }
      if(cap.includes("hum")){
        measurement.push("humidity")
        measurements = Object.assign({
          "humidity":0
        })
      }
      if(cap.includes("pre")){
        measurement.push("pressure");
        measurements = Object.assign({
          "pressure":0
        })
      }
      if(cap.includes("ran")){
        measurement.push("rain")
        measurements = Object.assign({
          "rain":0
        })
      }
      if(cap.includes("lum")){
        measurement.push("luminosity")
        measurements = Object.assign({
          "luminosity":0
        })
      }
      if(cap.includes("win")){
        measurement.push('wind_heading','wind_speed_avg','wind_speed_max','wind_speed_min')
        measurements = Object.assign({
          "wind": {
            description : [],
            units : ["date"],
            data : []
          }
        });
      }
    }

    // Do multiple asynchronous queries to the database
    queries= [];
    for(var i = 0; i< measurement.length; i++){
      try{
        queries.push(influxClient.query(
          'SELECT description, units, value, latitude, longitude FROM ' + measurement[i] + ` ORDER BY time DESC LIMIT 1`
        ));
      } catch(error){
        console.log(error);
        res.json({error:"inaproppriate query"})
      }
    }

    // When all queries are finished
    Promise.all(queries).then(q => {
      //For each sensor
      for(var i = 0; i<q.length; i++){
        //If wind sensor
        if(new RegExp("wind*").test(measurement[i])){
          measurement[i] = "wind"
          //Gathering wind values
          for(var j = 0; j<q[i].length; j++){
            //If it's the first wind value to add
            if(measurements["wind"]['data'].length < q[i].length){
              measurements["wind"]['data'].push([q[i][j]['time'], q[i][j]['value']]);
            }
            //If wind values already exist, don't push time
            else{
              measurements["wind"]['data'][j].push(q[i][j]['value']);
            }
            measurements["wind"]['description'].push(q[i][j]['description']);
            measurements["wind"]['units'].push(q[i][j]['units'])
          }
        }
        // If GPS sensor
        else if (new RegExp("coordinate").test(measurement[i])) {
          lat = q[i][q[i].length - 1]['latitude'];
          lng = q[i][q[i].length - 1]['longitude'];
          date_GPS = q[i][q[i].length - 1]['time'];
        }
        else{
          let data = [];
          let units = ["date"]
          if(!new RegExp("rain").test(measurement[i])){
            units.push(q[i][0]['units']);
          }
          for(var j = 0; j<q[i].length; j++){
            if(new RegExp("rain").test(measurement[i])){
              data.push([q[i][j]['time']]);
            }
            else {
              data.push([q[i][j]['time'], q[i][j]['value']]);
            }
          }
          measurements[measurement[i]] = {
            description : [q[i][0]['description']],
            units : units,
            data : data
          }
        }
      }
      result = {
         'id': 11,
         'metadata': {
             'nom': "Piensg 011"
         },
         'coordinate': {
             'longitude': lng,
             'latitude': lat,
             'date': date_GPS,
             'success': true
         },
         measurements
      }
      res.json({result:result});
    })

  }
  catch(error){
    res.json({error: "parameters undefined"});
  }
});

module.exports = router;
