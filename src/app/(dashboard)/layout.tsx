import { Sidebar, BuyerTopbar, BuyerMobileNav } from '@/components/sidebar'
import { CopilotPanel } from '@/components/copilot/copilot-panel'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <BuyerTopbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
      </div>
      <BuyerMobileNav />
      <CopilotPanel />
    </div>
  )
}
