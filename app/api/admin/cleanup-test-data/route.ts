import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST() {
  try {
    console.log("🧹 Starting cleanup of test data...")

    // Delete all registrations with test-like characteristics
    const { error: deleteError, count } = await supabase
      .from("registrations")
      .delete()
      .or(
        "email.ilike.%test.com%," +
          "email.ilike.%example.com%," +
          "name.ilike.%Test%," +
          "university.ilike.%Test%," +
          "payment_proof_url.ilike.%example.com%",
      )

    if (deleteError) {
      console.error("Error cleaning up test data:", deleteError)
      return NextResponse.json(
        {
          error: "Failed to cleanup test data",
          details: deleteError.message,
        },
        { status: 500 },
      )
    }

    console.log(`✅ Cleaned up ${count} test records`)

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${count} test records`,
      deletedCount: count,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      {
        error: "Internal server error during cleanup",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
