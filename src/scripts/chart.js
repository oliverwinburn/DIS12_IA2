import { Chart } from "chart.js";

/** @type {HTMLSpanElement} */
const tempDisplay = document.getElementById('temp-display')

/** @type {CanvasRenderingContext2D} */
const ctxTemp = document.getElementById("chartTemp").getContext("2d")

/** @type {CanvasRenderingContext2D} */
const ctxHumid = document.getElementById("chartHumid").getContext("2d")

/** @type {{x: number, y: number}[]} */
let temperatureDataset = []

/** @type {{x: number, y: number}[]} */
let humidityDataset = []

const options = (text, suggestedMin, suggestedMax) => {
    return {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: "Time",
                time: { unit: "millisecond", },
                ticks: { display: false, },
                grid: { display: false, },
            },
            y: {
                type: "linear",
                position: "left",
                title: { text, display: true, font: { size: 16 }, },
                suggestedMax, suggestedMin,
            }
        },
        animation: false,
        elements: { point: { radius: 0 } }
    }
}

const chartTemp = new Chart(ctxTemp, {
    type: "line",
    data: {
        datasets: [{ label: "Temperature", data: temperatureDataset, tension: 0.3, }],
    },
    options: options("Temperature (°C)", 20, 30)
})

const chartHumid = new Chart(ctxHumid, {
    type: "line",
    data: {
        datasets: [{ label: "Humidity", data: humidityDataset, tension: 0.3 }]
    },
    options: options("Humidity", 50, 100)
})

let latestTimestamp = 0
let initialTime
let currentTemp

async function insertData() {
    /** @type {{id: number, timestamp: number, temperature: number, humidity: number}[]} */
    const data = JSON.parse((await fetch(`/api/fetch?timestamp=${latestTimestamp}`).then(r => r.text())))
    if (!data.length) return
    data.sort((a, b) => a.timestamp - b.timestamp)

    latestTimestamp = data.at(-1).timestamp
    if (!initialTime) initialTime = data.at(0).timestamp - 30000

    const tempData = data.map(d => { return { x: d.timestamp - initialTime, y: d.temperature } })
    const humidData = data.map(d => { return { x: d.timestamp - initialTime, y: d.humidity } })

    tempData.forEach(d => temperatureDataset.push(d))
    humidData.forEach(d => humidityDataset.push(d))

    const maxTemp = tempData.at(-1)
    const cutoffTime = maxTemp.x - 35000

    for (let i = 0; i < temperatureDataset.length; i++) {
        if (temperatureDataset[i].x < cutoffTime) {
            temperatureDataset.splice(i, 1)
        }
    }

    for (let i = 0; i < humidityDataset.length; i++) {
        if (humidityDataset[i].x < cutoffTime) {
            humidityDataset.splice(i, 1)
        }
    }

    chartTemp.options.scales.x.min = cutoffTime
    chartHumid.options.scales.x.min = cutoffTime

    chartTemp.options.scales.x.max = maxTemp.x + 3000
    chartHumid.options.scales.x.max = maxTemp.x + 3000

    chartTemp.update()
    chartHumid.update()

    tempDisplay.innerText = `${maxTemp.y.toFixed(1)}°C`
    currentTemp = maxTemp.y
    updateAlarm()
}

function updateAlarm() {
    try {
        if (currentTemp > insideThreshold) {
            tempDisplay.classList.add("alarm")
        } else tempDisplay.classList.remove("alarm")
    } catch { }
}

const beginInserter = () => { insertData(); dataInserter = setInterval(insertData, 1000) }
const stopInserter = () => clearInterval(dataInserter)
beginInserter()
