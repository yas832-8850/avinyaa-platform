import { getOrganisation, getShareWithAvinyaa } from "./actions";
import LogoUploadForm from "./logo-upload-form";
import ShareWithAvinyaaToggle from "./share-with-avinyaa-toggle";
import { getAuthContext } from "@/lib/auth";

export default async function OrganisationSettingsPage() {
  const { orgId } = await getAuthContext();

  const org = await getOrganisation(orgId);
  const shareEnabled = await getShareWithAvinyaa(orgId);

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold tracking-wide text-[#EDEEF0] mb-1">Organisation Settings</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-2" />
        <p className="text-sm text-[#8B92A0] mb-6">Upload your logo — it will appear on quote PDFs.</p>
        <LogoUploadForm orgId={orgId} currentLogoUrl={org?.logo_url ?? null} />
        <ShareWithAvinyaaToggle orgId={orgId} initialValue={shareEnabled} />
      </div>
    </div>
  );
}
