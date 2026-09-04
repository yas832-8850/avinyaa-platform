import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getQuote, getJobsForDropdown, getMasterOrgId } from "../actions";
import QuoteBuilder from "./quote-builder";
import { getAuthContext } from "@/lib/auth";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId: viewerOrgId, isSuperAdmin } = await getAuthContext();

  const result = await getQuote(id);
  if (!result) notFound();

  const { quote } = result;

  // Access rule, matching the Quotes model confirmed this session: a client
  // can only open their OWN quote; staff can open any quote EXCEPT one a
  // client created privately without sharing it.
  if (!isSuperAdmin && quote.client_org_id !== viewerOrgId) {
    notFound();
  }
  if (isSuperAdmin && quote.created_by_client && !quote.shared_with_staff) {
    notFound();
  }

  const masterOrgId = await getMasterOrgId();
  if (!masterOrgId) notFound();

  const jobOptions = await getJobsForDropdown(isSuperAdmin, viewerOrgId);

  return (
    <QuoteBuilder
      orgId={masterOrgId}
      initialQuote={quote}
      initialTiers={result.tiers}
      initialLines={result.lines}
      initialFreight={result.freight}
      jobOptions={jobOptions}
      isOwner={quote.client_org_id === viewerOrgId && !isSuperAdmin}
    />
  );
}
