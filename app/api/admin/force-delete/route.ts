import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { id, force } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    if (!force) {
      return NextResponse.json({ error: "Force parameter required for safety" }, { status: 400 })
    }

    console.log(`🔥 FORCE DELETE: Attempting to delete registration ID: ${id}`)

    // Method 1: Try direct delete with service role
    try {
      const { data: beforeDelete, error: fetchError } = await supabase
        .from("registrations")
        .select("id, name, email")
        .eq("id", id)
        .single()

      if (fetchError) {
        console.log("❌ Record not found or fetch error:", fetchError.message)
        return NextResponse.json({ error: "Record not found", details: fetchError.message }, { status: 404 })
      }

      console.log(`📋 Found record: ${beforeDelete.name} (${beforeDelete.email})`)

      // Try the delete
      const { error: deleteError, count } = await supabase.from("registrations").delete().eq("id", id)

      if (deleteError) {
        console.log("❌ Delete failed with error:", deleteError)

        // Method 2: Try with raw SQL if regular delete fails
        console.log("🔄 Trying raw SQL delete...")
        const { data: sqlResult, error: sqlError } = await supabase.rpc("force_delete_registration", { reg_id: id })

        if (sqlError) {
          console.log("❌ SQL delete also failed:", sqlError)
          return NextResponse.json(
            {
              error: "Both delete methods failed",
              regularDeleteError: deleteError.message,
              sqlDeleteError: sqlError.message,
              suggestions: [
                "Check if RLS policies are blocking the delete",
                "Verify service role has proper permissions",
                "Try running the SQL fix script again",
              ],
            },
            { status: 500 },
          )
        }

        console.log("✅ SQL delete succeeded!")
        return NextResponse.json({
          success: true,
          message: "Record deleted using SQL method",
          method: "sql",
          deletedRecord: beforeDelete,
        })
      }

      console.log(`✅ Regular delete succeeded! Affected rows: ${count}`)
      return NextResponse.json({
        success: true,
        message: "Record deleted successfully",
        method: "regular",
        deletedRecord: beforeDelete,
        affectedRows: count,
      })
    } catch (error) {
      console.log("❌ Exception during delete:", error)
      return NextResponse.json(
        {
          error: "Exception during delete operation",
          details: String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Force delete API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

// GET method to test connectivity
export async function GET() {
  try {
    // Test basic connectivity
    const { data, error } = await supabase.from("registrations").select("count", { count: "exact", head: true })

    if (error) {
      return NextResponse.json({
        status: "error",
        message: "Database connection failed",
        error: error.message,
        code: error.code,
      })
    }

    // Test permissions by trying to select a record
    const { data: testRecord, error: selectError } = await supabase
      .from("registrations")
      .select("id, name")
      .limit(1)
      .single()

    return NextResponse.json({
      status: "ok",
      message: "Force delete API is ready",
      canConnect: true,
      canSelect: !selectError,
      selectError: selectError?.message,
      sampleRecord: testRecord ? { id: testRecord.id, name: testRecord.name } : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "API test failed",
      error: String(error),
    })
  }
}
