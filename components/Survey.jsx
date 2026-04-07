"use client"

import { useState, useEffect, useCallback } from "react"
import LegalNavLinks from "@/components/LegalNavLinks"
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
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 py-4 border-b border-orendt-gray-200 opacity-0 animate-slide-up min-w-0"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "forwards" }}
    >
      <span className="text-sm text-orendt-black font-body sm:flex-1 sm:pr-4 sm:min-w-0">{label}</span>
      <div
        className="
          grid w-full min-w-0 grid-cols-5 gap-1.5
          sm:flex sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-1.5 sm:shrink-0
        "
        role="group"
        aria-label={`Bewertung für ${label}`}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`
              flex h-11 w-full min-w-0 items-center justify-center rounded-lg border-2 font-display font-bold text-xs
              transition-all duration-200 touch-manipulation sm:h-10 sm:w-10 sm:text-sm
              ${value === n
                ? "border-orendt-black bg-orendt-black text-orendt-accent"
                : "border-orendt-gray-200 text-orendt-gray-600 hover:border-orendt-gray-400 hover:text-orendt-black"
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
  const [started, setStarted] = useState(false)
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
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center p-6">
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
      <div className="min-h-dvh bg-white flex items-center justify-center p-6">
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

  // Landing page
  if (!started) {
    // Split by \n for admin-controlled line breaks.
    // If no newlines, render as a single block (no word-per-line splitting).
    const rawTitle = (survey.landing_title || survey.title).toUpperCase()
    const headlineLines = rawTitle.includes("\n") ? rawTitle.split("\n") : [rawTitle]
    const descText = survey.landing_description || survey.description
    const btnLabel = survey.start_button_label || "Jetzt starten"

    return (
      <div className="min-h-dvh bg-orendt-black flex flex-col overflow-x-hidden">
        {/* Top bar */}
        <header className="flex items-center px-5 md:px-14 pt-6 md:pt-8 flex-shrink-0 animate-fade-in">
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col justify-between px-5 md:px-14 pt-6 md:pt-10 pb-8 md:pb-12 min-h-0">

          {/* Headline block */}
          <div>
            <h1
              className="font-display font-bold tracking-tight uppercase text-white break-words"
              style={{ fontSize: "clamp(1.8rem, 7.5vw, 7.5rem)", lineHeight: 0.9 }}
            >
              {headlineLines.map((line, i) => (
                <span
                  key={i}
                  className="block opacity-0 animate-slide-up"
                  style={{ animationDelay: `${0.15 + i * 0.08}s`, animationFillMode: "forwards" }}
                >
                  {i === headlineLines.length - 1
                    ? <span className="text-orendt-accent">{line}</span>
                    : line
                  }
                </span>
              ))}
            </h1>
          </div>

          {/* Bottom section */}
          <div
            className="opacity-0 animate-slide-up mt-8 md:mt-0"
            style={{ animationDelay: `${0.15 + headlineLines.length * 0.08 + 0.1}s`, animationFillMode: "forwards" }}
          >
            {/* Divider */}
            <div className="flex items-center gap-4 mb-5 md:mb-8">
              <div className="h-px flex-1 bg-orendt-gray-800" />
              {questions.length > 0 && (
                <span className="font-display text-[10px] tracking-[0.3em] uppercase text-orendt-gray-700">
                  {questions.length} Fragen
                </span>
              )}
            </div>

            {/* Mobile: Logo → Button → Description | Desktop: Description | Button | Logo */}
            <div className="flex flex-col items-center gap-5 md:flex-row md:items-center">
              {/* Logo: top on mobile, right on desktop */}
              <div className="md:order-3 md:flex-1 md:flex md:justify-end">
                <OrendtLogo />
              </div>

              {/* Button: middle on mobile, center on desktop */}
              <div className="flex-shrink-0 w-full md:w-auto md:order-2">
                <button
                  onClick={() => setStarted(true)}
                  className="group w-full md:w-auto inline-flex items-center justify-center gap-4 bg-orendt-accent text-orendt-black font-display font-bold text-sm uppercase tracking-widest px-8 py-4 md:py-5 rounded-full hover:scale-105 active:scale-95 transition-transform duration-200 animate-pulse"
                >
                  <span>{btnLabel}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Description: bottom on mobile, left on desktop */}
              {descText && (
                <p className="text-orendt-gray-400 font-body text-sm md:text-base leading-relaxed max-w-sm text-center md:text-left md:order-1 md:flex-1">
                  {descText}
                </p>
              )}
            </div>

            <div className="mt-8 md:mt-10 flex justify-center md:justify-end">
              <LegalNavLinks
                variant="dark"
                className="text-[10px] tracking-[0.28em] gap-x-8 gap-y-2 md:justify-end"
              />
            </div>
          </div>
        </main>

        {/* Bottom accent line */}
        <div className="h-px w-full bg-orendt-accent opacity-20 flex-shrink-0" />
      </div>
    )
  }

  if (!q) return null

  const ratingItems = q.rating_items || []
  const options = q.options || []

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 md:px-8 py-4 md:py-5 flex flex-wrap items-center justify-between gap-4 border-b border-orendt-gray-200">
        <OrendtLogo />
        <div className="flex flex-col items-end gap-2 min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 justify-end">
            <div className="w-1.5 h-1.5 rounded-full bg-orendt-black shrink-0 hidden sm:block" />
            <span className="font-display text-[10px] font-medium tracking-[0.15em] uppercase text-orendt-gray-500 text-right truncate max-w-full sm:max-w-[min(100%,20rem)]">
              Orendt Studios – {survey.title}
            </span>
          </div>
          <LegalNavLinks className="text-[10px] tracking-[0.15em] text-orendt-gray-500 justify-end gap-4" />
        </div>
      </header>

      <ProgressBar current={currentQ} total={questions.length} />

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div
          key={animKey}
          className={`w-full min-w-0 max-w-xl ${slideDir === "right" ? "animate-slide-right" : "animate-slide-left"}`}
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
                flex min-h-[44px] items-center gap-2 px-5 py-3 rounded-xl border-2 font-display font-semibold text-sm
                tracking-wide transition-all duration-200
                ${currentQ === 0
                  ? "border-orendt-gray-200 text-orendt-gray-500 cursor-not-allowed"
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
                tracking-wide transition-all duration-200 border-0 min-h-[44px]
                ${canProceed()
                  ? "bg-orendt-black text-orendt-accent hover:opacity-90 animate-pulse"
                  : "bg-orendt-gray-200 text-orendt-gray-600 cursor-not-allowed"
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
    </div>
  )
}
