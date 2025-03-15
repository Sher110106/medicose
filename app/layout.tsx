import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Expiry Date Reader - Accessible Medicine Tracking",
  description: "An accessible application to help visually impaired users identify product expiration dates"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
        >
          Skip to main content
        </a>
        
        <div className="flex flex-col min-h-screen">
          {children}
          <Toaster />
        </div>

        <div id="portal-root" role="alert" aria-live="polite"></div>
      </body>
    </html>
  )
}

