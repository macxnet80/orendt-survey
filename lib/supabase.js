import { createClient } from "@supabase/supabase-js"
import slugify from "slugify"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing in environment variables")
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ──────────────────────────────────────
//  Surveys
// ──────────────────────────────────────

export async function getSurveys() {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .order("created_at", { ascending: false })
  return { data, error }
}

export async function getSurveyBySlug(slug) {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("slug", slug)
    .single()
  return { data, error }
}

export async function createSurvey(title, description = "") {
  if (!supabase) return { data: null, error: "Supabase not configured" }

  const slug = slugify(title, { lower: true, strict: true })

  const { data, error } = await supabase
    .from("surveys")
    .insert({ title, description, slug })
    .select()
    .single()
  return { data, error }
}

export async function updateSurvey(id, updates) {
  if (!supabase) return { data: null, error: "Supabase not configured" }

  const { data, error } = await supabase
    .from("surveys")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  return { data, error }
}

// ──────────────────────────────────────
//  Questions
// ──────────────────────────────────────

export async function getQuestions(surveyId) {
  if (!supabase) return { data: null, error: "Supabase not configured" }

  let query = supabase
    .from("questions")
    .select("*")
    .order("sort_order", { ascending: true })

  if (surveyId) {
    query = query.eq("survey_id", surveyId)
  }

  const { data, error } = await query
  return { data, error }
}


export async function createQuestion(question) {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("questions")
    .insert(question)
    .select()
    .single()
  return { data, error }
}

export async function updateQuestion(id, updates) {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  return { data, error }
}

export async function deleteQuestion(id) {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id)
  return { error }
}

// ──────────────────────────────────────
//  Responses
// ──────────────────────────────────────

export async function submitResponse(surveyId, answers) {
  if (!supabase) return { data: null, error: "Supabase not configured" }

  const payload = {
    answers,
    submitted_at: new Date().toISOString()
  }

  if (surveyId) {
    payload.survey_id = surveyId
  }

  const { data, error } = await supabase
    .from("responses")
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function getResponses(surveyId) {
  if (!supabase) return { data: null, error: "Supabase not configured" }

  let query = supabase
    .from("responses")
    .select("*")
    .order("submitted_at", { ascending: false })

  if (surveyId) {
    query = query.eq("survey_id", surveyId)
  }

  const { data, error } = await query
  return { data, error }
}

export async function deleteResponse(id) {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { error } = await supabase
    .from("responses")
    .delete()
    .eq("id", id)
  return { error }
}
