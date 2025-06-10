import { NextResponse } from "next/server"

// Use the provided Resend API key
const RESEND_API_KEY = "re_E5KKnqsG_5GRkEq1XYmoJ7DV2yBcmiBp3"

// Verified email for testing
const VERIFIED_EMAIL = "arsanyosama90@gmail.com"

export async function GET() {
  try {
    // Check if we're in test mode (no verified domain)
    const isTestMode = true
    const recipient = isTestMode ? VERIFIED_EMAIL : "test@example.com"

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [recipient],
        subject: "TEDxECU Email Service Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">TEDxECU Email Service Test</h1>
            <p>This is a test email to verify that the email service is working correctly.</p>
            <p>Test completed at: ${new Date().toISOString()}</p>
            ${isTestMode ? `<p><strong>TEST MODE:</strong> This would normally be sent to test@example.com</p>` : ""}
          </div>
        `,
        reply_to: "test@example.com",
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Email API error:", result)
      return NextResponse.json({
        success: false,
        error: `Email service error: ${result.message || "Unknown error"}`,
        testMode: isTestMode,
      })
    }

    return NextResponse.json({
      success: true,
      message: isTestMode
        ? `Email service is working! Test email sent to ${VERIFIED_EMAIL} (TEST MODE - would be sent to test@example.com)`
        : "Email service is working! Test email sent successfully.",
      testMode: isTestMode,
      tip: isTestMode ? "To send emails to actual recipients, verify a domain at resend.com/domains" : undefined,
    })
  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json({
      success: false,
      error: `Email test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }
}
