import type React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  fullScreen?: boolean
}

export function PageContainer({ children, className, maxWidth = "full", fullScreen = false }: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-none",
  }

  if (fullScreen) {
    return <div className={cn("flex flex-1 min-w-0 h-full w-full overflow-hidden", className)}>{children}</div>
  }

  return (
    <div className={cn("w-full h-full bg-gray-50/50", className)}>
      <div className={cn("mx-auto px-6 py-8 h-full", maxWidthClasses[maxWidth])}>{children}</div>
    </div>
  )
}
