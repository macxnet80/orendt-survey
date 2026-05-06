import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseServiceRoleClient } from "@/lib/supabase-admin"
import { summarizeSurveyData } from "@/lib/ai-summary"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RESPONSES_PAGE = 1000

async function fetchAllResponses(supabase, surveyId) {
  const all = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from("responses")
      .select("*")
      .eq("survey_id", surveyId)
      .order("submitted_at", { ascending: false })
      .range(from, from + RESPONSES_PAGE - 1)
    if (error) throw new Error(error.message || "responses query failed")
    const batch = data || []
    all.push(...batch)
    if (batch.length < RESPONSES_PAGE) break
    from += RESPONSES_PAGE
  }
  return all
}

export async function POST(request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization: Bearer Token erforderlich." }, { status: 401 })
  }
  const token = authHeader.slice("Bearer ".length).trim()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase nicht konfiguriert." }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const rawSurveyId = body?.surveyId
  const surveyId =
    rawSurveyId != null && String(rawSurveyId).trim() !== ""
      ? String(rawSurveyId).trim()
      : null
  if (!surveyId) {
    return NextResponse.json({ error: "Body: surveyId erforderlich." }, { status: 400 })
  }

  const authSupabase = createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authErr } = await authSupabase.auth.getUser(token)
  const authUserId = authData?.user?.id
  if (authErr || !authUserId) {
    return NextResponse.json({ error: authErr?.message ?? "Session ungueltig." }, { status: 401 })
  }

  const { data: adminRow, error: adminErr } = await authSupabase
    .from("survey_admins")
    .select("id")
    .eq("survey_id", surveyId)
    .eq("user_id", authUserId)
    .maybeSingle()

  if (adminErr) {
    return NextResponse.json({ error: adminErr.message || "Berechtigungsfehler." }, { status: 403 })
  }
  if (!adminRow) {
    return NextResponse.json({ error: "Kein Zugriff auf diese Umfrage." }, { status: 403 })
  }

  const service = getSupabaseServiceRoleClient()
  if (!service) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY fehlt auf dem Server." }, { status: 500 })
  }

  try {
    const { data: survey, error: sErr } = await service.from("surveys").select("*").eq("id", surveyId).single()
    if (sErr || !survey) {
      return NextResponse.json({ error: "Umfrage nicht gefunden." }, { status: 404 })
    }

    const { data: questionsRaw, error: qErr } = await service
      .from("questions")
      .select("*")
      .eq("survey_id", surveyId)
      .order("sort_order", { ascending: true })
    if (qErr) {
      return NextResponse.json({ error: qErr.message || "Fragen laden fehlgeschlagen." }, { status: 500 })
    }
    const questions = questionsRaw || []

    const responses = await fetchAllResponses(service, surveyId)

    const { summary, model } = await summarizeSurveyData({
      survey,
      questions,
      responses,
    })

    const generatedAt = new Date().toISOString()
    const { error: updErr } = await service
      .from("surveys")
      .update({
        ai_summary: summary,
        ai_summary_generated_at: generatedAt,
        ai_summary_model: model,
      })
      .eq("id", surveyId)

    if (updErr) {
      return NextResponse.json(
        { error: updErr.message || "Speichern der Zusammenfassung fehlgeschlagen (DB-Spalten vorhanden?)." },
        { status: 500 }
      )
    }

    return NextResponse.json({ summary, model, generatedAt })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
