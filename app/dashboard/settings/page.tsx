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
  ];

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage settings across the platform.</p>

      <div className="grid grid-cols-2 gap-4">
        {settingsAreas.map((area) => (
          <a key={area.href} href={area.href} className="border rounded-md p-4 hover:bg-gray-50 hover:border-gray-300">
            <h3 className="font-medium text-sm mb-1">{area.title}</h3>
            <p className="text-xs text-gray-500">{area.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}