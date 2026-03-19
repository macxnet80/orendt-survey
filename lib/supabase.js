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

// ──────────────────────────────────────
//  Auth (Magic Link)
// ──────────────────────────────────────

export async function signInWithMagicLink(email) {
  if (!supabase) return { error: "Supabase not configured" }
  const redirectTo = typeof window !== "undefined"
    ? `${window.location.origin}/admin`
    : undefined
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
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
 * Get all surveys the current user is admin of.
 */
export async function getAdminSurveys() {
  if (!supabase) return { data: null, error: "Supabase not configured" }
  const { data, error } = await supabase
    .from("survey_admins")
    .select("survey_id, surveys(*)")
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
    .select("id, user_id, created_at, profiles:user_id(email)")
    .eq("survey_id", surveyId)
  return { data, error }
}

/**
 * Add an admin by email (looks up user by email, then inserts).
 */
export async function addSurveyAdmin(surveyId, email) {
  if (!supabase) return { error: "Supabase not configured" }
  // Look up user by email via admin API (requires service role) or invite flow
  // With anon key we can only insert for known user IDs.
  // Workaround: insert a pending record using the email stored in user metadata
  // Use Supabase user invite instead:
  const { data, error } = await supabase.rpc("add_survey_admin_by_email", {
    p_survey_id: surveyId,
    p_email: email,
  })
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
