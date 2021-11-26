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
    .attr("transform", "translate(" + time_graph_offset + "," + height / 2 +")");

var yAxisGroup = g.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + time_graph_offset + ", 0)");

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
var currentlyStacked = false;
var tempAxes;
function triggerTransition(){

    currentlyStacked = !currentlyStacked;

    var yIndividualHeight = height * (1 / keys.length);

    var yIndividualHeightTopMargin = yIndividualHeight * 0.2;

    var yIndividualHeightInside = yIndividualHeight - yIndividualHeightTopMargin;


    // Animate label movements
    if(currentlyStacked)
    {
        xLabel.transition().duration(1000).attr("y", (height / 2) + 50);

        yLabel.transition().duration(1000).attr("x", -(height / 4));
    }
    else
    {
        xLabel.transition().duration(1000).attr("y", (height) + 50);

        yLabel.transition().duration(1000).attr("x", -(height / 2));
    }


    if(currentlyStacked)
    {
        //d3.selectAll(".temp_y").remove();
        
        y = d3.scaleLinear()
        .range([height * 0.5, 0]);

        y.domain([0, maxStackedY * 1.1]);

        //var yAxisCall = d3.axisLeft(y);
        yAxisGroup.transition().duration(1000).call(d3.axisLeft(y).ticks(4)).attr("transform", "translate( " + time_graph_offset + ", 0)");

        d3.selectAll(".temp_y").transition().duration(1000).call(d3.axisLeft(y).ticks(4)).attr("transform", "translate( " + time_graph_offset + ", 0 )").remove();

        xAxisGroup.transition().duration(1000).call(d3.axisBottom(x).ticks(5)).attr("transform", "translate(" + time_graph_offset + "," + height / 2 +")");

    }
    else
    {

        xAxisGroup.transition().duration(1000).call(d3.axisBottom(x).ticks(5)).attr("transform", "translate(" + time_graph_offset + "," + height +")");

        d3.selectAll("temp_y axis").remove();

        y = d3.scaleLinear()
        .range([yIndividualHeightInside, 0]);

        y.domain([0, maxIndividualY * 1.1]);

        //var yAxisCall = d3.axisLeft(y);
        yAxisGroup.transition().duration(1000).call(d3.axisLeft(y).ticks(4)).attr("transform", "translate( " + time_graph_offset + ", " + yIndividualHeightTopMargin +" )");

        for(let i = 1; i < keys.length; ++i)
        {
            var y_temp = d3.scaleLinear().range([height * 0.5, 0]).domain([0, maxStackedY * 1.1]);

            var yAxisGroup_temp = g.append("g").attr("class", "temp_y temp_y" + i + " axis").attr("transform", "translate( " + time_graph_offset + ", 0)");
            yAxisGroup_temp.transition().duration(1000).call(d3.axisLeft(y_temp).ticks(4));

            var y_temp1 = d3.scaleLinear().range([yIndividualHeightInside, 0]).domain([0, maxIndividualY * 1.1]);

            yAxisGroup_temp.transition().duration(1000).call(d3.axisLeft(y_temp1).ticks(4));

            var transitionY = (yIndividualHeight * i) + yIndividualHeightTopMargin;

            d3.select(".temp_y" + i)
            .transition()
            .duration(1000)
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
      .duration(1000)
      //.style("fill", function(d) { console.log(d.key) ; return color(d.key); })
      .attr("d", d3.area()
        .x(function(d, i) { return x(d.data.timestamp); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
    ).attr("transform", function(d, i) {
        var transitionY = ( (currentlyStacked ? 0 : d.offset) * yIndividualHeight) + (currentlyStacked ? 0 : yIndividualHeightTopMargin);
        return "translate( " + time_graph_offset + ", " + transitionY + ")"});
  }

//========================Data Loading=======================
/* Load the raw data file, anything that's local gets worked with within this async function. d3 can handle these
three file types; csv, tsv, and json.
IMPORTANT: This call is new to D3 v5. You may need to modify code that you take from the internet for compatibility */

//d3.csv("data/revenues.csv").then(function(data){
//d3.tsv("data/revenues.tsv").then(function(data){
d3.csv("data/data1.csv").then(function(data){
     console.log(data);


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

    var totals = JSON.parse(JSON.stringify(data[data.length - 1]));
    // Process the data into increments
    // Stores the number of new readings each increment
    var incrementData = data;

    for (let i = data.length - 1; i > 0; i--) {
        keys.forEach(function(k) {
            incrementData[i][k] = incrementData[i][k] - incrementData[i - 1][k];
        });
    }


    stackedData = d3.stack().keys(keys)(data);

    maxStackedY = 0;
    stackedData[stackedData.length - 1].forEach(function(d) {
        maxStackedY = Math.max(maxStackedY, d[1]);
    });

    maxIndividualY = 0;
    var ymax = maxStackedY;

    stackedData.forEach(function(d) {
        d.offset = keys.length - 1;
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
        seperatedStacks[i].offset = (keys.length - 1) - i;
    }


    // create area chart

    // Store the totals
    
    var totalsTree = {};
    totalsTree.children = new Array();

    //totalsTree.children.push({value: "", name: "Origin", parent: ""});

    keys.forEach(function(k) {
        totalsTree.children.push({});
        totalsTree.children[ totalsTree.children.length - 1].value = totals[k];
        totalsTree.children[ totalsTree.children.length - 1].name = k;
    });
    
    var root = d3.hierarchy(totalsTree).sum(function(d){ return d.value})

    d3.treemap()
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
      .style("stroke", "black")
      //.style("fill", "#69b3a2");

  // and to add the text labels
  g
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
      .attr("x", function(d){ return d.x0+10})    // +10 to adjust position (more right)
      .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
      .text(function(d){ return d.data.name})
      .attr("font-size", "15px")
      .attr("fill", "white")

      //return;
    //what happens at each n milliseconds interval.
    //This is basically our automatic update loop. Use it for time-based automated tasks.
    // This sets up d3 behind the scenes.
    // is not run on the first frame.
    
    d3.interval(function(){
        //var newData = showingStackedArea ? data : data.slice(1);

        triggerTransition();
        //showingStackedArea = !showingStackedArea
    }, 3000);
    

    // Run the update in the first frame.
    update(seperatedStacks, ymax);
});

function update(sdata, ymax) {

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
    x.domain(d3.extent(sdata[0], function(d) { return d.data.timestamp; }));
    y.domain([0, maxIndividualY * 1.1]);

    // X Axis
    var xAxisCall = d3.axisBottom(x).ticks(5);
    xAxisGroup.call(xAxisCall);

    // Y Axis
    var yAxisCall = d3.axisLeft(y);
    yAxisGroup.call(yAxisCall.ticks(4));

  // color palette
  var color = d3.scaleOrdinal()
    .domain(keys)
    .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf'])

    gfill = g.selectAll("mylayers")
    .data(sdata)
    .enter()
    .append("path")
      .style("fill", function(d) { console.log(d.key) ; return color(d.key); })
      .attr("d", d3.area()
        .x(function(d, i) { return x(d.data.timestamp); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
    ).attr("transform", function(d, i) {
        return "translate( " + time_graph_offset + ", 0)"});
}



// //similar to our
// function update(data) {
//     var label = showingStackedArea ? "Revenue" : "Profit";
//
//     //revisit the scales and axes
//     x.domain(data.map(function(d){ return d.month }));
//     y.domain([0, d3.max(data, function(d) { return d[value] })]);
//
//     // X Axis
//     var xAxisCall = d3.axisBottom(x);
//     xAxisGroup.transition(t).call(xAxisCall);
//
//     // Y Axis
//     var yAxisCall = d3.axisLeft(y)
//         .tickFormat(function(d){ return "$" + d; });
//     yAxisGroup.transition(t).call(yAxisCall);
//
//     /* VERY  IMPORTANT */
//     /* This is the bread and butter of D3. d3.interval first joins the all html objects with
//     corresponding data using the ranges and other objects. It then seperaates them into
//     two lists, depending on whether the objects data reference has an old, same, or new signature
//     The EXIT list is all old elements that dont have references in the present data set.
//     The Enter list contains all new entering elements based on new data AS WELL AS old elements with
//     references in the present data. */
//
//     // JOIN new data with old elements. One element for each month.
//     var rects = g.selectAll("rect")
//         .data(data, function(d){
//             return d.month;
//         });
//
//     // EXIT old elements not present in new data.
//     rects.exit()
//         .attr("fill", "red")
//     .transition(t)
//         .attr("y", y(0))
//         .attr("height", 0)
//         .remove();
//
//     // ENTER new elements present in new data...
//     rects.enter()
//         .append("rect")
//             .attr("fill", "grey")
//             .attr("y", y(0))
//             .attr("height", 0)
//             .attr("x", function(d){ return x(d.month) })
//             .attr("width", x.bandwidth)
//             // AND UPDATE old elements present in new data.
//             .merge(rects)
//             .transition(t)
//                 .attr("x", function(d){ return x(d.month) })
//                 .attr("width", x.bandwidth)
//                 .attr("y", function(d){ return y(d[value]); })
//                 .attr("height", function(d){ return height - y(d[value]); });
//
//     //update the label text
//     var label = showingStackedArea ? "Revenue" : "Profit";
//     yLabel.text(label);
//
// }


