import fs from 'fs';
import path from 'path';
import * as mime from "mime-types";
import nunjucks from "nunjucks";

nunjucks.configure({ autoescape: true, noCache: true })
const nunjucksObject = { pagename: "Website" }

function recursiveReadDir(dir: string): string[] {
    let files: string[] = [];
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const fileStat = fs.statSync(filePath);
        if (fileStat.isDirectory()) {
            recursiveReadDir(filePath).forEach(file => files.push(file));
        } else if (fileStat.isFile()) {
            files.push(filePath);
        }
    });
    return files
}

const URLify = (URL: string) => "/" + encodeURI(URL.replaceAll("\\", "/").replaceAll(" ", "_"));

class File {
    URL: string;
    mimeType: string = "text/plain";
    filePath: string;
    readFunction: Function | undefined;

    public constructor(URL: string, filepath: string, readFunction?: (file: string) => Promise<string> | string) {
        this.URL = URL;
        this.filePath = filepath;
        this.mimeType = mime.lookup(filepath) || "text/plain";
        this.readFunction = readFunction
        serverRoutes.set(URL, this)
    }

    public async read() {
        if (this.readFunction) return this.readFunction(this.filePath)
        if (this.filePath) return fs.promises.readFile(this.filePath);
        return "";
    }
}

export const serverRoutes: Map<String, File> = new Map()

export function mapServerFiles() {
    console.log("Loading files into server routes")
    recursiveReadDir("src/scripts").forEach(file => {
        if (!file.endsWith('.js')) return
        const URL = URLify(file).replace('src', 'dist')

        new File(URL, file, (file) => fs.promises.readFile(file, "utf-8"))
    });

    recursiveReadDir("static/").forEach(file => {
        new File(URLify(file), file)
    });

    const pageRemovals = ["index", ".html", "/pages"]
    recursiveReadDir("pages/").forEach(file => {
        if (file.includes("+")) return
        let URL = URLify(file)
        pageRemovals.forEach(term => URL = URL.replace(term, ""))

        new File(URL, file, (file) => nunjucks.render(file, nunjucksObject))
    })

    recursiveReadDir("css/").forEach(file => {
        const URL = "/dist" + URLify(file);

        new File(URL, file, (file) => fs.promises.readFile(file, "utf-8"))
    })
    console.log(`${serverRoutes.size} files loaded into directory`)
    const display: Map<string, string> = new Map()
    serverRoutes.forEach(file => display.set(file.URL, file.filePath))
    console.log(display)
}