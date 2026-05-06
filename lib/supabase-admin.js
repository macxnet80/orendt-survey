import { createClient } from "@supabase/supabase-js"
import { isSurveyExpired } from "@/lib/survey-expiry"

/**
 * Server-only Supabase Client (Service Role). Umgeht RLS — nur nach validierter Autorisierung nutzen.
 * Nicht in Client-Komponenten importieren.
 */
export function getSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

function createServerSupabaseAdmin() {
  return getSupabaseServiceRoleClient()
}

/**
 * Persist survey response: checks survey is active, then inserts (RLS bypass via service role).
 */
export async function submitResponseServer(surveyId, answers) {
  const supabase = createServerSupabaseAdmin()
  if (!supabase) {
    return { data: null, error: { message: "Server-Konfiguration: SUPABASE_SERVICE_ROLE_KEY fehlt." } }
  }

  const { data: surveyRow, error: surveyError } = await supabase
    .from("surveys")
    .select("id, expires_at")
    .eq("id", surveyId)
    .eq("is_active", true)
    .maybeSingle()

  if (surveyError) {
    return { data: null, error: surveyError }
  }
  if (!surveyRow) {
    return {
      data: null,
      error: { message: "Umfrage nicht gefunden oder nicht aktiv." }
    }
  }
  if (isSurveyExpired(surveyRow.expires_at)) {
    return {
      data: null,
      error: { message: "Umfrage nicht gefunden oder nicht aktiv." }
    }
  }

  const { data, error } = await supabase
    .from("responses")
    .insert({
      survey_id: surveyId,
      answers,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()

  return { data, error }
}
