import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "EPRx Exchange",
  description: "India's only zero-markup EPR credit exchange",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={{
          theme: shadcn,
          variables: {
            colorPrimary: '#006948',
            colorBackground: '#ffffff',
            borderRadius: '0.5rem',
            fontFamily: 'var(--font-geist), ui-sans-serif, system-ui, sans-serif',
          },
          elements: {
            // ── Modal shell ──────────────────────────────────────────────
            modalContent: 'shadow-2xl rounded-xl border border-zinc-100 overflow-hidden',
            modalCloseButton: 'top-3 right-3 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg p-1.5',
            card: 'shadow-none rounded-none border-0 bg-white',

            // ── Left navbar ──────────────────────────────────────────────
            navbar: 'bg-zinc-50/80 border-r border-zinc-100 py-4 px-2 gap-1',
            navbarButton: 'rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white hover:text-zinc-900 hover:shadow-sm transition-all',
            navbarButtonActive__profile: 'bg-white text-[#006948] shadow-sm font-semibold',
            navbarButtonActive__security: 'bg-white text-[#006948] shadow-sm font-semibold',
            navbarButtonActive: 'bg-white text-[#006948] shadow-sm font-semibold',
            navbarButtonIcon: 'h-4 w-4 opacity-70',

            // ── Page content ─────────────────────────────────────────────
            pageScrollBox: 'px-8 py-6',
            headerTitle: 'text-xl font-semibold text-zinc-900 tracking-tight',
            headerSubtitle: 'text-sm text-zinc-500 mt-0.5',

            // ── Profile sections ──────────────────────────────────────────
            profileSectionTitle: 'border-b border-zinc-100 pb-3 mb-1',
            profileSectionTitleText: 'text-xs font-bold uppercase tracking-widest text-zinc-400',
            profileSectionPrimaryButton: 'text-sm font-semibold text-[#006948] hover:text-[#005137] transition-colors',
            profileSectionItem: 'py-3',

            // ── Form buttons ──────────────────────────────────────────────
            formButtonPrimary: 'bg-[#006948] hover:bg-[#005137] active:bg-[#004430] text-white text-sm font-semibold rounded-lg px-5 py-2.5 shadow-sm transition-all',
            formButtonReset: 'text-sm text-zinc-500 hover:text-zinc-700 font-medium',
            formFieldInput: 'rounded-lg border-zinc-200 text-sm focus:ring-[#006948] focus:border-[#006948]',
            formFieldLabel: 'text-xs font-semibold uppercase tracking-wide text-zinc-500',

            // ── User button popover ───────────────────────────────────────
            userButtonPopoverCard: 'shadow-xl border border-zinc-100 rounded-xl overflow-hidden',
            userButtonPopoverActionButton: 'text-sm font-medium hover:bg-zinc-50 rounded-lg mx-1 px-3',
            userButtonPopoverActionButtonText: 'text-zinc-700',
            userButtonPopoverActionButtonIcon: 'text-zinc-400',
            userButtonPopoverFooter: 'border-t border-zinc-100 bg-zinc-50/60',

            // ── Avatar ────────────────────────────────────────────────────
            avatarBox: 'ring-2 ring-[#006948]/15 ring-offset-1',

            // ── Footer — Clerk branding ───────────────────────────────────
            footer: 'bg-zinc-50/60 border-t border-zinc-100',
            footerActionLink: 'text-[#006948] hover:text-[#005137] font-medium',
          },
        }}>
          {children}
          <Toaster richColors />
        </ClerkProvider>
      </body>
    </html>
  );
}
