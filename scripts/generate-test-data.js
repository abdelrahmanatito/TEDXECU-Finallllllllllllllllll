// Script to generate 500 test users with random data
const { createClient } = require("@supabase/supabase-js")

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || "your-supabase-url"
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Sample data arrays for generating realistic test data
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
]

const emailDomains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "student.edu.eg",
  "aucegypt.edu",
  "cu.edu.eg",
  "alexu.edu.eg",
]

const paymentStatuses = ["pending", "confirmed", "rejected"]

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function generateRandomPhone() {
  // Generate Egyptian phone number format (11 digits starting with 01)
  const prefixes = ["010", "011", "012", "015"]
  const prefix = getRandomElement(prefixes)
  const remaining = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0")
  return prefix + remaining
}

function generateRandomEmail(firstName, lastName) {
  const domain = getRandomElement(emailDomains)
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 100)}${lastName.toLowerCase()}@${domain}`,
  ]
  return getRandomElement(variations)
}

function generateTicketId() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function generateTestUsers() {
  console.log("🚀 Starting to generate 500 test users...")

  const users = []
  const startDate = new Date("2024-01-01")
  const endDate = new Date()

  for (let i = 0; i < 500; i++) {
    const firstName = getRandomElement(firstNames)
    const lastName = getRandomElement(lastNames)
    const paymentStatus = getRandomElement(paymentStatuses)
    const createdAt = generateRandomDate(startDate, endDate)

    const user = {
      name: `${firstName} ${lastName}`,
      email: generateRandomEmail(firstName, lastName),
      phone: generateRandomPhone(),
      university: getRandomElement(universities),
      payment_proof_url: `https://example.com/payment-proof-${i + 1}.jpg`,
      payment_status: paymentStatus,
      ticket_id: paymentStatus === "confirmed" ? generateTicketId() : null,
      created_at: createdAt.toISOString(),
      confirmed_at: paymentStatus === "confirmed" ? generateRandomDate(createdAt, endDate).toISOString() : null,
      ticket_sent: paymentStatus === "confirmed" ? Math.random() > 0.3 : false,
    }

    users.push(user)

    // Log progress every 50 users
    if ((i + 1) % 50 === 0) {
      console.log(`📝 Generated ${i + 1}/500 users...`)
    }
  }

  console.log("💾 Inserting users into database...")

  // Insert users in batches of 50 to avoid overwhelming the database
  const batchSize = 50
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)

    try {
      const { data, error } = await supabase.from("registrations").insert(batch)

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
        errorCount += batch.length
      } else {
        successCount += batch.length
        console.log(`✅ Successfully inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} users)`)
      }
    } catch (err) {
      console.error(`❌ Exception in batch ${Math.floor(i / batchSize) + 1}:`, err)
      errorCount += batch.length
    }

    // Small delay between batches to be gentle on the database
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log("\n📊 Generation Summary:")
  console.log(`✅ Successfully created: ${successCount} users`)
  console.log(`❌ Failed to create: ${errorCount} users`)
  console.log(`📈 Total attempted: ${users.length} users`)

  // Generate statistics
  const statusCounts = users.reduce((acc, user) => {
    acc[user.payment_status] = (acc[user.payment_status] || 0) + 1
    return acc
  }, {})

  console.log("\n📈 Status Distribution:")
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`${status}: ${count} users (${((count / users.length) * 100).toFixed(1)}%)`)
  })

  console.log("\n🎯 Test Data Generation Complete!")
  console.log("You can now test the admin dashboard with 500 users to check:")
  console.log("- Loading performance")
  console.log("- Pagination needs")
  console.log("- Search functionality")
  console.log("- Export performance")
  console.log("- UI responsiveness with large datasets")
}

// Run the script
generateTestUsers().catch(console.error)
