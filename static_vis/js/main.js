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
    .attr("y", height + (margins.bottom / 2))
    //characteristics
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("Month");

//define y axis-label
g.append("text")
    .attr("class", "y axis-label")
    //position
    .attr("x", -height / 2)
    .attr("y", -60)
    //characteristics
    .attr("fons-size", "12px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Profit");

//========================Data Loading=======================
/* Load the raw data file, anything that's local gets worked with within this async function. d3 can handle these
three file types; csv, tsv, and json.
IMPORTANT: This call is new to D3 v5. You may need to modify code that you take from the internet for compatibility */

//d3.csv("data/revenues.csv").then(function(data){
//d3.tsv("data/revenues.tsv").then(function(data){
d3.json("data/revenues.json").then(function(data){

    /*first thing to do is log the data. You can check this either in your debugger (recommend JetBrains WebStorm) or
    in your browser (recommend chrome) using the developer tools */
    console.log(data);

    //=====================Data Handling======================
    /* Work with the raw data here. Create a new array with modifiedData = {} if you need to. Apply filters to check for
    null values, etc...  */

    //convert to ints
    data.forEach(function(d){
        d.revenue = +d.revenue;
        d.profit = +d.profit;
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
    var x = d3.scaleBand() //ordinal
        .domain(data.map(function(d){ return d.month; })) //input: months
        .range([0, width])                                //output
        .paddingInner(0.3)
        .paddingOuter(0.3);

    //linear scale for the y-axis, returns a function object
    /* mapping the domain of profits to the range of height to 0.
    this is reversed because (0,0) is at the top left of the chart area, with positive y-axis pointing down */
    var y = d3.scaleLinear() //interval
        .domain([0, d3.max(data, function(d){ return d.profit })]) //input
        .range([height, 0]);                                       //output


    //create axes, append them to the chart area
    var xAxisCall = d3.axisBottom(x);
    g.append("g")
    //axis location
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxisCall)
        //text characteristics
        .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");
    var yAxisCall = d3.axisLeft(y)
        .ticks(10); //let d3 handle the ticks and text
    g.append("g")
        .attr("class", "y-axis")
        .call(yAxisCall);

    //gain access to all rectangles, even if there are none
    var rects = g.selectAll("rect")
        .data(data);

    //create new rectangles, with positions and sizes using our scale functions.
    /* in this case we only create the rectangles once because this is a static viz. when we get into dynamic viz
    we will need to handle not only the creation of the new rectangles, but the update or removal of old ones. */
    rects.enter()
        .append("rect")
        .attr("y", function(d){ return y(d.profit); })
        .attr("x", function(d){ return x(d.month); })
        .attr("width", x.bandwidth)
        .attr("height", function(d){ return height - y(d.profit); })
        .attr("fill", "grey");

}).catch(function(error){ //error handling for async function
    return error;
}); //end data load

