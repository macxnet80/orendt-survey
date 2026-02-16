import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ──────────────────────────────────────
//  Questions
// ──────────────────────────────────────

export async function getQuestions() {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("sort_order", { ascending: true })
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

export async function submitResponse(answers) {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("responses")
    .insert({ answers, submitted_at: new Date().toISOString() })
    .select()
    .single()
  return { data, error }
}

export async function getResponses() {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("responses")
    .select("*")
    .order("submitted_at", { ascending: false })
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
