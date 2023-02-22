import { Chart } from "chart.js";

/** @type {HTMLSpanElement} */
const tempDisplay = document.getElementById('temp-display')

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("chart")
const ctx = canvas.getContext('2d')

/**
 * @type {{x: number, y: number}[]}
 */
let temperatureDataset = []

const chart = new Chart(ctx, {
    type: "line",
    data: {
        datasets: [{ label: "Temperature", data: temperatureDataset, tension: 0.3 }],
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: "Time",
                time: {
                    unit: "millisecond",
                },
                ticks: {
                    display: false,
                },
                grid: {
                    display: false,
                },
            },
            y: {
                type: "linear",
                position: "left",
                title: {
                    text: "Temperature (°C)",
                    display: true,
                    font: {
                        size: 16
                    }
                },
            }
        },
        animation: false,
    },
})

let latestTimestamp = 0
let initialTime

async function insertData() {
    /** @type {{id: number, timestamp: number, temperature: number, humidity: number}[]} */
    const data = JSON.parse((await fetch(`/api/fetch?timestamp=${latestTimestamp}`).then(r => r.text())))
    if (!data.length) return
    data.sort((a, b) => b.timestamp - a.timestamp)

    latestTimestamp = data.at(0).timestamp
    if (!initialTime) initialTime = data.at(-1).timestamp - 30000
    // const filteredData = data.filter(d => latestTimestamp - d.timestamp > 20000)

    const displayDataTemp = data.map(d => { return { x: d.timestamp - initialTime, y: d.temperature } })
    displayDataTemp.sort((a, b) => a.x - b.x)

    displayDataTemp.forEach(d => temperatureDataset.push(d))
    const maxTemp = displayDataTemp.at(-1)
    const cutoffTime = maxTemp.x - 35000
    
    let i = temperatureDataset.length
    while (i--) {
        if (temperatureDataset[i].x < cutoffTime) {
            temperatureDataset.splice(i, 1)
        } 
    }

    chart.options.scales.x.min = cutoffTime
    chart.options.scales.x.max = maxTemp.x + 3000

    tempDisplay.innerText = `${maxTemp.y.toFixed(1)}°C`

    chart.update()
}

insertData()
const beginInserter = () => dataInserter = setInterval(insertData, 1500)
const stopInserter = () => clearInterval(dataInserter)
beginInserter()
