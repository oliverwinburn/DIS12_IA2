import { IncomingMessage, ServerResponse } from "http";
import { Readings } from "./database";
import { serverRoutes } from "./routes";
import nunjucks from "nunjucks";
//nunjucks is the node version of jinja (used with flask)


function decodeURL(url: string = "/") {
    const args: Map<string, string> = new Map()
    url = decodeURI(url)
    const splitString = url.split("?")
    if (splitString.length == 1) return { url, args }
    const params = splitString.slice(1, -1).join('?').split("&")
    for (let i = 0; i < params.length; i++) {
        const pair = params[i].split("=")
        if (pair[0] && pair[1]) args.set(pair[0], pair[1])
    }
    return { url, args }
}

function respond(response: ServerResponse, code: number, mimetype: string, data: string) {
    response.setHeader("Content-Type", mimetype)
    response.writeHead(code)
    response.end(data)
}


export async function handleServer(request: IncomingMessage, response: ServerResponse) {
    const url = decodeURL(request.url || "/")

    // Should only be for static files
    const file = serverRoutes.get(url.url)
    if (file) {
        respond(response, 200, file.mimeType, await file.read())
    }
    else if (url.url == "/") {
        const data = nunjucks.render("./pages/index.html")
        respond(response, 200, "text/html", data)
    }
    else if (url.url == "/api/fetch") {
        const timestamp = Number(url.args.get("timestamp")) || 0
        const readings = await Readings.fetchAfter(timestamp)
        const readingsJSON = JSON.stringify(readings, null, 2)
        respond(response, 200, "text/json", readingsJSON)
    }
    else {
        response.writeHead(404).end();
    }
}