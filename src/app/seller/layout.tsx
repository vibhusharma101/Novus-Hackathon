import { SellerSidebar, SellerTopbar, SellerMobileNav } from '@/components/seller/seller-shell'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-slate-soft">
      <SellerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SellerTopbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">{children}</main>
      </div>
      <SellerMobileNav />
    </div>
  )
}
