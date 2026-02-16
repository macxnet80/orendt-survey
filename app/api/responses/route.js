import { NextResponse } from "next/server"
import { submitResponse, getResponses, deleteResponse } from "@/lib/supabase"

export async function GET() {
  const { data, error } = await getResponses()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const { data, error } = await submitResponse(body.answers)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const { error } = await deleteResponse(id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
