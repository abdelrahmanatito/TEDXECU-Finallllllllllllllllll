import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import * as XLSX from "xlsx"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Ticket price constant
const TICKET_PRICE = 250 // EGP

export async function GET() {
  try {
    const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
    }

    // Calculate total money collected
    const confirmedCount = data.filter((reg) => reg.payment_status === "confirmed").length
    const totalMoney = confirmedCount * TICKET_PRICE

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()

    // Format data for Excel
    const formattedData = data.map((registration) => ({
      Name: registration.name,
      Email: registration.email,
      Phone: registration.phone,
      "Phone Type": registration.phone_type === "egyptian" ? "Egyptian" : "International",
      University: registration.university,
      "Payment Status": registration.payment_status,
      "Ticket ID": registration.ticket_id || "",
      "Registration Date": new Date(registration.created_at).toLocaleDateString(),
      "Confirmation Date": registration.confirmed_at ? new Date(registration.confirmed_at).toLocaleDateString() : "",
      "Ticket Sent": registration.ticket_sent ? "Yes" : "No",
      "Payment Proof URL": registration.payment_proof_url || "",
      "Personal Photo URL": registration.personal_photo_url || "",
    }))

    // Create main data worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData)

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Phone Type
      { wch: 25 }, // University
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Ticket ID
      { wch: 15 }, // Registration Date
      { wch: 15 }, // Confirmation Date
      { wch: 10 }, // Ticket Sent
      { wch: 50 }, // Payment Proof URL
      { wch: 50 }, // Personal Photo URL
    ]
    worksheet["!cols"] = columnWidths

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations")

    // Create summary worksheet
    const summaryData = [
      { Metric: "Total Registrations", Value: data.length },
      { Metric: "Confirmed Registrations", Value: confirmedCount },
      { Metric: "Pending Registrations", Value: data.filter((reg) => reg.payment_status === "pending").length },
      { Metric: "Rejected Registrations", Value: data.filter((reg) => reg.payment_status === "rejected").length },
      { Metric: "Tickets Sent", Value: data.filter((reg) => reg.ticket_sent).length },
      { Metric: "Total Money Collected (EGP)", Value: totalMoney },
      { Metric: "Ticket Price (EGP)", Value: TICKET_PRICE },
      { Metric: "Export Date", Value: new Date().toLocaleString() },
    ]

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
    summaryWorksheet["!cols"] = [{ wch: 25 }, { wch: 20 }]

    // Add the summary worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary")

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="tedxecu-registrations-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
