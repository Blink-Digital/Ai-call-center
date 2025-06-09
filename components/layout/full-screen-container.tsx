import type React from "react"
import { cn } from "@/lib/utils"

interface FullScreenContainerProps {
  children: React.ReactNode
  className?: string
}

export function FullScreenContainer({ children, className }: FullScreenContainerProps) {
  return <div className={cn("flex flex-1 min-w-0 h-full w-full overflow-hidden", className)}>{children}</div>
}
