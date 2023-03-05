import chalk from "chalk";
import { SerialPort, ReadlineParser } from "serialport";
import { BOMRecordings, Readings } from "./database.js";
import fetch from "node-fetch";
import proxyAgents from "https-proxy-agent";
import * as dotenv from "dotenv";
dotenv.config()

const BOM_URL = "http://reg.bom.gov.au/fwo/IDQ60901/IDQ60901.94576.json"


export async function beginSerialMonitor() {
    console.log(`[${chalk.green("LOAD")}] Loading serial monitor`)
    const SERIALPORT = process.argv.find(val => val.startsWith("--COM:"))?.replace("--COM:", "") || "COM3"
    if (SERIALPORT == "DEV") {
        console.log(`[${chalk.green("LOAD")}] Loaded testing serial monitor`)
        setInterval(() => {
            Readings.insert(Math.random() * 30 + 10, Math.random() * 60 + 40).catch(e => { })
        }, 1500)
        return
    }

    const port = new SerialPort({
        baudRate: 9600,
        path: SERIALPORT,
    })

    const parser = new ReadlineParser({ delimiter: "\r\n" })
    port.pipe(parser)

    parser.on("data", async (data: string) => {
        try {
            const parsed: { temp: number, humidity: number } = JSON.parse(data)
            await Readings.insert(parsed.temp, parsed.humidity)
                .catch(e => console.log(`[${chalk.red("ERROR")}] Sensor log to database failed`))
        } catch (e) { }
    })
}

async function fetchBOMData() {
    const agent = (process.argv.includes("--proxy")) ?
        new proxyAgents.HttpsProxyAgent(`https://${process.env.USERNAME}:${process.env.PASSWORD}@proxy2.eq.edu.au`)
        : undefined
    const response = await fetch(BOM_URL, { agent })
    const data = JSON.parse(await response.text())
    return {
        temperature: data.observations.data[0].air_temp,
        apparent_t: data.observations.data[0].apparent_t,
        humidity: data.observations.data[0].rel_hum,
    }
}

export async function beginBOMFetcher() {
    setInterval(async () => {
        try {
            const data = await fetchBOMData()
            return BOMRecordings.insert(data.temperature, data.apparent_t, data.humidity)
        } catch (e) {
            console.error(e)
        }
    }, 5 * 60 * 1000)
}

