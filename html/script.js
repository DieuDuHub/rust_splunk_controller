

let countries = [];
let dataToShow = [];
let datafilter = null;
let max_nb_policy = 0;
let topten = [];
let index = 0;
let world = null;
let max_amount = 0;
let sum_policy = 0;
let sum_amount = 0;

const colorScale = d3.scaleSequential(d3.interpolate("lightskyblue", "midnightblue"));

// URL Params  
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);


let isRandom = 0;

if (urlParams.get('israndom') != undefined) {
  isRandom = parseInt(urlParams.get('israndom'));
}
console.log(isRandom);
let maxTop = 99;

if (urlParams.get('maxtop') != undefined) {
  maxTop = parseInt(urlParams.get('maxtop'));
}

let refreshtime = 10000;
if (urlParams.get('refreshtime') != undefined) {
  refreshtime = urlParams.get('refreshtime');
}

let mock = 0;
if (urlParams.get('mock') != undefined) {
  mock = urlParams.get('mock');
}

// Load initiale JSON lovcal fule with Country , ISO2 and Polygonal shape for designing on of the globe
const refresh = () => fetch('./ne_110m_admin_0_countries.geojson')
  .then(res => res.json())
  .then(countries => {
    if (mock == 1) {
      consolidateFix(countries);
    }
    else {
      consolidate(countries);
    }
  });

const consolidate = (dataset) => {
  /* Data Load */
  // Fetch data from the API
  fetch('/splunk', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJraWQiOiJzcGx1bmsuc2VjcmV0IiwiYWxnIjoiSFM1MTIiLCJ2ZXIiOiJ2MiIsInR0eXAiOiJzdGF0aWMifQ.eyJpc3MiOiJuaWNvbGFzdCBmcm9tIHNoLWktMDM2ZmI0ZTM4YWYwNTVkNDMiLCJzdWIiOiJuaWNvbGFzdCIsImF1ZCI6IkFEUCBURVNUIiwiaWRwIjoiU3BsdW5rIiwianRpIjoiNzE3ZjVjZmEzYTI5M2IwMTQwODkxZWNlZjliMTBlYTI0OTU1Yjc1NjkyMmRkNDJkOTE5NmUxNjk5YjhhZDFlZSIsImlhdCI6MTczMjY5ODk3OCwiZXhwIjoxNzM3ODgyOTc4LCJuYnIiOjE3MzI2OTg5Nzh9.vkTCCdHhXMmby8gXqdREMADZSOZEuEOCzgc1-xBk4CKcL1n-ITyGoDiFiOsbtA5jzrdNs7dCAxbFxsxi4mP-Xg' // Replace with your credentials
    }
  })
    .then(response => response.json())
    .then(data => {
      enhanced_data_with_splunk(dataset, data);
    });
};

// Consolidate the countries data by adding Policies stats from splunk and Nb police , amount. Create also the TopTen filter for animation
    
const consolidateFix = (dataset) => {
  fetch('./splunk.json')
    .then(response => response.json())
    .then(data => {
      enhanced_data_with_splunk(dataset, data);
    });
};

const enhanced_data_with_splunk = (dataset, data) => {
  sum_amount = data.max_amount;
  sum_policy = data.max_policy;

  for (let j = 0; j < dataset.features.length; j++) {
    for (let i = 0; i < data.markets.length; i++) {
      const row = data.markets[i];
      if (row.market_code == dataset.features[j].properties.ISO_A2) {

        dataset.features[j].properties['NBPOL'] = row.market_policies;
        dataset.features[j].properties['AMOUNT'] = Math.round(row.market_amount, 2);


        dataset.features[j].properties['ALT'] = parseFloat(0.06);
        dataset.features[j].properties['ISSELECT'] = false;

        dataset.features[j].properties['saleschannels'] = row.saleschannels;

    }
    if (dataset.features[j].properties['NBPOL'] === undefined) {
      dataset.features[j].properties['NBPOL'] = parseInt(0);
      dataset.features[j].properties['AMOUNT'] = parseInt(0);
      dataset.features[j].properties['ALT'] = parseFloat(0.06);
      dataset.features[j].properties['ISSELECT'] = false;
    }

  };
};

  // Filter by amount
  dataset.features.sort(compareNumbers).reverse();

  refreshGlobe(dataset);
}

// used to filter array by top
function compareNumbers(a, b) {
  return parseFloat(a.properties.AMOUNT) - parseFloat(b.properties.AMOUNT);
}

// fetchData().catch(error => console.error('Fetching data failed:', error));

const getVal = feat => {
  return feat.properties.AMOUNT;
};

const refreshGlobe = (dataset) => {

  const maxVal = Math.max(...dataset.features.map(getVal));
  colorScale.domain([0, dataset.max_amount]);

  world = Globe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .lineHoverPrecision(0)
    .polygonsData(dataset.features)//.filter(d => d.properties.ISO_A2 !== 'AQ'))
    .polygonAltitude(d => d.properties.ALT)
    .polygonCapColor(feat => feat.properties.NBPOL == 0 ? 'lightgrey' : colorScale(getVal(feat)))
    .polygonSideColor(() => 'rgba(100, 100, 100, 0.15)')
    .polygonStrokeColor(() => '#111')
    .pathStroke("50px")
    .polygonLabel(({ properties: d }) => `
      <div class="custom-div">
        <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
        Amount: <i>${d.AMOUNT}</i> $<br/>
        Policies sold : <i>${d.NBPOL}</i>
        </div>
      `)
    // .onPolygonHover(hoverD => world
    //   .polygonAltitude(d => d === hoverD ? 0.12 : 0.06)
    //   .polygonCapColor(d => d === hoverD ? 'steelblue' : colorScale(getVal(d)))
    // )
    .polygonsTransitionDuration(300)
    (document.getElementById('globeViz'))

  // Add auto-rotation
  //  world.controls().autoRotate = true;
  world.controls().autoRotateSpeed = 0.6;

  let span = document.getElementById("hello");
  let txt = document.createTextNode(max_nb_policy);
  span.appendChild(txt);

  const MAP_CENTER = { lng: -47.55, lat: -15.47, altitude: 1.5 };
  world.pointOfView(MAP_CENTER, 1);

  countrygeo(dataset);
};

const countrygeo = (dataset) => {
  fetch('./countrygeo.json')
    .then(res => res.json())
    .then(countries => {
      for (let i = 0; i < countries.features.length; i++) {
        let prop = countries.features[i];
        for (let j in dataset.features) {
          if (prop.properties.iso2 == dataset.features[j].properties.ISO_A2) {
            dataset.features[j].properties.lat = prop.geometry.coordinates[1];
            dataset.features[j].properties.lng = prop.geometry.coordinates[0];
          }
        }
      }
      dataToShow = dataset;
      return countries;
    });
};

const timerefresh = () => {

  dataToShow.features[index].properties['ALT'] = parseFloat(0.06);
  dataToShow.features[index].properties['ISSELECT'] = false;

  index++;
  let max = 10;
  max = (maxTop != 99) ? max = maxTop : topten.length;
  if (isRandom == 1) {
    index = Math.floor(Math.random() * max);
  }

  if (index >= max) {
    index = 0;
  }

  let reference = dataToShow.features[index].properties;

  let MAP_CENTER = { lng: reference.lng, lat: reference.lat, altitude: 2.0 };

  world.pointOfView(MAP_CENTER, 3000);

  let span = document.getElementById("hello");

  let txt = "<i>Today sales API Target</i><br><br> Total policies : <b>" + sum_policy + "</b><br> Total amount : <b>" + new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
    sum_amount) + " euros</b><br><br><b>Country : " + reference.ADMIN + "</b><br> Policies  : " + reference.NBPOL + "<br> Amount (EUR)  : " + new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
      reference.AMOUNT);

  span.innerHTML = txt;

  dataToShow.features[index].properties['ALT'] = parseFloat(0.50);

  span.appendChild(simplebar());

  world.polygonsData(dataToShow.features);


};

const simplebar = () => {
  // Prepare data subset
  let dd = [];

  let select = dataToShow.features[index];

  for (let j in select.properties.saleschannels) {

    let val = { name: select.properties.saleschannels[j].sc_bp, value: select.properties.saleschannels[j].sc_amount };
    dd.push(val);
  }

  dd = dd.splice(0, 10);

  // Specify the chart’s dimensions, based on a bar’s height.
  const barHeight = 25;
  const marginTop = 30;
  const marginRight = 0;
  const marginBottom = 10;
  const marginLeft = 30;
  const width = 400;
  const height = Math.ceil((dd.length + 0.1) * barHeight) + marginTop + marginBottom;

  // Create the scales.
  const x = d3.scaleLinear()
    .domain([0, d3.max(dd, d => d.value)])
    .range([marginLeft, width - marginRight]);

  const y = d3.scaleBand()
    .domain(d3.sort(dd, d => -d.value).map(d => d.name))
    .rangeRound([marginTop, height - marginBottom])
    .padding(0.1);

  // Create a value format.
  const format = x.tickFormat(20, "%");

  // Create the SVG container.
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Append a rect for each letter.
  svg.append("g")
    .attr("fill", "steelblue")
    .selectAll()
    .data(dd)
    .join("rect")
    .attr("x", x(0))
    .attr("y", (d) => y(d.name))
    .attr("width", (d) => x(d.value) - x(0))
    .attr("height", y.bandwidth());

  // Append a label for each letter.
  /*
  svg.append("g")
      .attr("fill", "white")
      .attr("text-anchor", "end")
    .selectAll()
    .data(dd)
    .join("text")
      .attr("x", (d) => x(d.value))
      .attr("y", (d) => y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("dx", -4)
      .text((d) => d.value)
    .call((text) => text.filter(d => x(d.value) - x(0) < 20) 
      .attr("dx", +4)
      .attr("fill", "black")
      .attr("text-anchor", "start"));
      */

  // Create the axes.
  svg.append("g")
    .attr("transform", `translate(0,${marginTop})`)
    .call(d3.axisTop(x).ticks(5))
    .call(g => g.select(".domain").remove());

  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0));

  return svg.node();
}
refresh();
setInterval(refresh, 60000 * 30);
setInterval(timerefresh, refreshtime);
