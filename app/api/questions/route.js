import { NextResponse } from "next/server"
import {
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
} from "@/lib/supabase"

export async function GET() {
  const { data, error } = await getQuestions()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const { data, error } = await createQuestion(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const { data, error } = await updateQuestion(id, updates)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const { error } = await deleteQuestion(id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
