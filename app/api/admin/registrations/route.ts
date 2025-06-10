import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    console.log("🔍 Checking database connection...")

    // First, let's check if we can connect to Supabase
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Missing Supabase environment variables")
      return NextResponse.json(
        {
          error: "Database configuration error",
          details: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
          setup_required: true,
        },
        { status: 500 },
      )
    }

    console.log("✅ Environment variables found")
    console.log("🔍 Attempting to fetch registrations...")

    // Try to fetch registrations with all fields including personal_photo_url
    const { data, error, count } = await supabase
      .from("registrations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Database error:", error)

      // Check if it's a table not found error
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Database table not found",
            details: "The 'registrations' table does not exist. Please run the database setup script.",
            setup_required: true,
            sql_script: "Run the script in scripts/00-setup-database.sql in your Supabase SQL Editor",
            supabase_url: process.env.SUPABASE_URL?.replace(/\/.*/, "") + "/project/*/sql", // Remove sensitive parts
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          error: "Database query failed",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    // Ensure we always return an array
    const registrations = Array.isArray(data) ? data : []

    console.log(`✅ Successfully fetched ${registrations.length} registrations (total count: ${count})`)

    return NextResponse.json(registrations)
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
        setup_required: true,
      },
      { status: 500 },
    )
  }
}
