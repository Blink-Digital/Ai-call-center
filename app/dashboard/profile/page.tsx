"use client"

import type React from "react"

import { useState } from "react"
import { useAuth, type User } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  const { user, updateProfile, enableTwoFactor, verifyTwoFactor } = useAuth()
  const [profileData, setProfileData] = useState<Partial<User>>(user || {})
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // 2FA states
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<any>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p>You must be logged in to view this page.</p>
              <Button className="mt-4" onClick={() => (window.location.href = "/login")}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsUpdating(true)

    try {
      const result = await updateProfile(profileData)

      if (result.success) {
        setSuccessMessage(result.message)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEnableTwoFactor = async () => {
    setError("")
    setSuccessMessage("")

    try {
      const result = await enableTwoFactor()

      if (result.success && result.setupData) {
        setTwoFactorSetupData(result.setupData)
        setShowTwoFactorSetup(true)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const handleVerifyTwoFactor = async () => {
    setError("")
    setSuccessMessage("")
    setIsVerifying(true)

    try {
      const result = await verifyTwoFactor(verificationCode)

      if (result.success) {
        setSuccessMessage(result.message)
        setShowTwoFactorSetup(false)
        setTwoFactorSetupData(null)
        setVerificationCode("")
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-800" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={profileData.name || ""} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email || ""}
                    onChange={handleChange}
                    disabled
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" value={profileData.company || ""} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={profileData.phoneNumber || ""}
                    onChange={handleChange}
                  />
                </div>

                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {successMessage && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-800" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={user.twoFactorEnabled || false}
                      onCheckedChange={() => {
                        if (!user.twoFactorEnabled) {
                          handleEnableTwoFactor()
                        }
                      }}
                      disabled={user.twoFactorEnabled}
                    />
                    <span className="text-sm font-medium">{user.twoFactorEnabled ? "Enabled" : "Disabled"}</span>
                  </div>
                </div>

                {showTwoFactorSetup && twoFactorSetupData && (
                  <div className="rounded-lg border p-4 space-y-4">
                    <h4 className="font-medium">Set up Two-Factor Authentication</h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                      </p>
                      <div className="flex justify-center py-4">
                        <img
                          src={twoFactorSetupData.qrCodeUrl || "/placeholder.svg"}
                          alt="Two-factor authentication QR code"
                          className="border rounded-lg"
                        />
                      </div>
                      <p className="text-sm">2. Enter the verification code from your authenticator app</p>
                      <div className="flex space-x-2">
                        <Input
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="6-digit code"
                          maxLength={6}
                        />
                        <Button onClick={handleVerifyTwoFactor} disabled={isVerifying || verificationCode.length !== 6}>
                          {isVerifying ? "Verifying..." : "Verify"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-gray-500">Update your password regularly for better security</p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <h3 className="text-lg font-medium">Account Activity</h3>
                    <p className="text-sm text-gray-500">View your recent login activity</p>
                  </div>
                  <Button variant="outline">View Activity</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
