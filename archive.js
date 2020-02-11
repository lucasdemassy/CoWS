let mymap = L.map('map').setView([47.375897, 1.2590706], 5);


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);


let listTab = document.getElementsByClassName('nav-link');

//global variable to stock the charts created and destroy them before the creation of a new one
let listCharts = new Array();

// global variables to access the time between start and end of acquisition
let start;
let end;

let listMarkers = new Array();

/**
 * Manage the current active tab
 *
 */
let tab_status = function(){
  let listTabA = document.getElementsByClassName('nav-link active');

  for (let i = 0; i < listTab.length; i++){

    listTabA[i].className = "nav-link"; }

	this.className = "nav-link active";
	this.setAttribute("aria-selected","true");
}

for (let i = 0; i < listTab.length; i++) {
    listTab[i].addEventListener('click', tab_status, false);
}

/**
 *
 * Get the Data and launch visualisation functions
 *
 *
 */

function getData(id,init){

  let divError = document.getElementById("error");
  divError.innerHTML = "";

  let listPossible = ["temperature","pressure","humidity","luminosity","wind","rain"];
  let listMeasurements = new Array();
  let ids = [9,10,11,18];

  let markers = listMarkers;
  listMarkers = new Array();

  markers.forEach(marker => {
    mymap.removeLayer(marker);
  })


  start = document.getElementById("startArch").value;
  end = document.getElementById("endArch").value;

  if(init){
    listMeasurements = listPossible ;
    start = "2020-02-01T00:00"
    end = "2020-02-01T16:00"
  }
  else{
    listPossible.forEach(element => {
      let checkBox = document.getElementById(element);
      if(checkBox.checked){
        listMeasurements.push(element);
      }
    });
  }

  let url = constructURL(id);

  // add the capteurs to the url
  if(listMeasurements.length==listPossible.length){
    url += "all"
  }
  else{
    listMeasurements.forEach(element => {
      let strElmt = element.substring(0,3);
      url += strElmt + ",";
    });
    url = url.substring(0,url.length-1)
  }

  url += "&start=" + start + "&stop=" + end;

  console.log(url);


//launch the acquisition of data in the archive mode for the selected station
  fetch(url,{credentials: 'same-origin'}).then(result => {
    return result.json();
  }).then(jsonT => {

    if (jsonT.result) {
      let json = jsonT.result;

      //mapStations(json.id,json.coordinate,json.metadata);

      listMeasurements.forEach(element => {
        setGraph(json.id,json.measurements[element],element);
      });
    }
    else if(jsonT.error){
      let divError = document.getElementById("error");

      divError.innerHTML = "PIENSG " + id + " : " + JSON.stringify(jsonT);
    }
  });

  ids.forEach(element => {
    //if(element!=id){
      let newURL = constructLiveURL(element);
      newURL += listPossible[0].substring(0,3);
      console.log(newURL);

      fetch(newURL,{credentials: 'same-origin'}).then(result => {
        return result.json();
      }).then(jsonT => {

        if(jsonT.result){

          let json = jsonT.result;


          mapStations(json.id,json.coordinate,json.metadata);
        }
        else{
          let divError = document.getElementById("error");

          divError.innerHTML += "PIENSG " + element + " : " + JSON.stringify(jsonT);

        }
      });
    //}
  })

}

/**
 * Formating the data to make it usable by graphs
 *
 */

function formateData(json,name) {


  let dataJson = json.data;
  let data = new Array();
  let dates = new Array();

  if(name != "wind" && name != "rain"){
    dataJson.forEach(element => {

      data.push(element[1]);
      let date = new Date(element[0]).toString();
      let cleanDate = date.split("GMT")[0].split(" ");

      let orderDate = cleanDate[2] + " " + cleanDate[1] + " " + cleanDate[3] + " " + cleanDate[4];

      dates.push(orderDate);
    });

    return([dates,data]);
  }

  // 4 data for the wind
  else if (name == "wind"){
    let type1 = new Array();
    let type2 = new Array();
    let type3 = new Array();
    let type4 = new Array();

    dataJson.forEach(element => {
      type1.push(element[1]);
      type2.push(element[2]);
      type3.push(element[3]);
      type4.push(element[4]);

      let date = new Date(element[0]).toString();
      let cleanDate = date.split("GMT")[0].split(" ");

      let orderDate = cleanDate[2] + " " + cleanDate[1] + " " + cleanDate[3] + " " + cleanDate[4];

      dates.push(orderDate);
    });

    return([dates,type1,type2,type3,type4]);
  }
// special dat of the rain
  else if (name=="rain"){


      let startDate = new Date(start);
      let endDate = new Date(end);

      let hours = Math.ceil(Math.abs(startDate - endDate) / 36e5);


      let hoursDate = new Array();
      let hoursStr = new Array();

      hoursDate.push(startDate)

      for (let index = 0; index < hours; index++) {
        if(index == hours - 1){
          hoursDate.push(endDate);
        }
        else{
          let newHour = hoursDate[index];
          newHour.setHours( newHour.getHours() + 1 );
          hoursDate.push(newHour);
        }
      }

     let iRain = 0;
     let rainsCount = new Array();

     for (let index = 0; index < hoursDate.length; index++) {
      let between = true;
      let numberOfRains = 0;

      while(between){

      if(iRain >= dataJson.length){
        between = false
      }

      let date = new Date(dataJson[iRain]);

      if(date<hoursDate[index+1]){
        numberOfRains ++
        iRain++
       }
      else{
        rainsCount.push(numberOfRains)
        between = false;
      }
      }



     }

    hoursDate.forEach(date => {
      let string = date.toString();

      let cleanDate = string.split("GMT")[0].split(" ");

      let orderDate = cleanDate[2] + " " + cleanDate[1] + " " + cleanDate[3] + " " + cleanDate[4];

      hoursStr.push(orderDate);
    });

    return([hoursStr,rainsCount])
  }


}

/**
 * construction of the graphs
 *
 */
function setGraph(id,json,name) {

  let ctx = document.getElementById('myChart_'+name).getContext('2d');
  let data = formateData(json,name);


  let datasets = new Array();

  if(name != "rain"){
    for (let i = 1; i < data.length; i++) {
      let element = data[i];
      let label = json.description[i-1];

      let red = Math.random()*255;
      let blue = Math.random()*255;
      let green = Math.random()*255;

      datasets.push({label : label, data : element, backgroundColor : 'rgba('+ red +','+ green +','+ blue +')',borderColor : 'rgba('+ red +','+ green +','+ blue +', 0.2)'});
    }

    for( var i = 0; i < listCharts.length; i++){
      if ( listCharts[i].config.constuctedId == "Chart-"+name) {
        console.log("destroying the previous chart");
        listCharts[i].destroy();
        listCharts.splice(i, 1);
      }
    }

    let myChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data[0],
        datasets: datasets
      },
      constuctedId : "Chart-"+name
    });

    let divPIENSG = document.getElementById(name+"-Station");
    divPIENSG.innerHTML = "data from PIENSG " + id;

    listCharts.push(myChart);
  }
  else{
    let labelDate = new Array();

    for (let i = 1; i < data.length; i++) {
      let element = data[i];
      let label = json.description[(i-1)*data.length];

      let red = Math.random()*255;
      let blue = Math.random()*255;
      let green = Math.random()*255;

      datasets.push({label : label, data : element, backgroundColor : 'rgba('+ red +','+ green +','+ blue +')',borderColor : 'rgba('+ red +','+ green +','+ blue +', 0.2)'});
    }

    for (let i = 0; i < data[1].length; i++) {
      labelDate.push(data[0][i] + "-" + data[0][i+1])
    }


    for( var i = 0; i < listCharts.length; i++){
      if ( listCharts[i].config.constuctedId == "Chart-"+name) {
        console.log("destroying the previous chart");
        listCharts[i].destroy();
        listCharts.splice(i, 1);
      }
    }

    let myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labelDate,
        datasets: datasets
      },
      constuctedId : "Chart-"+name
    });

    let divPIENSG = document.getElementById(name+"-Station");
    divPIENSG.innerHTML = "data from PIENSG " + id;
    listCharts.push(myChart);

  }


}



/**
 * Mapping the stations
 *
 */
function mapStations(id,jsonCoord, metadata){
  console.log(id);

  let date = new Date(jsonCoord.date).toString();
  let cleanDate = date.split("GMT")[0].split(" ");

  let orderDate = cleanDate[2] + " " + cleanDate[1] + " " + cleanDate[3] + " " + cleanDate[4];

  let marker = L.marker([jsonCoord.latitude, jsonCoord.longitude]).addTo(mymap)
  .bindPopup("The weather station " + metadata.nom + "'s position on the " + orderDate + " <br /> <button id='locker' type='button' name='button' onclick='getData("+id+",false)' value='actualise'>Select this station</button>");

  listMarkers.push(marker);
}

/**
 * construction of the url to request the server
 *
 */
function constructURL(id){
  let url = "http://piensg";

  if(id>=10){
    url += "0" + id;
  }
  else{
    url += "00" + id;
  }

  url += ".ensg.eu/archive?capteurs="

  return(url);
}

/**
 * construction of simple url to get location of stations
 *
 */
function constructLiveURL(id){
  let url = "http://piensg";

  if(id>=10){
    url += "0" + id;
  }
  else{
    url += "00" + id;
  }

  url += ".ensg.eu/live?capteurs="

  return(url);
}


getData(11,true);
