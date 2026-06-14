import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Toaster } from "@/components/ui/sonner";
import { PendoInitializer } from "@/components/pendo-initializer";
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
(function(apiKey){
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
    v=['initialize','identify','updateOptions','pageLoad','track','trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
    o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
    y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
    z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
})('a2dcdf6d-60fc-4424-ac01-5565c1ce4b10');
` }} />
      </head>
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
            // ── Modal shell ───────────────────────────────────────────────
            cardBox: {
              borderRadius: '0.75rem',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18)',
              border: '1px solid #e4e4e7',
            },

            // ── Left navbar — solid brand green ───────────────────────────
            navbar: {
              background: 'linear-gradient(160deg, #006948 0%, #004430 100%)',
              borderRight: 'none',
              padding: '1.5rem 0.75rem',
              gap: '0.25rem',
            },
            navbarButton: {
              color: 'rgba(255,255,255,0.75)',
              fontWeight: '500',
              fontSize: '0.875rem',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
              },
              '&[data-active]': {
                backgroundColor: 'rgba(255,255,255,0.18)',
                color: '#ffffff',
                fontWeight: '600',
              },
            },
            navbarButtonIcon: {
              opacity: '0.8',
            },

            // ── Page content ──────────────────────────────────────────────
            pageScrollBox: {
              padding: '2rem 2.5rem',
            },
            headerTitle: {
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#18181b',
              letterSpacing: '-0.01em',
            },
            headerSubtitle: {
              fontSize: '0.875rem',
              color: '#71717a',
              marginTop: '0.125rem',
            },

            // ── Profile sections ──────────────────────────────────────────
            profileSectionTitle: {
              borderBottom: '1px solid #f4f4f5',
              paddingBottom: '0.75rem',
              marginBottom: '0.25rem',
            },
            profileSectionTitleText: {
              fontSize: '0.7rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#a1a1aa',
            },
            profileSectionPrimaryButton: {
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#006948',
            },
            profileSectionItem: {
              padding: '0.75rem 0',
            },

            // ── Form buttons ──────────────────────────────────────────────
            formButtonPrimary: {
              backgroundColor: '#006948',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: '600',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              '&:hover': { backgroundColor: '#005137' },
              '&:active': { backgroundColor: '#004430' },
            },
            formButtonReset: {
              fontSize: '0.875rem',
              color: '#71717a',
              fontWeight: '500',
            },
            formFieldInput: {
              borderRadius: '0.5rem',
              borderColor: '#e4e4e7',
              fontSize: '0.875rem',
            },
            formFieldLabel: {
              fontSize: '0.7rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#71717a',
            },

            // ── User button popover ───────────────────────────────────────
            popoverBox: {
              boxShadow: '0 20px 40px -8px rgba(0,0,0,0.15)',
              border: '1px solid #e4e4e7',
              borderRadius: '0.75rem',
              overflow: 'hidden',
            },

            // ── Footer ────────────────────────────────────────────────────
            footer: {
              backgroundColor: '#fafafa',
              borderTop: '1px solid #f4f4f5',
            },
            footerActionLink: {
              color: '#006948',
              fontWeight: '500',
            },
          },
        }}>
          <PendoInitializer />
          {children}
          <Toaster richColors />
        </ClerkProvider>
      </body>
    </html>
  );
}
