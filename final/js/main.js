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
var width = 1700 - margins.left - margins.right;
var height = 750 - margins.top - margins.bottom;

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
var cropDataSetByTop = 6;
var completeKeySet;

var s_data;
var totals;

var x_min = 0;
var x_max = 1;

var y_chart_offsets = [];

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

    var yIndividualHeight;

    var yIndividualHeightTopMargin;

    var yIndividualHeightInside;

// Transitions to individual graphs
var currentlyStacked = true;
var tempAxes;
function triggerTransition(time_duration){

    //currentlyStacked = !currentlyStacked;

    yIndividualHeight = height * (1 / keys.length);

    yIndividualHeightTopMargin = yIndividualHeight * 0.2;

    yIndividualHeightInside = yIndividualHeight - yIndividualHeightTopMargin;


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
        .x(function(d, i) { return x(d.data.Timestamp); })
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
  .html(d.data.key + ":<br>Samples: " + d.value + "<br>" + d3.format(".2%")(d.value / totalSamples))
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




  var mouseoverGraph = function(d) {
    //g.selectAll('.hoverText').style("opacity", 1);
    g.selectAll('.hoverLine').style("opacity", 1);
    g.selectAll('.hoverPoint').style("opacity", 1);
  }


  var mousemoveGraph = function(d) {

    var selection = d3.select(this);
    var m = d3.mouse(selection.node());
    var domRect = document.getElementById("chart-area").getBoundingClientRect();

    var correctedXPos = m[0];// + domRect.left;

    var xValue = x.invert(correctedXPos);

    const bisectorData = d3.bisector(function(d) {
        return d.data.Timestamp;
      }).left;
    const xIndex = bisectorData(d, xValue, 1);

    const dataElement = d[xIndex]; 


      
    g.selectAll('.clone').remove();
    var original = g.select(".hoverText");

    var total_y = total_y = stackedData[stackedData.length - 1][xIndex][1];;
    //for(let i = 0; i < stackedData.length; ++i)
    //{
    //    if(stackedData[i].offset == 0)
    //        total_y = stackedData[i][xIndex][1];
    //}

    for(let i = 0; i < keys.length; ++i)
    {

        var hoverTextX = 0;
        var hoverTextAnchor = 0;


        var y_top_pos = 0;
        var y_value = 0;

        var transitionY = (currentlyStacked ? 0 : y_chart_offsets[keys[i]]) + (currentlyStacked ? 0 : yIndividualHeightTopMargin);

        if(currentlyStacked)
        {
            y_top_pos =  y(stackedData[i][xIndex][1]) + transitionY;
            y_value = stackedData[i][xIndex][1] - stackedData[i][xIndex][0];

            // each alternate the side
            const isLessThanHalf = (i % 2 == 0);
            hoverTextX = isLessThanHalf ? '-0.75em' : '0.75em';
            hoverTextAnchor = isLessThanHalf ? 'end' : 'start';
        }
        else
        {
            y_top_pos =  y(seperatedStacks[i][xIndex][1]) + transitionY;
            y_value = seperatedStacks[i][xIndex][1];

            const isLessThanHalf = xIndex > d.length / 2;
            hoverTextX = isLessThanHalf ? '-0.75em' : '0.75em';
            hoverTextAnchor = isLessThanHalf ? 'end' : 'start';
        }

    

    original.clone(true).classed('clone', true)
      .attr('x', x(dataElement.data.Timestamp))
      .attr('y', y_top_pos)
      .attr('dx', hoverTextX)
      .attr('dy', '-1.25em')
      .style('text-anchor', hoverTextAnchor)
      .style("opacity", 1)
      .text(d3.format('.5s')(y_value) + ", " + d3.format('.2%')(y_value / total_y) + " " + keys[i])
      .style("fill", function(d) { return coloring(keys[i]); })
      .style("stroke", "white")
      .style("stroke-width", "3px")
      .style("paint-order", "stroke fill");
    }

    // One more for totals

    y_top_pos =  0;

    const isLessThanHalf = xIndex > d.length / 2;
    var hoverTextX = isLessThanHalf ? '-0.75em' : '0.75em';
    var hoverTextAnchor = isLessThanHalf ? 'end' : 'start';

    original.clone(true).classed('clone', true)
    .attr('x', x(dataElement.data.Timestamp))
    .attr('y', y_top_pos)
    .attr('dx', hoverTextX)
    .attr('dy', '-1.25em')
    .style('text-anchor', hoverTextAnchor)
    .style("opacity", 1)
    .text("Total: " + d3.format('.5s')(total_y))
    .style("fill", function(d) { return "black"; })
    .style("stroke", "white")
    .style("stroke-width", "3px")
    .style("paint-order", "stroke fill");


    // draw line
    
    g.selectAll('.hoverLine')
    .attr('x1', x(dataElement.data.Timestamp))
    .attr('y1', 0)
    .attr('x2', x(dataElement.data.Timestamp))
    .attr('y2', currentlyStacked ? height / 2 : height)
    .attr('stroke', '#1f1f1f')
    .attr('fill', '#1f1f1f');

  }
  var mouseleaveGraph = function(d) {
    g.selectAll('.clone').remove();
    //g.selectAll('.hoverText').style("opacity", 0);
    g.selectAll('.hoverLine').style("opacity", 0);
    g.selectAll('.hoverPoint').style("opacity", 0);
  }


//========================Data Loading=======================
/* Load the raw data file, anything that's local gets worked with within this async function. d3 can handle these
three file types; csv, tsv, and json.
IMPORTANT: This call is new to D3 v5. You may need to modify code that you take from the internet for compatibility */

var prevX = 0;
var prevY = 0;

//d3.csv("data/revenues.csv").then(function(data){
//d3.tsv("data/revenues.tsv").then(function(data){
d3.csv("data/ProfileReport.csv").then(function(data){
     console.log(data);

     

               // create a tooltip

  
  //data.columns = data.columns.slice(0, 4);

    // Pull module names out of the headers
    keys = data.columns.slice(1);



    // Clean the data
    data.forEach(function(d) {
        keys.forEach(function(k) {
            d[k] = +d[k];
        });
        d["Timestamp"] = +d["Timestamp"];
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

    coloring = d3.scaleOrdinal()
    .domain(keys)
    .range(['#4E79A7','#F28E2B','#E15759','#76B7B2','#59A14E','#EDC949','#AF7AA1','#FF9DA7', '#9C755F', '#BAB0AC'])

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



// Make a fresh copy of the data for manipulation
var data = JSON.parse(JSON.stringify(s_data));
data.columns = JSON.parse(JSON.stringify(s_data.columns));



if(cropDataSet)
{
    keys = [];
    data.columns = ["Timestamp"];
    for(let i = 0; i < cropDataSetByTop; ++i)
    {
        data.columns.push(completeKeySet[i]);
        keys.push(completeKeySet[i]);
    }
}
else
{
    keys = completeKeySet.slice();
    data.columns = ["Timestamp"];
    data.columns.push.apply(data.columns, completeKeySet);
    //data.columns = data.columns.append(completeKeySet);
}


//var sorted_data;
//sorted_data["columns"][0] = data["columns"][0];
for (let i = 0; i < keys.length; i++) {
    data["columns"][1 + i] = keys[i];
}

// Cut ends off data
if(x_min != 0 || x_max != 1)
{
    data = data.splice(data.length * x_min, (data.length) - (data.length * x_min))
}


// Process the data into increments
// Stores the number of new readings each increment
var incrementData = data;

var initialOffset = JSON.parse(JSON.stringify(data[0]));

for (let i = 0; i < incrementData.length; i++) {
    keys.forEach(function(k) {
        incrementData[i][k] = incrementData[i][k] - initialOffset[k];
    });
}

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

var pie_totals = [];

keys.forEach(function(k) {
    pie_totals[k] = totals[k];
});


var pie = d3.pie()
  .value(function(d) {return d.value; })
var pie_data = pie(d3.entries(pie_totals))

g
  .selectAll('pieChart')
  .data(pie_data)
  .enter()
  .append('path')
  .attr('d', d3.arc()
    .innerRadius(0)
    .outerRadius(width_total / 2)
  )
  .attr('fill', function(d){ return(coloring(d.data.key)) })
  .style("opacity", 0.7)
  .attr("transform", "translate(" + ( width_total / 2 + (width * 0.05)) + "," + ((width_total / 2) + (width * 0.025)) + ")")
  .on("mouseover", mouseover)
  .on("mousemove", mousemove)
  .on("mouseleave", mouseleave);


  yIndividualHeight = height * (1 / keys.length);

yIndividualHeightTopMargin = yIndividualHeight * 0.2;

yIndividualHeightInside = yIndividualHeight - yIndividualHeightTopMargin;

seperatedStacks.forEach(function(ss) {
    y_chart_offsets[ss.key] = ss.offset * yIndividualHeight;
});
/*
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

yIndividualHeight = height * (1 / keys.length);

yIndividualHeightTopMargin = yIndividualHeight * 0.2;

yIndividualHeightInside = yIndividualHeight - yIndividualHeightTopMargin;



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
*/

// X Label
xLabel = g.append("text")
    .attr("y", (height / 2) + 50)
    .attr("x", width_time / 2 + time_graph_offset)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Time");

// Y Label
yLabel = g.append("text")
    .attr("y", -30 + time_graph_offset)
    .attr("x", -(height / 4))
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Samples");


    // Legend
    g.selectAll("LegendCircles")
  .data(keys)
  .enter()
  .append("circle")
    .attr("cx", 10)
    .attr("cy", function(d,i){ return ((keys.length - 1) * 25) - i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("r", 7)
    .style("fill", function(d){ return coloring(d)})
    .attr("transform", "translate(" + (width * 0.05) + "," + ((width_total /2) +  ((width_total / 2) + (width * 0.025)) + 30) + ")");

    // Legend text
   g.selectAll("LegendText")
  .data(keys)
  .enter()
  .append("text")
    .attr("x", 30)
    .attr("y", function(d,i){ return ((keys.length - 1) * 25) - i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .style("fill", function(d){ return coloring(d)})
    .text(function(d){ return d})
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .attr("transform", "translate(" + (width * 0.05) + "," + ((width_total /2) +  ((width_total / 2) + (width * 0.025)) + 30) + ")");;

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
    var x_max_val = d3.max(stackedData[0], function(d) { return d.data.Timestamp; });
    x.domain([x_min * x_max_val, x_max * x_max_val]);
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
      .style("opacity", 0.8)
      .attr("d", d3.area()
        .x(function(d, i) { return x(d.data.Timestamp); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
    ).attr("transform", function(d, i) {
        return "translate( " + time_graph_offset + ", 0)"}) 
        .on("mouseover", mouseoverGraph)
        .on("mousemove", mousemoveGraph)
        .on("mouseleave", mouseleaveGraph);


        g.append('line').classed('hoverLine', true).attr("transform", function(d, i) {
            return "translate( " + time_graph_offset + ", 0)"}).style("opacity", 0);

        g.append("text").classed('hoverText', true).attr("transform", function(d, i) {
            return "translate( " + time_graph_offset + ", 0)"}).style("opacity", 0);


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


// Dual range slider
// from https://stackoverflow.com/questions/4753946/html5-slider-with-two-inputs-possible
  
  window.onload = function(){
    // Initialize Sliders
    var sliderSections = document.getElementsByClassName("range-slider");
        for( var x = 0; x < sliderSections.length; x++ ){
          var sliders = sliderSections[x].getElementsByTagName("input");
          for( var y = 0; y < sliders.length; y++ ){
            if( sliders[y].type ==="range" ){
              sliders[y].oninput = getVals;
              // Manually trigger event first time to display values
              sliders[y].oninput();
            }
          }
        }
  }


  function sliderChange(){
    //var parent = this.parentNode;
    //var slides = parent.getElementById("sliderMax");
    var slide1 = parseFloat(  document.getElementById("sliderMin").value );
    var slide2 = parseFloat(  document.getElementById("sliderMax").value );

    var test = document.getElementById("sliderMax").step;

    var s1_clamped =  Math.min(slide2 - parseFloat(document.getElementById("sliderMin").step), slide1);
    var s2_clamped =  Math.max(slide1 + parseFloat(document.getElementById("sliderMax").step), slide2);

     if(x_min != s1_clamped || x_max != s2_clamped)
     {
        x_min = s1_clamped;
        x_max = s2_clamped;

        if(s1_clamped != slide1)
            document.getElementById("sliderMin").value = s1_clamped;

        if(s2_clamped != slide2)
            document.getElementById("sliderMax").value = s2_clamped;

        d3.selectAll("svg > g > *").remove();
        update(s_data);
        triggerTransition(0);
     }
  }