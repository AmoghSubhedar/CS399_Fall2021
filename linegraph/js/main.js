//============================GLOBALS============================
/* you should define anything up here that stays static throughout your visualization. It is the design of your
visualization that determines if a variable/svg/axis/etc. should remain in the global space or should
be animated/updated etc. Typically, you will put things here that are not dependent on the data.
 */

// define margins in pixels. Use these to define total space allotted for this chart, within the chart area.
// For multiple charts, you can define multiple margin arrays
var margins = { left:100, right:40, top:50, bottom:150};

//define chart sizes
var width = 600 - margins.left - margins.right;
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

//define x axis-label
g.append("text")
    .attr("class", "x axis-label")
    //position
    .attr("x", width / 2) //centered
    .attr("y", height + (margins.bottom / 3.5))
    //characteristics
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("Annual Income in US Dollars");

//define x axis-label
g.append("text")
.attr("class", "title")
//position
.attr("x", width / 2) //centered
.attr("y", -40)
//characteristics
.attr("font-size", "14px")
.attr("text-anchor", "middle")
.text("Attendance Rate for Religious Services vs Annual Income");

//define y axis-label
g.append("text")
    .attr("class", "y axis-label")
    //position
    .attr("x", -height / 2)
    .attr("y", -50)
    //characteristics
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Avg. Attendance Rate for Religious Services");
  
 
//define y axis-label
g.append("text")
    .attr("class", "y axis-label")
    //position
    .attr("x", width / 2)
    .attr("y",  height + (margins.bottom / 1.5))
    //characteristics
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("(For attendance rate, 1 is Weekly or more, 0.5 is Less than weekly, 0 is Never)");

//========================Data Loading=======================
/* Load the raw data file, anything that's local gets worked with within this async function. d3 can handle these
three file types; csv, tsv, and json.
IMPORTANT: This call is new to D3 v5. You may need to modify code that you take from the internet for compatibility */

//d3.csv("data/revenues.csv").then(function(data){
//d3.tsv("data/revenues.tsv").then(function(data){
d3.json("data/incomereligion.json").then(function(data){

    /*first thing to do is log the data. You can check this either in your debugger (recommend JetBrains WebStorm) or
    in your browser (recommend chrome) using the developer tools */
    console.log(data);

    //=====================Data Handling======================
    /* Work with the raw data here. Create a new array with modifiedData = {} if you need to. Apply filters to check for
    null values, etc...  */

    //convert to ints
    data.forEach(function(d){
        d.income = +d.income;
        d.attendance = +d.attendance;
    });

    //log the data again to check it's correct format, especially if you create a new array
    //console.log(modifiedData);

    //=====================Data Joining========================
    /* The data is available here. This is where you work with objects that require a reference to the data. In this
    case that means the axis scales and the rectangle objects, but it could be any number of things, especially if
    you are creating a more dynamic viz. Much of this section can be moved into an update() function which you will
     use to define the dynamic objects of your viz. */

    //band scale for the x axis, returns a function object
    /*we are mapping a set of names to the width of the viz (using index)
    eg. january => width * (0/11), february => width * (1/11),... */
    

    var x = d3.scaleLinear() //ordinal
        .domain([0, d3.max(data, function(d){ return d.income; })])  //input: months
        .range([0, width]);                                //output
    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
      
     const ymax =  d3.max(data, function(d){ return +d.attendance; });
      const ymin =  d3.min(data, function(d){ return +d.attendance; });
      
    //linear scale for the y-axis, returns a function object
    /* mapping the domain of profits to the range of height to 0.
    this is reversed because (0,0) is at the top left of the chart area, with positive y-axis pointing down */
    var y = d3.scaleLinear() //interval
        .domain([0, ymax]) //input
        .range([height, 0]);                                       //output
     
    g.append("g")
      .call(d3.axisLeft(y));
      
     g.append("linearGradient")
       .attr("id", "line-gradient")
       .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(ymin))
      .attr("x2", 0)
      .attr("y2", y(ymax))
      .selectAll("stop")
        .data([
          {offset: "0%", color: "lightblue"},
          {offset: "100%", color: "darkblue"}
        ])
      .enter().append("stop")
        .attr("offset", function(d) { return d.offset; })
        .attr("stop-color", function(d) { return d.color; });
      
      
   g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "url(#line-gradient)")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
    .x(function(d) { return x(d.income) })
    .y(function(d) { return y(d.attendance) })
     )

}).catch(function(error){ //error handling for async function
    return error;
}); //end data load

