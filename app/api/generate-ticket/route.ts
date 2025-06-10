import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { registrationId } = await request.json()

    console.log("🎫 Generating ticket for registration:", registrationId)

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required" }, { status: 400 })
    }

    // Get registration details
    const { data: registration, error: fetchError } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", registrationId)
      .single()

    if (fetchError || !registration) {
      console.error("Registration fetch error:", fetchError)
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.payment_status !== "confirmed") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 })
    }

    console.log("✅ Registration found:", {
      name: registration.name,
      email: registration.email,
      ticketId: registration.ticket_id,
      status: registration.payment_status,
    })

    // Create comprehensive QR code data
    const qrData = JSON.stringify({
      ticketId: registration.ticket_id,
      name: registration.name,
      email: registration.email,
      university: registration.university,
      event: "TEDxECU 2025",
      theme: "Yin & Yang: Finding Balance in Innovation",
      date: "June 20, 2025",
      time: "9:00 AM - 6:00 PM",
      venue: "Egyptian Chinese University",
      seat: "General Admission",
      verified: true,
      timestamp: new Date().toISOString(),
    })

    // Generate professional ticket HTML
    const ticketHtml = generateProfessionalTicketHtml({
      name: registration.name,
      ticketId: registration.ticket_id,
      email: registration.email,
      university: registration.university,
      personalPhotoUrl: registration.personal_photo_url,
      qrData,
    })

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=000000`

    console.log("🎫 Ticket generated successfully")

    return NextResponse.json({
      success: true,
      ticketHtml,
      qrCodeUrl,
      ticketData: {
        name: registration.name,
        ticketId: registration.ticket_id,
        email: registration.email,
        university: registration.university,
        date: "June 20, 2025",
        seat: "General Admission",
      },
    })
  } catch (error) {
    console.error("Error generating ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateProfessionalTicketHtml({
  name,
  ticketId,
  email,
  university,
  personalPhotoUrl,
  qrData,
}: {
  name: string
  ticketId: string
  email: string
  university: string
  personalPhotoUrl: string | null
  qrData: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TEDxECU Ticket - ${name}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          margin: 0; 
          padding: 20px; 
          background: #f0f0f0; 
          display: flex; 
          flex-direction: column;
          justify-content: center; 
          align-items: center; 
          min-height: 100vh;
          font-family: Arial, sans-serif;
        }
        .ticket-container { 
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          max-width: 100%;
          overflow: hidden;
          border-radius: 20px;
        }
        h1 {
          color: #dc2626;
          text-align: center;
          margin-bottom: 20px;
        }
        .actions {
          margin-top: 20px;
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          text-decoration: none;
        }
        .button.outline {
          background: transparent;
          border: 2px solid #dc2626;
          color: #dc2626;
        }
        @media print {
          .no-print {
            display: none;
          }
          body {
            padding: 0;
            background: white;
          }
        }
      </style>
    </head>
    <body>
      <h1 class="no-print">Your TEDxECU Ticket</h1>
      <div class="ticket-container">
        <div style="
          width: 900px;
          height: 500px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          position: relative;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #ffffff;
          overflow: hidden;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          border: 1px solid #334155;
        ">
          <!-- Geometric background pattern -->
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
              radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
              linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%);
            opacity: 0.8;
          "></div>
          
          <!-- Header Section -->
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 120px;
            background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
            display: flex;
            align-items: center;
            padding: 0 40px;
            box-sizing: border-box;
          ">
            <!-- TEDx Logo -->
            <div style="
              display: flex;
              align-items: center;
              gap: 20px;
            ">
              <div style="
                width: 80px;
                height: 80px;
                background: white;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
              ">
                <div style="
                  font-size: 24px;
                  font-weight: bold;
                  color: #dc2626;
                ">TEDx</div>
              </div>
              <div>
                <div style="
                  font-size: 42px;
                  font-weight: 900;
                  color: white;
                  letter-spacing: -1px;
                  margin-bottom: -5px;
                ">TED<span style="color: white;">x</span><span style="color: #fbbf24;">ECU</span></div>
                <div style="
                  font-size: 14px;
                  color: rgba(255, 255, 255, 0.9);
                  font-weight: 500;
                  letter-spacing: 1px;
                ">x = independently organized TED event</div>
              </div>
            </div>
            
            <!-- Event Theme -->
            <div style="
              margin-left: auto;
              text-align: right;
            ">
              <div style="
                font-size: 18px;
                color: white;
                font-weight: 600;
                margin-bottom: 5px;
              ">2025</div>
              <div style="
                font-size: 14px;
                color: rgba(255, 255, 255, 0.8);
                font-style: italic;
              ">Yin & Yang: Finding Balance</div>
            </div>
          </div>
          
          <!-- Main Content Area -->
          <div style="
            position: absolute;
            top: 140px;
            left: 40px;
            right: 40px;
            bottom: 40px;
            display: flex;
            gap: 40px;
          ">
            <!-- Left Section - Attendee Info -->
            <div style="
              flex: 1;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 16px;
              padding: 30px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
            ">
              <div style="
                font-size: 16px;
                color: #ef4444;
                font-weight: 600;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">Attendee Information</div>
              
              <div style="margin-bottom: 20px;">
                <div style="
                  font-size: 12px;
                  color: #94a3b8;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Full Name</div>
                <div style="
                  font-size: 24px;
                  color: #ffffff;
                  font-weight: 700;
                  line-height: 1.2;
                ">${name}</div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <div style="
                  font-size: 12px;
                  color: #94a3b8;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">University</div>
                <div style="
                  font-size: 16px;
                  color: #e2e8f0;
                  font-weight: 500;
                ">${university}</div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <div style="
                  font-size: 12px;
                  color: #94a3b8;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Email</div>
                <div style="
                  font-size: 14px;
                  color: #cbd5e1;
                  font-weight: 400;
                ">${email}</div>
              </div>
              
              <!-- Ticket ID Highlight -->
              <div style="
                background: linear-gradient(135deg, #ef4444, #dc2626);
                border-radius: 12px;
                padding: 15px;
                margin-top: 20px;
              ">
                <div style="
                  font-size: 12px;
                  color: rgba(255, 255, 255, 0.8);
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Ticket ID</div>
                <div style="
                  font-size: 28px;
                  color: white;
                  font-weight: 900;
                  font-family: 'Courier New', monospace;
                  letter-spacing: 2px;
                ">${ticketId}</div>
              </div>
            </div>
            
            <!-- Right Section - Event Details & Photo -->
            <div style="
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 20px;
            ">
              <!-- Personal Photo Section -->
              ${
                personalPhotoUrl
                  ? `
              <div style="
                background: rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                text-align: center;
              ">
                <div style="
                  font-size: 14px;
                  color: #ef4444;
                  font-weight: 600;
                  margin-bottom: 15px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                ">Attendee Photo</div>
                <img src="${personalPhotoUrl}" 
                     style="width: 120px; height: 150px; border-radius: 12px; object-fit: cover; border: 3px solid #ef4444;" 
                     alt="Attendee Photo" />
              </div>
              `
                  : ""
              }
              
              <!-- Event Details -->
              <div style="
                background: rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 25px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                flex: 1;
              ">
                <div style="
                  font-size: 16px;
                  color: #ef4444;
                  font-weight: 600;
                  margin-bottom: 20px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                ">Event Details</div>
                
                <div style="display: flex; flex-direction: column; gap: 15px;">
                  <div>
                    <div style="
                      font-size: 12px;
                      color: #94a3b8;
                      margin-bottom: 5px;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    ">Date</div>
                    <div style="
                      font-size: 18px;
                      color: #ffffff;
                      font-weight: 600;
                    ">June 20, 2025</div>
                  </div>
                  
                  <div>
                    <div style="
                      font-size: 12px;
                      color: #94a3b8;
                      margin-bottom: 5px;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    ">Time</div>
                    <div style="
                      font-size: 18px;
                      color: #ffffff;
                      font-weight: 600;
                    ">9:00 AM - 6:00 PM</div>
                  </div>
                  
                  <div>
                    <div style="
                      font-size: 12px;
                      color: #94a3b8;
                      margin-bottom: 5px;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    ">Venue</div>
                    <div style="
                      font-size: 16px;
                      color: #e2e8f0;
                      font-weight: 500;
                      line-height: 1.3;
                    ">Egyptian Chinese University</div>
                  </div>
                  
                  <div>
                    <div style="
                      font-size: 12px;
                      color: #94a3b8;
                      margin-bottom: 5px;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    ">Admission</div>
                    <div style="
                      font-size: 16px;
                      color: #e2e8f0;
                      font-weight: 500;
                    ">General Admission</div>
                  </div>
                </div>
              </div>
              
              <!-- QR Code Section -->
              <div style="
                background: rgba(255, 255, 255, 0.95);
                border-radius: 16px;
                padding: 20px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
              ">
                <div style="
                  font-size: 12px;
                  color: #374151;
                  margin-bottom: 10px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  font-weight: 600;
                ">Scan for Entry</div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=000000" 
                     style="width: 120px; height: 120px; border-radius: 8px;" 
                     alt="QR Code" />
                <div style="
                  font-size: 10px;
                  color: #6b7280;
                  margin-top: 8px;
                  font-weight: 500;
                ">Contains ticket verification data</div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="
            position: absolute;
            bottom: 10px;
            left: 40px;
            right: 40px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
          ">
            This ticket is valid for one person only • Present this ticket and a valid ID at the venue
          </div>
        </div>
      </div>
      <div class="actions no-print">
        <button onclick="window.print()" class="button">Print Ticket</button>
        <a href="/admin" class="button outline">Back to Admin</a>
      </div>
    </body>
    </html>
  `
}
