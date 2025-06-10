import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Sample data for generating realistic test users
const firstNames = [
  "Ahmed",
  "Mohamed",
  "Omar",
  "Ali",
  "Hassan",
  "Mahmoud",
  "Youssef",
  "Khaled",
  "Amr",
  "Tamer",
  "Fatma",
  "Aisha",
  "Maryam",
  "Nour",
  "Sara",
  "Dina",
  "Rana",
  "Heba",
  "Yasmin",
  "Nada",
  "John",
  "David",
  "Michael",
  "James",
  "Robert",
  "William",
  "Richard",
  "Joseph",
  "Thomas",
  "Christopher",
  "Mary",
  "Patricia",
  "Jennifer",
  "Linda",
  "Elizabeth",
  "Barbara",
  "Susan",
  "Jessica",
  "Sarah",
  "Karen",
  "Alex",
  "Emma",
  "Olivia",
  "Sophia",
  "Isabella",
  "Mia",
  "Charlotte",
  "Amelia",
  "Harper",
  "Evelyn",
]

const lastNames = [
  "Ibrahim",
  "Hassan",
  "Mohamed",
  "Ali",
  "Mahmoud",
  "Ahmed",
  "Omar",
  "Youssef",
  "Khaled",
  "Amr",
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Wilson",
  "Anderson",
  "Taylor",
  "Thomas",
  "Hernandez",
  "Moore",
  "Martin",
  "Jackson",
  "Thompson",
  "White",
  "Lopez",
  "Lee",
  "Gonzalez",
  "Harris",
  "Clark",
  "Lewis",
  "Robinson",
  "Walker",
  "Perez",
  "Hall",
]

const universities = [
  "Cairo University",
  "American University in Cairo",
  "Ain Shams University",
  "Alexandria University",
  "Helwan University",
  "Mansoura University",
  "Assiut University",
  "Zagazig University",
  "Tanta University",
  "Suez Canal University",
  "Benha University",
  "Fayoum University",
  "Beni-Suef University",
  "Minia University",
  "South Valley University",
  "Egyptian Chinese University",
  "German University in Cairo",
  "British University in Egypt",
  "Future University in Egypt",
  "Modern Sciences and Arts University",
  "New Cairo Academy",
  "Misr International University",
  "October University for Modern Sciences and Arts",
  "Arab Academy for Science, Technology and Maritime Transport",
  "Nile University",
]

const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "student.edu.eg", "test.com"]
const paymentStatuses = ["pending", "confirmed", "rejected"]

function getRandomElement(array: any[]) {
  return array[Math.floor(Math.random() * array.length)]
}

function generateRandomPhone() {
  const prefixes = ["010", "011", "012", "015"]
  const prefix = getRandomElement(prefixes)
  const remaining = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0")
  return prefix + remaining
}

function generateUniqueEmail(firstName: string, lastName: string, index: number, usedEmails: Set<string>): string {
  const domain = getRandomElement(emailDomains)
  const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`

  // Try different variations to ensure uniqueness
  const variations = [
    `${baseEmail}@${domain}`,
    `${baseEmail}${index}@${domain}`,
    `${baseEmail}.${index}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${index}@${domain}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 10000)}@${domain}`,
    `test.user.${index}.${Math.floor(Math.random() * 1000)}@${domain}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}.${index}@${domain}`,
  ]

  for (const email of variations) {
    if (!usedEmails.has(email)) {
      usedEmails.add(email)
      return email
    }
  }

  // Fallback: use timestamp and random number
  const fallbackEmail = `user.${Date.now()}.${Math.floor(Math.random() * 100000)}.${index}@${domain}`
  usedEmails.add(fallbackEmail)
  return fallbackEmail
}

function generateTicketId() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export async function POST() {
  try {
    console.log("🚀 Starting to generate 500 test users...")

    // First, get existing emails to avoid duplicates
    console.log("🔍 Checking existing emails...")
    const { data: existingEmails, error: emailCheckError } = await supabase.from("registrations").select("email")

    if (emailCheckError) {
      console.error("Error checking existing emails:", emailCheckError)
      return NextResponse.json(
        { error: "Failed to check existing emails", details: emailCheckError.message },
        { status: 500 },
      )
    }

    const usedEmails = new Set<string>()

    // Add existing emails to the set
    if (existingEmails) {
      existingEmails.forEach((row: { email: string }) => {
        usedEmails.add(row.email.toLowerCase())
      })
    }

    console.log(`📧 Found ${usedEmails.size} existing emails`)

    const users = []
    const startDate = new Date("2024-01-01")
    const endDate = new Date()

    for (let i = 0; i < 500; i++) {
      const firstName = getRandomElement(firstNames)
      const lastName = getRandomElement(lastNames)
      const paymentStatus = getRandomElement(paymentStatuses)
      const createdAt = generateRandomDate(startDate, endDate)

      // Generate unique email
      const email = generateUniqueEmail(firstName, lastName, i, usedEmails)

      const user = {
        name: `${firstName} ${lastName}`,
        email: email,
        phone: generateRandomPhone(),
        phone_type: "egyptian",
        university: getRandomElement(universities),
        payment_proof_url: `https://example.com/payment-proof-${i + 1}.jpg`,
        payment_status: paymentStatus,
        ticket_id: paymentStatus === "confirmed" ? generateTicketId() : null,
        created_at: createdAt.toISOString(),
        confirmed_at: paymentStatus === "confirmed" ? generateRandomDate(createdAt, endDate).toISOString() : null,
        ticket_sent: paymentStatus === "confirmed" ? Math.random() > 0.3 : false,
      }

      users.push(user)
    }

    console.log("💾 Inserting users into database...")

    // Insert users in smaller batches to handle potential conflicts better
    const batchSize = 25 // Reduced batch size for better error handling
    let successCount = 0
    let errorCount = 0
    const errors: any[] = []

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)

      try {
        // Use upsert to handle any remaining duplicates gracefully
        const { data, error } = await supabase.from("registrations").upsert(batch, {
          onConflict: "email",
          ignoreDuplicates: true,
        })

        if (error) {
          console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
          errorCount += batch.length
          errors.push({
            batch: Math.floor(i / batchSize) + 1,
            error: error.message,
            code: error.code,
          })
        } else {
          successCount += batch.length
          console.log(`✅ Successfully processed batch ${Math.floor(i / batchSize) + 1}`)
        }
      } catch (err) {
        console.error(`❌ Exception in batch ${Math.floor(i / batchSize) + 1}:`, err)
        errorCount += batch.length
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: String(err),
        })
      }

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Get final count from database
    const { count: finalCount } = await supabase.from("registrations").select("*", { count: "exact", head: true })

    // Generate statistics from the users we tried to create
    const statusCounts = users.reduce((acc: any, user) => {
      acc[user.payment_status] = (acc[user.payment_status] || 0) + 1
      return acc
    }, {})

    console.log("📊 Generation completed!")

    return NextResponse.json({
      success: true,
      message: "Test data generation completed!",
      summary: {
        totalAttempted: users.length,
        successCount,
        errorCount,
        statusDistribution: statusCounts,
        finalDatabaseCount: finalCount,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Show only first 5 errors
      },
    })
  } catch (error) {
    console.error("Error generating test data:", error)
    return NextResponse.json({ error: "Failed to generate test data", details: String(error) }, { status: 500 })
  }
}
