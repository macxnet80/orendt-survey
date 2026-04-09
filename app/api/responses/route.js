import { NextResponse } from "next/server"
import { getResponses, deleteResponse } from "@/lib/supabase"
import { submitResponseServer } from "@/lib/supabase-admin"

export async function GET() {
  const { data, error } = await getResponses()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const surveyId = body.survey_id ?? body.surveyId
  const answers = body.answers
  if (!surveyId || answers == null || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json(
      { error: "Body must include survey_id (or surveyId) and answers (object)" },
      { status: 400 }
    )
  }
  const { data, error } = await submitResponseServer(surveyId, answers)
  if (error) {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
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
