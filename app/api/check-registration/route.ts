import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const { data: registration, error } = await supabase
      .from("registrations")
      .select("id, name, email, payment_status, ticket_id, created_at")
      .eq("email", email)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (!registration) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({
      exists: true,
      registration: {
        name: registration.name,
        email: registration.email,
        status: registration.payment_status,
        ticketId: registration.ticket_id,
        registeredAt: registration.created_at,
      },
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
