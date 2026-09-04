export default function SettingsHubPage() {
  const settingsAreas = [
    {
      title: "Organisation",
      description: "Upload your logo and manage organisation details.",
      href: "/dashboard/settings/organisation",
    },
    {
      title: "Statuses",
      description: "Manage status labels and colors used across job trees.",
      href: "/dashboard/settings/statuses",
    },
    {
      title: "Assignees",
      description: "Manage the people who can be assigned to tasks.",
      href: "/dashboard/settings/assignees",
    },
    {
      title: "Installers",
      description: "Manage installers for rollout planning and job allocation.",
      href: "/dashboard/settings/installers",
    },
        {
      title: "Manage Staff",
      description: "Create staff accounts and set what they can access.",
      href: "/dashboard/settings/staff",
    },
  ];

  return (
    <div className="min-h-screen bg-[#15181D] p-6">
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold tracking-wide text-[#EDEEF0] mb-1">Settings</h1>
        <div className="h-[2px] w-10 bg-[#F0A83A] mb-2" />
        <p className="text-sm text-[#8B92A0] mb-6">Manage settings across the platform.</p>

        <div className="grid grid-cols-2 gap-4">
          {settingsAreas.map((area) => (
            <a key={area.href} href={area.href} className="border border-[#2C313A] bg-[#1E2229] p-4 hover:border-[#F0A83A] transition-colors">
              <h3 className="font-medium text-sm text-[#EDEEF0] mb-1">{area.title}</h3>
              <p className="text-xs text-[#8B92A0]">{area.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
