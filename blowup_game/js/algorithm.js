var numSims;
var numTrials;
var percentToBet;
var winMultiplier;
var chanceOfBlowup;
var percentOfBetToBlowup;
var binNumber;
var kernelEp;

var capital = [];

function updateSimulation()
{
    capital = [];
    console.log("Updating the simulation, please be patient...");
    for (let i = 0; i < numSims; ++i)
    {
      var money = 100.0;
      for(let j = 0; j < numTrials; ++j)
      {
        var betAmount = (percentToBet / 100) * money;
        if(Math.random() > (chanceOfBlowup / 100))
          money += winMultiplier * betAmount - betAmount;
        else
          money -= betAmount * (percentOfBetToBlowup / 100);
        if(money < 0)
        {
          money = 0;
          break;
        }
      }
      //console.log(money);
      capital.push(Math.floor(money));
    }
}

// Function to compute density
function kernelDensityEstimator(kernel, X) 
{
    return function(V) {
      return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
  }

function kernelEpanechnikov(k) 
{
    return function(v) {
      return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

var hasRunOnce = false;

function loadValuesFromForm()
{
    numSims = document.getElementById("numSimsFromGUI").value;
    numTrials = document.getElementById("numTrialsFromGUI").value;
    percentToBet = document.getElementById("percentToBetFromGUI").value;
    winMultiplier = document.getElementById("winMultiplierFromGUI").value;
    chanceOfBlowup = document.getElementById("chanceOfBlowupFromGUI").value;
    percentOfBetToBlowup = document.getElementById("percentOfBetToBlowupFromGUI").value;
    binNumber = document.getElementById("binNumberFromGUI").value;
    kernelEp = document.getElementById("kernelEpFromGUI").value;


    updateSimulation();
    updateChart();

    // Look, you kinda have to run that twice the first time
    // I dont know man, it just works
    if(!hasRunOnce)
    {
      updateChart();
      hasRunOnce = true;
    }
}


//============================GLOBALS============================
/* you should define anything up here that stays static throughout your visualization. It is the design of your
visualization that determines if a variable/svg/axis/etc. should remain in the global space or should
be animated/updated etc. Typically, you will put things here that are not dependent on the data.
 */


// define margins in pixels. Use these to define total space allotted for this chart, within the chart area.
// For multiple charts, you can define multiple margin arrays
var margins = { left:50, right:40, top:50, bottom:50};

//define chart sizes
var width = 1100 - margins.left - margins.right;
var height = 400 - margins.top - margins.bottom;

//grab entire body
//d3.select() grabs html objects and can modify them. Here you are designating a block of space
var g = d3.select("#chart-area")
//define the block size
    .append("svg")
    .attr("width", width + margins.left + margins.right)
    .attr("height", height + margins.top + margins.bottom)
    //define the chart location
    .append("g")
    .attr("transform", "translate(" + margins.left + ", " + margins.top  + ")");


    var xAxisGroup = g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height +")");

var yAxisGroup = g.append("g")
    .attr("class", "y axis");


    // Y Scale
var y = d3.scaleLinear()
.range([height, 0]);

// X Scale
var x = d3.scaleLinear()
.range([0, width]);


function updateChart() {
  console.log("Updating chart");

  g.selectAll("path").remove();

  //x.domain([0, d3.max(data, function(d) { return d[value] })]);
  //y.domain([0, d3.max(data, function(d) { return d[value] })]);

  // X Axis
  var xAxisCall = d3.axisBottom(x)
   .tickFormat(function(d){ return "$" + d; });
  xAxisGroup.call(xAxisCall);

  // Y Axis
  var yAxisCall = d3.axisLeft(y);
  yAxisGroup.call(yAxisCall);

  var xMax = d3.max(capital, function(d){ return d; });

  //revisit scales and axes
  x.domain([-100, xMax + 500]);

  // Draw density curve
  var kde = kernelDensityEstimator(kernelEpanechnikov(kernelEp), x.ticks(binNumber));
  var density =  kde(capital);


  var yMax = d3.max(density, function(d){ return d[1] });
  //y.domain([0, yMax]);

  y.domain([0, yMax]);
  

  g.append("path")
  .attr("class", "linepath")
  .datum(density)
  .attr("fill", "#D6E4E4")
  .attr("opacity", ".8")
  .attr("stroke", "#000")
  .attr("stroke-width", 1)
  .attr("stroke-linejoin", "round")
  .attr("d",  d3.line()
    .curve(d3.curveBasis)
      .x(function(d) { return x(d[0]); })
      .y(function(d) { return y(d[1]); })
  );


  // Get bins via histogram

  var histogram = d3.histogram()
  .value(function(d) { return d; })   // I need to give the vector of value
  .domain(x.domain())  // then the domain of the graphic
  .thresholds(x.ticks(binNumber)); // then the numbers of bins

// And apply this function to data to get the bins
var bins = histogram(capital);
// Jittering the points
var points = [];
for(let i = 0; i < bins.length; ++i)
{
  for(let j = 0; j < bins[i].length; ++j)
  {
    points.push([bins[i][j] + (Math.random() * (10) - 5), Math.random() * yMax]);
  } 
}

g.selectAll("circle").remove();


g.append('g')
.selectAll("dot")
.data(points)
.enter()
.append("circle")
  .attr("cx", function (d) { return x(d[0]); } )
  .attr("cy", function (d) { return y(d[1]); } )
  .attr("r", 1.5)
  .style("fill", "#000000")
  .style("opacity", "0.2")


  //yLabel.text("Revenue");

}