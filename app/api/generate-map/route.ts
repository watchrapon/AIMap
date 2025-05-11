import { NextResponse } from "next/server"
import { generateMindMap } from "@/lib/gemini"

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const mindMapData = await generateMindMap(query)

    return NextResponse.json({ data: mindMapData })
  } catch (error) {
    console.error("Error in generate-map API route:", error)
    return NextResponse.json({ error: "Failed to generate mind map" }, { status: 500 })
  }
}
