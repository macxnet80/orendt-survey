"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  getAdminSurveys, createSurvey, updateSurvey,
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
  getResponses, deleteResponse,
  addCurrentUserAsSurveyAdmin, getSurveyAdmins, removeSurveyAdmin,
  signOut,
} from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"

// ─── Icons (inline SVG) ───────────────────────────

const icons = {
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
  ),
  save: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
  ),
  chevUp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
  ),
  chevDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
  ),
  chevLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
  ),
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
  ),
  lock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
}

// ─── Helpers ───────────────────────────────────────


// ─── Type badges ───────────────────────────────────

const TYPE_LABELS = {
  single: "Single Choice",
  multiple: "Multiple Choice",
  rating: "Bewertung",
  text: "Freitext",
}

const TYPE_COLORS = {
  single: "bg-blue-50 text-blue-700 border-blue-200",
  multiple: "bg-purple-50 text-purple-700 border-purple-200",
  rating: "bg-amber-50 text-amber-700 border-amber-200",
  text: "bg-green-50 text-green-700 border-green-200",
}

// ─── Components ───────────────────────────────────

function SurveyModal({ survey, onSave, onCancel }) {
  const [title, setTitle] = useState(survey?.title || "")
  const [desc, setDesc] = useState(survey?.description || "")
  const [slug, setSlug] = useState(survey?.slug || "")
  const [landingTitle, setLandingTitle] = useState(survey?.landing_title || "")
  const [landingDescription, setLandingDescription] = useState(survey?.landing_description || "")
  const [startButtonLabel, setStartButtonLabel] = useState(survey?.start_button_label || "")

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title,
      description: desc,
      slug,
      landing_title: landingTitle || null,
      landing_description: landingDescription || null,
      start_button_label: startButtonLabel || null,
    })
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 text-sm font-body focus:outline-none focus:border-orendt-black transition-colors"
  const labelClass = "block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display font-bold text-lg mb-4">{survey ? "Umfrage bearbeiten" : "Neue Umfrage erstellen"}</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Titel</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Q3 Mitarbeiter-Feedback"
              className={inputClass}
            />
          </div>
          {survey && (
            <div>
              <label className={labelClass}>URL Slug</label>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="z.B. q3-feedback"
                className={`${inputClass} font-mono`}
              />
              <p className="text-[10px] text-orendt-gray-400 mt-1">Ändert die URL der Umfrage.</p>
            </div>
          )}
          <div>
            <label className={labelClass}>Beschreibung</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Kurze Beschreibung..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Landing Page Section */}
          <div className="pt-2 border-t border-orendt-gray-200">
            <p className="text-[10px] font-display font-semibold tracking-wider uppercase text-orendt-gray-400 mb-4">
              Startseite
            </p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Überschrift</label>
                <input
                  value={landingTitle}
                  onChange={e => setLandingTitle(e.target.value)}
                  placeholder={title || "Überschrift der Startseite"}
                  className={inputClass}
                />
                <p className="text-[10px] text-orendt-gray-400 mt-1">Leer lassen = Umfrage-Titel wird verwendet.</p>
              </div>
              <div>
                <label className={labelClass}>Startseiten-Text</label>
                <textarea
                  value={landingDescription}
                  onChange={e => setLandingDescription(e.target.value)}
                  placeholder="Begrüßungstext für Teilnehmer..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className={labelClass}>Button-Text</label>
                <input
                  value={startButtonLabel}
                  onChange={e => setStartButtonLabel(e.target.value)}
                  placeholder="Umfrage starten"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border-2 border-orendt-gray-200 text-sm font-semibold font-display text-orendt-gray-600 hover:bg-orendt-gray-50">
            Abbrechen
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-orendt-black text-orendt-accent text-sm font-semibold font-display hover:opacity-90">
            {survey ? "Speichern" : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionEditor({ question, onSave, onCancel }) {
  const [form, setForm] = useState({
    type: question?.type || "single",
    category: question?.category || "",
    question: question?.question || "",
    subtitle: question?.subtitle || "",
    options: question?.options || [],
    rating_items: question?.rating_items || [],
    placeholder: question?.placeholder || "",
    is_required: question?.is_required ?? true,
    sort_order: question?.sort_order || 0,
  })

  // ... (keeping existing logic roughly same, just omitting for brevity but will include fully in rewrite)
  const [newOption, setNewOption] = useState("")
  const [newRatingItem, setNewRatingItem] = useState("")

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const addOption = () => {
    if (!newOption.trim()) return
    update("options", [...form.options, newOption.trim()])
    setNewOption("")
  }

  const removeOption = (i) => {
    update("options", form.options.filter((_, idx) => idx !== i))
  }

  const addRatingItem = () => {
    if (!newRatingItem.trim()) return
    update("rating_items", [...form.rating_items, newRatingItem.trim()])
    setNewRatingItem("")
  }

  const removeRatingItem = (i) => {
    update("rating_items", form.rating_items.filter((_, idx) => idx !== i))
  }

  const handleSave = () => {
    if (!form.question.trim() || !form.category.trim()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-5 border-b border-orendt-gray-200 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <h3 className="font-display font-bold text-lg">
            {question ? "Frage bearbeiten" : "Neue Frage"}
          </h3>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-orendt-gray-100 transition-colors text-orendt-gray-500">
            {icons.x}
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Form Fields ... keeping same as before essentially */}
          {/* Type */}
          <div>
            <label className="block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2">Typ</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => update("type", key)}
                  className={`
                    px-3 py-2.5 rounded-xl text-xs font-semibold font-display border-2 transition-all
                    ${form.type === key
                      ? "border-orendt-black bg-orendt-black text-white"
                      : "border-orendt-gray-200 text-orendt-gray-600 hover:border-orendt-gray-400"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category + Sort */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2">Kategorie</label>
              <input
                value={form.category}
                onChange={(e) => update("category", e.target.value.toUpperCase())}
                placeholder="z.B. ARBEITSBEREICH"
                className="w-full px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 text-sm font-body focus:outline-none focus:border-orendt-black transition-colors placeholder:text-orendt-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2">Reihenfolge</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => update("sort_order", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 text-sm font-body focus:outline-none focus:border-orendt-black transition-colors"
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2">Frage</label>
            <textarea
              value={form.question}
              onChange={(e) => update("question", e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 text-sm font-body focus:outline-none focus:border-orendt-black transition-colors resize-none placeholder:text-orendt-gray-400"
              placeholder="Deine Frage..."
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2">Untertitel (optional)</label>
            <input
              value={form.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
              placeholder="z.B. Mehrfachauswahl möglich"
              className="w-full px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 text-sm font-body focus:outline-none focus:border-orendt-black transition-colors placeholder:text-orendt-gray-400"
            />
          </div>

          {/* Options (for single/multiple) */}
          {(form.type === "single" || form.type === "multiple") && (
            <div>
              <label className="block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2">
                Antwortoptionen
              </label>
              <div className="space-y-2 mb-3">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <span className="flex-1 px-4 py-2.5 rounded-lg bg-orendt-gray-50 border border-orendt-gray-200 text-sm">
                      {opt}
                    </span>
                    <button
                      onClick={() => removeOption(i)}
                      className="p-2 rounded-lg text-orendt-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {icons.x}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                  placeholder="Neue Option hinzufügen..."
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-dashed border-orendt-gray-300 bg-white text-sm font-body focus:outline-none focus:border-orendt-black transition-colors placeholder:text-orendt-gray-400"
                />
                <button
                  onClick={addOption}
                  className="px-4 py-2.5 rounded-xl bg-orendt-gray-100 text-orendt-gray-600 hover:bg-orendt-gray-200 transition-colors text-sm font-semibold"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* Rating Items */}
          {form.type === "rating" && (
            <div>
              <label className="block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2">
                Bewertungskriterien
              </label>
              <div className="space-y-2 mb-3">
                {form.rating_items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <span className="flex-1 px-4 py-2.5 rounded-lg bg-orendt-gray-50 border border-orendt-gray-200 text-sm">
                      {item}
                    </span>
                    <button
                      onClick={() => removeRatingItem(i)}
                      className="p-2 rounded-lg text-orendt-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {icons.x}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newRatingItem}
                  onChange={(e) => setNewRatingItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRatingItem())}
                  placeholder="Neues Kriterium hinzufügen..."
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-dashed border-orendt-gray-300 bg-white text-sm font-body focus:outline-none focus:border-orendt-black transition-colors placeholder:text-orendt-gray-400"
                />
                <button
                  onClick={addRatingItem}
                  className="px-4 py-2.5 rounded-xl bg-orendt-gray-100 text-orendt-gray-600 hover:bg-orendt-gray-200 transition-colors text-sm font-semibold"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* Placeholder (for text) */}
          {form.type === "text" && (
            <div>
              <label className="block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2">Platzhalter-Text</label>
              <input
                value={form.placeholder}
                onChange={(e) => update("placeholder", e.target.value)}
                placeholder="z.B. Beschreibe hier..."
                className="w-full px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 text-sm font-body focus:outline-none focus:border-orendt-black transition-colors placeholder:text-orendt-gray-400"
              />
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-orendt-gray-200">
            <span className="text-sm font-medium text-orendt-gray-700">Pflichtfrage</span>
            <button
              onClick={() => update("is_required", !form.is_required)}
              className={`
                w-12 h-7 rounded-full transition-colors duration-200 relative
                ${form.is_required ? "bg-orendt-black" : "bg-orendt-gray-300"}
              `}
            >
              <div
                className={`
                  w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform duration-200
                  ${form.is_required ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-orendt-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border-2 border-orendt-gray-200 text-sm font-semibold font-display text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-orendt-black text-orendt-accent text-sm font-semibold font-display hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {icons.save}
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 p-5">
      <p className="text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-display font-bold text-orendt-black">{value}</p>
      {sub && <p className="text-xs text-orendt-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function analyzeResponses(responses, questions) {
  if (!responses || !questions) return {}
  const stats = {}
  questions.forEach((q) => {
    if (q.type === "single") {
      const counts = {}; (q.options || []).forEach((o) => (counts[o] = 0))
      responses.forEach((r) => {
        const val = r.answers?.[q.id]
        if (val && counts[val] !== undefined) counts[val]++
      })
      stats[q.id] = { type: "single", counts, total: responses.length }
    } else if (q.type === "multiple") {
      const counts = {}; (q.options || []).forEach((o) => (counts[o] = 0))
      responses.forEach((r) => {
        const vals = r.answers?.[q.id] || []
        vals.forEach((v) => { if (counts[v] !== undefined) counts[v]++ })
      })
      stats[q.id] = { type: "multiple", counts, total: responses.length }
    } else if (q.type === "rating") {
      const avgs = {}; (q.rating_items || []).forEach((item) => {
        let sum = 0, count = 0
        responses.forEach((r) => {
          const val = r.answers?.[q.id]?.[item]
          if (val) { sum += val; count++ }
        })
        avgs[item] = count > 0 ? (sum / count).toFixed(1) : "–"
      })
      stats[q.id] = { type: "rating", avgs }
    } else if (q.type === "text") {
      const texts = responses
        .map((r) => r.answers?.[q.id])
        .filter(Boolean)
      stats[q.id] = { type: "text", texts }
    }
  })
  return stats
}

function SimpleBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs text-orendt-gray-600 w-48 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-orendt-gray-100 rounded-lg overflow-hidden">
        <div
          className="h-full bg-orendt-black rounded-lg transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-xs font-display font-bold text-orendt-black w-10 text-right">{count}</span>
    </div>
  )
}

// ─── Main Admin Dashboard ───────────────────────────

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [selectedSurvey, setSelectedSurvey] = useState(null)

  // Survey List State
  const [surveys, setSurveys] = useState([])
  const [loadingSurveys, setLoadingSurveys] = useState(true)
  const [editingSurvey, setEditingSurvey] = useState(null) // null | "new" | survey object

  // Detail State
  const [tab, setTab] = useState("questions")
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | "new" | question object
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedResponse, setExpandedResponse] = useState(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  // 1. Load Surveys (only admin's surveys)
  const loadSurveys = useCallback(async () => {
    setLoadingSurveys(true)
    const { data } = await getAdminSurveys()
    setSurveys(data || [])
    setLoadingSurveys(false)
  }, [])

  useEffect(() => {
    if (user && !selectedSurvey) {
      loadSurveys()
    }
  }, [user, selectedSurvey, loadSurveys])


  // 2. Load Detail Data
  const loadSurveyData = useCallback(async () => {
    if (!selectedSurvey) return
    setLoading(true)
    const [qRes, rRes, aRes] = await Promise.all([
      getQuestions(selectedSurvey.id),
      getResponses(selectedSurvey.id),
      getSurveyAdmins(selectedSurvey.id)
    ])
    setQuestions(qRes.data || [])
    setResponses(rRes.data || [])
    setAdmins(aRes.data || [])
    setLoading(false)
  }, [selectedSurvey])

  useEffect(() => {
    if (selectedSurvey) {
      loadSurveyData()
    }
  }, [selectedSurvey, loadSurveyData])

  // ─── Handlers ─────────────────

  const handleSaveSurvey = async ({ title, description, slug }) => {
    if (editingSurvey === "new") {
      const { data: newSurvey } = await createSurvey(title, description)
      if (newSurvey) {
        await addCurrentUserAsSurveyAdmin(newSurvey.id)
      }
    } else if (editingSurvey?.id) {
      await updateSurvey(editingSurvey.id, { title, description, slug })
    }
    setEditingSurvey(null)
    loadSurveys()
  }

  const handleSaveQuestion = async (form) => {
    const payload = { ...form, survey_id: selectedSurvey.id } // Attach ID
    if (editing === "new") {
      await createQuestion(payload)
    } else if (editing?.id) {
      await updateQuestion(editing.id, form)
    }
    setEditing(null)
    loadSurveyData()
  }

  const handleDeleteQuestion = async (id) => {
    await deleteQuestion(id)
    setConfirmDelete(null)
    loadSurveyData()
  }

  const handleDeleteResponse = async (id) => {
    await deleteResponse(id)
    loadSurveyData()
  }

  // ─── Handlers ─────────────────

  const handleLogout = async () => {
    await signOut()
    router.push("/admin/login")
  }

  // ─── Renders ──────────────────

  // Show loading while checking auth
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-orendt-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    if (typeof window !== "undefined") {
      router.push("/admin/login")
    }
    return null
  }

  // View: Survey List
  if (!selectedSurvey) {
    return (
      <div className="min-h-screen bg-orendt-gray-50 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-orendt-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="h-9 px-3 py-1.5 bg-orendt-black rounded-lg flex items-center justify-center shadow-sm">
              <img src="/orendtstudios_logo.png" alt="Orendt Studios" className="h-full w-auto object-contain" />
            </div>
            <div className="h-4 w-[1px] bg-orendt-gray-200 mx-1" />
            <span className="text-xs text-orendt-gray-500 font-medium tracking-wide">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-orendt-gray-200 text-xs font-display font-semibold text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-2xl font-bold">Deine Umfragen</h1>
            <button onClick={() => setEditingSurvey("new")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orendt-black text-orendt-accent font-display font-semibold text-sm hover:opacity-90 transition-opacity">
              {icons.plus} Neue Umfrage
            </button>
          </div>

          {loadingSurveys ? (
            <div className="text-center py-20"><div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin inline-block" /></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {surveys.map(s => (
                <div key={s.id} className="relative group hover:shadow-lg transition-all rounded-2xl">
                  <button onClick={() => setSelectedSurvey(s)} className="w-full bg-white p-6 rounded-2xl border border-orendt-gray-200 hover:border-orendt-black transition-all text-left">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-display uppercase ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                      {s.password_hash && (
                        <span title="Passwortgeschützt" className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded font-display uppercase bg-orendt-gray-100 text-orendt-gray-600">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Passwort
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-bold mb-1 max-w-[90%]">{s.title}</h3>
                    <p className="text-sm text-orendt-gray-500 line-clamp-2 mb-4">{s.description || 'Keine Beschreibung'}</p>
                    <div className="flex items-center gap-2 text-xs text-orendt-gray-400 font-mono bg-orendt-gray-50 p-2 rounded w-fit">
                      /{s.slug}
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingSurvey(s); }}
                    className="absolute top-6 right-6 p-2 rounded-lg text-orendt-gray-400 hover:text-orendt-black hover:bg-orendt-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {icons.edit}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>

        {editingSurvey && (
          <SurveyModal
            survey={editingSurvey === "new" ? null : editingSurvey}
            onSave={handleSaveSurvey}
            onCancel={() => setEditingSurvey(null)}
          />
        )}
      </div>
    )
  }

  // View: Survey Detail (Existing Dashboard Logic)
  const stats = analyzeResponses(responses, questions)

  return (
    <div className="min-h-screen bg-orendt-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-orendt-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedSurvey(null)} className="p-2 -ml-2 rounded-lg hover:bg-orendt-gray-100 text-orendt-gray-500">
            {icons.chevLeft}
          </button>
          <div className="h-9 px-3 py-1.5 bg-orendt-black rounded-lg flex items-center justify-center shadow-sm">
            <img src="/orendtstudios_logo.png" alt="Orendt Studios" className="h-full w-auto object-contain" />
          </div>
          <div className="h-4 w-[1px] bg-orendt-gray-200 mx-1" />
          <div className="flex flex-col">
            <span className="text-xs text-orendt-gray-500 font-medium tracking-wide">Dashboard</span>
            <span className="text-xs font-bold leading-none">{selectedSurvey.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/${selectedSurvey.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orendt-gray-200 text-xs font-display font-semibold text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors"
          >
            {icons.eye}
            Umfrage ansehen
          </a>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-orendt-gray-200 text-xs font-display font-semibold text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Fragen" value={questions.length} />
          <StatCard label="Antworten" value={responses.length} />
          <StatCard label="Rücklaufquote" value={responses.length > 0 ? `${responses.length}` : "–"} sub="Teilnehmer" />
          <StatCard
            label="Letzte Antwort"
            value={responses.length > 0 ? new Date(responses[0].submitted_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) : "–"}
            sub={responses.length > 0 ? new Date(responses[0].submitted_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : ""}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-orendt-gray-200 p-1 w-fit">
          {[
            { id: "questions", label: "Fragen", icon: icons.clipboard },
            { id: "responses", label: "Ergebnisse", icon: icons.chart },
            { id: "admins", label: "Admins", icon: icons.lock },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg font-display text-sm font-semibold transition-all duration-200
                ${tab === t.id
                  ? "bg-orendt-black text-white"
                  : "text-orendt-gray-500 hover:text-orendt-black hover:bg-orendt-gray-50"
                }
              `}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
          </div>
        ) : tab === "admins" ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">Verwaltung Admins</h2>
            </div>
            <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden">
              <div className="p-6 border-b border-orendt-gray-200">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const email = e.target.email.value
                    if (!email) return
                    const { error } = await addSurveyAdmin(selectedSurvey.id, email)
                    if (error) alert("Fehler: " + error.message)
                    else {
                      e.target.email.value = ""
                      loadSurveyData()
                    }
                  }}
                  className="flex gap-3"
                >
                  <input 
                    name="email"
                    type="email" 
                    placeholder="E-Mail des neuen Admins..."
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-orendt-gray-200 focus:border-orendt-black outline-none text-sm transition-colors"
                  />
                  <button type="submit" className="px-6 py-2.5 bg-orendt-black text-orendt-accent rounded-xl text-sm font-semibold font-display hover:opacity-90 transition-opacity">
                    Hinzufügen
                  </button>
                </form>
                <p className="text-[10px] text-orendt-gray-400 mt-2">Der User muss bereits ein Orendt-Konto haben, um hinzugefügt zu werden.</p>
              </div>
              <div className="divide-y divide-orendt-gray-100">
                {admins.map((admin) => (
                  <div key={admin.id} className="p-4 flex items-center justify-between hover:bg-orendt-gray-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-orendt-black">{admin.profiles?.email || "Unbekannter User"}</span>
                      <span className="text-[10px] text-orendt-gray-400">ID: {admin.id}</span>
                    </div>
                    {admin.profiles?.email !== user.email && (
                      <button 
                        onClick={async () => {
                          if (confirm("Diesen Admin wirklich entfernen?")) {
                            await removeSurveyAdmin(admin.id)
                            loadSurveyData()
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {icons.trash}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : tab === "questions" ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">{questions.length} Fragen</h2>
              <button
                onClick={() => setEditing("new")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orendt-black text-orendt-accent font-display font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {icons.plus}
                Neue Frage
              </button>
            </div>

            <div className="space-y-3">
              {questions.length === 0 && <p className="text-center py-10 text-gray-400">Keine Fragen vorhanden. Lege eine neue an!</p>}
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white rounded-2xl border border-orendt-gray-200 p-5 hover:border-orendt-gray-300 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orendt-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-display font-bold text-sm text-orendt-gray-600">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold font-display border ${TYPE_COLORS[q.type]}`}>{TYPE_LABELS[q.type]}</span>
                        <span className="text-[11px] font-display font-semibold tracking-wider uppercase text-orendt-gray-400">{q.category}</span>
                        {q.is_required && <span className="text-[10px] font-display font-semibold text-red-400 uppercase">Pflicht</span>}
                      </div>
                      <p className="font-body text-sm text-orendt-black font-medium leading-snug">{q.question}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditing(q)} className="p-2 rounded-lg text-orendt-gray-400 hover:text-orendt-black hover:bg-orendt-gray-100 transition-colors">{icons.edit}</button>
                      <button onClick={() => setConfirmDelete(q.id)} className="p-2 rounded-lg text-orendt-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">{icons.trash}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-xl font-bold mb-6">{responses.length} Antworten</h2>
            {responses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-orendt-gray-200 p-12 text-center">
                <p className="text-orendt-gray-500 font-body">Noch keine Antworten eingegangen.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((q) => {
                  const s = stats[q.id]
                  if (!s) return null
                  return (
                    <div key={q.id} className="bg-white rounded-2xl border border-orendt-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold font-display border ${TYPE_COLORS[q.type]}`}>{TYPE_LABELS[q.type]}</span>
                        <span className="text-[11px] font-display font-semibold tracking-wider uppercase text-orendt-gray-400">{q.category}</span>
                      </div>
                      <h3 className="font-display font-bold text-sm mb-4">{q.question}</h3>
                      {(s.type === "single" || s.type === "multiple") && (
                        <div className="space-y-1">
                          {Object.entries(s.counts).sort(([, a], [, b]) => b - a).map(([label, count]) => (
                            <SimpleBar key={label} label={label} count={count} total={s.total} />
                          ))}
                        </div>
                      )}
                      {s.type === "rating" && (
                        <div className="space-y-2">
                          {Object.entries(s.avgs).map(([item, avg]) => (
                            <div key={item} className="flex items-center gap-3">
                              <span className="text-xs text-orendt-gray-600 w-48 truncate">{item}</span>
                              <div className="flex-1 h-6 bg-orendt-gray-100 rounded-lg overflow-hidden">
                                <div className="h-full bg-orendt-accent rounded-lg" style={{ width: `${avg !== "–" ? (avg / 5) * 100 : 0}%` }} />
                              </div>
                              <span className="text-sm font-display font-bold text-orendt-black w-10 text-right">{avg}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.type === "text" && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {s.texts.map((text, i) => (
                            <div key={i} className="px-4 py-3 bg-orendt-gray-50 rounded-xl text-sm text-orendt-gray-700 border border-orendt-gray-100">&ldquo;{text}&rdquo;</div>
                          ))}
                          {s.texts.length === 0 && <p className="text-xs text-orendt-gray-400 italic">Keine Antworten</p>}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Individual Responses */}
                <div className="mt-8">
                  <h3 className="font-display font-bold text-base mb-4">Einzelne Antworten</h3>
                  <div className="space-y-2">
                    {responses.map((r, i) => (
                      <div key={r.id} className="bg-white rounded-xl border border-orendt-gray-200 overflow-hidden">
                        <button onClick={() => setExpandedResponse(expandedResponse === r.id ? null : r.id)} className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-orendt-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="font-display text-xs font-bold text-orendt-gray-400">#{responses.length - i}</span>
                            <span className="text-sm text-orendt-gray-700">
                              {new Date(r.submitted_at).toLocaleDateString("de-DE", {
                                day: "2-digit", month: "2-digit", year: "numeric",
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <span className="text-orendt-gray-400 flex items-center gap-2">
                            <span onClick={(e) => { e.stopPropagation(); handleDeleteResponse(r.id); }} className="p-1 hover:text-red-500">{icons.trash}</span>
                            {expandedResponse === r.id ? icons.chevUp : icons.chevDown}
                          </span>
                        </button>
                        {expandedResponse === r.id && (
                          <div className="px-5 pb-4 border-t border-orendt-gray-100 pt-3 space-y-3 animate-fade-in">
                            {questions.map((q) => {
                              const val = r.answers?.[q.id]
                              if (!val || (Array.isArray(val) && val.length === 0)) return null
                              return (
                                <div key={q.id}>
                                  <p className="text-[11px] font-display font-semibold tracking-wider uppercase text-orendt-gray-400 mb-0.5">{q.category}</p>
                                  <p className="text-sm text-orendt-black">
                                    {Array.isArray(val) ? val.join(", ") : typeof val === "object" ? Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(", ") : val}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {editing && <QuestionEditor question={editing === "new" ? null : editing} onSave={handleSaveQuestion} onCancel={() => setEditing(null)} />}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-display font-bold text-lg mb-2">Frage löschen?</h3>
            <p className="text-sm text-orendt-gray-600 mb-6">Diese Aktion kann nicht rückgängig gemacht werden. Bestehende Antworten zu dieser Frage bleiben erhalten.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2.5 rounded-xl border-2 border-orendt-gray-200 text-sm font-semibold font-display text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors">Abbrechen</button>
              <button onClick={() => handleDeleteQuestion(confirmDelete)} className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold font-display hover:bg-red-600 transition-colors">Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
