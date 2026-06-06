"use client"

import { useEffect, useState } from "react"
import { Laptop, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Mode = "light" | "dark" | "system"

export function ThemeModePicker({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const current = (theme ?? "system") as Mode

  const items: { id: Mode; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Laptop },
  ]

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map(({ id, label, icon: Icon }) => {
        const active = current === id
        return (
          <Button
            key={id}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            className="gap-2"
            disabled={!mounted}
            onClick={() => setTheme(id)}
            aria-pressed={active}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        )
      })}
      {mounted ? (
        <p className="w-full text-xs text-muted-foreground">
          Active appearance: <span className="font-medium text-foreground">{resolvedTheme}</span>
          {current === "system" ? " (from system)" : ""}
        </p>
      ) : null}
    </div>
  )
}
