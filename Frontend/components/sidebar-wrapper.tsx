"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"

export function SidebarWrapper() {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserName(user.name || user.username || "User")
        setUserEmail(user.email || "")
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e)
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")
      localStorage.removeItem("remember_me")
      sessionStorage.removeItem("access_token")
      sessionStorage.removeItem("user")

      // Redirect to login
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  return <Sidebar onLogout={handleLogout} userName={userName} userEmail={userEmail} />
}
