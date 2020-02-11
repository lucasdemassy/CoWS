let mymap = L.map('map').setView([47.375897, 1.2590706], 5);


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);


let listTab = document.getElementsByClassName('nav-link');

let listMarkers = new Array();


/**
 * Manage the current active tab
 *
 */
let tab_status = function(){
  let listTabA = document.getElementsByClassName('nav-link active');

  for (let i = 0; i < listTab.length; i++){
    listTabA[i].className = "nav-link";

	}
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

  let listPossible = ["temperature","pressure","humidity","luminosity","wind","rain"];
  let listMeasurements = new Array();
  let ids = [9,10,11,18];

  let divError = document.getElementById("error");
  divError.innerHTML = "";


  // clean the markers to don't have them multiple times on the map
  let markers = listMarkers;
  listMarkers = new Array();

  markers.forEach(marker => {
    mymap.removeLayer(marker);
  })


  if(init){
    listMeasurements = listPossible ;
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
console.log(url);
// launch the request to the server to get the live data
  fetch(url,{credentials: 'same-origin'}).then(result => {
      return result.json();
  }).then(jsonT => {
    if(jsonT.result){

      let json = jsonT.result;

      //mapStations(json.id,json.coordinate,json.metadata);

      listMeasurements.forEach(element => {
        logLiveData(id,json.measurements[element],element);});
    }
    else if(jsonT.error){
      let divError = document.getElementById("error");

      divError.innerHTML = "PIENSG " + id + " : " + JSON.stringify(jsonT);
    }
  });

// launch the requests to get the markers and their positions
  ids.forEach(element => {
    //if(element!=id){
      let newURL = constructURL(element);
      newURL += listPossible[0].substring(0,3);
      //console.log(newURL);

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

  if(name!="wind"){
    dataJson.forEach(element => {
      // let newPoint = {x: Date.parse(element[0]), y: element[1]};
      // let newPoint = element[1];
      data.push(element[1]);

      let date = new Date(element[0]).toString();
      let cleanDate = date.split("GMT")[0].split(" ");

      let orderDate = cleanDate[2] + " " + cleanDate[1] + " " + cleanDate[3] + " " + cleanDate[4];

      dates.push(orderDate);
    });

    return([dates,data]);
  }
  // wind takes multiples streams/types of data so we need to multiple the tasks
  else{
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


}

/**
 * construction of the log in the web site
 *
 */
function logLiveData(id,json,name) {

  let data = formateData(json,name);

  let datasets = new Array();

  for (let i = 1; i < data.length; i++) {
    let element = data[i];
    let label;
    if(name != "wind"){
      label = name;
    }
    else{
      label = json.description[i-1];
    }
    datasets.push({label : label, data : element});
  }

// log the data
  if(name != "wind" && name != "rain"){
    let div = document.getElementById("nav-"+name);
    div.innerHTML = "PIENSG " + id + " : " + datasets[0].label + " @ " + data[0] + " : " + datasets[0].data + " " + json.units[1];
  }
// log the 4 data of wind
  else if (name=="wind"){
    let div = document.getElementById("nav-"+name);
    div.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      div.innerHTML += "PIENSG " + id + " : " + datasets[i].label + " @ " + data[0] + " : " + datasets[i].data + " " + json.units[i+1] + "<br />"

    }
  }
//log the last rain
  else if (name=="rain"){
    let div = document.getElementById("nav-"+name);
    div.innerHTML = "PIENSG " + id + " : " + "last rain @ " + data[0];
  }
}

/**
 * Mapping the stations
 *
 */
function mapStations(id,jsonCoord, metadata){

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

  url += ".ensg.eu/live?capteurs="

  return(url);
}

getData(11,true);
