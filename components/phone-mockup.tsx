"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PhoneMockup() {
  const [phoneNumber, setPhoneNumber] = useState("")

  return (
    <div className="relative mx-auto w-[280px] h-[580px] bg-black rounded-[40px] shadow-xl overflow-hidden">
      {/* Phone frame */}
      <div className="absolute inset-0 w-full h-full">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-xl"></div>

        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 h-8 flex justify-between items-center px-6 text-white text-xs">
          <span>9:41</span>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 flex items-center">
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full ml-0.5"></div>
              <div className="w-1 h-3 bg-white rounded-full ml-0.5"></div>
              <div className="w-1 h-4 bg-white rounded-full ml-0.5"></div>
            </div>
            <div className="w-4 h-4 flex justify-center items-center">
              <div className="w-3 h-3 border border-white rounded-full"></div>
            </div>
            <div className="w-6 h-3 border border-white rounded-sm relative">
              <div className="absolute right-0.5 top-0.5 w-1 h-2 bg-white rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="absolute top-8 left-0 right-0 bottom-0 bg-white">
          {/* App header */}
          <div className="bg-gray-100 p-4 flex items-center">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center mr-3">
              <div className="w-4 h-2 bg-white rounded-sm"></div>
            </div>
            <div>
              <div className="font-medium text-sm">Call Bland's AI</div>
              <div className="text-xs text-gray-600">Make your customers happy!</div>
            </div>
            <div className="ml-auto text-xs text-gray-500">9:41 AM</div>
          </div>

          {/* App content */}
          <div className="p-4 flex flex-col h-[calc(100%-64px)] justify-between">
            <div className="flex-1 flex items-center justify-center">
              <Input
                type="tel"
                placeholder="Enter Phone Number"
                className="text-center"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <Button className="w-full bg-black text-white hover:bg-gray-800">Let's Talk</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
