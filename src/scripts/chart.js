import { Chart } from "chart.js";

/** @type {HTMLSpanElement} */
const tempDisplay = document.getElementById('temp-display')

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("chart")
const ctx = canvas.getContext('2d')

let temperatureDataset = []

const chart = new Chart(ctx, {
    type: "scatter",
    data: {
        datasets: [{ label: "Temperature", data: temperatureDataset }],
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: "Time",
                ticks: {}
            },
            y: {
                type: "linear",
                position: "left",
                title: "Temperature"
            }
        },
        // animation: false, 
    },
})

let latestTimestamp = 0

async function insertData() {
    /** @type {{id: number, timestamp: number, temperature: number, humidity: number}[]} */
    const data = JSON.parse((await fetch(`/api/fetch?timestamp=${latestTimestamp}`).then(r => r.text())))
    if (!data.length) return
    latestTimestamp = data.at(0).timestamp
    const displayDataTemp = data.map(d => { return { x: d.timestamp, y: d.temperature } })
    displayDataTemp.forEach(d => temperatureDataset.push(d))
    chart.update()

}

