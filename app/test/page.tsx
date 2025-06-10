"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Mail, Database, Users, FileText } from "lucide-react"

interface TestResult {
  name: string
  status: "idle" | "running" | "success" | "error"
  message: string
  details?: any
}

export default function TestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Database Connection", status: "idle", message: "" },
    { name: "Email Service", status: "idle", message: "" },
    { name: "Registration System", status: "idle", message: "" },
    { name: "Admin Functions", status: "idle", message: "" },
  ])

  const updateTest = (name: string, status: TestResult["status"], message: string, details?: any) => {
    setTests((prev) => prev.map((test) => (test.name === name ? { ...test, status, message, details } : test)))
  }

  const runTest = async (testName: string) => {
    updateTest(testName, "running", "Testing...")

    try {
      switch (testName) {
        case "Database Connection":
          await testDatabase()
          break
        case "Email Service":
          await testEmailService()
          break
        case "Registration System":
          await testRegistrationSystem()
          break
        case "Admin Functions":
          await testAdminFunctions()
          break
      }
    } catch (error) {
      updateTest(testName, "error", `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const testDatabase = async () => {
    const response = await fetch("/api/admin/test-system")
    const result = await response.json()

    if (response.ok && result.success) {
      updateTest("Database Connection", "success", "Database connection successful", result)
    } else {
      updateTest("Database Connection", "error", result.error || "Database test failed", result)
    }
  }

  const testEmailService = async () => {
    const response = await fetch("/api/test-email-service")
    const result = await response.json()

    if (response.ok && result.success) {
      updateTest("Email Service", "success", `Email service working! Test email sent (ID: ${result.emailId})`, result)
    } else {
      updateTest(
        "Email Service",
        result.configured ? "error" : "error",
        result.error || "Email service test failed",
        result,
      )
    }
  }

  const testRegistrationSystem = async () => {
    // Create a test registration
    const testData = new FormData()
    testData.append("name", "Test User Registration")
    testData.append("email", `test-${Date.now()}@example.com`)
    testData.append("phone", "01234567890")
    testData.append("phoneType", "egyptian")
    testData.append("university", "Test University")

    // Create a dummy file for testing
    const dummyFile = new File(["test payment proof"], "test-payment.jpg", { type: "image/jpeg" })
    testData.append("paymentProof", dummyFile)

    const response = await fetch("/api/test-registration", {
      method: "POST",
      body: testData,
    })

    const result = await response.json()

    if (response.ok && result.success) {
      updateTest("Registration System", "success", "Registration system working correctly", result)
    } else {
      updateTest("Registration System", "error", result.error || "Registration test failed", result)
    }
  }

  const testAdminFunctions = async () => {
    const response = await fetch("/api/admin/registrations")
    const result = await response.json()

    if (response.ok) {
      updateTest(
        "Admin Functions",
        "success",
        `Admin functions working. Found ${result.data?.length || 0} registrations`,
        result,
      )
    } else {
      updateTest("Admin Functions", "error", result.error || "Admin functions test failed", result)
    }
  }

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.name)
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-slate-400" />
    }
  }

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case "Database Connection":
        return <Database className="w-5 h-5" />
      case "Email Service":
        return <Mail className="w-5 h-5" />
      case "Registration System":
        return <Users className="w-5 h-5" />
      case "Admin Functions":
        return <FileText className="w-5 h-5" />
      default:
        return null
    }
  }

  const allTestsComplete = tests.every((test) => test.status !== "idle" && test.status !== "running")
  const allTestsSuccess = tests.every((test) => test.status === "success")
  const hasErrors = tests.some((test) => test.status === "error")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
            <img src="/images/tedx-logo.png" alt="TEDx Logo" className="w-8 h-auto" />
          </div>
          <h1 className="text-3xl text-white font-bold">
            TED<span className="text-red-500">x</span>ECU System Test
          </h1>
        </div>

        {/* Test Status Overview */}
        {allTestsComplete && (
          <Alert
            className={`mb-6 ${allTestsSuccess ? "bg-green-900/50 border-green-700" : "bg-red-900/50 border-red-700"}`}
          >
            {allTestsSuccess ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertTitle className={allTestsSuccess ? "text-green-300" : "text-red-300"}>
              {allTestsSuccess ? "All Tests Passed!" : "Some Tests Failed"}
            </AlertTitle>
            <AlertDescription className={allTestsSuccess ? "text-green-200" : "text-red-200"}>
              {allTestsSuccess
                ? "Your TEDxECU registration system is fully operational and ready for production."
                : "Please review the failed tests and fix any configuration issues."}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Controls */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white">System Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Button onClick={runAllTests} className="bg-blue-600 hover:bg-blue-700 text-white">
                Run All Tests
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="text-slate-300 border-slate-600"
              >
                Reset Tests
              </Button>
            </div>

            {/* Individual Tests */}
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.name}
                  className={`p-4 rounded-lg border transition-colors ${
                    test.status === "success"
                      ? "bg-green-900/20 border-green-700"
                      : test.status === "error"
                        ? "bg-red-900/20 border-red-700"
                        : test.status === "running"
                          ? "bg-blue-900/20 border-blue-700"
                          : "bg-slate-700/50 border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTestIcon(test.name)}
                      <h3 className="text-white font-medium">{test.name}</h3>
                      <Badge
                        variant={
                          test.status === "success"
                            ? "default"
                            : test.status === "error"
                              ? "destructive"
                              : test.status === "running"
                                ? "secondary"
                                : "outline"
                        }
                        className={
                          test.status === "success" ? "bg-green-600" : test.status === "running" ? "bg-blue-600" : ""
                        }
                      >
                        {test.status === "idle" ? "Ready" : test.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <Button
                        onClick={() => runTest(test.name)}
                        disabled={test.status === "running"}
                        variant="outline"
                        size="sm"
                        className="text-slate-300 border-slate-600"
                      >
                        {test.status === "running" ? "Testing..." : "Test"}
                      </Button>
                    </div>
                  </div>
                  {test.message && (
                    <p
                      className={`mt-2 text-sm ${
                        test.status === "success"
                          ? "text-green-300"
                          : test.status === "error"
                            ? "text-red-300"
                            : "text-slate-300"
                      }`}
                    >
                      {test.message}
                    </p>
                  )}
                  {test.details && test.status === "success" && (
                    <details className="mt-2">
                      <summary className="text-slate-400 text-sm cursor-pointer hover:text-slate-300">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="text-slate-300 border-slate-600"
          >
            Go to Homepage
          </Button>
          <Button
            onClick={() => (window.location.href = "/setup")}
            variant="outline"
            className="text-slate-300 border-slate-600"
          >
            Setup Guide
          </Button>
          {allTestsSuccess && (
            <Button
              onClick={() => (window.location.href = "/admin")}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Go to Admin Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
