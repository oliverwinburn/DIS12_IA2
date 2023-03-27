import { Server } from "http";
import { beginBOMFetcher, beginSerialMonitor } from "./monitor.js";
import chalk from "chalk";
import { sequelize } from "./database.js";
import { handleServer } from "./handler.js";

const PORT = 80;
const HOST = "127.0.0.1"

const server = new Server(async (request, response) => {
    await handleServer(request, response) // forward request to handleServer functions from handler.ts
    // The rest of this is error handling and console logging
        .catch((e) => {
            console.log(`[${chalk.red("ERROR")}] Internal server error`)
            console.error(e)
            response.writeHead(500).end()
        })
        .then(() => {
            console.log(`[${chalk.gray("LOG")}] `
            + `${request.socket.remoteAddress} - [${new Date().toLocaleTimeString()}] `
            + `${response.statusCode >= 400 ? chalk.red(response.statusCode) : chalk.green(response.statusCode)}`
            + ` ${chalk.blue(request.method, request.url)}`)
        })
})

// Sync then load serial monitor, BOM fetcher and http server
sequelize.sync({ force: process.argv.includes("--fsync") }).then((res) => {
    console.log(`[${chalk.green("LOAD")}] Database loaded`)

    beginSerialMonitor()
    beginBOMFetcher()

    server.listen(PORT, HOST, () => {
        console.log(`[${chalk.green("LOAD")}] Server started on http://${HOST}:${PORT}/`)
    })
})

