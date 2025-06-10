import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticketId = params.id

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Get registration details by ticket ID
    const { data: registration, error: fetchError } = await supabase
      .from("registrations")
      .select("*")
      .eq("ticket_id", ticketId)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    if (registration.payment_status !== "confirmed") {
      return NextResponse.json({ error: "Ticket is not valid" }, { status: 400 })
    }

    // Generate ticket HTML
    const ticketHtml = generateTicketHtml({
      name: registration.name,
      ticketId: registration.ticket_id,
      date: "20/6",
      seat: "G-SEC",
    })

    // Return HTML page with the ticket
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TEDxECU Ticket - ${registration.name}</title>
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
          }
          .ticket-container > div {
            max-width: 100%;
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
          ${ticketHtml}
        </div>
        <div class="actions no-print">
          <button onclick="window.print()" class="button">Print Ticket</button>
          <a href="/" class="button outline">Back to Home</a>
        </div>
      </body>
      </html>
      `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      },
    )
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateTicketHtml({
  name,
  ticketId,
  date,
  seat,
}: {
  name: string
  ticketId: string
  date: string
  seat: string
}) {
  return `
    <div style="
      width: 800px;
      height: 400px;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      position: relative;
      font-family: 'Arial', sans-serif;
      color: #f5f5f5;
      overflow: hidden;
      border-radius: 12px;
    ">
      <!-- Background building image overlay -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 800 400\"><rect width=\"800\" height=\"400\" fill=\"%23000\"/><rect x=\"400\" y=\"150\" width=\"200\" height=\"300\" fill=\"%23333\" opacity=\"0.3\"/><rect x=\"450\" y=\"100\" width=\"100\" height=\"350\" fill=\"%23444\" opacity=\"0.2\"/></svg>');
        background-size: cover;
        background-position: center;
        opacity: 0.6;
      "></div>
      
      <!-- Red lanterns -->
      <div style="
        position: absolute;
        top: 20px;
        left: 30px;
        width: 40px;
        height: 60px;
        background: #dc2626;
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        opacity: 0.8;
      "></div>
      <div style="
        position: absolute;
        top: 60px;
        left: 10px;
        width: 30px;
        height: 45px;
        background: #dc2626;
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        opacity: 0.6;
      "></div>
      
      <!-- TEDxECU Logo -->
      <div style="
        position: absolute;
        top: 40px;
        left: 100px;
        z-index: 10;
      ">
        <div style="
          font-size: 48px;
          font-weight: bold;
          color: #dc2626;
          margin-bottom: 5px;
        ">
          TED<span style="color: #dc2626;">x</span><span style="color: #f5c842;">ECU</span>
        </div>
        <div style="
          font-size: 14px;
          color: #cccccc;
          margin-top: -5px;
        ">
          x = independently organized TED event
        </div>
      </div>
      
      <!-- Ticket Information -->
      <div style="
        position: absolute;
        top: 150px;
        left: 100px;
        z-index: 10;
      ">
        <div style="margin-bottom: 20px;">
          <div style="
            font-size: 18px;
            color: #f5c842;
            margin-bottom: 5px;
            font-weight: 500;
          ">Name:</div>
          <div style="
            font-size: 24px;
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">${name}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="
            font-size: 18px;
            color: #f5c842;
            margin-bottom: 5px;
            font-weight: 500;
          ">Ticket id:</div>
          <div style="
            font-size: 32px;
            color: #dc2626;
            font-weight: bold;
            font-family: 'Courier New', monospace;
          ">${ticketId}</div>
        </div>
        
        <div style="display: flex; gap: 80px;">
          <div>
            <div style="
              font-size: 18px;
              color: #f5c842;
              margin-bottom: 5px;
              font-weight: 500;
            ">Date</div>
            <div style="
              font-size: 28px;
              color: #ffffff;
              font-weight: bold;
            ">${date}</div>
          </div>
          
          <div>
            <div style="
              font-size: 18px;
              color: #f5c842;
              margin-bottom: 5px;
              font-weight: 500;
            ">Seat</div>
            <div style="
              font-size: 28px;
              color: #ffffff;
              font-weight: bold;
            ">${seat}</div>
          </div>
        </div>
      </div>
      
      <!-- QR Code -->
      <div style="
        position: absolute;
        bottom: 40px;
        left: 100px;
        width: 120px;
        height: 120px;
        background: white;
        padding: 10px;
        border-radius: 8px;
      ">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${ticketId}&bgcolor=ffffff&color=000000" 
             style="width: 100%; height: 100%; object-fit: contain;" 
             alt="QR Code" />
      </div>
      
      <!-- Large Red X -->
      <div style="
        position: absolute;
        right: 50px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 300px;
        font-weight: bold;
        color: #dc2626;
        opacity: 0.9;
        z-index: 5;
        font-family: Arial, sans-serif;
      ">X</div>
      
      <!-- Ideas worth spreading text -->
      <div style="
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%) rotate(90deg);
        font-size: 16px;
        color: #dc2626;
        font-weight: 500;
        letter-spacing: 2px;
        z-index: 10;
      ">ideas worth spreading</div>
    </div>
  `
}
