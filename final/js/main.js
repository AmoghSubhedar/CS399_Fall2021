// oh god oh man i dont know javascript/css
// this is the messiest code ive ever written
// im so sorry

//============================GLOBALS============================
/* you should define anything up here that stays static throughout your visualization. It is the design of your
visualization that determines if a variable/svg/axis/etc. should remain in the global space or should
be animated/updated etc. Typically, you will put things here that are not dependent on the data.
 */



// define margins in pixels. Use these to define total space allotted for this chart, within the chart area.
// For multiple charts, you can define multiple margin arrays
var margins = { left:0, right:0, top:50, bottom:150};

//define chart sizes
var width = 1200 - margins.left - margins.right;
var height = 800 - margins.top - margins.bottom;

var width_time = width * 0.70;

var width_total = width * 0.20;

var time_graph_offset = width_total + width * 0.10;

//used to swap between stacked area and individual areas
var showingStackedArea = true;
var keys;
//define the transition times in milliseconds
//var t = d3.transition().duration(750);
var seperatedStacks;
var stackedData;

var maxStackedY;
var maxIndividualY;

var coloring;

var totalSamples = 0;

var cropDataSet = true;
var cropDataSetByTop = 3;
var completeKeySet;

var s_data;
var totals;

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


var xAxisGroup;

var yAxisGroup;

/* We begin the definition of the scales here because these attributes
are not dependent on the live data. We will modify onlt the necessary attributes
in the update loop. */
// X Scale
var x = d3.scaleLinear()
    .range([0, width_time]);

// Y Scale
var y = d3.scaleLinear()
    .range([height * 0.5, 0]);

/* Again, notice that we are not defining every attribute. We will modify what needs to be updated
in the update loop. */
// X Label
var xLabel;

// Y Label
var yLabel;

    var gfill;

// Transitions to individual graphs
var currentlyStacked = true;
var tempAxes;
function triggerTransition(time_duration){

    //currentlyStacked = !currentlyStacked;

    var yIndividualHeight = height * (1 / keys.length);

    var yIndividualHeightTopMargin = yIndividualHeight * 0.2;

    var yIndividualHeightInside = yIndividualHeight - yIndividualHeightTopMargin;


    // Animate label movements
    if(currentlyStacked)
    {
        xLabel.transition().duration(time_duration).attr("y", (height / 2) + 50);

        yLabel.transition().duration(time_duration).attr("x", -(height / 4));
    }
    else
    {
        xLabel.transition().duration(time_duration).attr("y", (height) + 50);

        yLabel.transition().duration(time_duration).attr("x", -(height / 2));
    }


    if(currentlyStacked)
    {
        //d3.selectAll(".temp_y").remove();
        
        y = d3.scaleLinear()
        .range([height * 0.5, 0]);

        y.domain([0, maxStackedY * 1.1]);

        //var yAxisCall = d3.axisLeft(y);
        yAxisGroup.transition().duration(time_duration).call(d3.axisLeft(y).ticks(6)).attr("transform", "translate( " + time_graph_offset + ", 0)");

        d3.selectAll(".temp_y").transition().duration(time_duration).call(d3.axisLeft(y).ticks(6)).attr("transform", "translate( " + time_graph_offset + ", 0 )").remove();

        xAxisGroup.transition().duration(time_duration).call(d3.axisBottom(x).ticks(5)).attr("transform", "translate(" + time_graph_offset + "," + height / 2 +")");

    }
    else
    {

        xAxisGroup.transition().duration(time_duration).call(d3.axisBottom(x).ticks(5)).attr("transform", "translate(" + time_graph_offset + "," + height +")");

        d3.selectAll("temp_y axis").remove();

        y = d3.scaleLinear()
        .range([yIndividualHeightInside, 0]);

        y.domain([0, maxIndividualY * 1.1]);

        //var yAxisCall = d3.axisLeft(y);
        yAxisGroup.transition().duration(time_duration).call(d3.axisLeft(y).ticks(1)).attr("transform", "translate( " + time_graph_offset + ", " + yIndividualHeightTopMargin +" )");

        for(let i = 1; i < keys.length; ++i)
        {
            var y_temp = d3.scaleLinear().range([height * 0.5, 0]).domain([0, maxStackedY * 1.1]);

            var yAxisGroup_temp = g.append("g").attr("class", "temp_y temp_y" + i + " axis").attr("transform", "translate( " + time_graph_offset + ", 0)");
            yAxisGroup_temp.transition().duration(time_duration).call(d3.axisLeft(y_temp).ticks(6));

            var y_temp1 = d3.scaleLinear().range([yIndividualHeightInside, 0]).domain([0, maxIndividualY * 1.1]);

            yAxisGroup_temp.transition().duration(time_duration).call(d3.axisLeft(y_temp1).ticks(1));

            var transitionY = (yIndividualHeight * i) + yIndividualHeightTopMargin;

            d3.select(".temp_y" + i)
            .transition()
            .duration(time_duration)
            .attr("transform", "translate( " + time_graph_offset + ", " + transitionY +" )");
            //tempAxes
            //.attr("transform", "translate( " + width + ", 0 )")
        }
    }

    //y.domain([0, maxStackedY * 1.1]);
    //var u = g.selectAll("mylayers")
    //.data(currentlyStacked ? stackedData : seperatedStacks);



    console.log("Transitioning");
    gfill
      .data(currentlyStacked ? stackedData : seperatedStacks)
      .transition()
      .duration(time_duration)
      //.style("fill", function(d) { console.log(d.key) ; return color(d.key); })
      .attr("d", d3.area()
        .x(function(d, i) { return x(d.data.timestamp); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
    ).attr("transform", function(d, i) {
        var transitionY = ( (currentlyStacked ? 0 : d.offset) * yIndividualHeight) + (currentlyStacked ? 0 : yIndividualHeightTopMargin);
        return "translate( " + time_graph_offset + ", " + transitionY + ")"});
  }


  var Tooltip = d3.select("#chart-area").append("div")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")
  .style("pointer-events", "none")
  .style("vertical-align", "bottom")

  var mouseover = function(d) {
    Tooltip
      .style("opacity", 1)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
  }

  var mousemove = function(d) {
   Tooltip
  .html(d.data.name + ":<br>Samples: " + d.value + "<br>" + d3.format(".2%")(d.value / totalSamples))
  .style("top", function(d) { if(d3.event.pageY) {prevY = d3.event.pageY;} return (prevY -  d3.select('.tooltip').node().getBoundingClientRect().height) + "px"; })
  .style("left", function(d) { if(d3.event.pageX) {prevX = d3.event.pageX;} return prevX + "px"; })
  }
  var mouseleave = function(d) {
    Tooltip
      .style("opacity", 0)
    d3.select(this)
      .style("stroke", "none")
      .style("opacity", 0.8)
  }


  var TooltipGraph = d3.select("#chart-area").append("div")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip tooltipG")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")
  .style("pointer-events", "none")
  .style("vertical-align", "bottom")

  var mouseoverGraph = function(d) {
    TooltipGraph
      .style("opacity", 1)
  }

  var mousemoveGraph = function(d) {

    var selection = d3.select(this);
    var m = d3.mouse(selection.node());
    var domRect = document.getElementById("chart-area").getBoundingClientRect();

    var correctedXPos = m[0];// + domRect.left;

    var xValue = x.invert(correctedXPos);

    const bisectorData = d3.bisector(function(d) {
        return d.data.timestamp;
      }).left;
    const xIndex = bisectorData(d, xValue, 1);
    //const mouseYValue = data[xIndex].population;

      // INDEX IS MAYBE RIGHT
      // CONT USING https://observablehq.com/@elishaterada/simple-area-chart-with-tooltip
      // TO IMPLEMENT A TOOLTIP
      // THEN FIX THE COLORS AND SHIP IT

   TooltipGraph
  //.html(d.data.name + ":<br>Samples: " + d.value + "<br>" + d3.format(".2%")(d.value / totalSamples))
  .html(function(d) {
    if(d3.event.pageX) {prevX = d3.event.pageX;}

    
    
    return "test";})
  .style("top", function(d) { if(d3.event.pageY) {prevY = d3.event.pageY;} return (prevY -  d3.select('.tooltipG').node().getBoundingClientRect().height) + "px"; })
  .style("left", function(d) { if(d3.event.pageX) {prevX = d3.event.pageX;} return (m[0] + time_graph_offset + domRect.left) + "px"; })
  }
  var mouseleaveGraph = function(d) {
    TooltipGraph
      .style("opacity", 0)
  }


//========================Data Loading=======================
/* Load the raw data file, anything that's local gets worked with within this async function. d3 can handle these
three file types; csv, tsv, and json.
IMPORTANT: This call is new to D3 v5. You may need to modify code that you take from the internet for compatibility */

var prevX = 0;
var prevY = 0;

//d3.csv("data/revenues.csv").then(function(data){
//d3.tsv("data/revenues.tsv").then(function(data){
d3.csv("data/data1.csv").then(function(data){
     console.log(data);

     

               // create a tooltip

  
  //data.columns = data.columns.slice(0, 4);

    // Pull module names out of the headers
    keys = data.columns.slice(1);

    
    coloring = d3.scaleOrdinal()
    .domain(keys)
    .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf'])

    // Clean the data
    data.forEach(function(d) {
        keys.forEach(function(k) {
            d[k] = +d[k];
        });
        d["timestamp"] = +d["timestamp"];
    });

    totals = JSON.parse(JSON.stringify(data[data.length - 1]));

    var totalsNamesPairs = [];
    for(let i = 0; i < keys.length; ++i)
    {
        totalsNamesPairs.push({[keys[i]]: totals[keys[i]]});//[keys[i]] =  totals[keys[i]];//push({keys[i], totals[keys[i]]});
    }

    totalsNamesPairs.sort(function(a, b) {
        return a[Object.keys(a)[0]] < b[Object.keys(b)[0]] ? 1 : -1;
      });


          // redo keys with this new sorting
    for(let i = 0; i < totalsNamesPairs.length; ++i)
    {
        keys[i] = Object.keys(totalsNamesPairs[i])[0];
    }

    // Can be used to draw out the top X keys
    completeKeySet = keys.slice();
    

    s_data = data;
    // Run the update in the first frame.
    update();
});

function update() {

 xAxisGroup = g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + time_graph_offset + "," + height / 2 +")");

 yAxisGroup = g.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + time_graph_offset + ", 0)");



    // Tooltips for graphs



// Make a fresh copy of the data for manipulation
var data = JSON.parse(JSON.stringify(s_data));
data.columns = JSON.parse(JSON.stringify(s_data.columns));

if(cropDataSet)
{
    keys = [];
    data.columns = ["timestamp"];
    for(let i = 0; i < cropDataSetByTop; ++i)
    {
        data.columns.push(completeKeySet[i]);
        keys.push(completeKeySet[i]);
    }
}
else
{
    keys = completeKeySet.slice();
    data.columns = ["timestamp"];
    data.columns.push.apply(data.columns, completeKeySet);
    //data.columns = data.columns.append(completeKeySet);
}


//var sorted_data;
//sorted_data["columns"][0] = data["columns"][0];
for (let i = 0; i < keys.length; i++) {
    data["columns"][1 + i] = keys[i];
}


// Process the data into increments
// Stores the number of new readings each increment
var incrementData = data;

for (let i = data.length - 1; i > 0; i--) {
    keys.forEach(function(k) {
        incrementData[i][k] = incrementData[i][k] - incrementData[i - 1][k];
    });
}

keys = keys.reverse();
stackedData = d3.stack().keys(keys)(data);

//stackedData;



maxStackedY = 0;
stackedData[stackedData.length - 1].forEach(function(d) {
    maxStackedY = Math.max(maxStackedY, d[1]);
});

maxIndividualY = 0;
//var ymax = maxStackedY;

stackedData.forEach(function(d) {
    d.offset =  (stackedData.length - 1);
});

// "unstacked" stacks, they overlap
// we want to transition to these (with a position offset of the whole chart)
// when splitting the stacked areas into individual ones
seperatedStacks = JSON.parse(JSON.stringify(stackedData));

for (let i = 1; i < seperatedStacks.length; i++)
{
    for (let j = 0; j < seperatedStacks[i].length; j++)
    {
        seperatedStacks[i][j][0] -= stackedData[i - 1][j][1];
        seperatedStacks[i][j][1] -= stackedData[i - 1][j][1];
    }
}

// Finish the deep copy, cover the stuff not dealt with by the json stringify trick
for (let i = 0; i < seperatedStacks.length; i++)
{
    seperatedStacks[i].key = stackedData[i].key;
    for (let j = 0; j < seperatedStacks[i].length; j++)
    {
        maxIndividualY = Math.max(seperatedStacks[i][j][1], maxIndividualY);
        seperatedStacks[i][j].data = stackedData[i][j].data;
    }
    seperatedStacks[i].offset = (stackedData.length - 1) - i ;
}


// create area chart

// Store the totals
totalSamples = 0;
keys.forEach(function(k) {
    totalSamples += totals[k];
});

var totalsTree = {};
totalsTree.children = new Array();

//totalsTree.children.push({value: "", name: "Origin", parent: ""});

keys.forEach(function(k) {
    totalsTree.children.push({});
    totalsTree.children[ totalsTree.children.length - 1].value = totals[k];
    totalsTree.children[ totalsTree.children.length - 1].name = k;
});

var root = d3.hierarchy(totalsTree).sum(function(d){ return d.value}).sort(function(a,b) {
    return b.value - a.value;
})




d3.treemap()
.round(true)
.tile(d3.treemapSlice)
.size([width_total , height])
.padding(2)
(root);

g
.selectAll("rect")
.data(root.leaves())
.enter()
.append("rect")
  .attr('x', function (d) { return d.x0; })
  .attr('y', function (d) { return d.y0; })
  .attr('width', function (d) { return d.x1 - d.x0; })
  .attr('height', function (d) { return d.y1 - d.y0; })
  .attr("fill",  function(d){ return coloring(d.data.name)} )
  .attr("title",  function(d){ return d.data.name} )
  .style("stroke", "none")
  .style("opacity", 0.8)
  .on("mouseover", mouseover)
  .on("mousemove", mousemove)
  .on("mouseleave", mouseleave)
  //.style("fill", "#69b3a2");

//// and to add the text labels
g
.selectAll("text")
.data(root.leaves())
.enter()
.append("text")
  .attr("x", function(d){ return d.x0+10})    // +10 to adjust position (more right)
  .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
  .style("width", function(d) { return d.x1 - d.x0 + "px"; })
  .style("height", function(d) { return d.y1 - d.y0 + "px"; })
  .text(function(d){ return d.data.name})
  .attr("font-size", "15px")
  .attr("fill", "white")
.style("pointer-events", "none")


// X Label
xLabel = g.append("text")
    .attr("y", (height / 2) + 50)
    .attr("x", width_time / 2 + time_graph_offset)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Time");

// Y Label
yLabel = g.append("text")
    .attr("y", -60 + time_graph_offset)
    .attr("x", -(height / 4))
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Samples");

    //var ymax = 0;
    if(showingStackedArea)
    {
        // need to find max of stacked chart
        //stackedData = data;

        //stackedData[stackedData.length - 1].forEach(function(d) {
        //    ymax = Math.max(ymax, d[1]);
        //});

    }
    else
    {
        // collect the max value for each key
        let maxvalues = new Array(keys.length).fill(0);
        data.forEach(function(d) {
            for (let i = 0; i < keys.length; i++)
            {
                maxvalues[i] = Math.max(maxvalues[i], d[keys[i]]);
            }
        });

        var overallmax = d3.max(maxvalues, function(m) { return m });

        // TODO: use the max of each graph?
        var ymax = overallmax;
    }
    

    //var value = showingStackedArea ? d3.max(data, function(d) { return d[value] }) : "profit";

    //revisit scales and axes
    x.domain(d3.extent(stackedData[0], function(d) { return d.data.timestamp; }));
    y.domain([0, maxStackedY * 1.1]);

    // X Axis
    var xAxisCall = d3.axisBottom(x).ticks(5);
    xAxisGroup.call(xAxisCall);

    // Y Axis
    var yAxisCall = d3.axisLeft(y);
    yAxisGroup.call(yAxisCall.ticks(4));

    gfill = g.selectAll("mylayers")
    .data(stackedData)
    .enter()
    .append("path")
      .style("fill", function(d) { console.log(d.key) ; return coloring(d.key); })
      .attr("d", d3.area()
        .x(function(d, i) { return x(d.data.timestamp); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
    ).attr("transform", function(d, i) {
        return "translate( " + time_graph_offset + ", 0)"}) 
        .on("mouseover", mouseoverGraph)
        .on("mousemove", mousemoveGraph)
        .on("mouseleave", mouseleaveGraph);
}

function isTransitioning(selection) {
    var transitioning = false;
    selection.each(function() { if(d3.active(this)) { transitioning = true; } })
    return transitioning;
}

function changeTopValues(val) {

    if(val < 1)
    {
        val = 1;
        document.getElementById("topValsCount").value = val;
    }

    if(val > completeKeySet.length)
    {
        val = completeKeySet.length;
        //document.getElementById("topValsCount").value = val;
        //return;
    }

    if(val != cropDataSetByTop)
    {
        cropDataSetByTop = val;
        console.log("Registered top val change " + val);


        if(cropDataSet)
        {
        d3.selectAll("svg > g > *").remove();
        update(s_data);
        triggerTransition(0);
        }
    }
  }

  function enableTopValues(is_enabled) {

    if(is_enabled != cropDataSet)
    {
        cropDataSet = is_enabled;
        console.log("Registered enable top val change " + is_enabled);

        d3.selectAll("svg > g > *").remove();
        update(s_data);
        triggerTransition(0);
    }
  }

function changeStacking(do_stacking) {
  if(currentlyStacked != do_stacking)
  {
      // Special handling to defeat those fiends who
      // might try to change the stacking
      // in the middle of a transition
      if(!isTransitioning(d3.selectAll(".temp_y")))
      {
          console.log("Registered stacking change " + do_stacking);
          currentlyStacked = do_stacking;
          triggerTransition(1000);
      }
      else
      {
          document.getElementById("rStacked").checked = currentlyStacked;
          document.getElementById("rSeperate").checked = !currentlyStacked;
      }
  }
}
  

//d3.select("#topvals").on("input", changeTopValues);

//d3.select("#enableTopValues").on("input", enableTopValues);

//g.on('mousemove', mouseTooltipGraph)