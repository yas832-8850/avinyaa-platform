import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("*, organisations(name), carriers(name)")
    .eq("id", id)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.05, 0.1, 0.25);
  const gray = rgb(0.4, 0.4, 0.4);
  const black = rgb(0, 0, 0);

  let y = 780;

  // Header
  page.drawText("AVINYAA AUSTRALIA", { x: 50, y, size: 20, font: boldFont, color: navy });
  y -= 20;
  page.drawText("ABN 57 184 217 792", { x: 50, y, size: 10, font, color: gray });
  y -= 14;
  page.drawText("North Kellyville, NSW", { x: 50, y, size: 10, font, color: gray });
  y -= 14;
  page.drawText("sales@avinyaa.com.au", { x: 50, y, size: 10, font, color: gray });

  y -= 40;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: navy });

  y -= 40;
  page.drawText("TAX INVOICE", { x: 50, y, size: 16, font: boldFont, color: navy });

  y -= 30;
  const invoiceNumber = `INV-${job.id.slice(0, 8).toUpperCase()}`;
  page.drawText(`Invoice #: ${invoiceNumber}`, { x: 50, y, size: 10, font, color: black });
  y -= 16;
  page.drawText(`Date: ${new Date().toLocaleDateString("en-AU")}`, { x: 50, y, size: 10, font, color: black });
  y -= 16;
  page.drawText(`Job booked: ${new Date(job.created_at).toLocaleDateString("en-AU")}`, { x: 50, y, size: 10, font, color: black });

  y -= 30;
  page.drawText("Bill to:", { x: 50, y, size: 10, font: boldFont, color: black });
  y -= 16;
  page.drawText(job.organisations?.name ?? "—", { x: 50, y, size: 12, font, color: black });

  y -= 40;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: gray });

  y -= 25;
  page.drawText("Description", { x: 50, y, size: 10, font: boldFont, color: gray });
  page.drawText("Carrier", { x: 280, y, size: 10, font: boldFont, color: gray });
  page.drawText("Amount", { x: 480, y, size: 10, font: boldFont, color: gray });

  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: gray });

  y -= 25;
  const description = job.job_type === "freight" ? "Freight service" : "Installation service";
  page.drawText(description, { x: 50, y, size: 11, font, color: black });
  page.drawText(job.carriers?.name ?? "—", { x: 280, y, size: 11, font, color: black });
  page.drawText(`$${Number(job.sell_rate).toFixed(2)}`, { x: 480, y, size: 11, font, color: black });

  if (job.notes) {
    y -= 16;
    page.drawText(job.notes.slice(0, 80), { x: 50, y, size: 9, font, color: gray });
  }

  y -= 30;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: navy });

  y -= 30;
  page.drawText("Total (AUD):", { x: 380, y, size: 12, font: boldFont, color: black });
  page.drawText(`$${Number(job.sell_rate).toFixed(2)}`, { x: 480, y, size: 12, font: boldFont, color: navy });

  y -= 60;
  page.drawText("Thank you for your business.", { x: 50, y, size: 10, font, color: gray });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoiceNumber}.pdf"`,
    },
  });
}