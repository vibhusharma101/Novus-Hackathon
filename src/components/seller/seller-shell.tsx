'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Boxes, PlusCircle, ShieldCheck, LogOut } from 'lucide-react'

const navItems = [
  { href: '/seller/vault', label: 'Inventory Vault', icon: Boxes, exact: false },
]

function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  async function handleSignOut() {
    await fetch('/api/seller/sign-out', { method: 'POST' })
    router.push('/seller/sign-in')
  }
  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn('flex items-center gap-2 text-on-surface-variant hover:text-[--color-risk-red] transition-colors font-data text-sm', className)}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  )
}

export function SellerSidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen border-r border-[--color-border-zinc] bg-surface-container-lowest">
      <div className="px-6 py-5 flex items-center gap-3 border-b border-[--color-border-zinc]">
        <div className="w-9 h-9 bg-primary-container rounded-lg flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-on-primary" />
        </div>
        <Image src="/logo.jpg" alt="Recyclink" width={40} height={40} className="h-9 w-9 object-contain" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-md font-data text-sm transition-all active:scale-[0.98]',
                active
                  ? 'bg-primary-container text-on-primary-container border-l-4 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 pt-4 border-t border-[--color-border-zinc] space-y-3">
        <Link
          href="/seller/listings/new"
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-md font-data text-sm font-semibold hover:bg-primary-container transition-colors active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          Create Listing
        </Link>
        <div className="flex items-center justify-between px-2">
          <span className="font-data text-[11px] text-on-surface-variant truncate max-w-[140px]">{companyName}</span>
          <SignOutButton />
        </div>
      </div>
    </aside>
  )
}

export function SellerTopbar({ companyName }: { companyName: string }) {
  return (
    <header className="h-14 lg:h-16 shrink-0 border-b border-[--color-border-zinc] bg-surface-container-lowest flex items-center justify-between px-4 lg:px-8">
      <Image src="/logo.jpg" alt="Recyclink" width={40} height={40} className="h-9 w-9 object-contain" />
      <div className="flex items-center gap-3">
        <Link
          href="/seller/listings/new"
          className="hidden sm:flex lg:hidden xl:flex items-center gap-1.5 bg-primary text-on-primary px-4 py-1.5 rounded-lg font-data text-sm font-semibold hover:bg-primary-container transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Create Listing
        </Link>
        <span className="hidden lg:block font-data text-xs text-on-surface-variant">{companyName}</span>
        <SignOutButton className="hidden lg:flex" />
      </div>
    </header>
  )
}

export function SellerMobileNav() {
  const pathname = usePathname()
  const vaultActive = pathname.startsWith('/seller/vault')

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-40 h-16 bg-surface-container-lowest border-t border-[--color-border-zinc] flex items-center justify-around px-6 pb-safe">
      <Link
        href="/seller/vault"
        className={cn(
          'flex flex-col items-center justify-center gap-0.5',
          vaultActive ? 'text-primary' : 'text-on-surface-variant',
        )}
      >
        <Boxes className="h-6 w-6" />
        <span className="font-data text-[11px]">Inventory</span>
      </Link>
      <Link
        href="/seller/listings/new"
        className="flex flex-col items-center justify-center -mt-6"
      >
        <span className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform">
          <PlusCircle className="h-7 w-7" />
        </span>
      </Link>
      <div className="flex flex-col items-center justify-center gap-0.5">
        <SignOutButton />
      </div>
    </nav>
  )
}
