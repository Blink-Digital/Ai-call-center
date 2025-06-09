"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Phone } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  const [email, setEmail] = useState("")

  return (
    <section className="pt-24 pb-16 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-block px-3 py-1 mb-6 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-400 text-sm font-medium">
              AI-Powered Conversation Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Transform Customer Conversations with AI
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-2xl">
              Deploy intelligent voice and chat agents that understand context, show empathy, and deliver exceptional
              customer experiences.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <div className="flex-1 sm:max-w-xs">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border-gray-700 text-white h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 text-sm text-gray-400">
              No credit card required. Start your 14-day free trial today.
              <span className="ml-2">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Login
                </Link>
              </span>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="relative">
              {/* Glowing effect behind the phone */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full filter blur-3xl opacity-20"></div>

              {/* Phone mockup */}
              <div className="relative bg-gray-800 border border-gray-700 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-medium">Blink.AI Assistant</h3>
                      <p className="text-gray-400 text-sm">Online</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                    <p className="text-white">Hello! How can I help you today?</p>
                  </div>

                  <div className="bg-blue-600 rounded-2xl rounded-tr-none p-3 max-w-[80%] ml-auto">
                    <p className="text-white">I need to check my order status</p>
                  </div>

                  <div className="bg-gray-700 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                    <p className="text-white">
                      I'd be happy to help you check your order status. Could you please provide your order number?
                    </p>
                  </div>

                  <div className="bg-blue-600 rounded-2xl rounded-tr-none p-3 max-w-[80%] ml-auto">
                    <p className="text-white">It's #ORD-12345</p>
                  </div>

                  <div className="bg-gray-700 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                    <p className="text-white">
                      Thanks! I can see your order #ORD-12345 is currently being prepared for shipping and should be
                      dispatched within 24 hours.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center">
                  <Input
                    placeholder="Type your message..."
                    className="bg-gray-700 border-gray-600 text-white rounded-full"
                  />
                  <Button className="ml-2 rounded-full w-10 h-10 p-0 bg-gradient-to-r from-blue-500 to-purple-600">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
