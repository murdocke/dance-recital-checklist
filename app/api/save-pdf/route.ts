import { put } from "@vercel/blob";
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
    const filePath = `recital-checklists/${timestamp}-${safeFilename}`;
    const fileBuffer = Buffer.from(await request.arrayBuffer());

    const blob = await put(filePath, fileBuffer, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/pdf"
    });

    return NextResponse.json({
      filePath: blob.pathname,
      url: blob.url
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to save the PDF to Vercel Blob."
      },
      { status: 500 }
    );
  }
}
