
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableCell, 
  TableRow, 
  TextRun, 
  WidthType, 
  VerticalAlign, 
  TableBorders, 
  AlignmentType, 
  HeightRule 
} from 'docx';
import { saveAs } from 'file-saver';
import { DrawingData } from "../types";

export const generateCBMReports = async (data: DrawingData) => {
  const ROWS_PER_PAGE = 23; 
  const totalDimensions = data.dimensions.length;
  const totalPages = Math.ceil(totalDimensions / ROWS_PER_PAGE) || 1;
  const currentDate = new Date().toLocaleDateString('pl-PL');

  // Generujemy 3 raporty (zgodnie z wymogami 3 próbek)
  for (let reportIdx = 0; reportIdx < 3; reportIdx++) {
    const sections = [];

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageDimensions = data.dimensions.slice(
        pageIdx * ROWS_PER_PAGE,
        (pageIdx + 1) * ROWS_PER_PAGE
      );

      const topCodes = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TableBorders.NONE,
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DJ-IO 06", size: 14 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "F-NP 016", size: 14 })], alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "z06.01", size: 14 })], alignment: AlignmentType.RIGHT })] }),
            ],
          }),
        ],
      });

      const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "CBM Polska", bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "Spółka z o.o.", size: 8 })], alignment: AlignmentType.CENTER }),
                ],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                width: { size: 45, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Raport z kontroli", bold: true, size: 22 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "WZORCA DO ZATWIERDZENIA", bold: true, size: 22 })], alignment: AlignmentType.CENTER }),
                ],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [
                  createLabelValue("Rap. Nr", (reportIdx + 1).toString()),
                  createLabelValue("Data", currentDate),
                  createLabelValue("Strona", `${pageIdx + 1} / ${totalPages}`),
                ],
              }),
            ],
          }),
        ],
      });

      const partMetaTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Opis wzorca", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }),
              new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Nazwa i rysunek części", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Nowa część [ X ]  Zmodyfikowana [ ]", size: 14 })], spacing: { before: 100, after: 100 } })]
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: `Nr rys. ${data.drawingNumber || "N/A"}`, bold: true, size: 18 })], spacing: { before: 50 } }),
                  new Paragraph({ children: [new TextRun({ text: `Nazwa ${data.partName || "Część"}`, bold: true, size: 18 })], spacing: { after: 50 } }),
                ]
              }),
            ],
          }),
        ],
      });

      const dataRows = [
        new TableRow({
          tableHeader: true,
          children: [
            createTableHeadCell("Lp", 10),
            createTableHeadCell("Charakterystyka", 40),
            createTableHeadCell("Wynik dostawcy", 25),
            createTableHeadCell("Wynik KJ CBM", 25),
          ],
        }),
      ];

      pageDimensions.forEach((dim) => {
        let result = dim.results?.[reportIdx] || "";
        if (dim.isWeld) result = "O.K.";

        dataRows.push(new TableRow({
          children: [
            createTableDataCell(dim.balloonId, AlignmentType.CENTER, true),
            createTableDataCell(dim.characteristic, AlignmentType.LEFT, false, true),
            createTableDataCell(result, AlignmentType.CENTER, false),
            createTableDataCell("", AlignmentType.CENTER),
          ]
        }));
      });

      // Puste wiersze do wypełnienia strony
      while (dataRows.length <= ROWS_PER_PAGE + 1) {
        dataRows.push(new TableRow({
          children: [createTableDataCell(""), createTableDataCell(""), createTableDataCell(""), createTableDataCell("")]
        }));
      }

      sections.push({
        properties: { page: { margin: { top: 400, right: 400, bottom: 400, left: 400 } } },
        children: [
          topCodes,
          new Paragraph({ text: "", spacing: { after: 50 } }),
          headerTable,
          partMetaTable,
          new Paragraph({ text: "", spacing: { after: 100 } }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: dataRows }),
          new Paragraph({ text: "", spacing: { before: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Podpis KJ: ____________________  Data: ____________________", size: 12 })] }),
        ],
      });
    }

    const doc = new Document({ sections });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `RAPORT_CBM_${data.drawingNumber || "PROJEKT"}_PROBKA_${reportIdx + 1}.docx`);
  }
};

function createLabelValue(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, size: 12 }),
      new TextRun({ text: value, bold: true, size: 14 }),
    ],
    spacing: { before: 10, after: 10 }
  });
}

function createTableHeadCell(text: string, widthPct: number) {
  return new TableCell({
    shading: { fill: "F2F2F2" },
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 14 })],
      alignment: AlignmentType.CENTER
    })],
    verticalAlign: VerticalAlign.CENTER
  });
}

// Fixed AlignmentType type usage by using 'any' to resolve the value-vs-type conflict.
function createTableDataCell(text: string, align: any = AlignmentType.CENTER, bold = false, isSpecial = false) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ 
        text: text || "", 
        size: 14, 
        bold, 
        font: isSpecial ? "Arial Narrow" : "Arial" 
      })],
      alignment: align
    })],
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 20, bottom: 20, left: 40, right: 40 }
  });
}
