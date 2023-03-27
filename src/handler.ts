import { IncomingMessage, ServerResponse } from "http";
import { fetchDBAfter, } from "./database.js";
import { readFileSync } from "node:fs";
import * as mime from "mime-types";

//nunjucks is the node version of jinja (used with flask)

const routes: Map<string, { mime: string, data: string | Buffer }> = new Map()

function register(route: string, file: string, encoding?: BufferEncoding) {
    routes.set(route, {
        mime: mime.lookup(file) || "text/plain",
        data: readFileSync(file, encoding)
    })
}
register("/", "./pages/index.html", "utf-8")
register("/favicon.ico", "./static/favicon.ico")

register("/dist/global.css", "./css/global.css", "utf-8")
register("/dist/chart.js", "./src/scripts/chart.js", "utf-8")
register("/dist/index.js", "./src/scripts/index.js", "utf-8")
register("/static/logo.svg", "./static/logo.svg")


/** 
 * @desc Function to extract url variables
 * @example decodeURL("/example?a=1&b=2") == {url: "/example", args: {a: "1", b: "2"}}*/
function decodeURL(url: string = "/") {
    const args: Map<string, string> = new Map()
    url = decodeURI(url)
    const splitString = url.split("?")
    url = splitString.at(0) || "/"
    if (splitString.length == 1) return { url, args }
    const params = splitString.pop()?.split("&") || []
    for (let i = 0; i < params.length; i++) {
        const pair = params[i].split("=")
        if (pair[0] && pair[1]) args.set(pair[0], pair[1])
    }
    return { url, args }
}

/** @desc Construct a server response from parameters */
function respond(response: ServerResponse, mimetype: string, data: string | Buffer) {
    response.setHeader("Content-Type", mimetype)
    response.writeHead(200)
    response.end(data)
}

export async function handleServer(request: IncomingMessage, response: ServerResponse) {
    const url = decodeURL(request.url || "/")

    const fileRoute = routes.get(url.url)
    if (fileRoute?.data && fileRoute.mime) {
        return respond(response, fileRoute.mime, fileRoute.data)
    }
    else if (url.url == "/api/fetch") {
        const timestamp = Number(url.args.get("timestamp")) || 0
        const readings = await fetchDBAfter(timestamp)
        return respond(response, "text/json", JSON.stringify(readings, null, 2))
    }
    else {
        return response.writeHead(404).end()
    }
}