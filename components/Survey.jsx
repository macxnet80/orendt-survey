"use client"

import { useState, useEffect, useCallback } from "react"
import { getQuestions, submitResponse, getSurveyBySlug } from "@/lib/supabase"

// ─── Sub-components ───────────────────────────────

function ProgressBar({ current, total }) {
  const pct = ((current + 1) / total) * 100
  return (
    <div className="w-full h-[3px] bg-orendt-gray-200">
      <div
        className="h-full bg-orendt-black transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function OptionButton({ selected, onClick, children, index }) {
  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-4 w-full p-4 rounded-xl border-2 text-left
        font-body text-[15px] transition-all duration-200
        opacity-0 animate-slide-up
        ${selected
          ? "border-orendt-black bg-orendt-black text-white"
          : "border-orendt-gray-200 bg-white text-orendt-black hover:border-orendt-gray-400 hover:translate-x-1"
        }
      `}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "forwards" }}
    >
      <span
        className={`
          w-7 h-7 rounded-lg border-2 flex items-center justify-center
          flex-shrink-0 text-xs font-bold font-display transition-all duration-200
          ${selected
            ? "border-orendt-accent bg-orendt-accent text-orendt-black"
            : "border-orendt-gray-300 text-orendt-gray-500 group-hover:border-orendt-gray-500"
          }
        `}
      >
        {selected ? "✓" : String.fromCharCode(65 + index)}
      </span>
      <span className={selected ? "font-semibold" : "font-normal"}>{children}</span>
    </button>
  )
}

function RatingRow({ label, value, onChange, index }) {
  return (
    <div
      className="flex items-center justify-between py-4 border-b border-orendt-gray-200 opacity-0 animate-slide-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "forwards" }}
    >
      <span className="text-sm text-orendt-black font-body flex-1 pr-4">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`
              w-10 h-10 rounded-lg border-2 font-display font-bold text-sm
              transition-all duration-200
              ${value === n
                ? "border-orendt-black bg-orendt-black text-orendt-accent"
                : "border-orendt-gray-200 text-orendt-gray-500 hover:border-orendt-gray-400"
              }
            `}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      className="
        w-full p-5 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50
        font-body text-[15px] text-orendt-black resize-y
        transition-colors duration-200 opacity-0 animate-slide-up
        focus:border-orendt-black focus:outline-none
        placeholder:text-orendt-gray-400
      "
      style={{ animationFillMode: "forwards" }}
    />
  )
}

function OrendtLogo() {
  return (
    <div className="h-10 px-4 py-2 bg-orendt-black rounded-lg flex items-center justify-center">
      <img
        src="/orendtstudios_logo.png"
        alt="Orendt Studios"
        className="h-full w-auto object-contain"
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
          e.target.parentNode.innerText = 'ORENDT';
          e.target.parentNode.style.color = 'white';
          e.target.parentNode.style.fontWeight = 'bold';
        }}
      />
    </div>
  )
}

// ─── Main Survey ───────────────────────────────────

export default function Survey({ slug }) {
  const [survey, setSurvey] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [slideDir, setSlideDir] = useState("right")

  useEffect(() => {
    async function load() {
      // 1. Fetch Survey
      if (!slug) {
        setError("Keine Umfrage angegeben.")
        setLoading(false)
        return
      }

      const { data: surveyData, error: surveyError } = await getSurveyBySlug(slug)

      if (surveyError || !surveyData) {
        setError("Umfrage nicht gefunden.")
        setLoading(false)
        return
      }

      setSurvey(surveyData)

      if (!surveyData.is_active) {
        setError("Diese Umfrage ist nicht mehr aktiv.")
        setLoading(false)
        return
      }

      // 2. Fetch Questions
      const { data: questionsData, error: questionsError } = await getQuestions(surveyData.id)

      if (questionsError) {
        setError("Fehler beim Laden der Fragen.")
      } else if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData)
      } else {
        setError("Keine Fragen in dieser Umfrage gefunden.")
      }

      setLoading(false)
    }
    load()
  }, [slug])

  const q = questions[currentQ]

  const setAnswer = useCallback((val) => {
    if (!q) return
    setAnswers((prev) => ({ ...prev, [q.id]: val }))
  }, [q])

  const toggleMulti = useCallback((opt) => {
    if (!q) return
    setAnswers((prev) => {
      const current = prev[q.id] || []
      const next = current.includes(opt)
        ? current.filter((o) => o !== opt)
        : [...current, opt]
      return { ...prev, [q.id]: next }
    })
  }, [q])

  const setRating = useCallback((item, val) => {
    if (!q) return
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { ...(prev[q.id] || {}), [item]: val },
    }))
  }, [q])

  const canProceed = () => {
    if (!q) return false
    const a = answers[q.id]
    if (!q.is_required) return true
    if (q.type === "text" || q.type === "rating") return !!a // Simple check, could be more robust
    if (q.type === "multiple") return a && a.length > 0
    return !!a
  }

  const goNext = async () => {
    if (currentQ < questions.length - 1) {
      setSlideDir("right")
      setAnimKey((k) => k + 1)
      setCurrentQ((c) => c + 1)
    } else {
      setSubmitting(true)
      await submitResponse(survey.id, answers)
      setSubmitted(true)
      setSubmitting(false)
    }
  }

  const goBack = () => {
    if (currentQ > 0) {
      setSlideDir("left")
      setAnimKey((k) => k + 1)
      setCurrentQ((c) => c - 1)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <a href="/" className="text-sm underline">Zur Startseite</a>
        </div>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-orendt-black flex items-center justify-center mx-auto mb-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E8FF00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-orendt-gray-500 mb-3">
            Umfrage abgeschlossen
          </p>
          <h1 className="font-display text-4xl font-bold text-orendt-black mb-4 uppercase tracking-tight">
            Vielen Dank!
          </h1>
          <p className="text-base text-orendt-gray-600 leading-relaxed">
            Dein Feedback hilft uns, die Prozesse gemeinsam zu verbessern.
            Alle Antworten werden anonym ausgewertet.
          </p>
        </div>
      </div>
    )
  }

  if (!q) return null

  const ratingItems = q.rating_items || []
  const options = q.options || []

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 md:px-8 py-5 flex items-center justify-between border-b border-orendt-gray-200">
        <OrendtLogo />
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline font-display text-[11px] tracking-[0.12em] uppercase text-orendt-gray-500 font-medium">
            Anonym
          </span>
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
      </header>

      <ProgressBar current={currentQ} total={questions.length} />

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div
          key={animKey}
          className={`w-full max-w-xl ${slideDir === "right" ? "animate-slide-right" : "animate-slide-left"}`}
        >
          {/* Category + Counter */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-orendt-gray-500">
              {q.category}
            </span>
            <span className="font-display text-sm font-semibold text-orendt-gray-400">
              {String(currentQ + 1).padStart(2, "0")}/{String(questions.length).padStart(2, "0")}
            </span>
          </div>

          {/* Question */}
          <h2 className="font-display text-2xl md:text-3xl font-bold text-orendt-black mb-2 leading-tight tracking-tight">
            {q.question}
          </h2>
          {/* Survey Title Context */}
          <p className="text-xs uppercase text-orendt-gray-400 mb-4 tracking-widest">{survey.title}</p>

          {q.subtitle && (
            <p className="text-sm text-orendt-gray-500 mb-6">{q.subtitle}</p>
          )}
          {!q.subtitle && <div className="mb-6" />}

          {/* Answer Area */}
          {q.type === "single" && (
            <div className="flex flex-col gap-2.5 animate-stagger">
              {options.map((opt, i) => (
                <OptionButton
                  key={opt}
                  index={i}
                  selected={answers[q.id] === opt}
                  onClick={() => setAnswer(opt)}
                >
                  {opt}
                </OptionButton>
              ))}
            </div>
          )}

          {q.type === "multiple" && (
            <div className="flex flex-col gap-2.5 animate-stagger">
              {options.map((opt, i) => (
                <OptionButton
                  key={opt}
                  index={i}
                  selected={(answers[q.id] || []).includes(opt)}
                  onClick={() => toggleMulti(opt)}
                >
                  {opt}
                </OptionButton>
              ))}
            </div>
          )}

          {q.type === "rating" && (
            <div className="animate-stagger">
              {ratingItems.map((item, i) => (
                <RatingRow
                  key={item}
                  label={item}
                  index={i}
                  value={(answers[q.id] || {})[item]}
                  onChange={(val) => setRating(item, val)}
                />
              ))}
            </div>
          )}

          {q.type === "text" && (
            <TextInput
              value={answers[q.id] || ""}
              onChange={(val) => setAnswer(val)}
              placeholder={q.placeholder || "Deine Antwort..."}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10">
            <button
              onClick={goBack}
              disabled={currentQ === 0}
              className={`
                flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-display font-semibold text-sm
                tracking-wide transition-all duration-200
                ${currentQ === 0
                  ? "border-orendt-gray-200 text-orendt-gray-400 cursor-not-allowed"
                  : "border-orendt-black text-orendt-black hover:bg-orendt-gray-50"
                }
              `}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Zurück
            </button>

            <button
              onClick={goNext}
              disabled={!canProceed() || submitting}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-display font-semibold text-sm
                tracking-wide transition-all duration-200 border-0
                ${canProceed()
                  ? "bg-orendt-black text-orendt-accent hover:opacity-90 animate-pulse"
                  : "bg-orendt-gray-200 text-orendt-gray-400 cursor-not-allowed"
                }
              `}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-orendt-accent/30 border-t-orendt-accent rounded-full animate-spin" />
              ) : (
                <>
                  {currentQ === questions.length - 1 ? "Absenden" : "Weiter"}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-orendt-gray-200 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-orendt-black" />
        <span className="font-display text-[10px] font-medium tracking-[0.15em] uppercase text-orendt-gray-500">
          Orendt Studios – {survey.title}
        </span>
      </footer>
    </div>
  )
}
