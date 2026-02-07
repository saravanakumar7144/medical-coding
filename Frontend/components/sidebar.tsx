"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Bot, FileText, Home, Library, Settings, User2, FileSpreadsheet, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Chart Coding",
    href: "/chart-coding",
    icon: FileText,
  },
  {
    title: "Batch Processing",
    href: "/batch-processing",
    icon: FileSpreadsheet,
  },
  {
    title: "Code Library",
    href: "/code-library",
    icon: Library,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Admin & Settings",
    href: "/admin",
    icon: Settings,
  },
]

interface SidebarProps {
  onLogout?: () => void
  userName?: string
  userEmail?: string
}

export function Sidebar({ onLogout, userName = "User", userEmail }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-sidebar md:block md:w-64">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-info text-info-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <span>Medical Coder</span>
        </Link>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-1 p-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn(
                "justify-start transition-all",
                pathname === item.href
                  ? "bg-light text-foreground hover:bg-light/90 dark:bg-slate-800 dark:hover:bg-slate-700"
                  : "hover:bg-light/50 dark:hover:bg-slate-800/50",
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </div>
        <div className="mt-4 px-2">
          <div className="rounded-lg bg-light p-3 dark:bg-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-4 w-4 text-info" />
              <h3 className="font-medium text-sm">Ollama AI Assistant</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Your local AI assistant is ready to help with coding and verification tasks.
            </p>
            <Button size="sm" className="w-full text-xs bg-info hover:bg-info/80">
              <Bot className="mr-2 h-3 w-3" />
              Ask AI Assistant
            </Button>
          </div>
        </div>
      </ScrollArea>
      <div className="absolute bottom-0 w-64 border-t p-2 bg-background">
        <div className="mb-2 px-2">
          <div className="flex items-center gap-2">
            <User2 className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{userName}</p>
              {userEmail && <p className="text-xs text-muted-foreground truncate">{userEmail}</p>}
            </div>
          </div>
        </div>
        {onLogout && (
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
        )}
      </div>
    </div>
  )
}
