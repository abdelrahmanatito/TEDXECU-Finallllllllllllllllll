import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY is not configured",
          configured: false,
        },
        { status: 400 },
      )
    }

    // Test email content
    const testEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #dc2626; font-size: 36px; margin: 0;">TED<span style="color: #dc2626;">x</span>ECU</h1>
        <p style="color: #6b7280; margin: 5px 0;">x = independently organized TED event</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Ideas worth spreading</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0 0 10px 0; font-size: 28px;">✅ Email Service Test</h2>
        <p style="margin: 0; opacity: 0.9;">Your email service is working correctly!</p>
      </div>
      
      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">🎉 Test Results</h3>
        <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
          <li>✅ Resend API Key: Configured</li>
          <li>✅ Email Sending: Working</li>
          <li>✅ HTML Templates: Rendering</li>
          <li>✅ TEDxECU System: Ready</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #374151; font-size: 18px; margin-bottom: 10px;">Your TEDxECU registration system is ready!</p>
        <p style="color: #6b7280; margin: 0;">Users will now receive confirmation emails when they register.</p>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          This test email was sent at ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
    `

    // Send test email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: ["delivered@resend.dev"], // Resend's test email address
        subject: "TEDxECU Email Service Test - Configuration Successful",
        html: testEmailContent,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Email API error:", result)
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Email sending failed",
          details: result,
          configured: true,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully!",
      emailId: result.id,
      configured: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Email service test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Exception occurred while testing email service",
        details: error instanceof Error ? error.message : "Unknown error",
        configured: !!process.env.RESEND_API_KEY,
      },
      { status: 500 },
    )
  }
}
