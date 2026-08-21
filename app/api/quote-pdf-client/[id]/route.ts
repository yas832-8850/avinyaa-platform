import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { calculateSellFromMargin, calculateLineTotal } from "@/app/dashboard/quotes/quote-margin";

const GST_RATE = 0.10;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, jobs_master(job_number, project_name, client)")
    .eq("id", id)
    .single();

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const { data: org } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", profile.org_id)
    .single();

  const { data: tiers } = await supabase
    .from("quote_tiers")
    .select("*")
    .eq("quote_id", id)
    .order("tier_number");

  const { data: lines } = await supabase
    .from("quote_lines")
    .select("*")
    .eq("quote_id", id)
    .order("position");

  const { data: freight } = await supabase
    .from("quote_freight")
    .select("*")
    .eq("quote_id", id)
    .maybeSingle();

  const tierList = tiers ?? [];
  const lineList = lines ?? [];

  function getTierSellPrice(unitCost: number, tierId: string | null): number | null {
    if (!tierId) return null;
    const tier = tierList.find((t) => t.id === tierId);
    if (!tier) return null;
    return calculateSellFromMargin(unitCost, tier.margin_percent);
  }

  const lineTotals = lineList.map((line) => {
    const sellPrice = getTierSellPrice(line.unit_cost, line.tier_used_id);
    return sellPrice !== null ? calculateLineTotal(sellPrice, line.order_qty) : 0;
  });

  const linesSum = lineTotals.reduce((sum, t) => sum + t, 0);
  const freightMargin = freight?.margin_percent ?? 0;
  const freightCost = freight?.amount ?? 0;
  const freightSell = calculateSellFromMargin(freightCost, freightMargin);
  const freightIncluded = freight?.included ?? true;
  const effectiveFreight = freightIncluded ? freightSell : 0;

  const subtotal = linesSum + effectiveFreight;
  const pricingMode = quote.pricing_mode ?? "ex_gst";
  const gstAmount = pricingMode === "inc_gst" ? subtotal - subtotal / (1 + GST_RATE) : subtotal * GST_RATE;
  const grandTotalExGst = pricingMode === "inc_gst" ? subtotal - gstAmount : subtotal;
  const grandTotalIncGst = pricingMode === "inc_gst" ? subtotal : subtotal + gstAmount;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.05, 0.1, 0.25);
  const gray = rgb(0.4, 0.4, 0.4);
  const black = rgb(0, 0, 0);
  const lightGray = rgb(0.85, 0.85, 0.85);

  let y = 800;

  if (org?.logo_url) {
    try {
      const logoResp = await fetch(org.logo_url);
      const logoBytes = await logoResp.arrayBuffer();
      let logoImage;
      if (org.logo_url.toLowerCase().endsWith(".png")) {
        logoImage = await pdfDoc.embedPng(logoBytes);
      } else {
        logoImage = await pdfDoc.embedJpg(logoBytes);
      }
      const logoDims = logoImage.scale(60 / logoImage.height);
      page.drawImage(logoImage, {
        x: 545 - logoDims.width,
        y: 780,
        width: logoDims.width,
        height: logoDims.height,
      });
    } catch {
      // If logo fails to load, just skip it rather than failing the whole PDF
    }
  }

  page.drawText("QUOTE", { x: 50, y, size: 26, font: boldFont, color: black });
  y -= 40;

  const billToName = quote.bill_to_name || quote.jobs_master?.client || "";
  page.drawText(billToName, { x: 50, y, size: 12, font: boldFont, color: black });
  y -= 16;
  if (quote.bill_to_address) {
    const addressLines = quote.bill_to_address.split("\n");
    for (const line of addressLines) {
      page.drawText(line, { x: 50, y, size: 10, font, color: black });
      y -= 14;
    }
  }

  let rightY = 760;
  const rightX = 330;

  function drawDetailRow(label: string, value: string) {
    page.drawText(label, { x: rightX, y: rightY, size: 9, font: boldFont, color: black });
    rightY -= 13;
    page.drawText(value || "—", { x: rightX, y: rightY, size: 10, font, color: black });
    rightY -= 20;
  }

  drawDetailRow("Date", new Date(quote.created_at).toLocaleDateString("en-AU"));
  if (quote.expiry_date) {
    drawDetailRow("Expiry", new Date(quote.expiry_date).toLocaleDateString("en-AU"));
  }
  if (quote.account_number) {
    drawDetailRow("Account Number", quote.account_number);
  }
  drawDetailRow("Quote Number", quote.quote_number || quote.id.slice(0, 8).toUpperCase());
  if (quote.reference) {
    drawDetailRow("Reference", quote.reference);
  }

  page.drawText(org?.name ?? "", { x: rightX, y: rightY, size: 10, font: boldFont, color: black });
  rightY -= 14;
  if (org?.type) {
    page.drawText(org.type, { x: rightX, y: rightY, size: 9, font, color: gray });
    rightY -= 14;
  }

  y = Math.min(y, rightY) - 30;

  // CLIENT-SAFE table header — Description, Qty, Unit Price, Total. NO Cost, NO Margin.
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: black });
  y -= 20;
  page.drawText("Description", { x: 50, y, size: 9, font: boldFont, color: gray });
  page.drawText("Qty", { x: 380, y, size: 9, font: boldFont, color: gray });
  page.drawText("Unit Price", { x: 440, y, size: 9, font: boldFont, color: gray });
  page.drawText("Total", { x: 510, y, size: 9, font: boldFont, color: gray });
  y -= 8;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
  y -= 20;

  for (let i = 0; i < lineList.length; i++) {
    const line = lineList[i];
    const sellPrice = getTierSellPrice(line.unit_cost, line.tier_used_id);
    const total = lineTotals[i];

    const descLines = (line.description || "").split("\n");
    for (const descLine of descLines) {
      const words = descLine.split(" ");
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length > 55) {
          page.drawText(currentLine, { x: 50, y, size: 9, font, color: black });
          y -= 12;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        page.drawText(currentLine, { x: 50, y, size: 9, font, color: black });
        y -= 12;
      }
    }

    y += 12;
    page.drawText(String(line.order_qty), { x: 380, y, size: 9, font, color: black });
    page.drawText(sellPrice !== null ? `$${sellPrice.toFixed(2)}` : "—", { x: 440, y, size: 9, font, color: black });
    page.drawText(`$${total.toFixed(2)}`, { x: 510, y, size: 9, font, color: black });
    y -= 12;
    y -= 8;
  }

  if (freightIncluded) {
    y -= 6;
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
    y -= 20;
    page.drawText("Freight", { x: 50, y, size: 9, font, color: black });
    page.drawText(`$${freightSell.toFixed(2)}`, { x: 440, y, size: 9, font, color: black });
    page.drawText(`$${freightSell.toFixed(2)}`, { x: 510, y, size: 9, font, color: black });
    y -= 20;
  }

  y -= 10;
  page.drawLine({ start: { x: 350, y }, end: { x: 545, y }, thickness: 1, color: black });
  y -= 20;

  page.drawText("Subtotal (Ex GST):", { x: 380, y, size: 10, font, color: black });
  page.drawText(`$${grandTotalExGst.toFixed(2)}`, { x: 500, y, size: 10, font, color: black });
  y -= 16;

  page.drawText("GST (10%):", { x: 380, y, size: 10, font, color: black });
  page.drawText(`$${gstAmount.toFixed(2)}`, { x: 500, y, size: 10, font, color: black });
  y -= 20;

  page.drawLine({ start: { x: 350, y }, end: { x: 545, y }, thickness: 1, color: navy });
  y -= 20;

  page.drawText("Total (Inc GST):", { x: 380, y, size: 13, font: boldFont, color: navy });
  page.drawText(`$${grandTotalIncGst.toFixed(2)}`, { x: 490, y, size: 13, font: boldFont, color: navy });

  const pdfBytes = await pdfDoc.save();
  const filename = `${quote.quote_number || quote.id.slice(0, 8)}-quote.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
