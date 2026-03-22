"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { QRCodeCanvas } from "qrcode.react"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import {
  getAdminSurveys, createSurvey, updateSurvey, deleteSurvey,
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
  getResponses, deleteResponse,
  addCurrentUserAsSurveyAdmin, getSurveyAdmins, addSurveyAdmin, removeSurveyAdmin,
  getAllProfiles, transferSurveyOwnership,
  isAdminOfAnySurvey, signOut,
} from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"
import LegalNavLinks from "@/components/LegalNavLinks"

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
  share: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
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

function SurveyModal({ onSave, onCancel }) {
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title, description: desc })
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 text-sm font-body focus:outline-none focus:border-orendt-black transition-colors"
  const labelClass = "block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h3 className="font-display font-bold text-lg mb-4">Neue Umfrage erstellen</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Titel</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Q3 Mitarbeiter-Feedback"
              className={inputClass}
              autoFocus
            />
          </div>
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
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border-2 border-orendt-gray-200 text-sm font-semibold font-display text-orendt-gray-600 hover:bg-orendt-gray-50">
            Abbrechen
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-orendt-black text-orendt-accent text-sm font-semibold font-display hover:opacity-90">
            Erstellen
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

function ShareTab({ survey }) {
  const qrRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const surveyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${survey.slug}`
    : `/${survey.slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement("input")
      input.value = surveyUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas")
    if (!canvas) return
    const printCanvas = document.createElement("canvas")
    const scale = 4
    printCanvas.width = canvas.width * scale
    printCanvas.height = canvas.height * scale
    const ctx = printCanvas.getContext("2d")
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(canvas, 0, 0, printCanvas.width, printCanvas.height)
    const link = document.createElement("a")
    link.download = `qr-${survey.slug}.png`
    link.href = printCanvas.toDataURL("image/png")
    link.click()
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-6">Umfrage teilen</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Link Section */}
        <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6">
          <label className="block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-3">Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 text-sm font-mono text-orendt-gray-700 truncate select-all">
              {surveyUrl}
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-3 rounded-xl text-sm font-semibold font-display transition-all flex items-center gap-2 flex-shrink-0 ${
                copied
                  ? "bg-green-100 text-green-700 border-2 border-green-200"
                  : "bg-orendt-black text-orendt-accent border-2 border-orendt-black hover:opacity-90"
              }`}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Kopiert
                </>
              ) : (
                <>
                  {icons.clipboard}
                  Kopieren
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-orendt-gray-400 mt-3">Diesen Link an Teilnehmer senden oder in Einladungen einbetten.</p>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6 flex flex-col items-center">
          <label className="self-start block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-3">QR-Code</label>
          <div ref={qrRef} className="bg-white p-4 rounded-2xl border-2 border-orendt-gray-200">
            <QRCodeCanvas
              value={surveyUrl}
              size={200}
              level="H"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
          </div>
          <button
            onClick={handleDownloadQR}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-orendt-gray-200 text-sm font-semibold font-display text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            QR-Code herunterladen
          </button>
          <p className="text-[11px] text-orendt-gray-400 mt-3 text-center">Druckfertig in 4x Aufloesung (PNG).</p>
        </div>
      </div>
    </div>
  )
}

function SettingsTab({ survey, onSave, responseCount, onDelete, onToggleActive }) {
  const [title, setTitle] = useState(survey?.title || "")
  const [desc, setDesc] = useState(survey?.description || "")
  const [slug, setSlug] = useState(survey?.slug || "")
  const [landingTitle, setLandingTitle] = useState(survey?.landing_title || "")
  const [landingDescription, setLandingDescription] = useState(survey?.landing_description || "")
  const [startButtonLabel, setStartButtonLabel] = useState(survey?.start_button_label || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  // Reset form when survey changes
  useEffect(() => {
    setTitle(survey?.title || "")
    setDesc(survey?.description || "")
    setSlug(survey?.slug || "")
    setLandingTitle(survey?.landing_title || "")
    setLandingDescription(survey?.landing_description || "")
    setStartButtonLabel(survey?.start_button_label || "")
  }, [survey?.id])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      title,
      description: desc,
      slug,
      landing_title: landingTitle || null,
      landing_description: landingDescription || null,
      start_button_label: startButtonLabel || null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 text-sm font-body focus:outline-none focus:border-orendt-black transition-colors"
  const labelClass = "block text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-2"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold">Einstellungen</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-display transition-all ${
            saved
              ? "bg-green-100 text-green-700 border-2 border-green-200"
              : "bg-orendt-black text-orendt-accent border-2 border-orendt-black hover:opacity-90"
          }`}
        >
          {saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Gespeichert
            </>
          ) : (
            <>
              {icons.save}
              {saving ? "Speichert..." : "Speichern"}
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Status Toggle */}
        <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6">
          <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-4">Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orendt-black">
                {survey.is_active ? "Umfrage ist aktiv" : "Umfrage ist deaktiviert"}
              </p>
              <p className="text-[11px] text-orendt-gray-400 mt-0.5">
                {survey.is_active
                  ? "Teilnehmer koennen die Umfrage ausfuellen."
                  : "Die Umfrage ist fuer Teilnehmer nicht sichtbar."}
              </p>
            </div>
            <button
              onClick={onToggleActive}
              className={`
                w-12 h-7 rounded-full transition-colors duration-200 relative flex-shrink-0
                ${survey.is_active ? "bg-green-500" : "bg-orendt-gray-300"}
              `}
            >
              <div
                className={`
                  w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform duration-200
                  ${survey.is_active ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6">
          <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-4">Allgemein</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Titel</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Q3 Mitarbeiter-Feedback" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Beschreibung</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Kurze Beschreibung..." rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>URL Slug</label>
              <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="z.B. q3-feedback" className={`${inputClass} font-mono`} />
              <p className="text-[10px] text-orendt-gray-400 mt-1">Aendert die URL der Umfrage.</p>
            </div>
          </div>
        </div>

        {/* Landing Page Settings */}
        <div className="bg-white rounded-2xl border border-orendt-gray-200 p-6">
          <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-4">Startseite</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Ueberschrift</label>
              <textarea
                value={landingTitle}
                onChange={e => setLandingTitle(e.target.value)}
                placeholder={`${title || "Ueberschrift"}\nZweite Zeile\nDritte Zeile`}
                rows={3}
                className={`${inputClass} resize-none font-mono`}
              />
              <p className="text-[10px] text-orendt-gray-400 mt-1">Jede Zeile = eine Headline-Zeile. Leer lassen = Umfrage-Titel wird verwendet.</p>
            </div>
            <div>
              <label className={labelClass}>Startseiten-Text</label>
              <textarea value={landingDescription} onChange={e => setLandingDescription(e.target.value)} placeholder="Begrüßungstext für Teilnehmer..." rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Button-Text</label>
              <input value={startButtonLabel} onChange={e => setStartButtonLabel(e.target.value)} placeholder="Umfrage starten" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-200 p-6">
          <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-red-400 mb-4">Gefahrenzone</h3>
          {responseCount > 0 ? (
            <div>
              <p className="text-sm text-orendt-gray-600 mb-2">
                Diese Umfrage hat <strong>{responseCount} Antworten</strong> und kann nicht geloescht werden.
              </p>
              <p className="text-[11px] text-orendt-gray-400">
                Deaktiviere die Umfrage oben, um sie fuer Teilnehmer unsichtbar zu machen.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-orendt-gray-600 mb-4">
                Diese Umfrage hat keine Antworten und kann dauerhaft geloescht werden.
              </p>
              {!confirmArchive ? (
                <button
                  onClick={() => setConfirmArchive(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-sm font-semibold font-display text-red-500 hover:bg-red-50 transition-colors"
                >
                  {icons.trash}
                  Umfrage loeschen
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setConfirmArchive(false)}
                    className="px-4 py-2.5 rounded-xl border-2 border-orendt-gray-200 text-sm font-semibold font-display text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={onDelete}
                    className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold font-display hover:bg-red-600 transition-colors"
                  >
                    Endgueltig loeschen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-orendt-gray-200 p-5 h-32 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-display font-bold text-orendt-black">{value}</p>
      {sub ? (
        <p className="text-xs text-orendt-gray-500 mt-1">{sub}</p>
      ) : (
        <div className="h-4" /> /* Spacer for alignment */
      )}
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

function exportToExcel(responses, questions, surveyTitle) {
  const rows = responses.map((r, i) => {
    const row = {
      "#": responses.length - i,
      "Datum": new Date(r.submitted_at).toLocaleDateString("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    }
    questions.forEach((q) => {
      const val = r.answers?.[q.id]
      if (val == null) {
        row[q.question] = ""
      } else if (Array.isArray(val)) {
        row[q.question] = val.join(", ")
      } else if (typeof val === "object") {
        row[q.question] = Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(", ")
      } else {
        row[q.question] = val
      }
    })
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  // Auto-width columns
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key] || "").length)).toString().length > 50
      ? 50
      : Math.max(key.length + 2, ...rows.map((r) => String(r[key] || "").slice(0, 50).length + 2)),
  }))
  ws["!cols"] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Antworten")

  // Summary sheet
  const summaryRows = []
  questions.forEach((q) => {
    if (q.type === "single" || q.type === "multiple") {
      const counts = {}
      ;(q.options || []).forEach((o) => (counts[o] = 0))
      responses.forEach((r) => {
        const val = r.answers?.[q.id]
        if (q.type === "single" && val && counts[val] !== undefined) counts[val]++
        if (q.type === "multiple" && Array.isArray(val)) val.forEach((v) => { if (counts[v] !== undefined) counts[v]++ })
      })
      Object.entries(counts).forEach(([option, count]) => {
        summaryRows.push({ Frage: q.question, Kategorie: q.category, Option: option, Wert: count })
      })
    } else if (q.type === "rating") {
      ;(q.rating_items || []).forEach((item) => {
        let sum = 0, count = 0
        responses.forEach((r) => {
          const val = r.answers?.[q.id]?.[item]
          if (val) { sum += val; count++ }
        })
        summaryRows.push({ Frage: q.question, Kategorie: q.category, Option: item, Wert: count > 0 ? (sum / count).toFixed(1) : "–" })
      })
    }
  })
  if (summaryRows.length > 0) {
    const summaryWs = XLSX.utils.json_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, summaryWs, "Auswertung")
  }

  XLSX.writeFile(wb, `${surveyTitle || "umfrage"}-export.xlsx`)
}

function exportToPDF(responses, questions, stats, surveyTitle) {
  const doc = new jsPDF({ orientation: "landscape" })
  const pageWidth = doc.internal.pageSize.getWidth()

  // Title
  doc.setFontSize(18)
  doc.text(surveyTitle || "Umfrage-Ergebnisse", 14, 20)
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(`${responses.length} Antworten | Exportiert am ${new Date().toLocaleDateString("de-DE")}`, 14, 28)
  doc.setTextColor(0)

  let y = 38

  questions.forEach((q) => {
    const s = stats[q.id]
    if (!s) return

    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      y = 20
    }

    // Question header
    doc.setFontSize(11)
    doc.setFont(undefined, "bold")
    const qLines = doc.splitTextToSize(`${q.category} — ${q.question}`, pageWidth - 28)
    doc.text(qLines, 14, y)
    y += qLines.length * 6 + 2

    doc.setFont(undefined, "normal")
    doc.setFontSize(9)

    if (s.type === "single" || s.type === "multiple") {
      const tableData = Object.entries(s.counts)
        .sort(([, a], [, b]) => b - a)
        .map(([label, count]) => [
          label,
          String(count),
          s.total > 0 ? `${((count / s.total) * 100).toFixed(0)}%` : "0%",
        ])
      autoTable(doc, {
        startY: y,
        head: [["Option", "Anzahl", "Anteil"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [30, 30, 30], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
        tableWidth: "auto",
      })
      y = doc.lastAutoTable.finalY + 10
    } else if (s.type === "rating") {
      const tableData = Object.entries(s.avgs).map(([item, avg]) => [item, `${avg} / 5`])
      autoTable(doc, {
        startY: y,
        head: [["Kriterium", "Durchschnitt"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [30, 30, 30], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
        tableWidth: "auto",
      })
      y = doc.lastAutoTable.finalY + 10
    } else if (s.type === "text") {
      if (s.texts.length > 0) {
        const tableData = s.texts.map((t) => [t])
        autoTable(doc, {
          startY: y,
          head: [["Antworten"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [30, 30, 30], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
          columnStyles: { 0: { cellWidth: "auto" } },
        })
        y = doc.lastAutoTable.finalY + 10
      } else {
        doc.text("Keine Antworten", 14, y)
        y += 10
      }
    }
  })

  doc.save(`${surveyTitle || "umfrage"}-export.pdf`)
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
  const [allProfiles, setAllProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | "new" | question object
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedResponse, setExpandedResponse] = useState(null)
  const [showAdminPicker, setShowAdminPicker] = useState(false)
  const [adminSearch, setAdminSearch] = useState("")
  const [confirmOwnerTransfer, setConfirmOwnerTransfer] = useState(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  // Gate: sign out users who are authenticated but not in survey_admins
  useEffect(() => {
    if (!authLoading && user) {
      isAdminOfAnySurvey().then((isAdmin) => {
        if (!isAdmin) {
          signOut().then(() => router.push("/admin/login?error=access_denied"))
        }
      })
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
    const [qRes, rRes, aRes, pRes] = await Promise.all([
      getQuestions(selectedSurvey.id),
      getResponses(selectedSurvey.id),
      getSurveyAdmins(selectedSurvey.id),
      getAllProfiles()
    ])
    setQuestions(qRes.data || [])
    setResponses(rRes.data || [])
    setAdmins(aRes.data || [])
    setAllProfiles(pRes.data || [])
    setLoading(false)
  }, [selectedSurvey])

  useEffect(() => {
    if (selectedSurvey) {
      loadSurveyData()
    }
  }, [selectedSurvey, loadSurveyData])

  // ─── Handlers ─────────────────

  const handleSaveSurvey = async ({ title, description }) => {
    if (editingSurvey === "new") {
      const { data: newSurvey } = await createSurvey(title, description)
      if (newSurvey) {
        await addCurrentUserAsSurveyAdmin(newSurvey.id)
        setEditingSurvey(null)
        setSelectedSurvey(newSurvey)
        setTab("share")
        return
      }
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
      <div className="min-h-dvh bg-orendt-gray-50 flex items-center justify-center">
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
      <div className="min-h-dvh bg-orendt-gray-50 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-orendt-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="h-9 px-3 py-1.5 bg-orendt-black rounded-lg flex items-center justify-center shadow-sm">
              <img src="/orendtstudios_logo.png" alt="Orendt Studios" className="h-full w-auto object-contain" />
            </div>
            <div className="h-4 w-[1px] bg-orendt-gray-200 mx-1" />
            <span className="text-xs text-orendt-gray-500 font-medium tracking-wide">Admin</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <LegalNavLinks className="text-[10px] text-orendt-gray-400 gap-4" />
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-orendt-gray-200 text-xs font-display font-semibold text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-2xl font-bold">Deine Umfragen</h1>
            <button onClick={() => setEditingSurvey("new")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orendt-black text-orendt-accent font-display font-semibold text-sm hover:opacity-90 transition-opacity">
              {icons.plus} Neue Umfrage
            </button>
          </div>

          {loadingSurveys ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin inline-block" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {surveys.map((s) => (
                <div key={s.id} className="relative group hover:shadow-lg transition-all rounded-2xl h-52">
                  <button
                    onClick={() => setSelectedSurvey(s)}
                    className="w-full h-full bg-white p-6 rounded-2xl border border-orendt-gray-200 hover:border-orendt-black transition-all text-left flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-display uppercase ${
                            s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {s.is_active ? "Aktiv" : "Inaktiv"}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-display text-lg font-bold mb-1 max-w-[90%] truncate">{s.title}</h3>
                    <p className="text-sm text-orendt-gray-500 line-clamp-2 mb-4 flex-grow">
                      {s.description || "Keine Beschreibung"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-orendt-gray-400 font-mono bg-orendt-gray-50 p-2 rounded w-fit mt-auto">
                      /{s.slug}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>

        {editingSurvey === "new" && (
          <SurveyModal
            survey={null}
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
    <div className="min-h-dvh bg-orendt-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-orendt-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setSelectedSurvey(null)} className="p-2 -ml-2 rounded-lg hover:bg-orendt-gray-100 text-orendt-gray-500 shrink-0">
            {icons.chevLeft}
          </button>
          <div className="h-9 px-3 py-1.5 bg-orendt-black rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <img src="/orendtstudios_logo.png" alt="Orendt Studios" className="h-full w-auto object-contain" />
          </div>
          <div className="h-4 w-[1px] bg-orendt-gray-200 mx-1 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-orendt-gray-500 font-medium tracking-wide">Dashboard</span>
            <span className="text-xs font-bold leading-none truncate">{selectedSurvey.title}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <LegalNavLinks className="text-[10px] text-orendt-gray-400 gap-3 sm:gap-4" />
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
        <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-orendt-gray-200 p-1 w-fit overflow-x-auto">
          {[
            { id: "questions", label: "Fragen", icon: icons.clipboard },
            { id: "responses", label: "Ergebnisse", icon: icons.chart },
            { id: "share", label: "Teilen", icon: icons.share },
            { id: "settings", label: "Einstellungen", icon: icons.edit },
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
              <h2 className="font-display text-xl font-bold">Verwaltung</h2>
            </div>

            {/* Owner Section */}
            <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden mb-4">
              <div className="px-6 py-4 border-b border-orendt-gray-200 bg-orendt-gray-50">
                <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500">Owner</h3>
              </div>
              <div className="p-4">
                {(() => {
                  const ownerProfile = allProfiles.find(p => p.id === selectedSurvey.owner_id)
                  return ownerProfile ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orendt-accent flex items-center justify-center text-orendt-black font-display font-bold text-sm">
                        {(ownerProfile.full_name || ownerProfile.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-orendt-black">{ownerProfile.full_name || ownerProfile.email}</span>
                        {ownerProfile.full_name && <span className="text-[11px] text-orendt-gray-400">{ownerProfile.email}</span>}
                      </div>
                      <span className="ml-auto px-2.5 py-1 rounded-lg bg-orendt-accent text-orendt-black text-[10px] font-display font-bold uppercase tracking-wider">
                        Owner
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-orendt-gray-400">Kein Owner zugewiesen</p>
                  )
                })()}
              </div>
            </div>

            {/* Admins Section */}
            <div className="bg-white rounded-2xl border border-orendt-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-orendt-gray-200 bg-orendt-gray-50 flex items-center justify-between">
                <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-orendt-gray-500">Admins</h3>
                <button
                  onClick={() => { setShowAdminPicker(true); setAdminSearch("") }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orendt-black text-orendt-accent text-xs font-semibold font-display hover:opacity-90 transition-opacity"
                >
                  {icons.plus} Admin hinzufuegen
                </button>
              </div>

              {/* Admin List */}
              <div className="divide-y divide-orendt-gray-100">
                {admins.filter(a => a.user_id !== selectedSurvey.owner_id).length === 0 && !showAdminPicker && (
                  <p className="p-6 text-sm text-orendt-gray-400 text-center">Keine weiteren Admins zugewiesen.</p>
                )}
                {admins.filter(a => a.user_id !== selectedSurvey.owner_id).map((admin) => {
                  const profile = allProfiles.find(p => p.id === admin.user_id)
                  return (
                    <div key={admin.id} className="p-4 flex items-center justify-between hover:bg-orendt-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orendt-gray-200 flex items-center justify-center text-orendt-gray-600 font-display font-bold text-sm">
                          {(profile?.full_name || profile?.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-orendt-black">{profile?.full_name || profile?.email || "Unbekannter User"}</span>
                          {profile?.full_name && <span className="text-[11px] text-orendt-gray-400">{profile?.email}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Transfer ownership button - only visible to the owner */}
                        {user.id === selectedSurvey.owner_id && (
                          <button
                            onClick={() => setConfirmOwnerTransfer(admin)}
                            title="Ownership uebertragen"
                            className="px-2.5 py-1.5 text-[10px] font-display font-semibold rounded-lg border border-orendt-gray-200 text-orendt-gray-500 hover:border-orendt-accent hover:text-orendt-black hover:bg-orendt-accent/10 transition-colors"
                          >
                            Zum Owner machen
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (confirm("Diesen Admin wirklich entfernen?")) {
                              await removeSurveyAdmin(admin.id)
                              loadSurveyData()
                            }
                          }}
                          className="p-2 text-orendt-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          {icons.trash}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Admin Picker Dropdown */}
              {showAdminPicker && (
                <div className="border-t border-orendt-gray-200 p-4">
                  <div className="relative">
                    <input
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      placeholder="Name oder E-Mail suchen..."
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-orendt-gray-200 focus:border-orendt-black outline-none text-sm transition-colors"
                    />
                    <button
                      onClick={() => setShowAdminPicker(false)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-orendt-gray-400 hover:text-orendt-black hover:bg-orendt-gray-100 transition-colors"
                    >
                      {icons.x}
                    </button>
                  </div>
                  <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-orendt-gray-200">
                    {(() => {
                      const adminUserIds = admins.map(a => a.user_id)
                      const available = allProfiles.filter(p =>
                        !adminUserIds.includes(p.id) &&
                        p.id !== selectedSurvey.owner_id &&
                        (adminSearch === "" ||
                          (p.full_name || "").toLowerCase().includes(adminSearch.toLowerCase()) ||
                          (p.email || "").toLowerCase().includes(adminSearch.toLowerCase()))
                      )
                      if (available.length === 0) {
                        return <p className="p-4 text-sm text-orendt-gray-400 text-center">Keine verfuegbaren Profile gefunden.</p>
                      }
                      return available.map(profile => (
                        <button
                          key={profile.id}
                          onClick={async () => {
                            const { error } = await addSurveyAdmin(selectedSurvey.id, profile.id)
                            if (error) alert("Fehler: " + error.message)
                            else {
                              setShowAdminPicker(false)
                              setAdminSearch("")
                              loadSurveyData()
                            }
                          }}
                          className="w-full p-3 flex items-center gap-3 hover:bg-orendt-gray-50 transition-colors text-left border-b border-orendt-gray-100 last:border-b-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-orendt-gray-200 flex items-center justify-center text-orendt-gray-600 font-display font-bold text-xs">
                            {(profile.full_name || profile.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-orendt-black">{profile.full_name || profile.email}</span>
                            {profile.full_name && <span className="text-[11px] text-orendt-gray-400">{profile.email}</span>}
                          </div>
                        </button>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Owner Transfer Confirmation Modal */}
            {confirmOwnerTransfer && (() => {
              const transferProfile = allProfiles.find(p => p.id === confirmOwnerTransfer.user_id)
              return (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                  <h3 className="font-display font-bold text-lg mb-2">Ownership uebertragen?</h3>
                  <p className="text-sm text-orendt-gray-600 mb-6">
                    <strong>{transferProfile?.full_name || transferProfile?.email}</strong> wird neuer Owner dieser Umfrage. Du bleibst als Admin erhalten.
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setConfirmOwnerTransfer(null)} className="px-4 py-2.5 rounded-xl border-2 border-orendt-gray-200 text-sm font-semibold font-display text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors">Abbrechen</button>
                    <button
                      onClick={async () => {
                        const { error } = await transferSurveyOwnership(selectedSurvey.id, confirmOwnerTransfer.user_id)
                        if (error) alert("Fehler: " + error.message)
                        else {
                          // Update local state
                          setSelectedSurvey(prev => ({ ...prev, owner_id: confirmOwnerTransfer.user_id }))
                          // Make sure old owner is in admins list
                          const oldOwnerId = selectedSurvey.owner_id
                          const oldOwnerInAdmins = admins.some(a => a.user_id === oldOwnerId)
                          if (!oldOwnerInAdmins) {
                            await addSurveyAdmin(selectedSurvey.id, oldOwnerId)
                          }
                          setConfirmOwnerTransfer(null)
                          loadSurveyData()
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-orendt-black text-orendt-accent text-sm font-semibold font-display hover:opacity-90 transition-opacity"
                    >
                      Uebertragen
                    </button>
                  </div>
                </div>
              </div>
              )
            })()}
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
        ) : tab === "share" ? (
          <ShareTab survey={selectedSurvey} />
        ) : tab === "settings" ? (
          <SettingsTab
            survey={selectedSurvey}
            responseCount={responses.length}
            onSave={async (updates) => {
              await updateSurvey(selectedSurvey.id, updates)
              const { data } = await getAdminSurveys()
              const updated = (data || []).find(s => s.id === selectedSurvey.id)
              if (updated) setSelectedSurvey(updated)
            }}
            onToggleActive={async () => {
              await updateSurvey(selectedSurvey.id, { is_active: !selectedSurvey.is_active })
              const { data } = await getAdminSurveys()
              const updated = (data || []).find(s => s.id === selectedSurvey.id)
              if (updated) setSelectedSurvey(updated)
            }}
            onDelete={async () => {
              await deleteSurvey(selectedSurvey.id)
              setSelectedSurvey(null)
              loadSurveys()
            }}
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">{responses.length} Antworten</h2>
              {responses.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToExcel(responses, questions, selectedSurvey.title)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-orendt-gray-200 text-sm font-semibold font-display text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    Excel
                  </button>
                  <button
                    onClick={() => exportToPDF(responses, questions, stats, selectedSurvey.title)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-orendt-gray-200 text-sm font-semibold font-display text-orendt-gray-600 hover:bg-orendt-gray-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    PDF
                  </button>
                </div>
              )}
            </div>
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
