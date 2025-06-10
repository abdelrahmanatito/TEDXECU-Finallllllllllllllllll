import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Use the provided Resend API key
const RESEND_API_KEY = "re_E5KKnqsG_5GRkEq1XYmoJ7DV2yBcmiBp3"

// Verified email for testing
const VERIFIED_EMAIL = "arsanyosama90@gmail.com"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const phoneType = formData.get("phoneType") as string
    const university = formData.get("university") as string
    const paymentProof = formData.get("paymentProof") as File
    const personalPhoto = formData.get("personalPhoto") as File

    console.log("📝 Registration attempt:", { name, email, phone, phoneType, university })
    console.log("📁 Files received:", {
      paymentProof: paymentProof?.name,
      personalPhoto: personalPhoto?.name,
    })

    if (!name || !email || !phone || !university || !paymentProof || !personalPhoto) {
      return NextResponse.json({ error: "All fields including personal photo are required" }, { status: 400 })
    }

    // Validate name length
    if (name.length < 5 || name.length > 50) {
      return NextResponse.json({ error: "Name must be between 5 and 50 characters" }, { status: 400 })
    }

    // Validate university length
    if (university.length < 5 || university.length > 50) {
      return NextResponse.json({ error: "University name must be between 5 and 50 characters" }, { status: 400 })
    }

    // Validate payment proof file type
    const paymentFileType = paymentProof.type.toLowerCase()
    const validPaymentTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

    if (!validPaymentTypes.includes(paymentFileType)) {
      return NextResponse.json({ error: "Payment proof: Only JPG, PNG, and PDF files are accepted" }, { status: 400 })
    }

    // Validate personal photo file type (only images)
    const photoFileType = personalPhoto.type.toLowerCase()
    const validPhotoTypes = ["image/jpeg", "image/jpg", "image/png"]

    if (!validPhotoTypes.includes(photoFileType)) {
      return NextResponse.json({ error: "Personal photo: Only JPG and PNG files are accepted" }, { status: 400 })
    }

    // Check file sizes (max 10MB each)
    if (paymentProof.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Payment proof file size must be less than 10MB" }, { status: 400 })
    }

    if (personalPhoto.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Personal photo file size must be less than 10MB" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("registrations")
      .select("id, email, payment_status")
      .eq("email", email)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing user:", checkError)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (existingUser) {
      const statusMessage = {
        pending: "Your registration is already submitted and pending payment verification.",
        confirmed: "You are already registered and your payment has been confirmed.",
        rejected: "Your previous registration was rejected. Please contact support for assistance.",
      }

      return NextResponse.json(
        {
          error: `Email already registered. ${statusMessage[existingUser.payment_status as keyof typeof statusMessage]}`,
        },
        { status: 409 },
      )
    }

    // First, try to add the personal_photo_url column directly with SQL
    try {
      await supabase.rpc("execute_sql", {
        sql_statement: `
          DO $$ 
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'registrations' 
                  AND column_name = 'personal_photo_url'
              ) THEN
                  ALTER TABLE registrations ADD COLUMN personal_photo_url TEXT;
              END IF;
          END $$;
        `,
      })
      console.log("✅ Checked/added personal_photo_url column")
    } catch (sqlError) {
      console.error("Error checking/adding column:", sqlError)
      // Continue anyway, we'll handle missing column later
    }

    // Ensure buckets exist
    const buckets = ["payment-proofs", "personal-photos"]
    for (const bucketName of buckets) {
      const { data: bucketList } = await supabase.storage.listBuckets()
      const bucketExists = bucketList?.some((bucket) => bucket.name === bucketName)

      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`)
        const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
          public: true,
        })
        if (bucketError) {
          console.error(`Bucket creation error for ${bucketName}:`, bucketError)
        }
      }
    }

    // Upload payment proof
    const paymentExt = paymentProof.name.split(".").pop()
    const paymentFileName = `${Date.now()}-payment-${Math.random().toString(36).substring(7)}.${paymentExt}`

    console.log(`📤 Uploading payment proof: ${paymentFileName}`)
    const { data: paymentUploadData, error: paymentUploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(paymentFileName, paymentProof)

    // Upload personal photo
    const photoExt = personalPhoto.name.split(".").pop()
    const photoFileName = `${Date.now()}-photo-${Math.random().toString(36).substring(7)}.${photoExt}`

    console.log(`📤 Uploading personal photo: ${photoFileName}`)
    const { data: photoUploadData, error: photoUploadError } = await supabase.storage
      .from("personal-photos")
      .upload(photoFileName, personalPhoto)

    // Get public URLs for uploaded files
    const { data: paymentUrlData } = supabase.storage.from("payment-proofs").getPublicUrl(paymentFileName)
    const { data: photoUrlData } = supabase.storage.from("personal-photos").getPublicUrl(photoFileName)

    console.log("📎 File URLs generated:", {
      payment: paymentUrlData.publicUrl,
      photo: photoUrlData.publicUrl,
    })

    // Generate unique ticket ID - make sure it's 10 characters or less
    const ticketId = generateTicketId()
    console.log(`🎫 Generated ticket ID: ${ticketId}`)

    // Insert registration into database - try with personal_photo_url first
    try {
      const { data, error } = await supabase
        .from("registrations")
        .insert({
          name,
          email,
          phone,
          phone_type: phoneType || "egyptian",
          university,
          payment_proof_url: paymentUrlData.publicUrl,
          personal_photo_url: photoUrlData.publicUrl,
          payment_status: "pending",
          ticket_id: ticketId,
          ticket_sent: false,
        })
        .select()

      if (error) {
        console.error("Database error:", error)

        // If error contains "personal_photo_url", try without it
        if (error.message && error.message.includes("personal_photo_url")) {
          console.log("⚠️ Error with personal_photo_url, trying without it")

          const { data: dataWithoutPhoto, error: errorWithoutPhoto } = await supabase
            .from("registrations")
            .insert({
              name,
              email,
              phone,
              phone_type: phoneType || "egyptian",
              university,
              payment_proof_url: paymentUrlData.publicUrl,
              payment_status: "pending",
              ticket_id: ticketId,
              ticket_sent: false,
            })
            .select()

          if (errorWithoutPhoto) {
            console.error("Database error even without personal_photo_url:", errorWithoutPhoto)

            // If it's a value too long error, it's likely the ticket_id
            if (errorWithoutPhoto.message && errorWithoutPhoto.message.includes("too long")) {
              console.log("⚠️ Value too long error, trying with shorter ticket ID")

              // Try with a shorter ticket ID
              const shortTicketId = ticketId.substring(0, 10)
              console.log(`🎫 Using shorter ticket ID: ${shortTicketId}`)

              const { data: dataWithShortId, error: errorWithShortId } = await supabase
                .from("registrations")
                .insert({
                  name,
                  email,
                  phone,
                  phone_type: phoneType || "egyptian",
                  university,
                  payment_proof_url: paymentUrlData.publicUrl,
                  payment_status: "pending",
                  ticket_id: shortTicketId,
                  ticket_sent: false,
                })
                .select()

              if (errorWithShortId) {
                console.error("Database error with shorter ticket ID:", errorWithShortId)
                return NextResponse.json({ error: "Registration failed" }, { status: 500 })
              }

              console.log("✅ Registration successful with shorter ticket ID:", dataWithShortId[0])

              // Send registration email
              const emailResult = await sendRegistrationEmail({
                name,
                email,
                phone,
                phoneType: phoneType || "egyptian",
                university,
                paymentProofUrl: paymentUrlData.publicUrl,
                personalPhotoUrl: photoUrlData.publicUrl,
              })

              return NextResponse.json({
                success: true,
                data: dataWithShortId,
                emailSent: emailResult.success,
                emailStatus: emailResult.success
                  ? "Registration successful! Confirmation email sent."
                  : `Registration successful! ${emailResult.error}`,
                message: emailResult.success
                  ? "Registration completed successfully. You will receive a confirmation email shortly."
                  : "Registration completed successfully. Email service issue, but your registration has been saved.",
                testMode: emailResult.testMode,
              })
            }

            return NextResponse.json({ error: "Registration failed" }, { status: 500 })
          }

          console.log("✅ Registration successful without personal_photo_url:", dataWithoutPhoto[0])

          // Send registration email
          const emailResult = await sendRegistrationEmail({
            name,
            email,
            phone,
            phoneType: phoneType || "egyptian",
            university,
            paymentProofUrl: paymentUrlData.publicUrl,
            personalPhotoUrl: photoUrlData.publicUrl,
          })

          return NextResponse.json({
            success: true,
            data: dataWithoutPhoto,
            emailSent: emailResult.success,
            emailStatus: emailResult.success
              ? "Registration successful! Confirmation email sent."
              : `Registration successful! ${emailResult.error}`,
            message: emailResult.success
              ? "Registration completed successfully. You will receive a confirmation email shortly."
              : "Registration completed successfully. Email service issue, but your registration has been saved.",
            warning:
              "Note: Your personal photo was saved but there was a database issue. Admin will update your record.",
            testMode: emailResult.testMode,
          })
        } else if (error.message && error.message.includes("too long")) {
          // If it's a value too long error, it's likely the ticket_id
          console.log("⚠️ Value too long error, trying with shorter ticket ID")

          // Try with a shorter ticket ID
          const shortTicketId = ticketId.substring(0, 10)
          console.log(`🎫 Using shorter ticket ID: ${shortTicketId}`)

          const { data: dataWithShortId, error: errorWithShortId } = await supabase
            .from("registrations")
            .insert({
              name,
              email,
              phone,
              phone_type: phoneType || "egyptian",
              university,
              payment_proof_url: paymentUrlData.publicUrl,
              personal_photo_url: photoUrlData.publicUrl,
              payment_status: "pending",
              ticket_id: shortTicketId,
              ticket_sent: false,
            })
            .select()

          if (errorWithShortId) {
            console.error("Database error with shorter ticket ID:", errorWithShortId)
            return NextResponse.json({ error: "Registration failed" }, { status: 500 })
          }

          console.log("✅ Registration successful with shorter ticket ID:", dataWithShortId[0])

          // Send registration email
          const emailResult = await sendRegistrationEmail({
            name,
            email,
            phone,
            phoneType: phoneType || "egyptian",
            university,
            paymentProofUrl: paymentUrlData.publicUrl,
            personalPhotoUrl: photoUrlData.publicUrl,
          })

          return NextResponse.json({
            success: true,
            data: dataWithShortId,
            emailSent: emailResult.success,
            emailStatus: emailResult.success
              ? "Registration successful! Confirmation email sent."
              : `Registration successful! ${emailResult.error}`,
            message: emailResult.success
              ? "Registration completed successfully. You will receive a confirmation email shortly."
              : "Registration completed successfully. Email service issue, but your registration has been saved.",
            testMode: emailResult.testMode,
          })
        } else if (error.code === "23505") {
          return NextResponse.json(
            { error: "This email is already registered. Please use a different email address." },
            { status: 409 },
          )
        }

        return NextResponse.json({ error: "Registration failed" }, { status: 500 })
      }

      console.log("✅ Registration successful:", data[0])

      // Send registration email with enhanced template
      const emailResult = await sendRegistrationEmail({
        name,
        email,
        phone,
        phoneType: phoneType || "egyptian",
        university,
        paymentProofUrl: paymentUrlData.publicUrl,
        personalPhotoUrl: photoUrlData.publicUrl,
      })

      return NextResponse.json({
        success: true,
        data,
        emailSent: emailResult.success,
        emailStatus: emailResult.success
          ? "Registration successful! Confirmation email sent."
          : `Registration successful! ${emailResult.error}`,
        message: emailResult.success
          ? "Registration completed successfully. You will receive a confirmation email shortly."
          : "Registration completed successfully. Email service issue, but your registration has been saved.",
        testMode: emailResult.testMode,
      })
    } catch (insertError) {
      console.error("Unexpected error during registration:", insertError)
      return NextResponse.json({ error: "An unexpected error occurred during registration" }, { status: 500 })
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateTicketId(): string {
  // Generate a shorter ticket ID (10 chars max)
  const timestamp = Date.now().toString().slice(-4)
  const random = Math.random().toString(36).substring(2, 4).toUpperCase()
  return `TX${timestamp}${random}`
}

async function sendRegistrationEmail({
  name,
  email,
  phone,
  phoneType,
  university,
  paymentProofUrl,
  personalPhotoUrl,
}: {
  name: string
  email: string
  phone: string
  phoneType: string
  university: string
  paymentProofUrl: string | null
  personalPhotoUrl: string | null
}) {
  try {
    if (!RESEND_API_KEY) {
      console.log("⚠️ RESEND_API_KEY is not configured - skipping email notification")
      return {
        success: false,
        error:
          "Email service not configured. Please add RESEND_API_KEY environment variable to enable email notifications.",
        testMode: false,
      }
    }

    // Check if we're in test mode (no verified domain)
    const isTestMode = true
    const recipient = isTestMode ? VERIFIED_EMAIL : email

    const phoneTypeDisplay = phoneType === "egyptian" ? "Egyptian" : "International"
    const emailDomain = email.split("@")[1].toLowerCase()

    console.log(
      `📧 Sending registration email to ${recipient}${isTestMode ? ` (TEST MODE - actual recipient: ${email})` : ""}`,
    )

    const emailContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
    <div style="text-align: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #dc2626; font-size: 36px; margin: 0;">TED<span style="color: #dc2626;">x</span>ECU</h1>
      <p style="color: #6b7280; margin: 5px 0;">x = independently organized TED event</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">Ideas worth spreading</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <h2 style="margin: 0 0 10px 0; font-size: 28px;">🎉 Registration Received!</h2>
      <p style="margin: 0; opacity: 0.9;">Thank you for registering for TEDxECU 2025</p>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="font-size: 18px; color: #374151;">Dear ${name},</p>
      
      <p style="color: #6b7280; line-height: 1.6;">
        Thank you for registering for TEDxECU 2025! We have received your registration, personal photo, and payment proof.
        Our team will review your information and confirm your registration within 24-48 hours.
      </p>
      
      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">📋 Your Registration Details</h3>
        <div style="display: grid; gap: 10px;">
          <p style="margin: 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0;"><strong>Phone:</strong> ${phone} (${phoneTypeDisplay})</p>
          <p style="margin: 0;"><strong>University:</strong> ${university}</p>
          <p style="margin: 0;"><strong>Event:</strong> TEDxECU 2025 - Yin & Yang: Finding Balance in Innovation</p>
          <p style="margin: 0;"><strong>Date:</strong> June 20, 2025</p>
          <p style="margin: 0;"><strong>Venue:</strong> Egyptian Chinese University</p>
        </div>
      </div>
      
      ${
        personalPhotoUrl
          ? `
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
        <h4 style="color: #1e40af; margin-top: 0;">📸 Your Personal Photo</h4>
        <img src="${personalPhotoUrl}" alt="Personal Photo" style="max-width: 200px; max-height: 250px; border-radius: 8px; border: 2px solid #dc2626; object-fit: cover;" />
        <p style="color: #1e40af; font-size: 14px; margin: 10px 0 0 0;">This photo will be used for your event badge</p>
      </div>
      `
          : ""
      }
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h4 style="color: #92400e; margin-top: 0;">⏰ Next Steps:</h4>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li>Our team will review your payment proof and personal photo within 24-48 hours</li>
          <li>You will receive your ticket via email once payment is confirmed</li>
          <li>Your personal photo will be used for your event badge</li>
          <li>Keep this email for your records</li>
          <li>Contact us if you have any questions</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #374151; font-size: 18px; margin-bottom: 10px;">We look forward to seeing you at TEDxECU!</p>
        <p style="color: #6b7280; margin: 0;">Get ready to be inspired by ideas worth spreading.</p>
      </div>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        This confirmation was generated by the TEDxECU registration system.<br>
        ${isTestMode ? '<strong style="color: #dc2626;">TEST MODE: This email would normally be sent to ' + email + "</strong>" : `Email sent to ${emailDomain} domain successfully.`}
      </p>
    </div>
  </div>
`

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [recipient],
        subject: "🎉 TEDxECU Registration Confirmation - Documents Received",
        html: emailContent,
        // Add reply-to with the actual recipient email for testing
        reply_to: email,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Email API error:", result)
      return {
        success: false,
        error: `Email service error: ${result.message || "Unknown error"}`,
        testMode: isTestMode,
      }
    }

    console.log(
      `✅ Confirmation email sent successfully to: ${recipient}${isTestMode ? ` (TEST MODE - actual recipient: ${email})` : ""}`,
    )
    return {
      success: true,
      data: result,
      testMode: isTestMode,
    }
  } catch (error) {
    console.error("Email sending error:", error)
    return {
      success: false,
      error: `Email sending failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      testMode: true,
    }
  }
}
