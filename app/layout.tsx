import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header" // Adjusted path
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AIMap - Accessible AI-Powered Mind Mapping",
  description: "Generate intelligent, accessible mind maps with AI for users with attention difficulties",
  manifest: "/manifest.json",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://d3js.org/d3.v7.min.js" strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Header />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
