import { Sidebar } from '@/components/sidebar'
import { CopilotPanel } from '@/components/copilot/copilot-panel'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
      <CopilotPanel />
    </div>
  )
}
