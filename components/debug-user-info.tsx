"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"

export function DebugUserInfo() {
  const { user } = useAuth()
  const [showDetails, setShowDetails] = useState(false)

  if (!user) return null

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
      <div className="flex justify-between items-center">
        <span>Logged in as: {user.email}</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-2 px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          {showDetails ? "Hide" : "Details"}
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 border-t border-gray-700 pt-2">
          <div>
            <strong>User ID:</strong> {user.id}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div className="mt-1 text-gray-400">This debug panel is only visible in development</div>
        </div>
      )}
    </div>
  )
}
