
// src/components/layout/ThemeToggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render a placeholder or null on the server and during initial client render
    // to avoid hydration mismatch, as theme is resolved on client.
    return (
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg" disabled>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme (loading)</span>
      </Button>
    );
  }

  const currentIcon = resolvedTheme === 'dark' 
    ? <Moon className="h-[1.2rem] w-[1.2rem]" /> 
    : <Sun className="h-[1.2rem] w-[1.2rem]" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg shadow-sm hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1">
          {currentIcon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card shadow-xl rounded-xl border mt-2 p-1.5">
        <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-primary/10 py-2 px-3 rounded-md cursor-pointer text-sm">
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-primary/10 py-2 px-3 rounded-md cursor-pointer text-sm">
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-primary/10 py-2 px-3 rounded-md cursor-pointer text-sm">
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
