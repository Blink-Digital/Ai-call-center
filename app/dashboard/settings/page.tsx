import type { Metadata } from "next"
import SettingsForm from "@/components/settings/settings-form"

export const metadata: Metadata = {
  title: "API Settings | Bland.ai Flowchart Builder",
  description: "Manage your API keys and integrations",
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">API Settings</h1>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <SettingsForm />
      </div>
    </div>
  )
}
