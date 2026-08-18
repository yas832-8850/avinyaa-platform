"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getQuotes(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select("*, jobs_master(job_number, project_name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load quotes:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getQuote(quoteId: string) {
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    return null;
  }

  const { data: tiers } = await supabase
    .from("quote_tiers")
    .select("*")
    .eq("quote_id", quoteId)
    .order("tier_number");

  const { data: lines } = await supabase
    .from("quote_lines")
    .select("*")
    .eq("quote_id", quoteId)
    .order("position");

  const { data: freight } = await supabase
    .from("quote_freight")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle();

  return {
    quote,
    tiers: tiers ?? [],
    lines: lines ?? [],
    freight: freight ?? null,
  };
}

export async function createQuote(orgId: string, quoteName: string, jobId: string | null) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      org_id: orgId,
      quote_name: quoteName,
      job_id: jobId,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  const defaultTiers = [
    { quote_id: data.id, tier_number: 1, margin_percent: 20, position: 1 },
    { quote_id: data.id, tier_number: 2, margin_percent: 25, position: 2 },
    { quote_id: data.id, tier_number: 3, margin_percent: 30, position: 3 },
  ];
  await supabase.from("quote_tiers").insert(defaultTiers);

  await supabase.from("quote_freight").insert({ quote_id: data.id, amount: 0 });

  revalidatePath("/dashboard/quotes");
  return { success: true, quote: data };
}

export async function updateQuote(
  quoteId: string,
  updates: { quote_name?: string; job_id?: string | null; pricing_mode?: string; rounding?: string }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quotes")
    .update(updates)
    .eq("id", quoteId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/quotes");
  return { success: true };
}

export async function deleteQuote(quoteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/quotes");
  return { success: true };
}

export async function createQuoteLine(quoteId: string, position: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quote_lines")
    .insert({
      quote_id: quoteId,
      description: "",
      unit_cost: 0,
      order_qty: 1,
      position,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  return { success: true, line: data };
}

export async function updateQuoteLine(
  lineId: string,
  updates: {
    description?: string;
    code?: string;
    unit_cost?: number;
    order_qty?: number;
    tier_used_id?: string | null;
    linked_node_id?: string | null;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quote_lines")
    .update(updates)
    .eq("id", lineId);

  if (error) return { error: error.message };

  return { success: true };
}

export async function deleteQuoteLine(lineId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quote_lines")
    .delete()
    .eq("id", lineId);

  if (error) return { error: error.message };

  return { success: true };
}

export async function updateQuoteTier(tierId: string, marginPercent: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quote_tiers")
    .update({ margin_percent: marginPercent })
    .eq("id", tierId);

  if (error) return { error: error.message };

  return { success: true };
}

export async function addQuoteTier(quoteId: string, tierNumber: number, marginPercent: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quote_tiers")
    .insert({ quote_id: quoteId, tier_number: tierNumber, margin_percent: marginPercent, position: tierNumber })
    .select()
    .single();

  if (error) return { error: error.message };

  return { success: true, tier: data };
}

export async function deleteQuoteTier(tierId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quote_tiers")
    .delete()
    .eq("id", tierId);

  if (error) return { error: error.message };

  return { success: true };
}

export async function updateQuoteFreight(quoteId: string, amount: number, notes: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("quote_freight")
    .select("id")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("quote_freight")
      .update({ amount, notes })
      .eq("quote_id", quoteId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("quote_freight")
      .insert({ quote_id: quoteId, amount, notes });
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function getJobsForDropdown(orgId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("jobs_master")
    .select("id, job_number, project_name")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getNodesForJob(jobId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("job_nodes")
    .select("id, name")
    .eq("job_id", jobId)
    .order("position");

  return data ?? [];
}