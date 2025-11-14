import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateFlashcards(
  jsonData: { question: string; answer: string }[]
) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const width = 612;
  const height = 792;

  const leftMargin = 40;
  const topMargin = 80;
  const maxTextWidth = width - leftMargin * 2;

  const sectionHeight = (height - topMargin - 40) / 4;

  const sectionPadding = 20;
  const lineHeight = 18;

  const reducedWidthFactor = 0.6;

  function wrapText(text: string, maxWidth: number, fontSize: number) {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      const w = font.widthOfTextAtSize(testLine, fontSize);

      if (w > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function drawDashedLine(
    page: any,
    xStart: number,
    xEnd: number,
    y: number,
    dash = 8,
    gap = 6,
    thickness = 0.8
  ) {
    let x = xStart;
    const color = rgb(0.3, 0.3, 0.3);

    while (x < xEnd) {
      const w = Math.min(dash, xEnd - x);
      page.drawRectangle({
        x,
        y: y - thickness / 2,
        width: w,
        height: thickness,
        color,
      });
      x += dash + gap;
    }
  }

  function drawCropMark(
    page: any,
    x: number,
    y: number,
    length = 8,
    thickness = 0.8
  ) {
    const color = rgb(0.3, 0.3, 0.3);

    page.drawRectangle({
      x: x - thickness / 2,
      y: y - length / 2,
      width: thickness,
      height: length,
      color,
    });
  }

  function drawVerticalCutMark(
    page: any,
    x: number,
    yTop: number,
    yBottom: number,
    thickness = 0.8,
    dash = 8,
    gap = 6
  ) {
    const color = rgb(0.3, 0.3, 0.3);
    let y = yBottom;

    while (y < yTop) {
      const h = Math.min(dash, yTop - y);
      page.drawRectangle({
        x: x - thickness / 2,
        y,
        width: thickness,
        height: h,
        color,
      });
      y += dash + gap;
    }
  }

  const addPage = (title: string) => {
    const page = pdfDoc.addPage([width, height]);
    page.setFont(font);
    page.setFontSize(16);

    page.drawText(title, {
      x: leftMargin,
      y: height - 50,
      color: rgb(0, 0, 0),
    });

    for (let s = 1; s <= 3; s++) {
      const y = height - topMargin - sectionHeight * s;

      drawDashedLine(page, leftMargin + 4, width - leftMargin - 4, y);

      drawCropMark(page, leftMargin - 12, y);
      drawCropMark(page, width - leftMargin + 12, y);
    }

    return page;
  };

  for (let i = 0; i < jsonData.length; i += 4) {
    const group = jsonData.slice(i, i + 4);

    const qPage = addPage("Questions");

    group.forEach((item, idx) => {
      const sectionTopY = height - topMargin - sectionHeight * idx;
      const sectionBottomY = sectionTopY - sectionHeight;

      const cutX = leftMargin + maxTextWidth * reducedWidthFactor;

      drawVerticalCutMark(qPage, cutX, sectionTopY - 4, sectionBottomY + 4);

      const maxWidth = maxTextWidth * reducedWidthFactor;
      const lines = wrapText(item.question, maxWidth, 14);

      let y = sectionTopY - sectionPadding;
      const bottomLimit = sectionBottomY + sectionPadding;

      for (const line of lines) {
        if (y < bottomLimit) break;

        qPage.drawText(line, {
          x: leftMargin,
          y,
          size: 14,
        });

        y -= lineHeight;
      }
    });

    const aPage = addPage("Answers");

    group.forEach((item, idx) => {
      const sectionTopY = height - topMargin - sectionHeight * idx;
      const sectionBottomY = sectionTopY - sectionHeight;

      const cutX = leftMargin + maxTextWidth * (1 - reducedWidthFactor);

      drawVerticalCutMark(aPage, cutX, sectionTopY - 4, sectionBottomY + 4);

      const maxWidth = maxTextWidth * (1 - reducedWidthFactor);
      const lines = wrapText(item.answer, maxWidth, 14);

      let y = sectionTopY - sectionPadding;
      const bottomLimit = sectionBottomY + sectionPadding;

      for (const line of lines) {
        if (y < bottomLimit) break;

        aPage.drawText(line, {
          x: cutX + sectionPadding,
          y,
          size: 14,
        });

        y -= lineHeight;
      }
    });
  }

  const pdfBytes = await pdfDoc.save();
  const safeBytes = new Uint8Array(pdfBytes);

  const blob = new Blob([safeBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "Flashcards.pdf";
  link.click();
}
