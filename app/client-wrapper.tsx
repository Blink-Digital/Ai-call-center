"use client"

import type React from "react"

import { ReactFlowProvider } from "reactflow"

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}
