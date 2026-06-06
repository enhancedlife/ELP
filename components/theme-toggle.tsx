"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { ToolbarDropdown } from "@/components/shared/toolbar-dropdown"

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`relative h-9 w-9 ${className ?? ""}`}
        aria-hidden
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem] opacity-50" />
        <span className="sr-only">Theme</span>
      </Button>
    )
  }

  return (
    <ToolbarDropdown
      align="end"
      ariaLabel="Theme"
      buttonClassName={`relative h-9 w-9 ${className ?? ""}`}
      panelWidth={200}
      triggerChildren={
        <>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </>
      }
    >
      {(close) => (
        <div className="flex flex-col gap-0.5 p-1">
          <button
            type="button"
            className="rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => {
              setTheme("light")
              close()
            }}
          >
            Light
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => {
              setTheme("dark")
              close()
            }}
          >
            Dark
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => {
              setTheme("system")
              close()
            }}
          >
            System
            {resolvedTheme ? (
              <span className="ml-1 text-xs text-muted-foreground">({resolvedTheme})</span>
            ) : null}
          </button>
        </div>
      )}
    </ToolbarDropdown>
  )
}
