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
    .eq("is_active", true)
    .order("created_at", { ascending: false })
  return { data, error }
}

export async function getSurveyBySlug(slug) {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()
  return { data, error }
}

export async function createSurvey(title, description = "") {
  if (!supabase) return { data: null, error: "Supabase not configured" }

  const slug = slugify(title, { lower: true, strict: true })

  // Set current user as owner
  const { data: { user } } = await supabase.auth.getUser()
  const owner_id = user?.id || null

  const { data, error } = await supabase
    .from("surveys")
    .insert({ title, description, slug, owner_id })
    .select()
    .single()
  return { data, error }
}

export async function deleteSurvey(id) {
  if (!supabase) return { error: "Supabase not configured" }
  // Delete related data first (admins, questions), then the survey
  await supabase.from("survey_admins").delete().eq("survey_id", id)
  await supabase.from("questions").delete().eq("survey_id", id)
  const { error } = await supabase.from("surveys").delete().eq("id", id)
  return { error }
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
//  Responses (öffentliche Abgabe: POST /api/responses + lib/supabase-admin.js)
// ──────────────────────────────────────

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

// ──────────────────────────────────────
//  Auth (Email + Password)
// ──────────────────────────────────────

export async function signInWithPassword(email, password) {
  if (!supabase) return { error: "Supabase not configured" }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function sendPasswordReset(email) {
  if (!supabase) return { error: "Supabase not configured" }
  const redirectTo = typeof window !== "undefined"
    ? `${window.location.origin}/admin/login`
    : undefined
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  return { error }
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return { session: null }
  const { data } = await supabase.auth.getSession()
  return { session: data.session }
}

// ──────────────────────────────────────
//  Survey Admins
// ──────────────────────────────────────

/**
 * Check if the current user is admin of at least one survey.
 * Uses RLS: survey_admins only returns rows for the current user's surveys.
 * Returns false for unauthenticated users or users not in any survey.
 */
export async function isAdminOfAnySurvey() {
  if (!supabase) return false
  const { data, error } = await supabase
    .from("survey_admins")
    .select("id")
    .limit(1)
  if (error) return false
  return Array.isArray(data) && data.length > 0
}

/**
 * Get all surveys the current user is admin of.
 */
export async function getAdminSurveys() {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  // Get current user to filter only their admin entries
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }
  const { data, error } = await supabase
    .from("survey_admins")
    .select("survey_id, surveys(*, owner:owner_id(id, email, full_name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  if (error) return { data: null, error }
  // Flatten: return array of survey objects
  const surveys = (data || []).map((row) => row.surveys).filter(Boolean)
  return { data: surveys, error: null }
}

/**
 * Get all admins for a survey.
 */
export async function getSurveyAdmins(surveyId) {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("survey_admins")
    .select("id, user_id, created_at")
    .eq("survey_id", surveyId)
  return { data, error }
}

/**
 * Add an admin by user ID (direct insert).
 */
export async function addSurveyAdmin(surveyId, userId) {
  if (!supabase) return { error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("survey_admins")
    .insert({ survey_id: surveyId, user_id: userId })
    .select()
    .single()
  return { data, error }
}

/**
 * Remove an admin entry by its row ID.
 */
export async function removeSurveyAdmin(adminRowId) {
  if (!supabase) return { error: "Supabase not configured" }
  const { error } = await supabase
    .from("survey_admins")
    .delete()
    .eq("id", adminRowId)
  return { error }
}

/**
 * Add current user as admin of a survey.
 * Called right after createSurvey() so the creator is the first admin.
 */
export async function addCurrentUserAsSurveyAdmin(surveyId) {
  if (!supabase) return { error: "Supabase not configured" }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  const { error } = await supabase
    .from("survey_admins")
    .insert({ survey_id: surveyId, user_id: user.id })
  return { error }
}

/**
 * Get all profiles for admin selection.
 */
export async function getAllProfiles() {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url")
    .order("full_name", { ascending: true })
  return { data, error }
}

/**
 * Transfer survey ownership to a new user.
 */
export async function transferSurveyOwnership(surveyId, newOwnerId) {
  if (!supabase) return { error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("surveys")
    .update({ owner_id: newOwnerId })
    .eq("id", surveyId)
    .select()
    .single()
  return { data, error }
}
