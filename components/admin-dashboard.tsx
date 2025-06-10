"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Download,
  Search,
  RefreshCw,
  Database,
  TestTube,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Send,
  FileText,
  User,
  Ticket,
  Filter,
  Banknote,
} from "lucide-react"

interface Registration {
  id: string
  name: string
  email: string
  phone: string
  phone_type: string
  university: string
  payment_status: "pending" | "confirmed" | "rejected"
  ticket_id: string | null
  created_at: string
  ticket_sent: boolean
  payment_proof_url: string | null
  personal_photo_url: string | null
}

interface Stats {
  total_registrations: number
  pending_registrations: number
  confirmed_registrations: number
  rejected_registrations: number
  tickets_sent: number
  total_money: number
}

interface ApiError {
  error: string
  details: string
  setup_required?: boolean
  sql_script?: string
  supabase_url?: string
}

// Ticket price constant
const TICKET_PRICE = 399 // EGP

export function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "rejected" | "ticket_sent">("all")
  const [testDataLoading, setTestDataLoading] = useState(false)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [emailTestLoading, setEmailTestLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string; testMode?: boolean } | null>(null)
  const [setupError, setSetupError] = useState<ApiError | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [showImageModal, setShowImageModal] = useState<{ url: string; title: string } | null>(null)
  const [domainTestLoading, setDomainTestLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})

  const setButtonLoading = (buttonId: string, loading: boolean) => {
    setActionLoading((prev) => ({ ...prev, [buttonId]: loading }))
  }

  const fetchRegistrations = async () => {
    setLoading(true)
    setSetupError(null)

    try {
      const response = await fetch("/api/admin/registrations")
      const data = await response.json()

      if (!response.ok) {
        if (data.setup_required) {
          setSetupError(data)
          setRegistrations([])
          return
        }
        throw new Error(data.details || data.error || "Failed to fetch registrations")
      }

      if (Array.isArray(data)) {
        setRegistrations(data)
        setSetupError(null)
      } else {
        console.error("API returned non-array data:", data)
        setRegistrations([])
        setEmailStatus({
          success: false,
          message: "Error: API returned invalid data format",
        })
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
      setRegistrations([])
      setEmailStatus({
        success: false,
        message: `Error fetching registrations: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupTestData = async () => {
    if (!confirm("⚠️ This will delete all test data. Are you sure?")) {
      return
    }

    setCleanupLoading(true)
    try {
      const response = await fetch("/api/admin/cleanup-test-data", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        await fetchRegistrations()
        setEmailStatus({
          success: true,
          message: `Cleanup completed! Removed ${result.deletedCount} test records.`,
        })
      } else {
        setEmailStatus({ success: false, message: result.error || "Failed to cleanup test data" })
      }
    } catch (error) {
      console.error("Error cleaning up test data:", error)
      setEmailStatus({ success: false, message: "Failed to cleanup test data" })
    } finally {
      setCleanupLoading(false)
    }
  }

  const handleGenerateTestData = async () => {
    setTestDataLoading(true)
    try {
      const response = await fetch("/api/admin/generate-test-data", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        await fetchRegistrations()
        const summary = result.summary
        setEmailStatus({
          success: true,
          message: `Generated test data! Attempted: ${summary.totalAttempted}, Success: ${summary.successCount}, Errors: ${summary.errorCount}. Total in DB: ${summary.finalDatabaseCount}`,
        })
      } else {
        setEmailStatus({ success: false, message: result.error || "Failed to generate test data" })
      }
    } catch (error) {
      console.error("Error generating test data:", error)
      setEmailStatus({ success: false, message: "Failed to generate test data" })
    } finally {
      setTestDataLoading(false)
    }
  }

  const testEmailService = async () => {
    setEmailTestLoading(true)
    try {
      const response = await fetch("/api/admin/test-email-service")
      const result = await response.json()
      setEmailStatus({
        success: result.success,
        message: result.success ? result.message : result.error,
        testMode: result.testMode,
      })
    } catch (error) {
      console.error("Error testing email:", error)
      setEmailStatus({ success: false, message: "Error testing email service." })
    } finally {
      setEmailTestLoading(false)
    }
  }

  const testEmailDomains = async () => {
    setDomainTestLoading(true)
    try {
      const response = await fetch("/api/admin/test-email-domains", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        setEmailStatus({
          success: true,
          message: `Domain test completed! ${result.summary.successful}/${result.summary.total} domains successful (${result.summary.successRate}). Tested: ${result.summary.testedDomains.join(", ")}`,
          testMode: result.testMode,
        })
      } else {
        setEmailStatus({ success: false, message: result.error || "Domain test failed" })
      }
    } catch (error) {
      console.error("Error testing domains:", error)
      setEmailStatus({ success: false, message: "Failed to test email domains" })
    } finally {
      setDomainTestLoading(false)
    }
  }

  const updatePaymentStatus = async (id: string, status: "confirmed" | "rejected") => {
    const buttonId = `status-${id}-${status}`
    setButtonLoading(buttonId, true)

    try {
      const response = await fetch("/api/admin/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      const result = await response.json()

      if (response.ok) {
        await fetchRegistrations()
        setEmailStatus({
          success: true,
          message: result.message || `Payment ${status} successfully!`,
          testMode: result.testMode,
        })
      } else {
        setEmailStatus({ success: false, message: result.error || "Failed to update payment status" })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      setEmailStatus({ success: false, message: "Failed to update payment status" })
    } finally {
      setButtonLoading(buttonId, false)
    }
  }

  const deleteRegistration = async (id: string) => {
    if (!confirm("⚠️ Are you sure you want to delete this registration? This action cannot be undone.")) {
      return
    }

    const buttonId = `delete-${id}`
    setButtonLoading(buttonId, true)

    try {
      const response = await fetch("/api/admin/delete-registration", {
        method: "POST", // Keep as POST for compatibility
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (response.ok) {
        await fetchRegistrations()
        setEmailStatus({ success: true, message: "Registration deleted successfully!" })
      } else {
        setEmailStatus({ success: false, message: result.error || "Failed to delete registration" })
      }
    } catch (error) {
      console.error("Error deleting registration:", error)
      setEmailStatus({ success: false, message: "Failed to delete registration" })
    } finally {
      setButtonLoading(buttonId, false)
    }
  }

  const sendTicket = async (registration: Registration) => {
    const buttonId = `send-${registration.id}`
    setButtonLoading(buttonId, true)

    try {
      const response = await fetch("/api/admin/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration,
          ticketData: {
            name: registration.name,
            ticketId: registration.ticket_id,
            email: registration.email,
            university: registration.university,
            date: "June 20, 2025",
            seat: "General Admission",
          },
        }),
      })

      const result = await response.json()

      if (response.ok) {
        await fetchRegistrations()
        setEmailStatus({
          success: true,
          message: result.message || "Ticket sent successfully!",
          testMode: result.testMode,
        })
      } else {
        setEmailStatus({
          success: false,
          message: result.error || "Failed to send ticket",
          testMode: result.testMode,
        })
      }
    } catch (error) {
      console.error("Error sending ticket:", error)
      setEmailStatus({ success: false, message: "Failed to send ticket" })
    } finally {
      setButtonLoading(buttonId, false)
    }
  }

  const generateTicket = async (registrationId: string) => {
    const buttonId = `generate-${registrationId}`
    setButtonLoading(buttonId, true)

    try {
      const response = await fetch("/api/generate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      })

      const result = await response.json()

      if (response.ok) {
        // Open ticket in new window
        const newWindow = window.open("", "_blank")
        if (newWindow) {
          newWindow.document.write(result.ticketHtml)
          newWindow.document.close()
        }
        setEmailStatus({ success: true, message: "Ticket generated successfully!" })
      } else {
        setEmailStatus({ success: false, message: result.error || "Failed to generate ticket" })
      }
    } catch (error) {
      console.error("Error generating ticket:", error)
      setEmailStatus({ success: false, message: "Failed to generate ticket" })
    } finally {
      setButtonLoading(buttonId, false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch("/api/admin/export-excel")
      if (!response.ok) {
        throw new Error("Export failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tedxecu-registrations-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setEmailStatus({ success: true, message: "Data exported successfully!" })
    } catch (error) {
      console.error("Error exporting data:", error)
      setEmailStatus({ success: false, message: "Failed to export data" })
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  // Calculate stats from registrations
  useEffect(() => {
    if (Array.isArray(registrations) && registrations.length > 0) {
      const confirmedRegistrations = registrations.filter((r) => r.payment_status === "confirmed")
      const totalMoney = confirmedRegistrations.length * TICKET_PRICE

      const calculatedStats = {
        total_registrations: registrations.length,
        pending_registrations: registrations.filter((r) => r.payment_status === "pending").length,
        confirmed_registrations: confirmedRegistrations.length,
        rejected_registrations: registrations.filter((r) => r.payment_status === "rejected").length,
        tickets_sent: registrations.filter((r) => r.ticket_sent).length,
        total_money: totalMoney,
      }
      setStats(calculatedStats)
    } else {
      setStats({
        total_registrations: 0,
        pending_registrations: 0,
        confirmed_registrations: 0,
        rejected_registrations: 0,
        tickets_sent: 0,
        total_money: 0,
      })
    }
  }, [registrations])

  // Filter registrations
  const filteredRegistrations = Array.isArray(registrations)
    ? registrations.filter((reg) => {
        const matchesSearch =
          reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (reg.ticket_id && reg.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()))

        let matchesStatus = false
        if (statusFilter === "all") {
          matchesStatus = true
        } else if (statusFilter === "ticket_sent") {
          matchesStatus = reg.ticket_sent === true
        } else {
          matchesStatus = reg.payment_status === statusFilter
        }

        return matchesSearch && matchesStatus
      })
    : []

  return (
    <div className="space-y-6">
      {/* Database Setup Error Alert */}
      {setupError && (
        <Alert className="bg-red-900/50 border-red-700">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-300">Database Setup Required</AlertTitle>
          <AlertDescription className="text-red-200 space-y-2">
            <p>{setupError.details}</p>
            {setupError.sql_script && (
              <div className="bg-slate-800 p-3 rounded mt-2">
                <p className="font-mono text-sm text-slate-300">📝 {setupError.sql_script}</p>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
                className="text-red-300 border-red-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Supabase Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={fetchRegistrations} className="text-red-300 border-red-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && !setupError && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.total_registrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pending_registrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-slate-400">Confirmed</p>
                  <p className="text-2xl font-bold text-white">{stats.confirmed_registrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-slate-400">Rejected</p>
                  <p className="text-2xl font-bold text-white">{stats.rejected_registrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-slate-400">Tickets Sent</p>
                  <p className="text-2xl font-bold text-white">{stats.tickets_sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm text-slate-400">Revenue (EGP)</p>
                  <p className="text-2xl font-bold text-white">{stats.total_money.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">System Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testEmailService} disabled={emailTestLoading || !!setupError} variant="outline">
              <TestTube className="w-4 h-4 mr-2" />
              {emailTestLoading ? "Testing..." : "Test Email Service"}
            </Button>
            <Button onClick={testEmailDomains} disabled={domainTestLoading || !!setupError} variant="outline">
              <TestTube className="w-4 h-4 mr-2" />
              {domainTestLoading ? "Testing Domains..." : "Test Email Domains"}
            </Button>
            <Button onClick={handleCleanupTestData} disabled={cleanupLoading || !!setupError} variant="outline">
              <Trash2 className="w-4 h-4 mr-2" />
              {cleanupLoading ? "Cleaning..." : "Cleanup Test Data"}
            </Button>
            <Button onClick={handleGenerateTestData} disabled={testDataLoading || !!setupError} variant="outline">
              <Database className="w-4 h-4 mr-2" />
              {testDataLoading ? "Generating..." : "Generate Test Data"}
            </Button>
            <Button onClick={exportData} disabled={!!setupError} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={fetchRegistrations} disabled={loading} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {emailStatus && (
            <div
              className={`p-3 rounded ${emailStatus.success ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}
            >
              {emailStatus.message}
              {emailStatus.testMode && (
                <div className="mt-2 p-2 bg-yellow-900/50 text-yellow-300 rounded text-sm">
                  <strong>⚠️ TEST MODE:</strong> Emails are being sent to the verified email address only. To send to
                  actual recipients, verify a domain at{" "}
                  <a href="https://resend.com/domains" target="_blank" className="underline" rel="noreferrer">
                    resend.com/domains
                  </a>
                  .
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      {!setupError && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Registrations Management</CardTitle>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, university, or ticket ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-red-600" : ""}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  All ({stats?.total_registrations || 0})
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                  className={statusFilter === "pending" ? "bg-yellow-600" : ""}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Pending ({stats?.pending_registrations || 0})
                </Button>
                <Button
                  variant={statusFilter === "confirmed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("confirmed")}
                  className={statusFilter === "confirmed" ? "bg-green-600" : ""}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmed ({stats?.confirmed_registrations || 0})
                </Button>
                <Button
                  variant={statusFilter === "rejected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("rejected")}
                  className={statusFilter === "rejected" ? "bg-red-600" : ""}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejected ({stats?.rejected_registrations || 0})
                </Button>
                <Button
                  variant={statusFilter === "ticket_sent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("ticket_sent")}
                  className={statusFilter === "ticket_sent" ? "bg-purple-600" : ""}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Ticket Sent ({stats?.tickets_sent || 0})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading registrations...</div>
            ) : (
              <div className="space-y-4">
                {filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((registration) => (
                    <div key={registration.id} className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-4">
                            <h3 className="text-white font-semibold">{registration.name}</h3>
                            {registration.personal_photo_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setShowImageModal({
                                    url: registration.personal_photo_url!,
                                    title: `${registration.name}'s Personal Photo`,
                                  })
                                }
                              >
                                <User className="w-4 h-4 mr-1" />
                                Photo
                              </Button>
                            )}
                            {registration.payment_proof_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setShowImageModal({
                                    url: registration.payment_proof_url!,
                                    title: `${registration.name}'s Payment Proof`,
                                  })
                                }
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Proof
                              </Button>
                            )}
                          </div>
                          <p className="text-slate-300 text-sm">{registration.email}</p>
                          <p className="text-slate-400 text-sm">
                            {registration.phone} (
                            {registration.phone_type === "egyptian" ? "Egyptian" : "International"}) •{" "}
                            {registration.university}
                          </p>
                          <p className="text-slate-500 text-xs">
                            Registered: {new Date(registration.created_at).toLocaleDateString()}
                          </p>
                          {registration.ticket_id && (
                            <p className="text-slate-300 text-sm font-mono">Ticket ID: {registration.ticket_id}</p>
                          )}
                          {registration.ticket_sent && (
                            <Badge variant="default" className="bg-purple-600">
                              Ticket Sent
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge
                            variant={
                              registration.payment_status === "confirmed"
                                ? "default"
                                : registration.payment_status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {registration.payment_status}
                          </Badge>

                          <div className="flex flex-wrap gap-2">
                            {registration.payment_status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updatePaymentStatus(registration.id, "confirmed")}
                                  disabled={actionLoading[`status-${registration.id}-confirmed`]}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  {actionLoading[`status-${registration.id}-confirmed`] ? "..." : "Accept"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updatePaymentStatus(registration.id, "rejected")}
                                  disabled={actionLoading[`status-${registration.id}-rejected`]}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  {actionLoading[`status-${registration.id}-rejected`] ? "..." : "Decline"}
                                </Button>
                              </>
                            )}

                            {registration.payment_status === "confirmed" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateTicket(registration.id)}
                                  disabled={actionLoading[`generate-${registration.id}`]}
                                >
                                  <Ticket className="w-4 h-4 mr-1" />
                                  {actionLoading[`generate-${registration.id}`] ? "..." : "Generate"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={registration.ticket_sent ? "outline" : "default"}
                                  onClick={() => sendTicket(registration)}
                                  disabled={actionLoading[`send-${registration.id}`]}
                                  className={registration.ticket_sent ? "" : "bg-purple-600 hover:bg-purple-700"}
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  {actionLoading[`send-${registration.id}`]
                                    ? "..."
                                    : registration.ticket_sent
                                      ? "Resend"
                                      : "Send Ticket"}
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteRegistration(registration.id)}
                              disabled={actionLoading[`delete-${registration.id}`]}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              {actionLoading[`delete-${registration.id}`] ? "..." : "Delete"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    {searchTerm || statusFilter !== "all"
                      ? "No registrations match your search/filter."
                      : "No registrations found."}
                    {!Array.isArray(registrations) && (
                      <div className="mt-2 text-red-400 text-sm">Error: Invalid data format received from API</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(null)}
        >
          <div className="bg-slate-800 p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">{showImageModal.title}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowImageModal(null)}>
                ✕
              </Button>
            </div>
            <img
              src={showImageModal.url || "/placeholder.svg"}
              alt={showImageModal.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=400&width=400"
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
