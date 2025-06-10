import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { ids, confirmationText } = await request.json()

    // Safety check
    if (confirmationText !== "DELETE ALL TEST DATA") {
      return NextResponse.json(
        {
          error: "Invalid confirmation text. Please type 'DELETE ALL TEST DATA' to confirm.",
        },
        { status: 400 },
      )
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs array is required" }, { status: 400 })
    }

    console.log(`Attempting to delete ${ids.length} registrations`)

    let successCount = 0
    let errorCount = 0
    const errors = []

    // Delete in batches of 10 to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)

      try {
        const { error: deleteError, count } = await supabase.from("registrations").delete().in("id", batch)

        if (deleteError) {
          console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1}:`, deleteError)
          errorCount += batch.length
          errors.push({
            batch: Math.floor(i / batchSize) + 1,
            error: deleteError.message,
            ids: batch,
          })
        } else {
          successCount += count || 0
          console.log(`Successfully deleted batch ${Math.floor(i / batchSize) + 1}: ${count} records`)
        }
      } catch (err) {
        console.error(`Exception in batch ${Math.floor(i / batchSize) + 1}:`, err)
        errorCount += batch.length
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: String(err),
          ids: batch,
        })
      }

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      message: `Bulk delete completed`,
      summary: {
        totalAttempted: ids.length,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

// DELETE method to delete all test data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirmationText = searchParams.get("confirm")

    // Safety check
    if (confirmationText !== "DELETE_ALL_TEST_DATA") {
      return NextResponse.json(
        {
          error: "Invalid confirmation. Add ?confirm=DELETE_ALL_TEST_DATA to the URL",
        },
        { status: 400 },
      )
    }

    console.log("Deleting all test data...")

    // Delete all registrations with test-like names or emails
    const { error: deleteError, count } = await supabase
      .from("registrations")
      .delete()
      .or("name.ilike.%test%,email.ilike.%example.com%,university.ilike.%Test%")

    if (deleteError) {
      console.error("Error deleting test data:", deleteError)
      return NextResponse.json(
        {
          error: "Failed to delete test data",
          details: deleteError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${count} test records`,
      deletedCount: count,
    })
  } catch (error) {
    console.error("Delete all test data error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
