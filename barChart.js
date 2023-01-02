width = 975
height = width

chartHeight = 400
chartWidth = 400
marginTop = 30 // top margin, in pixels
marginRight = 0 // right margin, in pixels
marginBottom = 30 // bottom margin, in pixels
marginLeft = 40 // left margin, in pixels

let year = "2013";
let province = "福建"

const svg = d3.select("#wrapper").append("svg")
    .style("width", width)
    .style("height", height)
    .style("font", "10px sans-serif")
let path = svg.append("g")
    .selectAll("g")
    .style("transform", `translate(500px, 500px)`)

let elements1 = ["PM2.5(微克每立方米)", "PM10(微克每立方米)", "SO2(微克每立方米)", "NO2(微克每立方米)", "CO(毫克每立方米)"]
let elements2 = ["PM2.5(微克每立方米)", "PM10(微克每立方米)"]
let elements3 = ["SO2(微克每立方米)", "NO2(微克每立方米)", "CO(毫克每立方米)"]
let elementOrder = [elements1, elements2, elements3]
let colors =  ["#d53e4f", "#fdae61", "#fee08b", "#e6f598", "#3288bd"]
xaxisSVG = svg.append("g")
yaxisSVG = svg.append("g")

async function draw() {

    let order = 0;

    const data = await d3.csv("./data-2@12.csv", (d, _, columns) => {
        //根据传参的年份和省份选择数据
        if (d.year == year && d.province == province) {
            return d;
        }
    })

    x = d3.scaleBand()
        .domain(data.map(d => {
            return d["月份"]
        }))
        .range([0, chartWidth])
        .align(0)

    xAxis = g => g
        .attr("transform", `translate(300,500)`)
        .call(d3.axisBottom(x).tickSizeOuter(0))

    svg.append("g")
        .attr("class", "x-axis")
        .call(xAxis);

    yaxisSVG = svg.append("g")
        .attr("class", "y-axis")

    const button = svg
        .append("rect")
        .attr("x", 100)
        .attr("y", 100)
        .attr("width", 45)
        .attr("height", 45)
        .style("fill", "green")
        .text("Change metric")

    button.node().addEventListener("click", onClick)
    function onClick() {
        order = order + 1
        drawBar(order)
    }

    function drawBar(order) {
        const removeTransition = d3.transition().duration(300)
        const updateTransition = removeTransition.transition().duration(300)

        if (order % 3 == 0 || order % 3 == 1) {
            initialCol = 0;

        } else {
            initialCol = 2;
        }
        totalMax = 0;
        
        order %= 3;

        elements = elementOrder[order]
        elementColor = colors.slice(initialCol,elements.length+ initialCol)

        for (let i = 0; i < data.length; i++) {
            total = 0;
            for (j in elements) {
                total += data[i][elements[j]] = +data[i][elements[j]]
            }
            totalMax = Math.max(total,totalMax)
            data[i].id = i;
        }

        y = d3.scaleLinear()
            .domain([0, totalMax])
            .range([chartHeight, 0])

        yAxis = g => g
            .attr("transform", `translate(300,100)`)
            .transition(updateTransition)
            .call(d3.axisLeft(y).ticks(chartHeight / 60))

        yaxisSVG
            .call(yAxis);

        const dataSeries = d3.stack().keys(data.columns.slice(initialCol, elements.length + initialCol))(data)

        d3.selectAll(".barchart")
            .transition(removeTransition)
            .attr("height", 0)
            .attr("y", 500)
            .remove()

        d3.selectAll(".barGroups")
            .transition(removeTransition)
            .remove()

        let chartNum = 0;
        const bar = svg.append("g")
            .selectAll("g")
            .data(dataSeries)
            .join("g")
            .attr("class", "barGroups")
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("class", "barchart")
            .attr("fill", (d, i) => {
                d.chartNum = chartNum
                d.month = i + 1;
                return elementColor[i === 11 ? chartNum++ : chartNum]
            })
            .attr("transform", `translate(300,0)`)
            .on("mousemove", function (d, i) {
                d3.select(this).style("opacity", "0.4")
            })
            .on("mouseout", function (d) {
                d3.select(this).style("opacity", "1")
            })
            .attr("x", (d) => x(d.data["月份"]))
            .attr("width", x.bandwidth() - 1 / 2)
            .attr("height", 0)
            .attr("y", 500)
            .transition(updateTransition)
            .attr("y", (d) => {
                return 100 + Math.min(y(d[0]), y(d[1]))
            }).attr("height", (d) => y(d[0]) - y(d[1]))

        d3.selectAll(".barchart")
            .append('title')
            .text(function (d) {
                return d.month + "月  " + d.data.province + "地区  " + elements[parseInt(d.chartNum)] + ":" + d.data[elements[parseInt(d.chartNum)]];
            });
    }
    drawBar(0)
}
draw()