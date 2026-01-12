import * as docx from 'docx';
import { saveAs } from 'file-saver';
import { DrawingData } from "../types";

export const generateCBMReports = async (data: DrawingData) => {
  const ROWS_PER_PAGE = 23; 
  const totalDimensions = data.dimensions.length;
  const totalPages = Math.ceil(totalDimensions / ROWS_PER_PAGE) || 1;
  const currentDate = data.reportDate || new Date().toLocaleDateString('pl-PL');

  for (let reportIdx = 0; reportIdx < 3; reportIdx++) {
    const sections = [];

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageDimensions = data.dimensions.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);

      const headerTable = new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        rows: [
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [
                  new docx.Paragraph({ children: [new docx.TextRun({ text: "CBM Polska", bold: true, size: 28 })] }),
                ],
              }),
              new docx.TableCell({
                children: [
                  new docx.Paragraph({ children: [new docx.TextRun({ text: `RAPORT PRÓBKA ${reportIdx + 1}`, bold: true, size: 20 })] }),
                ],
              }),
            ],
          }),
        ],
      });

      const dataRows = pageDimensions.map(dim => new docx.TableRow({
        children: [
          new docx.TableCell({ children: [new docx.Paragraph(dim.balloonId)] }),
          new docx.TableCell({ children: [new docx.Paragraph(dim.characteristic)] }),
          new docx.TableCell({ children: [new docx.Paragraph(dim.results[reportIdx] || "OK")] }),
        ]
      }));

      sections.push({
        children: [
          headerTable,
          new docx.Paragraph({ text: `Nr rys: ${data.drawingNumber} | Detal: ${data.partName}`, spacing: { before: 200, after: 200 } }),
          new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("Lp")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("Wymiar")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("Wynik")] }),
                ]
              }),
              ...dataRows
            ]
          })
        ],
      });
    }

    const doc = new docx.Document({ sections });
    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `RAPORT_${data.drawingNumber}_PROBKA_${reportIdx + 1}.docx`);
  }
};
