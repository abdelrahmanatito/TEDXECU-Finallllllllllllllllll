import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, university } = await request.json()

    // Validate inputs
    if (!name || !email || !phone || !university) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("registrations")
      .select("id, email, payment_status")
      .eq("email", email)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is what we want
      return NextResponse.json(
        {
          success: false,
          error: "Database error occurred",
          details: checkError,
        },
        { status: 500 },
      )
    }

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered",
          details: {
            id: existingUser.id,
            status: existingUser.payment_status,
          },
        },
        { status: 409 },
      )
    }

    // Create test registration with correct column name and personal photo
    const { data, error } = await supabase
      .from("registrations")
      .insert({
        name,
        email,
        phone,
        phone_type: "egyptian", // Use phone_type (underscore) to match database column
        university,
        payment_proof_url: "https://via.placeholder.com/400x600/dc2626/ffffff?text=Payment+Proof",
        personal_photo_url: `https://via.placeholder.com/300x400/1e40af/ffffff?text=${encodeURIComponent(name.charAt(0))}`,
        payment_status: "pending",
      })
      .select()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration failed",
          details: error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Test registration created successfully",
      data,
    })
  } catch (error) {
    console.error("Test registration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
