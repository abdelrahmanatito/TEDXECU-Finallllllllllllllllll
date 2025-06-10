"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, CheckCircle, Trash2, Zap } from "lucide-react"

export function DebugPanel() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testId, setTestId] = useState("")
  const [forceDeleteId, setForceDeleteId] = useState("")
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState("")

  const testDeleteAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/delete-registration")
      const result = await response.json()
      setTestResult({
        type: "api-test",
        success: response.ok,
        data: result,
      })
    } catch (error) {
      setTestResult({
        type: "api-test",
        success: false,
        data: { error: String(error) },
      })
    } finally {
      setLoading(false)
    }
  }

  const testForceDeleteAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/force-delete")
      const result = await response.json()
      setTestResult({
        type: "force-delete-test",
        success: response.ok,
        data: result,
      })
    } catch (error) {
      setTestResult({
        type: "force-delete-test",
        success: false,
        data: { error: String(error) },
      })
    } finally {
      setLoading(false)
    }
  }

  const testSingleDelete = async () => {
    if (!testId.trim()) {
      setTestResult({
        type: "single-delete",
        success: false,
        data: { error: "Please enter a registration ID" },
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/delete-registration", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testId.trim() }),
      })
      const result = await response.json()
      setTestResult({
        type: "single-delete",
        success: response.ok,
        data: result,
      })
    } catch (error) {
      setTestResult({
        type: "single-delete",
        success: false,
        data: { error: String(error) },
      })
    } finally {
      setLoading(false)
    }
  }

  const forceDeleteRecord = async () => {
    if (!forceDeleteId.trim()) {
      setTestResult({
        type: "force-delete",
        success: false,
        data: { error: "Please enter a registration ID" },
      })
      return
    }

    if (!confirm(`🔥 FORCE DELETE: Are you absolutely sure you want to force delete record ${forceDeleteId}?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/force-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: forceDeleteId.trim(), force: true }),
      })
      const result = await response.json()
      setTestResult({
        type: "force-delete",
        success: response.ok,
        data: result,
      })
    } catch (error) {
      setTestResult({
        type: "force-delete",
        success: false,
        data: { error: String(error) },
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteAllTestData = async () => {
    if (bulkDeleteConfirm !== "DELETE ALL TEST DATA") {
      setTestResult({
        type: "bulk-delete",
        success: false,
        data: { error: "Please type 'DELETE ALL TEST DATA' to confirm" },
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/bulk-delete?confirm=DELETE_ALL_TEST_DATA", {
        method: "DELETE",
      })
      const result = await response.json()
      setTestResult({
        type: "bulk-delete",
        success: response.ok,
        data: result,
      })
    } catch (error) {
      setTestResult({
        type: "bulk-delete",
        success: false,
        data: { error: String(error) },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800/80 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Debug Panel - Delete Functionality Fix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-red-900/50 border-red-700">
          <Zap className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-300">IMPORTANT: Run SQL Scripts First!</AlertTitle>
          <AlertDescription className="text-red-200">
            Before testing, run these SQL scripts in your Supabase SQL Editor:
            <br />
            1. <code className="bg-slate-700 px-1 rounded">04-force-fix-delete.sql</code>
            <br />
            2. <code className="bg-slate-700 px-1 rounded">05-create-delete-function.sql</code>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <h4 className="text-white font-medium">Test API Connection</h4>
            <Button onClick={testDeleteAPI} disabled={loading} variant="outline" className="w-full">
              {loading ? "Testing..." : "Test Delete API"}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-medium">Test Force Delete API</h4>
            <Button onClick={testForceDeleteAPI} disabled={loading} variant="outline" className="w-full">
              {loading ? "Testing..." : "Test Force API"}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-medium">Regular Delete Test</h4>
            <Input
              placeholder="Enter registration ID"
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Button
              onClick={testSingleDelete}
              disabled={loading || !testId.trim()}
              variant="outline"
              className="w-full text-red-400 border-red-600"
            >
              {loading ? "Deleting..." : "Regular Delete"}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-medium">🔥 Force Delete</h4>
            <Input
              placeholder="Enter registration ID"
              value={forceDeleteId}
              onChange={(e) => setForceDeleteId(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Button
              onClick={forceDeleteRecord}
              disabled={loading || !forceDeleteId.trim()}
              variant="outline"
              className="w-full text-red-400 border-red-600 bg-red-900/20"
            >
              <Zap className="w-4 h-4 mr-2" />
              {loading ? "Force Deleting..." : "FORCE DELETE"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-white font-medium">Delete All Test Data</h4>
          <Input
            placeholder="Type: DELETE ALL TEST DATA"
            value={bulkDeleteConfirm}
            onChange={(e) => setBulkDeleteConfirm(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
          <Button
            onClick={deleteAllTestData}
            disabled={loading || bulkDeleteConfirm !== "DELETE ALL TEST DATA"}
            variant="outline"
            className="w-full text-red-400 border-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? "Deleting..." : "Delete All Test Data"}
          </Button>
        </div>

        {testResult && (
          <Alert className={testResult.success ? "bg-green-900/50 border-green-700" : "bg-red-900/50 border-red-700"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
            <AlertTitle className={testResult.success ? "text-green-300" : "text-red-300"}>
              {testResult.type} - {testResult.success ? "Success" : "Error"}
            </AlertTitle>
            <AlertDescription className={testResult.success ? "text-green-200" : "text-red-200"}>
              <Textarea
                value={JSON.stringify(testResult.data, null, 2)}
                readOnly
                className="mt-2 bg-slate-800/50 border-slate-600 text-white font-mono text-xs"
                rows={8}
              />
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
