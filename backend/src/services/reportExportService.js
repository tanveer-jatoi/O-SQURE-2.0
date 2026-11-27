import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { env } from '../config/env.js';

/**
 * Streams a formatted Excel (.xlsx) workbook directly to the HTTP response.
 */
export async function streamExcelReport(res, { sheetName, filename, columns, rows }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = env.campus.name;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width || 22,
  }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };

  rows.forEach((row) => sheet.addRow(row));

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Streams a formatted A4 landscape PDF tabular report.
 */
export function streamTabularPdfReport(res, { title, subtitle, filename, columns, rows }) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  doc.fontSize(15).font('Helvetica-Bold').fillColor('#0F172A').text(`${env.campus.name} — ${title}`);
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(subtitle);
  doc.moveDown(0.8);

  const usableWidth = 770;
  const colWidth = Math.floor(usableWidth / columns.length);
  let y = doc.y;

  const drawHeader = () => {
    doc.rect(36, y, usableWidth, 20).fill('#0F172A');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
    columns.forEach((col, i) => {
      doc.text(col.header.toUpperCase(), 42 + i * colWidth, y + 6, {
        width: colWidth - 8,
        ellipsis: true,
      });
    });
    y += 22;
  };

  drawHeader();

  doc.font('Helvetica').fontSize(8).fillColor('#1E293B');
  rows.forEach((row, idx) => {
    if (y > 530) {
      doc.addPage();
      y = 36;
      drawHeader();
      doc.font('Helvetica').fontSize(8).fillColor('#1E293B');
    }
    if (idx % 2 === 1) {
      doc.rect(36, y - 2, usableWidth, 18).fill('#F8FAFC');
      doc.fillColor('#1E293B');
    }
    columns.forEach((col, i) => {
      const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—';
      doc.text(val, 42 + i * colWidth, y + 2, {
        width: colWidth - 8,
        ellipsis: true,
      });
    });
    y += 18;
  });

  doc.end();
}
