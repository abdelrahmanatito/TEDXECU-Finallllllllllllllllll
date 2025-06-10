import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Use the provided Resend API key
const RESEND_API_KEY = "re_E5KKnqsG_5GRkEq1XYmoJ7DV2yBcmiBp3"

// Verified email for testing
const VERIFIED_EMAIL = "arsanyosama90@gmail.com"

export async function POST(req: Request) {
  try {
    const { registration, ticketData } = await req.json()

    console.log("📧 Sending ticket to:", registration.email)

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Generate ticket for embedding in email
    const qrData = JSON.stringify({
      ticketId: registration.ticket_id,
      name: registration.name,
      email: registration.email,
      university: registration.university,
      event: "TEDxECU 2025",
      verified: true,
      timestamp: new Date().toISOString(),
    })

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=000000`

    const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="text-align: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #dc2626; font-size: 36px; margin: 0;">TED<span style="color: #dc2626;">x</span>ECU</h1>
        <p style="color: #6b7280; margin: 5px 0;">x = independently organized TED event</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Ideas worth spreading</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="margin: 0 0 10px 0; font-size: 28px;">🎫 Your Ticket is Ready!</h2>
        <p style="margin: 0; opacity: 0.9;">Payment confirmed - Welcome to TEDxECU 2025!</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 18px; color: #374151;">Dear ${registration.name},</p>
        <p style="color: #6b7280; line-height: 1.6;">
          Congratulations! Your payment has been confirmed and your ticket is ready. 
          We're excited to have you join us at TEDxECU for an inspiring day of ideas worth spreading.
        </p>
        
        <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">🎫 Your Ticket Details</h3>
          <div style="display: grid; gap: 10px;">
            <p style="margin: 0;"><strong>Name:</strong> ${registration.name}</p>
            <p style="margin: 0;"><strong>Email:</strong> ${registration.email}</p>
            <p style="margin: 0;"><strong>Phone:</strong> ${registration.phone}</p>
            <p style="margin: 0;"><strong>University:</strong> ${registration.university}</p>
            <p style="margin: 0;"><strong>Ticket ID:</strong> <span style="color: #dc2626; font-weight: bold; font-size: 18px; font-family: monospace;">${registration.ticket_id}</span></p>
            <p style="margin: 0;"><strong>Date:</strong> June 20, 2025</p>
            <p style="margin: 0;"><strong>Time:</strong> 9:00 AM - 6:00 PM</p>
            <p style="margin: 0;"><strong>Venue:</strong> Egyptian Chinese University</p>
            <p style="margin: 0;"><strong>Seat:</strong> General Admission</p>
          </div>
        </div>

        ${
          registration.personal_photo_url
            ? `
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <h4 style="color: #1e40af; margin-top: 0;">📸 Your Badge Photo</h4>
          <img src="${registration.personal_photo_url}" alt="Badge Photo" style="max-width: 150px; max-height: 200px; border-radius: 8px; border: 2px solid #dc2626; object-fit: cover;" />
          <p style="color: #1e40af; font-size: 14px; margin: 10px 0 0 0;">This photo will appear on your event badge</p>
        </div>
        `
            : ""
        }
        
        <!-- QR Code Section -->
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <h4 style="color: #374151; margin-top: 0;">📱 Your Entry QR Code</h4>
          <img src="${qrCodeUrl}" alt="Entry QR Code" style="width: 200px; height: 200px; border-radius: 8px; border: 2px solid #dc2626;" />
          <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">Show this QR code at the venue entrance</p>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="color: #92400e; margin-top: 0;">📱 Important Instructions:</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px;">
            <li>Save this email and screenshot your ticket details</li>
            <li>Present your <strong>Ticket ID (${registration.ticket_id})</strong> at the venue</li>
            <li>Show the QR code above for quick entry</li>
            <li>Arrive 30 minutes before the event starts</li>
            <li>Bring a valid ID for verification</li>
            <li>Your personal photo will be used for your event badge</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/ticket/${registration.ticket_id}" 
             style="display: inline-block; background: #dc2626; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px;">
            🎫 View Full Ticket
          </a>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #374151; font-size: 18px; margin-bottom: 10px;">We look forward to seeing you at TEDxECU!</p>
          <p style="color: #6b7280; margin: 0;">Get ready to be inspired by ideas worth spreading.</p>
        </div>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          This ticket was generated by the TEDxECU registration system.<br>
          Keep this email safe - it contains your entry credentials.
        </p>
      </div>
    </div>
  `

    // Send ticket email with retry logic
    let emailSent = false
    let emailError = null
    let retries = 3
    const isTestMode = true

    // Determine recipient based on test mode
    const recipient = isTestMode ? VERIFIED_EMAIL : registration.email

    while (retries > 0) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: [recipient],
            subject: `🎫 Your TEDxECU Ticket - Payment Confirmed! (${registration.ticket_id})`,
            html: emailContent,
            // Add reply-to with the actual recipient email for testing
            reply_to: registration.email,
          }),
        })

        const result = await emailResponse.json()

        if (!emailResponse.ok) {
          emailError = result.message || "Email sending failed"
          console.error(`Email API error (attempt ${4 - retries}/3):`, result)
          retries--

          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, (4 - retries) * 1000))
            continue
          }
        } else {
          // Success! Update ticket_sent status
          await supabase.from("registrations").update({ ticket_sent: true }).eq("id", registration.id)

          emailSent = true
          console.log(
            `✅ Ticket email sent successfully to: ${recipient}${isTestMode ? ` (TEST MODE - actual recipient: ${registration.email})` : ""}`,
          )
          break
        }
      } catch (error) {
        emailError = String(error)
        console.error(`Email sending exception (attempt ${4 - retries}/3):`, error)
        retries--

        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, (4 - retries) * 1000))
          continue
        }
      }
    }

    if (emailSent) {
      return NextResponse.json(
        {
          message: isTestMode
            ? `Ticket sent successfully to ${VERIFIED_EMAIL} (TEST MODE - actual recipient would be ${registration.email})`
            : "Ticket sent successfully!",
          testMode: isTestMode,
        },
        { status: 200 },
      )
    } else {
      return NextResponse.json(
        {
          error: emailError || "Failed to send email after multiple retries",
          testMode: isTestMode,
          tip: "In test mode, emails can only be sent to the verified email address. To send to actual recipients, verify a domain in Resend.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending ticket:", error)
    return NextResponse.json({ error: "Failed to send ticket" }, { status: 500 })
  }
}
