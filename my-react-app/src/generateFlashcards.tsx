import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateFlashcards(
  jsonData: { question: string; answer: string }[]
) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Letter size
  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;

  const LEFT_MARGIN = 40;
  const TOP_MARGIN = 80;
  const MAX_TEXT_WIDTH = PAGE_WIDTH - LEFT_MARGIN * 2;

  // 4 equal vertical sections
  const SECTION_HEIGHT = (PAGE_HEIGHT - TOP_MARGIN - 40) / 4;

  // Internal padding inside each section
  const SECTION_PADDING = 20;

  // Line height
  const LINE_HEIGHT = 18;

  // ALWAYS wrap at 60% of available width
  const REDUCED_WIDTH_FACTOR = 0.6;

  // -----------------------------
  // WORD WRAP HELPER
  // -----------------------------
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

  // -----------------------------
  // DASHED LINE (CUT GUIDES)
  // -----------------------------
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

  // -----------------------------
  // SMALL CROP MARKS
  // -----------------------------
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

  // -----------------------------
  // ADD PAGE + CUT LINES
  // -----------------------------
  const addPage = (title: string) => {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.setFont(font);
    page.setFontSize(16);

    // Page title
    page.drawText(title, {
      x: LEFT_MARGIN,
      y: PAGE_HEIGHT - 50,
      color: rgb(0, 0, 0),
    });

    // Draw dashed lines between 4 sections
    for (let s = 1; s <= 3; s++) {
      const y = PAGE_HEIGHT - TOP_MARGIN - SECTION_HEIGHT * s;

      drawDashedLine(page, LEFT_MARGIN + 4, PAGE_WIDTH - LEFT_MARGIN - 4, y);

      // Crop marks slightly outside
      drawCropMark(page, LEFT_MARGIN - 12, y);
      drawCropMark(page, PAGE_WIDTH - LEFT_MARGIN + 12, y);
    }

    return page;
  };

  // -----------------------------
  // MAIN LOOP — 4 AT A TIME
  // -----------------------------
  for (let i = 0; i < jsonData.length; i += 4) {
    const group = jsonData.slice(i, i + 4);

    // -------------------------
    // QUESTIONS PAGE
    // -------------------------
    const qPage = addPage("Questions");

    group.forEach((item, idx) => {
      const sectionTopY = PAGE_HEIGHT - TOP_MARGIN - SECTION_HEIGHT * idx;

      const maxWidth = MAX_TEXT_WIDTH * REDUCED_WIDTH_FACTOR;
      const lines = wrapText(item.question, maxWidth, 14);

      let y = sectionTopY - SECTION_PADDING;
      const bottomLimit = sectionTopY - SECTION_HEIGHT + SECTION_PADDING;

      for (const line of lines) {
        if (y < bottomLimit) break;

        qPage.drawText(line, {
          x: LEFT_MARGIN,
          y,
          size: 14,
        });

        y -= LINE_HEIGHT;
      }
    });

    // -------------------------
    // ANSWERS PAGE
    // -------------------------
    const aPage = addPage("Answers");

    group.forEach((item, idx) => {
      const sectionTopY = PAGE_HEIGHT - TOP_MARGIN - SECTION_HEIGHT * idx;

      const maxWidth = MAX_TEXT_WIDTH * REDUCED_WIDTH_FACTOR;
      const lines = wrapText(item.answer, maxWidth, 14);

      let y = sectionTopY - SECTION_PADDING;
      const bottomLimit = sectionTopY - SECTION_HEIGHT + SECTION_PADDING;

      for (const line of lines) {
        if (y < bottomLimit) break;

        aPage.drawText(line, {
          x: LEFT_MARGIN,
          y,
          size: 14,
        });

        y -= LINE_HEIGHT;
      }
    });
  }

  // -----------------------------
  // SAVE + DOWNLOAD
  // -----------------------------
  const pdfBytes = await pdfDoc.save();
  const safeBytes = new Uint8Array(pdfBytes);

  const blob = new Blob([safeBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "Flashcards.pdf";
  link.click();
}
