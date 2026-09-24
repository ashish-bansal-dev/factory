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
      <body>
        <CuratedQuoteProvider>
          <main className="relative">{props.children}</main>
        </CuratedQuoteProvider>
      </body>
    </html>
  )
}
