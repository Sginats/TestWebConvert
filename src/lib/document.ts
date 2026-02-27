import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import pdfParse from 'pdf-parse';

const LINE_HEIGHT = 14;
const FONT_SIZE = 11;
const MARGIN = 50;

export async function txtToPdf(text: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Courier);

  const pageWidth = 595; // A4
  const pageHeight = 842;
  const usableWidth = pageWidth - MARGIN * 2;
  const charsPerLine = Math.floor(usableWidth / (FONT_SIZE * 0.6));

  // Word-wrap lines
  const rawLines = text.split('\n');
  const wrappedLines: string[] = [];
  for (const rawLine of rawLines) {
    if (rawLine.length === 0) {
      wrappedLines.push('');
      continue;
    }
    let remaining = rawLine;
    while (remaining.length > charsPerLine) {
      // try to break at space
      let breakAt = charsPerLine;
      const spaceIdx = remaining.lastIndexOf(' ', charsPerLine);
      if (spaceIdx > 0) breakAt = spaceIdx;
      wrappedLines.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt).trimStart();
    }
    wrappedLines.push(remaining);
  }

  const linesPerPage = Math.floor((pageHeight - MARGIN * 2) / LINE_HEIGHT);

  for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const pageLines = wrappedLines.slice(i, i + linesPerPage);
    let y = pageHeight - MARGIN;
    for (const line of pageLines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;
    }
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function pdfToTxt(pdfBuffer: Buffer): Promise<string> {
  const data = await pdfParse(pdfBuffer);
  return data.text || '';
}
