import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google"
import "styles/globals.css"

import { CuratedQuoteProvider } from "@lib/context/curated-quote-context"
import GlobalWhatsAppBadge from "@modules/common/components/whatsapp-badge"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "FactoryTribe | B2B Wholesale Marketplace",
  description: "Direct wholesale B2B marketplace connecting verified Indian manufacturers, apparel mills, and retail buyers.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={`${plusJakartaSans.variable} ${playfairDisplay.variable}`}>
      <body className="bg-linen text-charcoal-900 font-sans antialiased min-h-screen selection:bg-terracotta-100 selection:text-terracotta-800">
        <CuratedQuoteProvider>
          <main className="relative">{props.children}</main>
          {/* Global WhatsApp Floating Badge with Page Context */}
          <GlobalWhatsAppBadge />
        </CuratedQuoteProvider>
      </body>
    </html>
  )
}
