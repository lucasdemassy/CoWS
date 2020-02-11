//const influx = require('influxdb-nodejs');
const CronJob = require('cron').CronJob;
const fs = require('fs');
const nmea = require('@drivetech/node-nmea')
const influx = require("influx");

const DATABASE_NAME = 'weatherStationDB'

const influxClient = new influx.InfluxDB({});


influxClient.getDatabaseNames()
  .then(names => {
    if (!names.includes(DATABASE_NAME)) {
      return influxClient.createDatabase(DATABASE_NAME);
    }
  })

/*
const influxClient = new influx.InfluxDB({
  host: 'localhost',
  database: DATABASE_NAME
});

*/

//const client = new Influx('http://piensg011.ensg.eu/archive');

function translateJson2InfluxText(jsonSrc){
    let fileText = '# DML \n# CONTEXT-DATABASE: pirates \n# CONTEXT-RETENTION-POLICY: oneyear; \n\n' //oneday

    for(let mes of jsonSrc.measure){

      let stringMes = mes.name + " ";
      stringMes += ",unit='" + mes.unit + "' ";
      stringMes += ",desc='" + mes.desc + "' ";
      stringMes += "value=" + mes.value;
      stringMes += " " + Date.parse(jsonSrc.date);

      fileText += stringMes + "\n";
    }


      // fs.writeFile("/tmp/test", "Hey there!", function(err) {
      // if(err) {
        //   return console.log(err);
      // }});

      // console.log("The file was saved!");
      console.log(fileText);
  };


function translate_Json_InfluxPoint(jsonSrc){
  let listInfluxPoints = new Array();

  for(let mes of jsonSrc.measure){

    let influxPoint = {
          measurement: mes.name,
          tags: { unit: mes.unit, desc: mes.desc },
          fields: { value: mes.value},
          timestamp: Date.parse(jsonSrc.date)
      };

    listInfluxPoints.push(influxPoint);
  }

return(listInfluxPoints);
}

function writerInflux(input_file){

  let textSrc = fs.readFileSync(input_file).toString();

  let jsonObject = JSON.parse(textSrc);

  let listPoints = translate_Json_InfluxPoint(jsonObject);
  console.log("Writing sensors data in the database")

  for (var i = 0; i < listPoints.length; i++) {
    influxClient.writePoints([
    {
      measurement: listPoints[i]['measurement'],
      tags: {'description' : listPoints[i]['tags']['desc'], 'units' : listPoints[i]['tags']['unit']},
      fields: {value : parseInt(listPoints[i]['fields']['value'])},
      timestamp: listPoints[i]['timestamp'],
    }
    ], {
      database: DATABASE_NAME,
      precision: 'ms',
    }).catch(err => {
      console.error(`Error saving data to InfluxDB! ${err.stack}`)
    });
  }

}

function writerInflux_GPS(input_file){
  let textSrc = fs.readFileSync(input_file).toString();
  let arrayOfLines = textSrc.match(/[^\r\n]+/g);
  console.log("Writing GPS data in the database")
  for(var i = 0; i < arrayOfLines.length; i++){
    let data = nmea.parse(arrayOfLines[1])
    let date = Date.parse(data.datetime);
    let lat = data.loc['geojson']['coordinates'][1];
    let lng = data.loc['geojson']['coordinates'][0];


    influxClient.writePoints([
    {
      measurement: 'coordinate',
      tags: {'longitude' : lng, 'latitude' : lat},
      fields: {value : data.valid},
      timestamp: date,
    }
    ], {
      database: DATABASE_NAME,
      precision: 'ms',
    }).catch(err => {
      console.error(`Error saving data to InfluxDB! ${err.stack}`)
    });

  }


}

function writerInflux_rain(input_file){
  let textSrc = fs.readFileSync(input_file).toString();
  let arrayOfLines = textSrc.match(/[^\r\n]+/g);
  let date = Date.parse(new Date(arrayOfLines[0]));
  console.log("Writing rain data in the database")
  influxClient.writePoints([
  {
    measurement: 'rain',
    tags: {'description' : "Dates des basculements", 'units' : 'mm/m²'},
    fields: {value : 0.32},
    timestamp: date,
  }
  ], {
    database: DATABASE_NAME,
    precision: 'ms',
  }).catch(err => {
    console.error(`Error saving data to InfluxDB! ${err.stack}`)
  });
}



var job = new CronJob('0/20 * * * *', function() {
  writerInflux('/dev/shm/sensors');
  writerInflux_GPS("/dev/shm/gpsNmea");
  writerInflux_rain("/dev/shm/rainCounter.log")
}, null, true, 'America/Los_Angeles');
job.start();
