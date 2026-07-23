import PDFDocument from "pdfkit";
import type { AdminExportDefinition } from "@/lib/services/admin-exports";

export async function createPdfDocument(
  definition: AdminExportDefinition,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: { top: 36, right: 30, bottom: 36, left: 30 },
    info: {
      Title: definition.title,
      Author: "Nahda Smart",
    },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const visibleColumns = definition.columns.slice(0, 9);
  const totalWeight = visibleColumns.reduce(
    (sum, column) => sum + (column.width ?? 18),
    0,
  );
  const columnWidths = visibleColumns.map(
    (column) => (pageWidth * (column.width ?? 18)) / totalWeight,
  );

  let y = drawPdfHeading(doc, definition);
  y = drawPdfHeader(doc, visibleColumns, columnWidths, y);

  definition.rows.forEach((row, index) => {
    if (y > doc.page.height - doc.page.margins.bottom - 24) {
      doc.addPage();
      y = drawPdfHeader(doc, visibleColumns, columnWidths, doc.page.margins.top);
    }

    const rowHeight = 22;
    if (index % 2 === 1) {
      doc
        .save()
        .fillColor("#f3f7ec")
        .rect(doc.page.margins.left, y, pageWidth, rowHeight)
        .fill()
        .restore();
    }

    let x = doc.page.margins.left;
    visibleColumns.forEach((column, columnIndex) => {
      doc
        .fillColor("#182016")
        .font("Helvetica")
        .fontSize(7.5)
        .text(String(row[column.key] ?? ""), x + 4, y + 7, {
          width: columnWidths[columnIndex] - 8,
          height: 10,
          ellipsis: true,
          lineBreak: false,
        });
      x += columnWidths[columnIndex];
    });
    y += rowHeight;
  });

  doc
    .moveDown()
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#667064")
    .text(
      `${definition.rows.length} ligne(s) exportée(s) — ${new Date().toLocaleString("fr-MA")}`,
      doc.page.margins.left,
      y + 10,
    );
  doc.end();

  return result;
}

function drawPdfHeading(
  doc: InstanceType<typeof PDFDocument>,
  definition: AdminExportDefinition,
) {
  doc
    .fillColor("#182016")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(definition.title, doc.page.margins.left, doc.page.margins.top);
  doc
    .fillColor("#667064")
    .font("Helvetica")
    .fontSize(9)
    .text("Export administratif confidentiel", doc.page.margins.left, 60);
  return 82;
}

function drawPdfHeader(
  doc: InstanceType<typeof PDFDocument>,
  columns: AdminExportDefinition["columns"],
  widths: number[],
  y: number,
) {
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc
    .save()
    .fillColor("#55720f")
    .rect(doc.page.margins.left, y, pageWidth, 26)
    .fill()
    .restore();

  let x = doc.page.margins.left;
  columns.forEach((column, index) => {
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(column.header, x + 4, y + 8, {
        width: widths[index] - 8,
        height: 10,
        ellipsis: true,
        lineBreak: false,
      });
    x += widths[index];
  });

  return y + 26;
}
