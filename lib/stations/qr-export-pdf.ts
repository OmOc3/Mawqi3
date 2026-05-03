import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { createElement } from "react";
import satori from "satori";
import { formatDateRome } from "@/lib/datetime";
import { technicianScanUrl, type StationQrExportItem } from "@/lib/stations/qr-export";

const a4Width = 595.28;
const a4Height = 841.89;
const pdfScale = 2;
const fontPath = path.join(process.cwd(), "assets", "fonts", "Tajawal-Bold.ttf");

let tajawalBoldBuffer: Buffer | undefined;

function clampText(value: string, maxLength: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

async function getTajawalBold(): Promise<Buffer> {
  if (!tajawalBoldBuffer) {
    tajawalBoldBuffer = await readFile(fontPath);
  }

  return tajawalBoldBuffer;
}

async function renderTextPng(input: {
  align?: "center" | "left" | "right";
  color?: string;
  direction?: "ltr" | "rtl";
  fontSize: number;
  fontWeight?: 700 | 800;
  height: number;
  text: string;
  width: number;
}): Promise<Buffer> {
  const fontData = await getTajawalBold();
  const w = Math.ceil(input.width * pdfScale);
  const h = Math.ceil(input.height * pdfScale);
  const fontSizePx = Math.round(input.fontSize * pdfScale);
  const direction = input.direction ?? "rtl";
  const justifyContent =
    input.align === "left" ? "flex-start" : input.align === "right" ? "flex-end" : "center";

  const fontWeightCss = input.fontWeight === 800 ? 800 : 700;

  const element = createElement(
    "div",
    {
      style: {
        alignItems: "center",
        color: input.color ?? "#111827",
        direction,
        display: "flex",
        fontFamily: "Tajawal",
        fontSize: `${fontSizePx}px`,
        fontWeight: fontWeightCss,
        height: `${h}px`,
        justifyContent,
        width: `${w}px`,
      },
    },
    input.text,
  );

  const svg = await satori(element, {
    fonts: [
      {
        data: fontData,
        name: "Tajawal",
        style: "normal",
        weight: 700,
      },
      {
        data: fontData,
        name: "Tajawal",
        style: "normal",
        weight: 800,
      },
    ],
    height: h,
    width: w,
  });

  return new Resvg(svg).render().asPng();
}

async function drawTextImage(
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument["addPage"]>,
  input: Parameters<typeof renderTextPng>[0] & { x: number; y: number },
): Promise<void> {
  const pngBytes = await renderTextPng(input);
  const image = await pdfDoc.embedPng(pngBytes);
  page.drawImage(image, {
    height: input.height / pdfScale,
    width: input.width / pdfScale,
    x: input.x,
    y: input.y,
  });
}

function pngBytesFromDataUrl(dataUrl: string): Buffer {
  const [, base64] = dataUrl.split(",", 2);

  if (!base64) {
    throw new Error("Invalid QR image data.");
  }

  return Buffer.from(base64, "base64");
}

export async function createStationQrExportPdf(items: readonly StationQrExportItem[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const item of items) {
    const page = pdfDoc.addPage([a4Width, a4Height]);
    page.drawRectangle({
      color: rgb(0.975, 0.98, 0.985),
      height: a4Height,
      width: a4Width,
      x: 0,
      y: 0,
    });
    page.drawRectangle({
      borderColor: rgb(0.82, 0.86, 0.9),
      borderWidth: 1,
      color: rgb(1, 1, 1),
      height: a4Height - 96,
      width: a4Width - 96,
      x: 48,
      y: 48,
    });

    await drawTextImage(pdfDoc, page, {
      color: "#0f172a",
      direction: "ltr",
      fontSize: 58,
      fontWeight: 800,
      height: 86,
      text: "SCAN ME",
      width: 520,
      x: 37.5,
      y: 688,
    });

    const qrDataUrl = await QRCode.toDataURL(item.qrCodeValue, {
      errorCorrectionLevel: "H",
      margin: 2,
      type: "image/png",
      width: 900,
    });
    const qrImage = await pdfDoc.embedPng(pngBytesFromDataUrl(qrDataUrl));
    page.drawImage(qrImage, {
      height: 330,
      width: 330,
      x: (a4Width - 330) / 2,
      y: 330,
    });

    await drawTextImage(pdfDoc, page, {
      color: "#0f172a",
      direction: "rtl",
      fontSize: 34,
      fontWeight: 800,
      height: 54,
      text: clampText(item.label, 48),
      width: 760,
      x: (a4Width - 380) / 2,
      y: 265,
    });
    await drawTextImage(pdfDoc, page, {
      color: "#334155",
      direction: "rtl",
      fontSize: 24,
      height: 42,
      text: `العميل: ${clampText(item.clientName, 52)}`,
      width: 760,
      x: (a4Width - 380) / 2,
      y: 223,
    });
    await drawTextImage(pdfDoc, page, {
      color: "#475569",
      direction: "rtl",
      fontSize: 22,
      height: 38,
      text: `تاريخ الإنشاء: ${formatDateRome(item.createdAt, { locale: "ar-EG" })}`,
      width: 760,
      x: (a4Width - 380) / 2,
      y: 188,
    });
    await drawTextImage(pdfDoc, page, {
      color: "#64748b",
      direction: "ltr",
      fontSize: 18,
      height: 34,
      text: technicianScanUrl,
      width: 800,
      x: (a4Width - 400) / 2,
      y: 92,
    });
  }

  return pdfDoc.save();
}
