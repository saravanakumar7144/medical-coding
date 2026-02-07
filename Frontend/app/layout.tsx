import type React from "react"
import type { Metadata } from "next"
import { Roboto } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
import { SidebarWrapper } from "@/components/sidebar-wrapper"

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Medical Coder - AI-Powered Coding Platform",
  description: "A comprehensive, Ollama-powered medical coding platform for local AI processing",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={roboto.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex h-screen overflow-hidden">
            <SidebarWrapper />
            <div className="flex flex-col flex-1 overflow-hidden">
              <MainNav />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
