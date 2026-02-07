"use client"

import { Bell, Bot, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { FloatingChatbot } from "@/components/floating-chatbot"
import { useState } from "react"

export function MainNav() {
  const [showChat, setShowChat] = useState(false)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="relative flex-1 md:grow-0 md:w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Search for patients, codes, or guidelines..." className="w-full pl-8" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-info text-info-foreground text-xs">
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="outline" size="icon" className="hidden sm:flex" onClick={() => setShowChat(!showChat)}>
          <Bot className="h-4 w-4" />
          <span className="sr-only">AI Assistant</span>
        </Button>
      </div>

      {showChat && <FloatingChatbot />}
    </header>
  )
}
