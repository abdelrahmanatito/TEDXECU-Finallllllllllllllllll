"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Eye } from "lucide-react"

interface TicketGeneratorProps {
  registrationId: string
  name: string
  ticketId: string
  onTicketGenerated?: () => void
}

export function TicketGenerator({ registrationId, name, ticketId, onTicketGenerated }: TicketGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [ticketHtml, setTicketHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateTicket = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      })

      const result = await response.json()

      if (response.ok) {
        setTicketHtml(result.ticketHtml)
        onTicketGenerated?.()
      } else {
        setError(result.error || "Failed to generate ticket")
      }
    } catch (error) {
      setError("Error generating ticket")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadTicket = () => {
    if (!ticketHtml) return

    // Create a new window with the ticket
    const ticketWindow = window.open("", "_blank", "width=850,height=550")
    if (ticketWindow) {
      ticketWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>TEDxECU Ticket - ${name}</title>
          <style>
            body { margin: 0; padding: 20px; background: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .ticket-container { box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            ${ticketHtml}
          </div>
          <script>
            // Auto-print when page loads
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            }
          </script>
        </body>
        </html>
      `)
      ticketWindow.document.close()
    }
  }

  const previewTicket = () => {
    if (!ticketHtml) return

    // Create a new window with the ticket preview
    const previewWindow = window.open("", "_blank", "width=850,height=550")
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>TEDxECU Ticket Preview - ${name}</title>
          <style>
            body { margin: 0; padding: 20px; background: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .ticket-container { box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            ${ticketHtml}
          </div>
        </body>
        </html>
      `)
      previewWindow.document.close()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Generate a customized ticket for <strong>{name}</strong> (ID: {ticketId})
          </p>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-2">
          <Button onClick={generateTicket} disabled={loading} className="flex-1">
            {loading ? "Generating..." : "Generate Ticket"}
          </Button>

          {ticketHtml && (
            <>
              <Button onClick={previewTicket} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button onClick={downloadTicket} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Print
              </Button>
            </>
          )}
        </div>

        {ticketHtml && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ Ticket generated successfully! Use the Preview button to see it or Print to download.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
