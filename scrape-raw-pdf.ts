import fs from "fs";
// @ts-ignore
import PDFParser from "pdf2json";

(async () => {
    // Load PDF.
    console.log("Loading PDFs")
    const promises = []
    for (const city of ["bronx", "brooklyn", "manhattan", "queens", "staten-island"]) {
        promises.push(new Promise((res, rej) => {
            const pdfParser = new PDFParser();

            pdfParser.on("pdfParser_dataError", (errData: any) => rej(errData.parserError));
            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                console.log(`${city}.pdf loaded`)
                res(pdfData.Pages)
            });

            pdfParser.loadPDF(`./data/${city}.pdf`);
        }))
    }

    try {
        const pages: any[] = (await Promise.all(promises)).flat(1);

        // Clean PDF raw data into list of apartments.
        console.log("Cleaning data")

        const apts = [];

        for (const page of pages) {
            const texts = page.Texts;

            // First, get Y values of special rows.
            const ySet = new Set<number>(texts.map((text: { y: number; }) => text.y));
            const yValues = Array.from(ySet.values()).sort((a, b) => a - b);

            const titleY = yValues[0];
            const headersY = yValues[1];
            const footerY = yValues[yValues.length - 1];

            const xToHeader = new Map<number, string>();
            const yToAptAttr = new Map<number, Record<string, string>>();

            // Get headers and apartment attributes.
            for (const text of texts) {
                // Skip title and footer text.
                if (text.y === titleY || text.y === footerY) continue;

                const content = text.R[0].T

                if (text.y === headersY) {
                    xToHeader.set(text.x, content)
                    continue;
                }

                const header = xToHeader.get(text.x)
                if (!header) {
                    console.error(`Can't find associated header for ${text.x}, ${content}`)
                    continue;
                }

                const attributes = yToAptAttr.get(text.y) ?? {}

                attributes[header] = decodeURIComponent(content).trim();

                yToAptAttr.set(text.y, attributes);
            }

            apts.push(...yToAptAttr.values())
        }



        fs.writeFile("./cleaned-data.json", JSON.stringify(apts), (err) => {
            if (err) throw err;
            console.log('Done!');
        });
    } catch (e) {
        console.error(e)
    }
})();