width = 975
height = width
innerRadius = 30
outerRadius = Math.min(width, height) / 3

const svg = d3.select("#wrapper").append("svg")
    .style("width", width)
    .style("height", height)
    .style("font", "10px sans-serif")

let path = svg.append("g")
    .selectAll("g")
    .style("transform", `translate(500px, 500px)`)

xaxisSVG = svg.append("g")
yaxisSVG = svg.append("g")
zaxisSVG = svg.append("g")

let elements = ["PM2.5(微克每立方米)", "PM10(微克每立方米)", "SO2(微克每立方米)", "NO2(微克每立方米)", "CO(毫克每立方米)"]

//正常扇形
arc = d3.arc()
    .innerRadius(d => y(d[0]))
    .outerRadius(d => y(d[1]))
    .startAngle(d => x(d.data["月份"]))
    .endAngle(d => x(d.data["月份"]) + x.bandwidth())
    .padAngle(0.2)
    .padRadius(innerRadius)

//用于更新数据时的扇形
arc1 = d3.arc()
    .innerRadius(d => y(d[0]))
    .outerRadius(d => y(d[1]))
    .startAngle(d => x(d.data["月份"]))
    .endAngle(d => x(d.data["月份"]) + 0.05)
    .padAngle(0.2)
    .padRadius(innerRadius)

//用于移出数据时的扇形
arc2 = d3.arc()
    .innerRadius(d => y(d[0]))
    .outerRadius(d => y(d[1]))
    .startAngle(d => x(d.data["月份"]) + 0.46)
    .endAngle(d => x(d.data["月份"]) + x.bandwidth())
    .padAngle(0.2)
    .padRadius(innerRadius)


function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}


async function dataPreprocess(year, province) {
    let elementMax = [0, 0, 0, 0, 0]
    const data = await d3.csv("./data-2@12.csv", (d, _, columns) => {

        //根据传参的年份和省份选择数据
        if (d.year == year && d.province == province) {

            for (let i = 0; i < 5; ++i) {
                d["ori" + columns[i]] = d[columns[i]]= +d[columns[i]]
            }

            return d;
        }
    })

    for (let i = 0; i < data.length; i++) {
        for (j in elements) {
            elementMax[j] += data[i][elements[j]]
        }
        data[i].id = i;
    }
    for (let i = 0; i < data.length; i++) {
        for (j in elements) {
            data[i][elements[j]] /= elementMax[j]
            data[i][elements[j]] *= data.length
        }
    }
    console.log(data)
    return data;
}

async function updateArc(year, province) {


    const data = await dataPreprocess(year, province);

    let chartNum = 0;

    let removeTransition = d3.transition().duration(200)
    let updateTransition = removeTransition.transition().duration(200)

    d3.selectAll(".img")
        .transition(removeTransition)
        .attr("d", arc2)
        .style("opacity", "0")
        .remove()

    d3.selectAll(".arcGroup")
        .transition(removeTransition)
        .remove()

    path
        .data(d3.stack().keys(data.columns.slice(0, 5))(data))
        .join(function (enter) {
            return enter.append("g")
        })
        .attr("class", "arcGroup")
        .selectAll("path")
        .data(d => d)
        .join(function (enter) {
            return enter.append("path")
                .style("transform", `translate(450px, 450px)`)
                .attr("fill", (d, i) => {
                    d.chartNum = chartNum
                    d.month = i + 1;
                    return ["#FC8C79", "#DC768F", "#AC6C99", "#776491", "#495879"][i === 11 ? chartNum++ : chartNum]
                }
                )
                .style("opacity", "0")
                .transition(updateTransition)
                .style("opacity", "1")
                .attr("d", arc1)
                .transition()
                .duration(500)
                .attr("d", arc)
                .attr("class", "img")
        }
        ).on("mousemove", function (d) {
            d3.select(this).style("opacity", "0.4")
        })
        .on("mouseout", function (d) {
            d3.select(this).style("opacity", "1")
        })


    d3.selectAll("path")
        .append('title')
        .text(function (d) {
            return d.month + "月  " + d.data.province + "地区  " + elements[parseInt(d.chartNum)] + ":" + d.data["ori" + elements[parseInt(d.chartNum)]];
        });
}

function drawAxisText(data) {
    x = d3.scaleBand()
        .domain(data.map(d => {
            return d["月份"]
        }))
        .range([0, 2 * Math.PI])
        .align(0)

    y = d3.scaleRadial()
        .domain([0, 6])
        .range([innerRadius, outerRadius])


    z = d3.scaleOrdinal()
        .domain(data.columns.slice(0, 5))
        .range(["#FC8C79", "#DC768F", "#AC6C99", "#776491", "#495879"])

    xAxis = g => g
        .attr("text-anchor", "middle")
        .style("transform", `translate(450px, 450px)`)
        .call(g => g.selectAll("g")
            .data(data)
            .join("g")
            .attr("transform", d => `
              rotate(${((x(d["月份"]) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
              translate(${innerRadius},0)
            `)
            .call(g => g.append("text")
                .attr("transform", d => ((x(d["月份"]) + x.bandwidth() / 2) * 180 / Math.PI - 90) < 0
                    ? "translate(" + (325 - (outerRadius + 10) + 10) + ")rotate(" + Math.abs(((x(d["月份"]) + x.bandwidth() / 2) * 180 / Math.PI - 90)) + ")"
                    : "translate(" + (325 - (outerRadius + 10) + 10) + ")rotate(-" + ((x(d["月份"]) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")")
                .text(d => d["月份"]))
            .call(g => g.attr("text-anchor", function (d) { return (x(d["月份"]) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
                .attr("transform", function (d) { return "rotate(" + ((x(d["月份"]) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (outerRadius + 20) + ",0)"; })
            )
        )

    yAxis = g => g
        .attr("text-anchor", "middle")
        .style("transform", `translate(450px, 450px)`)
        .call(g => g.append("text")
            .attr("y", d => -y(y.ticks(5).pop()))
            .attr("dy", "-1em")
            .text("月份"))
        .call(g => g.selectAll("g")
            .data(y.ticks(5))
            .join(
                function (enter) {
                    return enter.append("g")
                })
            .attr("fill", "none")
            .call(g => g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.5)
                .attr("r", y))
            .call(g => g.append("text")
                .attr("y", d => -y(d))
                .attr("dy", "0.35em")
                .attr("stroke", "#fff")
                .attr("stroke-width", 5)
                .text(y.tickFormat(5, "s"))
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none")))

    zAxis = g => g.append("g")
        .style("transform", `translate(450px, 300px)`)
        .selectAll("g")
        .data(data.columns.slice(0, 5))
        .join("g")
        .attr("transform", (d, i) => `translate(-400,${(i - (data.columns.length - 1) / 2) * 20})`)
        .call(g => g.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", z))
        .call(g => g.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .text(d => d))

    xaxisSVG
        .call(xAxis);

    yaxisSVG
        .call(yAxis);

    zaxisSVG
        .call(zAxis);

}

async function drawBars() {

    let year = "2013";
    let province = "福建"

    async function initialSVG(year, province) {

        const data = await dataPreprocess(year, province);

        drawAxisText(data);

        let chartNum = 0;

        path
            .data(d3.stack().keys(data.columns.slice(0, 5))(data))
            .join(function (enter) {
                return enter.append("g")
            })
            .attr("class", "arcGroup")
            .selectAll("path")
            .data(d => d)
            .join(function (enter) {
                return enter.append("path")
                    .style("transform", `translate(450px, 450px)`)
                    .attr("fill", (d, i) => {
                        d.chartNum = chartNum
                        d.month = i + 1;
                        console.log(d)
                        return ["#FC8C79", "#DC768F", "#AC6C99", "#776491", "#495879"][i === 11 ? chartNum++ : chartNum]
                    }
                    )
                    .style("opacity", "0")
                    .transition(200)
                    .style("opacity", "1")
                    .attr("d", arc1)
                    .transition()
                    .duration(500)
                    .attr("d", arc)
                    .attr("class", "img")
            }
            ).on("mousemove", function (d) {
                d3.select(this).style("opacity", "0.4")
            })
            .on("mouseout", function (d) {
                d3.select(this).style("opacity", "1")
            })

        d3.selectAll("path")
            .append('title')
            .text(function (d) {
                return d.month + "月  " + d.data.province + "地区  " + elements[parseInt(d.chartNum)] + ":" + d.data["ori" + elements[parseInt(d.chartNum)]];
            });

    }
    initialSVG(year, province)

    await sleep(3000).then(() => {
        let year = "2014";
        let province = "福建"
        updateArc(year, province)
    })

    await sleep(3000).then(() => {
        let year = "2013";
        let province = "福建"
        updateArc(year, province)
    })

    await sleep(3000).then(() => {
        let year = "2014";
        let province = "福建"
        updateArc(year, province)
    })

}
drawBars()

