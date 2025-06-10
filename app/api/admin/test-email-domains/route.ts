import { NextResponse } from "next/server"

// Use the provided Resend API key
const RESEND_API_KEY = "re_E5KKnqsG_5GRkEq1XYmoJ7DV2yBcmiBp3"

// Verified email for testing
const VERIFIED_EMAIL = "arsanyosama90@gmail.com"

export async function POST() {
  try {
    // Test domains
    const testDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"]
    const results: { domain: string; success: boolean; message: string }[] = []

    // In test mode, we'll only send to the verified email
    const isTestMode = true

    for (const domain of testDomains) {
      try {
        const testEmail = isTestMode ? VERIFIED_EMAIL : `test@${domain}`

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: [testEmail],
            subject: `TEDxECU Email Test - ${domain}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #dc2626;">TEDxECU Email Test</h1>
                <p>This is a test email to verify delivery to ${domain} domain.</p>
                <p>Test completed at: ${new Date().toISOString()}</p>
                ${isTestMode ? `<p><strong>TEST MODE:</strong> This would normally be sent to test@${domain}</p>` : ""}
              </div>
            `,
            reply_to: `test@${domain}`,
          }),
        })

        const result = await response.json()

        if (response.ok) {
          results.push({
            domain,
            success: true,
            message: isTestMode
              ? `Email sent to ${VERIFIED_EMAIL} (TEST MODE - would be sent to ${domain})`
              : `Email sent to ${domain} successfully`,
          })
        } else {
          results.push({
            domain,
            success: false,
            message: `Failed to send to ${domain}: ${result.message || "Unknown error"}`,
          })
        }
      } catch (error) {
        results.push({
          domain,
          success: false,
          message: `Error sending to ${domain}: ${error instanceof Error ? error.message : "Unknown error"}`,
        })
      }
    }

    // Calculate summary
    const successful = results.filter((r) => r.success).length
    const total = results.length
    const successRate = `${Math.round((successful / total) * 100)}%`
    const testedDomains = results.map((r) => r.domain)

    return NextResponse.json({
      success: true,
      results,
      summary: {
        successful,
        total,
        successRate,
        testedDomains,
      },
      testMode: isTestMode,
      message: isTestMode
        ? `Test completed in TEST MODE. All emails sent to ${VERIFIED_EMAIL} instead of actual domains.`
        : "Domain test completed successfully",
    })
  } catch (error) {
    console.error("Error testing email domains:", error)
    return NextResponse.json({ success: false, error: "Failed to test email domains" }, { status: 500 })
  }
}
