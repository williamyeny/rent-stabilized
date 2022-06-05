import fs from "fs"

const rawdataBuffer = fs.readFileSync('raw-data.json');
const rawdata = JSON.parse(rawdataBuffer.toString());
const pages = rawdata.Pages;

const TITLE_Y = 1.114;
const HEADERS_Y = 2.001;
const FOOTER_Y = 35.948;

const out = [];

for (const page of pages) {
    const xToHeader = new Map<number, string>();
    const yToAptAttr = new Map<number, Record<string, string>>();
    const texts = page.Texts;

    for (const text of texts) {
        if (text.y === TITLE_Y || text.y === FOOTER_Y) continue;

        const content = text.R[0].T

        if (text.y === HEADERS_Y) {
            xToHeader.set(text.x, content)
            continue;
        }

        const header = xToHeader.get(text.x)
        if (!header) {
            console.error(`Can't find associated header for ${text.x}`)
            continue;
        }

        const attributes = yToAptAttr.get(text.y) ?? {}

        attributes[header] = decodeURIComponent(content).trim();

        yToAptAttr.set(text.y, attributes);
    }

    out.push(...yToAptAttr.values())
}

fs.writeFile("./cleaned-data.json", JSON.stringify(out), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
});