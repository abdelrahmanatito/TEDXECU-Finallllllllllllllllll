import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Step 1: Test database connection
    console.log("Testing database connection...")
    const { data: dbTest, error: dbError } = await supabase
      .from("registrations")
      .select("count", { count: "exact", head: true })

    if (dbError) {
      return NextResponse.json(
        {
          success: false,
          component: "Database",
          error: dbError.message,
          details: dbError,
        },
        { status: 500 },
      )
    }

    // Step 2: Test storage
    console.log("Testing storage...")
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()

    if (storageError) {
      return NextResponse.json(
        {
          success: false,
          component: "Storage",
          error: storageError.message,
          details: storageError,
        },
        { status: 500 },
      )
    }

    const paymentProofsBucket = buckets?.find((b) => b.name === "payment-proofs")

    // Step 3: Test admin functions
    console.log("Testing admin functions...")
    let adminFunctionsWorking = true
    let adminFunctionsError = null

    try {
      const { data: statsResult, error: statsError } = await supabase.rpc("get_registration_stats")

      if (statsError) {
        adminFunctionsWorking = false
        adminFunctionsError = statsError
      }
    } catch (error) {
      adminFunctionsWorking = false
      adminFunctionsError = error
    }

    // Step 4: Test email service
    console.log("Testing email service...")
    let emailServiceWorking = true
    let emailServiceError = null
    let emailServiceDetails = null

    try {
      if (!process.env.RESEND_API_KEY) {
        emailServiceWorking = false
        emailServiceError = "RESEND_API_KEY is not configured"
      } else {
        // Just check if the API key is valid format (starts with re_)
        if (!process.env.RESEND_API_KEY.startsWith("re_")) {
          emailServiceWorking = false
          emailServiceError = "RESEND_API_KEY appears to be invalid format"
        } else {
          emailServiceDetails = {
            keyConfigured: true,
            keyFormat: "Valid (starts with re_)",
            keyLength: process.env.RESEND_API_KEY.length,
          }
        }
      }
    } catch (error) {
      emailServiceWorking = false
      emailServiceError = error
    }

    // Return comprehensive system status
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      systemStatus: {
        database: {
          connected: true,
          registrationsTable: true,
          count: dbTest?.count || 0,
        },
        storage: {
          connected: true,
          paymentProofsBucket: !!paymentProofsBucket,
          buckets: buckets?.map((b) => b.name) || [],
        },
        adminFunctions: {
          working: adminFunctionsWorking,
          error: adminFunctionsError,
        },
        emailService: {
          working: emailServiceWorking,
          error: emailServiceError,
          details: emailServiceDetails,
        },
        environment: {
          supabaseConfigured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          resendConfigured: !!process.env.RESEND_API_KEY,
          nodeEnv: process.env.NODE_ENV,
        },
      },
    })
  } catch (error) {
    console.error("System test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "System test failed",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
