import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    console.log(`Attempting to delete registration with ID: ${id}`)

    // First, get the registration to check if there are files to delete
    const { data: registration, error: fetchError } = await supabase
      .from("registrations")
      .select("id, payment_proof_url, personal_photo_url, name, email")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching registration:", fetchError)

      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Registration not found - it may have already been deleted" },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          error: "Failed to fetch registration",
          details: fetchError.message,
          code: fetchError.code,
        },
        { status: 500 },
      )
    }

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    console.log(`Found registration for: ${registration.name} (${registration.email})`)

    // Try to delete files if they exist
    const fileDeleteResults = []

    // Delete payment proof file
    if (registration.payment_proof_url) {
      try {
        const url = new URL(registration.payment_proof_url)
        const pathParts = url.pathname.split("/")
        const filename = pathParts[pathParts.length - 1]

        if (filename && filename !== "payment-proofs") {
          const { error: deleteFileError } = await supabase.storage.from("payment-proofs").remove([filename])

          if (deleteFileError) {
            console.error("Error deleting payment proof:", deleteFileError)
            fileDeleteResults.push({ file: "payment_proof", success: false, error: deleteFileError.message })
          } else {
            fileDeleteResults.push({ file: "payment_proof", success: true })
          }
        }
      } catch (fileError) {
        console.error("Error processing payment proof deletion:", fileError)
        fileDeleteResults.push({ file: "payment_proof", success: false, error: String(fileError) })
      }
    }

    // Delete personal photo file
    if (registration.personal_photo_url) {
      try {
        const url = new URL(registration.personal_photo_url)
        const pathParts = url.pathname.split("/")
        const filename = pathParts[pathParts.length - 1]

        if (filename && filename !== "personal-photos") {
          const { error: deleteFileError } = await supabase.storage.from("personal-photos").remove([filename])

          if (deleteFileError) {
            console.error("Error deleting personal photo:", deleteFileError)
            fileDeleteResults.push({ file: "personal_photo", success: false, error: deleteFileError.message })
          } else {
            fileDeleteResults.push({ file: "personal_photo", success: true })
          }
        }
      } catch (fileError) {
        console.error("Error processing personal photo deletion:", fileError)
        fileDeleteResults.push({ file: "personal_photo", success: false, error: String(fileError) })
      }
    }

    // Delete the registration record
    console.log("Attempting to delete registration record...")

    const { error: deleteError, count } = await supabase.from("registrations").delete().eq("id", id)

    if (deleteError) {
      console.error("Database delete error:", deleteError)
      return NextResponse.json(
        {
          error: "Failed to delete registration",
          details: deleteError.message,
          code: deleteError.code,
          hint: deleteError.hint,
          fileDeleteResults,
        },
        { status: 500 },
      )
    }

    console.log(`Delete operation completed. Affected rows: ${count}`)

    if (count === 0) {
      return NextResponse.json(
        {
          error: "No registration was deleted - record may not exist",
          fileDeleteResults,
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Registration deleted successfully",
      deletedRecord: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
      },
      fileDeleteResults,
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return DELETE(request)
}
