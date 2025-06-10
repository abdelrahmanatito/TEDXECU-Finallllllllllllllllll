import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Use the provided Resend API key
const RESEND_API_KEY = "re_E5KKnqsG_5GRkEq1XYmoJ7DV2yBcmiBp3"

// Verified email for testing
const VERIFIED_EMAIL = "arsanyosama90@gmail.com"

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 })
    }

    if (!["confirmed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Status must be 'confirmed' or 'rejected'" }, { status: 400 })
    }

    console.log(`Updating registration ${id} to status: ${status}`)

    // Get the registration details first
    const { data: registration, error: fetchError } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching registration:", fetchError)
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Generate ticket ID if confirming and doesn't have one
    const updateData: any = { payment_status: status }

    if (status === "confirmed" && !registration.ticket_id) {
      updateData.ticket_id = generateTicketId()
    }

    // Update the registration status
    const { data, error } = await supabase.from("registrations").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Error updating registration:", error)
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 })
    }

    console.log(`Registration ${id} updated successfully to ${status}`)

    // Send email notification
    const emailResult = await sendStatusUpdateEmail(registration, status, updateData.ticket_id)

    return NextResponse.json({
      success: true,
      message: `Registration ${status} successfully`,
      data: data[0],
      emailSent: emailResult.success,
      emailMessage: emailResult.message,
      testMode: emailResult.testMode,
    })
  } catch (error) {
    console.error("Error updating status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateTicketId(): string {
  const timestamp = Date.now().toString().slice(-4)
  const random = Math.random().toString(36).substring(2, 4).toUpperCase()
  return `TX${timestamp}${random}`
}

async function sendStatusUpdateEmail(registration: any, status: string, ticketId?: string) {
  try {
    console.log(`Sending ${status} email to: ${registration.email}`)

    // Check if we're in test mode (no verified domain)
    const isTestMode = true
    const recipient = isTestMode ? VERIFIED_EMAIL : registration.email

    let emailContent = ""
    let subject = ""

    if (status === "confirmed") {
      subject = `🎉 TEDxECU Registration Confirmed - Welcome Aboard!`
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="text-align: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #dc2626; font-size: 36px; margin: 0;">TED<span style="color: #dc2626;">x</span>ECU</h1>
            <p style="color: #6b7280; margin: 5px 0;">x = independently organized TED event</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">Ideas worth spreading</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="margin: 0 0 10px 0; font-size: 28px;">🎉 Payment Confirmed!</h2>
            <p style="margin: 0; opacity: 0.9;">Your registration has been approved!</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 18px; color: #374151;">Dear ${registration.name},</p>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Great news! Your payment has been verified and your registration for TEDxECU 2025 is now confirmed. 
              We're excited to have you join us for this inspiring event!
            </p>
            
            <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">✅ Confirmation Details</h3>
              <div style="display: grid; gap: 10px;">
                <p style="margin: 0;"><strong>Name:</strong> ${registration.name}</p>
                <p style="margin: 0;"><strong>Email:</strong> ${registration.email}</p>
                <p style="margin: 0;"><strong>University:</strong> ${registration.university}</p>
                ${ticketId ? `<p style="margin: 0;"><strong>Ticket ID:</strong> <span style="color: #dc2626; font-weight: bold; font-family: monospace;">${ticketId}</span></p>` : ""}
                <p style="margin: 0;"><strong>Event Date:</strong> June 20, 2025</p>
                <p style="margin: 0;"><strong>Venue:</strong> Egyptian Chinese University</p>
              </div>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="color: #92400e; margin-top: 0;">📅 What's Next:</h4>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                <li>Your ticket will be sent to you via email soon</li>
                <li>Keep this confirmation email for your records</li>
                <li>Arrive 30 minutes before the event starts</li>
                <li>Bring a valid ID for verification</li>
                <li>Get ready for an amazing day of ideas worth spreading!</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #374151; font-size: 18px; margin-bottom: 10px;">Welcome to TEDxECU 2025!</p>
              <p style="color: #6b7280; margin: 0;">We can't wait to see you there.</p>
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This confirmation was sent by the TEDxECU registration system.
            </p>
          </div>
        </div>
      `
    } else if (status === "rejected") {
      subject = `❌ TEDxECU Registration Update - Payment Issue`
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="text-align: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #dc2626; font-size: 36px; margin: 0;">TED<span style="color: #dc2626;">x</span>ECU</h1>
            <p style="color: #6b7280; margin: 5px 0;">x = independently organized TED event</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">Ideas worth spreading</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="margin: 0 0 10px 0; font-size: 28px;">⚠️ Payment Issue</h2>
            <p style="margin: 0; opacity: 0.9;">We need to review your payment</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 18px; color: #374151;">Dear ${registration.name},</p>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Thank you for your interest in TEDxECU 2025. Unfortunately, we were unable to verify your payment proof. 
              This could be due to various reasons such as unclear images, incorrect payment details, or technical issues.
            </p>
            
            <div style="background: #fef2f2; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">❌ Registration Status</h3>
              <p style="margin: 0; color: #ef4444; font-weight: bold;">Payment verification failed</p>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">💡 What you can do:</h4>
              <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                <li>Contact our support team for clarification</li>
                <li>Resubmit your registration with a clearer payment proof</li>
                <li>Ensure your payment details match our requirements</li>
                <li>Check if your payment was processed correctly</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #374151; font-size: 18px; margin-bottom: 10px;">We're here to help!</p>
              <p style="color: #6b7280; margin: 0;">Please don't hesitate to reach out to our support team.</p>
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This notification was sent by the TEDxECU registration system.
            </p>
          </div>
        </div>
      `
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [recipient],
        subject,
        html: emailContent,
        // Add reply-to with the actual recipient email for testing
        reply_to: registration.email,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Email API error:", result)
      return {
        success: false,
        message: `Email failed: ${result.message || "Unknown error"}`,
        testMode: isTestMode,
      }
    }

    console.log(
      `✅ Status update email sent successfully to: ${recipient}${isTestMode ? ` (TEST MODE - actual recipient: ${registration.email})` : ""}`,
    )
    return {
      success: true,
      message: isTestMode
        ? `Email sent successfully to ${VERIFIED_EMAIL} (TEST MODE - actual recipient would be ${registration.email})`
        : "Email sent successfully",
      testMode: isTestMode,
    }
  } catch (error) {
    console.error("Email sending error:", error)
    return {
      success: false,
      message: `Email failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      testMode: true,
    }
  }
}
