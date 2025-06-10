import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check if RESEND_API_KEY is available
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY is not configured",
          message: "Please add the RESEND_API_KEY environment variable to enable email functionality.",
        },
        { status: 500 },
      )
    }

    // Test email sending
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // Use Resend's default verified sender
        to: ["abdelrhmanatito92@gmail.com"],
        subject: "TEDxECU Email Test - Service Working ✅",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; font-size: 36px; margin: 0;">TED<span style="color: #dc2626;">x</span>ECU</h1>
              <p style="color: #6b7280; margin: 5px 0;">Email Service Test</p>
            </div>
            
            <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0;">✅ Email Service is Working!</h2>
            </div>
            
            <p>This is a test email to verify that the email service is working correctly.</p>
            <p>If you received this email, your email configuration is working perfectly!</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Test Details:</strong></p>
              <p style="margin: 5px 0;">Time sent: ${new Date().toISOString()}</p>
              <p style="margin: 5px 0;">Sender: onboarding@resend.dev (Resend default)</p>
              <p style="margin: 5px 0;">Service: Resend Email API</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              You can now proceed with confidence that email notifications and tickets will be delivered successfully.
            </p>
          </div>
        `,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Email sending failed",
          details: result,
          statusCode: response.status,
          statusText: response.statusText,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully to abdelrhmanatito92@gmail.com",
      details: result,
      note: "Using Resend's default verified sender (onboarding@resend.dev)",
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Exception occurred while sending test email",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
