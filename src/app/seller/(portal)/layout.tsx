import { redirect } from 'next/navigation'
import { sellerAuth } from '@/lib/seller-auth'
import { SellerSidebar, SellerTopbar, SellerMobileNav } from '@/components/seller/seller-shell'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await sellerAuth()
  if (!session) redirect('/seller/sign-in')

  return (
    <div className="flex h-screen overflow-hidden bg-bg-slate-soft">
      <SellerSidebar companyName={session.companyName} />
      <div className="flex-1 flex flex-col min-w-0">
        <SellerTopbar companyName={session.companyName} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">{children}</main>
      </div>
      <SellerMobileNav />
    </div>
  )
}
