import fs from "fs";
import PDFParser from "pdf2json";

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
    fs.writeFile("./raw-data.json", JSON.stringify(pdfData), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
});

pdfParser.loadPDF("./raw-data.pdf");