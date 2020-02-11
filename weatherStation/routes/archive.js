const express = require('express');
var router = express.Router();
const influx = require("influx");

const DATABASE_NAME = 'weatherStationDB'

// Influx database description
const influxClient = new influx.InfluxDB({
  host: 'localhost',
  database: DATABASE_NAME
});

router.get('/', function(req, res, next) {
  // Allow cross origin access
  res.header("Access-Control-Allow-Origin", "*");

  // Initializing variables
  let measurement = ["coordinate"]
  let measurements = {}
  let lat;
  let lng;
  let date_GPS;
  let initial_json = {
    description : [],
    units : ['dates'],
    data : []
  };

  try{

    // Starting date indication
    const start = new Date(req.query.start);
    if (isNaN(start)) {
      res.json({error:"the start date is inaproppriate"})
    }
    const start_date = Date.parse(start) * 1000000;

    // Ending date indication
    const stop = new Date(req.query.stop);
    if (isNaN(stop)) {
      res.json({error:"the stop date is inaproppriate"})
    }
    const stop_date = Date.parse(stop) * 1000000;

    // Get sensors input from the URL
    cap = req.query.capteurs.split(",");
    if(cap.includes("all")){
      measurement = ["temperature","humidity","pressure","rain","luminosity", 'wind_heading','wind_speed_avg','wind_speed_max','wind_speed_min',"coordinate"]
      measurements = {
        "temperature":{
          description : [],
          units : ['dates'],
          data : []
        },
        "humidity":{
          description : [],
          units : ['dates'],
          data : []
        },
        "pressure":{
          description : [],
          units : ['dates'],
          data : []
        },
        "rain":{
          description : [],
          units : ['dates'],
          data : []
        },
        "luminosity":{
          description : [],
          units : ['dates'],
          data : []
        },
        "wind":{
          description : [],
          units : ['dates'],
          data : []
        }
      }
    }
    else{
      if(cap.includes("tem")){
        measurement.push("temperature");
        measurements = Object.assign({
          "temperature":initial_json
        })
      }
      if(cap.includes("hum")){
        measurement.push("humidity")
        measurements = Object.assign({
          "humidity":initial_json
        })
      }
      if(cap.includes("pre")){
        measurement.push("pressure");
        measurements = Object.assign({
          "pressure":initial_json
        })
      }
      if(cap.includes("ran")){
        measurement.push("rain")
        measurements = Object.assign({
          "rain":initial_json
        })
      }
      if(cap.includes("lum")){
        measurement.push("luminosity")
        measurements = Object.assign({
          "luminosity":initial_json
        })
      }
      if(cap.includes("win")){
        measurement.push('wind_heading','wind_speed_avg','wind_speed_max','wind_speed_min')
        measurements = Object.assign({
          "wind": initial_json 
        });
      }
    }

    // Do multiple asynchronous queries to the database
    queries= [];
    for(var i = 0; i< measurement.length; i++){
      try{
        queries.push(influxClient.query(`
          select description, units, value, latitude, longitude from ` + measurement[i] + ` where time >= ` + start_date + ` AND time <= ` + stop_date
        ));
      } catch(error){
        console.log(error);
        res.json({error:"inaproppriate query"})
      }
    }

    // When all queries are finished
    Promise.all(queries).then(q => {
      let no_data = []
      // For each sensor
      for(var i = 0; i<q.length; i++){
        // If wind sensor
        if(new RegExp("wind*").test(measurement[i])){
          measurement[i] = "wind"
          measurements["wind"]['description'].push(q[i][0]['description']);
          measurements["wind"]['units'].push(q[i][0]['units'])
          // Gathering wind values
          for(var j = 0; j<q[i].length; j++){
            // If it's the first wind value to add
            if(measurements["wind"]['data'].length < q[i].length){
              measurements["wind"]['data'].push([q[i][j]['time'], q[i][j]['value']]);
            }
            // If wind values already exist, don't push time
            else{
              measurements["wind"]['data'][j].push(q[i][j]['value']);
            }
          }
        }
        // If GPS sensor
        else if (new RegExp("coordinate").test(measurement[i])) {
          lat = q[i][q[i].length - 1]['latitude'];
          lng = q[i][q[i].length - 1]['longitude'];
          date_GPS = q[i][q[i].length - 1]['time'];
        }
        // try if other queries return something
        else{
          let data = [];
          let units = ["date"];
          var description;
          try {
            description = [q[i][0]['description']];
            if(!new RegExp("rain").test(measurement[i])){
              units.push(q[i][0]['units']);
            }
            for(var j = 0; j<q[i].length; j++){
              if(new RegExp("rain").test(measurement[i])){
                // In case of dry period, the database query doesn't retrun anything
                data.push([q[i][j]['time']]);
              }
              else {
                data.push([q[i][j]['time'], q[i][j]['value']]);
              }
            }
          } catch (error) {
            /*
            If a query returns nothing --> save the sensor,
            then query the database to get its description and units
            */
            no_data.push(measurement[i])
          }

          measurements[measurement[i]] = {
            description : description,
            units : units,
            data : data
          }

        }
      }
      return [measurements, no_data];
    }).then(result => {
      measurements = result[0];
      no_data = result[1];

      let queries_no_data = [];
      /*
      For each query that didn't return anything
      get its description and units
      */
      for(var i = 0; i < no_data.length; i++){
        try{
          queries_no_data.push(influxClient.query(`
            select last(*), description, units, latitude, longitude from ` + no_data[i]
          ));
        } catch(error){
          console.log(error);
          res.json({error:"inaproppriate query"})
        }
      }

      // When all queries are finished
      Promise.all(queries_no_data).then(query => {
        for (var i = 0; i < query.length; i++) {
          let data = [];
          let units = ["date"];
          var description = query[i][0]['description'];
          // If the rain sensor is queried
          if(!new RegExp("Dates").test(description)){
            units.push(query[i][0]['units']);
          }
          measurements[no_data[i]] = {
            description : description,
            units : units,
            data : data
          }
        }
        return measurements
      }).then(measurements => {
        /*
        After checking correct queries and
        queries that didn't return anything,
        the page returns a JSON
        */
        let result = {
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
      });
    })

  }
  catch(error){
    res.json({error: "parameters undefined"});
  }
});

module.exports = router;
