
import * as docx from 'docx';
import { saveAs } from 'file-saver';
import { DrawingData } from "../types";

export const generateCBMReports = async (data: DrawingData) => {
  const ROWS_PER_PAGE = 23; 
  const totalDimensions = data.dimensions.length;
  const totalPages = Math.ceil(totalDimensions / ROWS_PER_PAGE) || 1;
  const currentDate = new Date().toLocaleDateString('pl-PL');

  for (let reportIdx = 0; reportIdx < 3; reportIdx++) {
    const sections = [];

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageDimensions = data.dimensions.slice(
        pageIdx * ROWS_PER_PAGE,
        (pageIdx + 1) * ROWS_PER_PAGE
      );

      const topCodes = new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        borders: docx.TableBorders.NONE,
        rows: [
          new docx.TableRow({
            children: [
              new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "DJ-IO 06", size: 14 })] })] }),
              // Use docx.Alignment instead of docx.AlignmentType
              new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "F-NP 016", size: 14 })], alignment: docx.Alignment.CENTER })] }),
              // Use docx.Alignment instead of docx.AlignmentType
              new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "z06.01", size: 14 })], alignment: docx.Alignment.RIGHT })] }),
            ],
          }),
        ],
      });

      const headerTable = new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        rows: [
          new docx.TableRow({
            children: [
              new docx.TableCell({
                width: { size: 30, type: docx.WidthType.PERCENTAGE },
                children: [
                  // Use docx.Alignment instead of docx.AlignmentType
                  new docx.Paragraph({ children: [new docx.TextRun({ text: "CBM Polska", bold: true, size: 28 })], alignment: docx.Alignment.CENTER }),
                  // Use docx.Alignment instead of docx.AlignmentType
                  new docx.Paragraph({ children: [new docx.TextRun({ text: "KONSTRUKCJE MECHANICZNE Sp. z o.o.", size: 8 })], alignment: docx.Alignment.CENTER }),
                ],
                verticalAlign: docx.VerticalAlign.CENTER,
              }),
              new docx.TableCell({
                width: { size: 45, type: docx.WidthType.PERCENTAGE },
                children: [
                  // Use docx.Alignment instead of docx.AlignmentType
                  new docx.Paragraph({ children: [new docx.TextRun({ text: "Raport z kontroli", bold: true, size: 22 })], alignment: docx.Alignment.CENTER }),
                  // Use docx.Alignment instead of docx.AlignmentType
                  new docx.Paragraph({ children: [new docx.TextRun({ text: "WZORCA DO ZATWIERDZENIA", bold: true, size: 22 })], alignment: docx.Alignment.CENTER }),
                ],
                verticalAlign: docx.VerticalAlign.CENTER,
              }),
              new docx.TableCell({
                width: { size: 25, type: docx.WidthType.PERCENTAGE },
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

      const partMetaTable = new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        rows: [
          new docx.TableRow({
            children: [
              // Use docx.Alignment instead of docx.AlignmentType
              new docx.TableCell({ shading: { fill: "F2F2F2" }, children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Opis wzorca", bold: true, size: 16 })], alignment: docx.Alignment.CENTER })] }),
              // Use docx.Alignment instead of docx.AlignmentType
              new docx.TableCell({ shading: { fill: "F2F2F2" }, children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Nazwa i rysunek części", bold: true, size: 16 })], alignment: docx.Alignment.CENTER })] }),
            ],
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Nowa część [ X ]  Zmodyfikowana [  ]  Nowy dostawca [  ]", size: 14 })], spacing: { before: 100, after: 100 } })]
              }),
              new docx.TableCell({
                children: [
                  new docx.Paragraph({ children: [new docx.TextRun({ text: `Nr rys.  ${data.drawingNumber}`, bold: true, size: 18 })], spacing: { before: 50 } }),
                  new docx.Paragraph({ children: [new docx.TextRun({ text: `Nazwa części  ${data.partName}`, bold: true, size: 18 })], spacing: { after: 50 } }),
                ]
              }),
            ],
          }),
        ],
      });

      const dataRows = [
        new docx.TableRow({
          tableHeader: true,
          children: [
            createTableHeadCell("Lp", 8),
            createTableHeadCell("Charakterystyka", 42),
            createTableHeadCell("Wynik dostawcy", 25),
            createTableHeadCell("Wynik KJ CBM Polska", 25),
          ],
        }),
      ];

      pageDimensions.forEach((dim) => {
        let result = dim.results[reportIdx] || "";
        if (dim.isWeld) result = "O.K.";
        if (dim.isGDT && !result) result = "ACCEPTED";

        dataRows.push(new docx.TableRow({
          children: [
            // Use docx.Alignment instead of docx.AlignmentType
            createTableDataCell(dim.balloonId, docx.Alignment.CENTER, true),
            // Use docx.Alignment instead of docx.AlignmentType
            createTableDataCell(dim.characteristic, docx.Alignment.LEFT, false, true),
            // Use docx.Alignment instead of docx.AlignmentType
            createTableDataCell(result, docx.Alignment.CENTER, false),
            // Use docx.Alignment instead of docx.AlignmentType
            createTableDataCell("", docx.Alignment.CENTER),
          ]
        }));
      });

      while (dataRows.length <= ROWS_PER_PAGE + 1) {
        dataRows.push(new docx.TableRow({
          children: [createTableDataCell(""), createTableDataCell(""), createTableDataCell(""), createTableDataCell("")]
        }));
      }

      const footerDecisionTable = new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        rows: [
          new docx.TableRow({
            children: [
              new docx.TableCell({
                borders: docx.TableBorders.NONE,
                width: { size: 60, type: docx.WidthType.PERCENTAGE },
                children: [
                  new docx.Paragraph({ children: [new docx.TextRun({ text: "Gwarantujemy że wyniki zapisane powyżej są prawdziwe i nasz wzorzec został wykonany zgodnie z wymaganiami KJ CBM Polska", italics: true, size: 11 })] }),
                  new docx.Paragraph({ text: "", spacing: { before: 100 } }),
                  new docx.Paragraph({ children: [new docx.TextRun({ text: "UWAGI: __________________________________________________________________", size: 12 })] }),
                  new docx.Paragraph({ children: [new docx.TextRun({ text: "__________________________________________________________________________", size: 12 })] }),
                ],
              }),
              new docx.TableCell({
                width: { size: 40, type: docx.WidthType.PERCENTAGE },
                children: [
                  new docx.Table({
                    width: { size: 100, type: docx.WidthType.PERCENTAGE },
                    rows: [
                      // Use docx.Alignment instead of docx.AlignmentType
                      new docx.TableRow({ children: [new docx.TableCell({ shading: { fill: "F2F2F2" }, children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "DECYZJE", bold: true, size: 12 })], alignment: docx.Alignment.CENTER })], columnSpan: 5 })] }),
                      new docx.TableRow({ children: [
                        new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "", size: 8 })] })] }),
                        new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "WYM.", size: 8 })] })] }),
                        new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "WZROK.", size: 8 })] })] }),
                        new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "MAT.", size: 8 })] })] }),
                        new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "OBR.", size: 8 })] })] }),
                      ]}),
                      new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "TAK", size: 10 })] })] }), new docx.TableCell({ children: [] }), new docx.TableCell({ children: [] }), new docx.TableCell({ children: [] }), new docx.TableCell({ children: [] })] }),
                      new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "NIE", size: 10 })] })] }), new docx.TableCell({ children: [] }), new docx.TableCell({ children: [] }), new docx.TableCell({ children: [] }), new docx.TableCell({ children: [] })] }),
                    ]
                  })
                ]
              })
            ]
          })
        ]
      });

      const signatureBlock = new docx.Paragraph({
        children: [
          new docx.TextRun({ text: "Podpis KJ Dostawcy: _________________ ", size: 12 }),
          new docx.TextRun({ text: "\tLab. Metrologiczne: _________________", size: 12 }),
          new docx.TextRun({ text: "\tKJ CBM: _________________", size: 12 }),
        ],
        spacing: { before: 200 }
      });

      sections.push({
        properties: { page: { margin: { top: 400, right: 400, bottom: 400, left: 400 } } },
        children: [
          topCodes,
          new docx.Paragraph({ text: "", spacing: { after: 50 } }),
          headerTable,
          partMetaTable,
          new docx.Paragraph({ text: "", spacing: { after: 50 } }),
          new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: dataRows }),
          new docx.Paragraph({ text: "", spacing: { after: 100 } }),
          footerDecisionTable,
          signatureBlock
        ],
      });
    }

    const doc = new docx.Document({ sections });
    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `${data.drawingNumber}_RAPORT_PRÓBKA_${reportIdx + 1}.docx`);
  }
};

function createLabelValue(label: string, value: string) {
  return new docx.Paragraph({
    children: [
      new docx.TextRun({ text: `${label}: `, size: 12 }),
      new docx.TextRun({ text: value, bold: true, size: 14 }),
    ],
    spacing: { before: 10, after: 10 }
  });
}

function createTableHeadCell(text: string, widthPct: number) {
  return new docx.TableCell({
    shading: { fill: "F2F2F2" },
    width: { size: widthPct, type: docx.WidthType.PERCENTAGE },
    children: [new docx.Paragraph({
      children: [new docx.TextRun({ text, bold: true, size: 14 })],
      // Use docx.Alignment instead of docx.AlignmentType
      alignment: docx.Alignment.CENTER
    })],
    verticalAlign: docx.VerticalAlign.CENTER
  });
}

// Fixed: Use docx.Alignment instead of docx.AlignmentType to match newer library version
function createTableDataCell(text: string, align: docx.Alignment = docx.Alignment.CENTER, bold = false, isSpecial = false) {
  return new docx.TableCell({
    children: [new docx.Paragraph({
      children: [new docx.TextRun({ 
        text: text || "", 
        size: 14, 
        bold, 
        font: isSpecial ? "Segoe UI Symbol" : "Arial" 
      })],
      alignment: align
    })],
    verticalAlign: docx.VerticalAlign.CENTER,
    margins: { top: 10, bottom: 10, left: 40, right: 40 }
  });
}
