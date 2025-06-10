"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, Mail, Trash, RefreshCw, Table } from "lucide-react"

export default function SetupPage() {
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [emailMessage, setEmailMessage] = useState("")
  const [dbStatus, setDbStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [dbMessage, setDbMessage] = useState("")
  const [cleanupStatus, setCleanupStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [cleanupMessage, setCleanupMessage] = useState("")
  const [fixStatus, setFixStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [fixMessage, setFixMessage] = useState("")

  const runSystemTest = async () => {
    setTestStatus("loading")
    setTestMessage("Testing system...")

    try {
      const response = await fetch("/api/admin/test-system")
      const data = await response.json()

      if (response.ok) {
        setTestStatus("success")
        setTestMessage(
          `System test successful! Database: ${data.database ? "✅" : "❌"}, Storage: ${
            data.storage ? "✅" : "❌"
          }, Environment: ${data.environment ? "✅" : "❌"}`,
        )
      } else {
        setTestStatus("error")
        setTestMessage(`Error: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      setTestStatus("error")
      setTestMessage(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const testEmailService = async () => {
    setEmailStatus("loading")
    setEmailMessage("Testing email service...")

    try {
      const response = await fetch("/api/test-email-service")
      const data = await response.json()

      if (response.ok) {
        setEmailStatus("success")
        setEmailMessage(`Email test successful! ${data.message || ""}`)
      } else {
        setEmailStatus("error")
        setEmailMessage(`Error: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      setEmailStatus("error")
      setEmailMessage(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const setupDatabase = async () => {
    setDbStatus("loading")
    setDbMessage("Setting up database...")

    try {
      // Run the direct SQL script to add the personal_photo_url column
      const response = await fetch("/api/admin/run-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: "15-fix-personal-photo-column.sql",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setDbStatus("error")
        setDbMessage(`Error setting up database: ${data.error || "Unknown error"}`)
        return
      }

      setDbStatus("success")
      setDbMessage("Database setup completed successfully!")
    } catch (error) {
      setDbStatus("error")
      setDbMessage(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const fixTicketIdColumn = async () => {
    setFixStatus("loading")
    setFixMessage("Fixing ticket_id column length...")

    try {
      // Run the SQL script to fix the ticket_id column length
      const response = await fetch("/api/admin/run-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: "16-create-execute-sql-function.sql",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setFixStatus("error")
        setFixMessage(`Error fixing ticket_id column: ${data.error || "Unknown error"}`)
        return
      }

      setFixStatus("success")
      setFixMessage("Ticket ID column fixed successfully!")
    } catch (error) {
      setFixStatus("error")
      setFixMessage(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const cleanupTestData = async () => {
    setCleanupStatus("loading")
    setCleanupMessage("Cleaning up test data...")

    try {
      const response = await fetch("/api/admin/cleanup-test-data")
      const data = await response.json()

      if (response.ok) {
        setCleanupStatus("success")
        setCleanupMessage(`Cleanup successful! ${data.message || ""}`)
      } else {
        setCleanupStatus("error")
        setCleanupMessage(`Error: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      setCleanupStatus("error")
      setCleanupMessage(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">TEDx Tickets System Setup</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Test</CardTitle>
            <CardDescription>Test database and storage connections</CardDescription>
          </CardHeader>
          <CardContent>
            {testStatus !== "idle" && (
              <Alert
                className={`mb-4 ${
                  testStatus === "success"
                    ? "bg-green-500/10 text-green-500"
                    : testStatus === "error"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-500"
                }`}
              >
                <div className="flex items-start gap-2">
                  {testStatus === "success" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : testStatus === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  )}
                  <div>
                    <AlertTitle>
                      {testStatus === "success" ? "Success" : testStatus === "error" ? "Error" : "Testing..."}
                    </AlertTitle>
                    <AlertDescription>{testMessage}</AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runSystemTest} disabled={testStatus === "loading"} className="w-full" variant="outline">
              {testStatus === "loading" ? "Testing..." : "Run System Test"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Service</CardTitle>
            <CardDescription>Test email sending functionality</CardDescription>
          </CardHeader>
          <CardContent>
            {emailStatus !== "idle" && (
              <Alert
                className={`mb-4 ${
                  emailStatus === "success"
                    ? "bg-green-500/10 text-green-500"
                    : emailStatus === "error"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-500"
                }`}
              >
                <div className="flex items-start gap-2">
                  {emailStatus === "success" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : emailStatus === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  )}
                  <div>
                    <AlertTitle>
                      {emailStatus === "success" ? "Success" : emailStatus === "error" ? "Error" : "Testing..."}
                    </AlertTitle>
                    <AlertDescription>{emailMessage}</AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={testEmailService}
              disabled={emailStatus === "loading"}
              className="w-full"
              variant="outline"
            >
              <Mail className="mr-2 h-4 w-4" />
              {emailStatus === "loading" ? "Testing..." : "Test Email Service"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Personal Photo Column</CardTitle>
            <CardDescription>Add the personal_photo_url column to the registrations table</CardDescription>
          </CardHeader>
          <CardContent>
            {dbStatus !== "idle" && (
              <Alert
                className={`mb-4 ${
                  dbStatus === "success"
                    ? "bg-green-500/10 text-green-500"
                    : dbStatus === "error"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-500"
                }`}
              >
                <div className="flex items-start gap-2">
                  {dbStatus === "success" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : dbStatus === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  )}
                  <div>
                    <AlertTitle>
                      {dbStatus === "success" ? "Success" : dbStatus === "error" ? "Error" : "Setting up..."}
                    </AlertTitle>
                    <AlertDescription>{dbMessage}</AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={setupDatabase} disabled={dbStatus === "loading"} className="w-full" variant="outline">
              <Database className="mr-2 h-4 w-4" />
              {dbStatus === "loading" ? "Adding Column..." : "Add Personal Photo Column"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fix Ticket ID Column</CardTitle>
            <CardDescription>Fix the ticket_id column length issue</CardDescription>
          </CardHeader>
          <CardContent>
            {fixStatus !== "idle" && (
              <Alert
                className={`mb-4 ${
                  fixStatus === "success"
                    ? "bg-green-500/10 text-green-500"
                    : fixStatus === "error"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-500"
                }`}
              >
                <div className="flex items-start gap-2">
                  {fixStatus === "success" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : fixStatus === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  )}
                  <div>
                    <AlertTitle>
                      {fixStatus === "success" ? "Success" : fixStatus === "error" ? "Error" : "Fixing..."}
                    </AlertTitle>
                    <AlertDescription>{fixMessage}</AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={fixTicketIdColumn} disabled={fixStatus === "loading"} className="w-full" variant="outline">
              <Table className="mr-2 h-4 w-4" />
              {fixStatus === "loading" ? "Fixing Column..." : "Fix Ticket ID Column"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cleanup Test Data</CardTitle>
            <CardDescription>Remove test registrations from the database</CardDescription>
          </CardHeader>
          <CardContent>
            {cleanupStatus !== "idle" && (
              <Alert
                className={`mb-4 ${
                  cleanupStatus === "success"
                    ? "bg-green-500/10 text-green-500"
                    : cleanupStatus === "error"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-500"
                }`}
              >
                <div className="flex items-start gap-2">
                  {cleanupStatus === "success" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : cleanupStatus === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  )}
                  <div>
                    <AlertTitle>
                      {cleanupStatus === "success" ? "Success" : cleanupStatus === "error" ? "Error" : "Cleaning..."}
                    </AlertTitle>
                    <AlertDescription>{cleanupMessage}</AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={cleanupTestData}
              disabled={cleanupStatus === "loading"}
              className="w-full"
              variant="outline"
            >
              <Trash className="mr-2 h-4 w-4" />
              {cleanupStatus === "loading" ? "Cleaning..." : "Cleanup Test Data"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
