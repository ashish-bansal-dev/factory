import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

import { CuratedQuoteProvider } from "@lib/context/curated-quote-context"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body className="bg-linen text-charcoal-900 antialiased min-h-screen selection:bg-terracotta-100 selection:text-terracotta-800">
        <CuratedQuoteProvider>
          <main className="relative">{props.children}</main>
        </CuratedQuoteProvider>
      </body>
    </html>
  )
}
