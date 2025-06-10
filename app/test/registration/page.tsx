"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function TestRegistrationPage() {
  const [formData, setFormData] = useState({
    name: "Test User",
    email: `test${Math.floor(Math.random() * 10000)}@example.com`,
    phone: "01012345678",
    university: "Test University",
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/test-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (err) {
      setError("Error submitting registration")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
            <img src="/images/tedx-logo.png" alt="TEDx Logo" className="w-8 h-auto" />
          </div>
          <h1 className="text-3xl text-white font-bold">
            TED<span className="text-red-500">x</span>ECU
          </h1>
        </div>

        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white">Test Registration Form</CardTitle>
            <CardDescription className="text-slate-300">
              Submit this form to test the registration process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-200">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university" className="text-slate-200">
                  University
                </Label>
                <Input
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Test Registration"
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-medium">Registration Successful!</span>
                </div>
                <div className="text-sm text-slate-300 space-y-1">
                  <p>Registration ID: {result.data[0].id}</p>
                  <p>Status: {result.data[0].payment_status}</p>
                  <p>Created: {new Date(result.data[0].created_at).toLocaleString()}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 font-medium">{error}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            onClick={() => (window.location.href = "/test")}
            variant="outline"
            className="text-slate-300 border-slate-600"
          >
            Back to System Test
          </Button>
          <Button onClick={() => (window.location.href = "/admin")} className="bg-red-600 hover:bg-red-700 text-white">
            Go to Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
