import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

function sanitizeFilename(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-|-$/g, "");
  return normalized.endsWith(".pdf") ? normalized : `${normalized}.pdf`;
}

export async function POST(request: NextRequest) {
  try {
    const requestedFilename = request.headers.get("x-filename") ?? "recital-checklist.pdf";
    const safeFilename = sanitizeFilename(requestedFilename) || "recital-checklist.pdf";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDirectory = path.join(process.cwd(), "saved-pdfs");
    const savedFilename = `${timestamp}-${safeFilename}`;
    const outputPath = path.join(outputDirectory, savedFilename);
    const fileBuffer = Buffer.from(await request.arrayBuffer());

    await mkdir(outputDirectory, { recursive: true });
    await writeFile(outputPath, fileBuffer);

    return NextResponse.json({
      filePath: outputPath
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to save the PDF on the server."
      },
      { status: 500 }
    );
  }
}
