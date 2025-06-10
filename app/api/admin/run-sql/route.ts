import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json()

    if (!script) {
      return NextResponse.json({ error: "Script name is required" }, { status: 400 })
    }

    // Security check - only allow scripts from the scripts directory
    if (!script.endsWith(".sql") || script.includes("..") || script.includes("/")) {
      return NextResponse.json({ error: "Invalid script name" }, { status: 400 })
    }

    // Get the script content
    const scriptPath = path.join(process.cwd(), "scripts", script)
    let sqlContent: string

    try {
      sqlContent = fs.readFileSync(scriptPath, "utf8")
    } catch (error) {
      console.error(`Error reading SQL script ${script}:`, error)
      return NextResponse.json({ error: `Script ${script} not found` }, { status: 404 })
    }

    // Execute the SQL script
    const { data, error } = await supabase.rpc("run_sql", { sql_query: sqlContent })

    if (error) {
      console.error(`Error executing SQL script ${script}:`, error)
      return NextResponse.json({ error: `Error executing script: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Script ${script} executed successfully`,
      data,
    })
  } catch (error) {
    console.error("Error running SQL script:", error)
    return NextResponse.json(
      {
        error: `Error running SQL script: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
