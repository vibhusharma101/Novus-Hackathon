'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Calculator, ArrowLeftRight } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/calculator', label: 'Calculator', icon: Calculator, exact: false },
  { href: '/dashboard/exchange', label: 'Exchange', icon: ArrowLeftRight, exact: false },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r flex flex-col h-screen bg-muted/40">
      <div className="px-4 py-5 border-b">
        <span className="font-['Geist'] font-semibold text-lg text-primary">EPRx Exchange</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t flex items-center gap-3">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8 ring-2 ring-primary/20',
              userButtonPopoverCard: 'shadow-xl border border-[--color-border-zinc] rounded-xl',
              userButtonPopoverActionButton: 'hover:bg-surface-container rounded-lg',
            },
          }}
        />
        <span className="font-data text-[11px] text-on-surface-variant uppercase tracking-wide">Account</span>
      </div>
    </aside>
  )
}
