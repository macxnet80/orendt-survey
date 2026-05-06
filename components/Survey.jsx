"use client"

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react"
import LegalNavLinks from "@/components/LegalNavLinks"
import { getQuestions, getSurveyBySlug } from "@/lib/supabase"

// ─── Sub-components ───────────────────────────────

function applyTwoLineFontSize(el, maxFontCandidatePx, { minFontPx, maxFontPx, lineHeightUnitless = 0.9 }) {
  const hi = Math.min(maxFontPx, Math.max(minFontPx + 1, Math.floor(maxFontCandidatePx)))
  let low = minFontPx
  let high = hi
  let best = minFontPx
  const heightBudget = (px) => px * lineHeightUnitless * 2 + 10
  while (low <= high) {
    const mid = (low + high) >> 1
    el.style.fontSize = `${mid}px`
    if (el.scrollHeight <= heightBudget(mid)) {
      best = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  el.style.fontSize = `${best}px`
}

/** Einen einzeiligen Titel in zwei optisch ausgewogene Zeilen teilen (Wortgrenzen). */
function splitHeadlineIntoTwoBalancedLines(text) {
  const trimmed = (text || "").trim()
  if (!trimmed) return { line1: "", line2: null }
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const longest = words.reduce((w, x) => (x.length > w.length ? x : w), "")
    const longFirst = words[0].length >= 20 && words[0] === longest
    if (longFirst) {
      return {
        line1: words[0],
        line2: words.slice(1).join(" "),
      }
    }
    let bestIdx = 1
    let bestDiff = Infinity
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ")
      const b = words.slice(i).join(" ")
      const diff = Math.abs(a.length - b.length)
      if (diff < bestDiff) {
        bestDiff = diff
        bestIdx = i
      }
    }
    return {
      line1: words.slice(0, bestIdx).join(" "),
      line2: words.slice(bestIdx).join(" "),
    }
  }
  if (trimmed.length >= 16) {
    const mid = Math.floor(trimmed.length / 2)
    return {
      line1: trimmed.slice(0, mid).trimEnd(),
      line2: trimmed.slice(mid).trimStart(),
    }
  }
  return { line1: trimmed, line2: null }
}

/** Landing headline: max two lines; scales font down if text would overflow. */
function LandingHeadline({ line1, line2 }) {
  const containerRef = useRef(null)
  const h1Ref = useRef(null)
  const twoParts = line2 != null

  useLayoutEffect(() => {
    const container = containerRef.current
    const el = h1Ref.current
    if (!container || !el) return

    const measure = () => {
      let maxW = container.offsetWidth
      if (maxW < 48 && typeof window !== "undefined") {
        maxW = Math.max(maxW, window.innerWidth - 48)
      }
      const targetMax = Math.min(176, Math.max(44, Math.floor(maxW * 0.22)))
      applyTwoLineFontSize(el, targetMax, {
        minFontPx: 26,
        maxFontPx: 176,
        lineHeightUnitless: 0.9,
      })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [line1, line2])

  return (
    <div ref={containerRef} className="w-full min-w-0">
      <div
        className="opacity-0 animate-slide-up"
        style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
      >
        <h1
          ref={h1Ref}
          className="font-display font-bold tracking-tight uppercase break-words [overflow-wrap:anywhere] text-white"
          style={{
            lineHeight: 0.9,
            fontSize: "clamp(1.625rem, 8.5vw, 11rem)",
          }}
        >
          {twoParts ? (
            <>
              <span className="text-white">{line1}</span>
              <br />
              <span className="text-orendt-accent">{line2}</span>
            </>
          ) : (
            <span className="text-orendt-accent">{line1}</span>
          )}
        </h1>
      </div>
    </div>
  )
}

/** Fragentitel: maximal zwei Zeilen, ggf. kleinere Schrift. */
function QuestionHeadline({ children }) {
  const containerRef = useRef(null)
  const h2Ref = useRef(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const el = h2Ref.current
    if (!container || !el) return

    const measure = () => {
      const maxW = container.offsetWidth
      applyTwoLineFontSize(el, Math.max(22, maxW * 0.065), {
        minFontPx: 16,
        maxFontPx: 42,
        lineHeightUnitless: 0.95,
      })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [children])

  return (
    <div ref={containerRef} className="w-full min-w-0 mb-2">
      <h2
        ref={h2Ref}
        className="font-display font-bold text-orendt-black tracking-tight break-words [overflow-wrap:anywhere]"
        style={{
          lineHeight: 0.95,
          fontSize: "clamp(1rem, 4.2vw, 1.875rem)",
        }}
      >
        {children}
      </h2>
    </div>
  )
}

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
        {[1, 2, 3, 4, 5].map((n) => (
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

      if (surveyError?.code === "expired" && surveyError.expires_at) {
        const raw = String(surveyError.expires_at).slice(0, 10)
        const [y, mo, da] = raw.split("-").map(Number)
        const label =
          y && mo && da
            ? new Date(y, mo - 1, da).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : raw
        setError(`Diese Umfrage ist am ${label} abgelaufen und wurde deaktiviert.`)
        setLoading(false)
        return
      }

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

  const advancingRef = useRef(false)

  useEffect(() => {
    advancingRef.current = false
  }, [currentQ])

  const canProceed = () => {
    if (!q) return false
    const a = answers[q.id]
    if (!q.is_required) return true
    if (q.type === "text") return !!(a && String(a).trim())
    if (q.type === "multiple") return Array.isArray(a) && a.length > 0
    if (q.type === "single") return !!a
    if (q.type === "rating") {
      const items = q.rating_items || []
      if (items.length === 0) return true
      const obj = a && typeof a === "object" && !Array.isArray(a) ? a : {}
      return items.every((it) => obj[it] != null && obj[it] !== "")
    }
    return !!a
  }

  const goNext = useCallback(
    async (answersPayload) => {
      const payload = answersPayload !== undefined ? answersPayload : answers
      if (currentQ < questions.length - 1) {
        setSlideDir("right")
        setAnimKey((k) => k + 1)
        setCurrentQ((c) => c + 1)
      } else {
        setSubmitting(true)
        try {
          const res = await fetch("/api/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ survey_id: survey.id, answers: payload })
          })
          const json = await res.json().catch(() => ({}))
          if (!res.ok) {
            const detail = typeof json.error === "string" ? json.error : null
            setError(
              detail
                ? `Antworten konnten nicht gespeichert werden: ${detail}`
                : "Antworten konnten nicht gespeichert werden."
            )
            return
          }
          setSubmitted(true)
        } finally {
          setSubmitting(false)
        }
      }
    },
    [answers, currentQ, questions.length, survey]
  )

  /** Eine Auswahl (inkl. Ja/Nein): ein Klick übernimmt die Antwort und geht weiter. */
  const pickSingleAndAdvance = useCallback(
    (opt) => {
      if (!q || q.type !== "single" || advancingRef.current || submitting) return
      const nextAnswers = { ...answers, [q.id]: opt }
      setAnswers(nextAnswers)
      advancingRef.current = true
      queueMicrotask(() => {
        void goNext(nextAnswers)
      })
    },
    [q, answers, submitting, goNext]
  )

  /** Skala: nach vollständiger Bewertung aller Zeilen automatisch weiter. */
  const pickRatingAndMaybeAdvance = useCallback(
    (item, val) => {
      if (!q || q.type !== "rating" || advancingRef.current || submitting) return
      const ratingItems = q.rating_items || []
      const nextEntry = { ...(answers[q.id] || {}), [item]: val }
      const nextAnswers = { ...answers, [q.id]: nextEntry }
      setAnswers(nextAnswers)
      const allFilled =
        ratingItems.length > 0 &&
        ratingItems.every((it) => nextEntry[it] != null && nextEntry[it] !== "")
      if (!allFilled) return
      advancingRef.current = true
      queueMicrotask(() => {
        void goNext(nextAnswers)
      })
    },
    [q, answers, submitting, goNext]
  )

  const showManualNextButton =
    q &&
    (q.type === "multiple" ||
      q.type === "text" ||
      (q.type === "single" && !q.is_required) ||
      (q.type === "rating" && !q.is_required))

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
    const rawTitle = (survey.landing_title || survey.title).toUpperCase()
    const parts = rawTitle.split("\n").map((s) => s.trim()).filter(Boolean)
    let landingLine1 = ""
    let landingLine2 = null
    if (parts.length === 1) {
      const split = splitHeadlineIntoTwoBalancedLines(parts[0])
      landingLine1 = split.line1
      landingLine2 = split.line2
    } else if (parts.length >= 2) {
      landingLine1 = parts[0]
      landingLine2 = parts.slice(1).join(" ")
    }
    const headlineSegmentCount = landingLine2 != null ? 2 : 1
    const descText = survey.landing_description || survey.description
    const btnLabel = survey.start_button_label || "Jetzt starten"

    return (
      <div className="min-h-dvh bg-orendt-black flex flex-col overflow-x-hidden">
        {/* Top bar */}
        <header className="flex items-center px-5 md:px-14 pt-6 md:pt-8 flex-shrink-0 animate-fade-in">
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col justify-between px-5 md:px-14 pt-6 md:pt-10 pb-8 md:pb-12 min-h-0">

          {/* Headline block: max two lines; font scales down when needed */}
          <div>
            <LandingHeadline line1={landingLine1} line2={landingLine2} />
          </div>

          {/* Bottom section */}
          <div
            className="opacity-0 animate-slide-up mt-8 md:mt-0"
            style={{ animationDelay: `${0.15 + headlineSegmentCount * 0.08 + 0.1}s`, animationFillMode: "forwards" }}
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

            {/* Mobile: Logo → Button (zentriert) → Description | Desktop: 1fr / auto / 1fr — Button optisch mittig */}
            <div className="flex flex-col items-center gap-5 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-x-6 md:gap-y-5">
              {/* Logo: top on mobile, rechts auf Desktop */}
              <div className="flex justify-center md:col-start-3 md:row-start-1 md:justify-self-end">
                <OrendtLogo />
              </div>

              {/* Button: zentriert */}
              <div className="flex w-full shrink-0 justify-center md:col-start-2 md:row-start-1 md:w-auto md:justify-self-center">
                <button
                  onClick={() => setStarted(true)}
                  className="group inline-flex items-center justify-center gap-4 bg-orendt-accent text-orendt-black font-display font-bold text-sm uppercase tracking-widest px-8 py-4 md:py-5 rounded-full transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  <span>{btnLabel}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Description: max-w-sm + 25% ≈ 30rem */}
              {descText && (
                <p className="max-w-[30rem] text-center font-body text-sm leading-relaxed text-orendt-gray-400 md:col-start-1 md:row-start-1 md:justify-self-start md:text-left md:text-base">
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
      {/* Header — mobil: Logo zentriert; Rechtliches siehe unter den Fragen */}
      <header className="border-b border-orendt-gray-200 px-6 py-4 md:flex md:items-center md:justify-between md:px-8 md:py-5">
        <div className="flex justify-center md:justify-start">
          <OrendtLogo />
        </div>
        <div className="mt-3 flex justify-center md:mt-0 md:max-w-[min(100%,24rem)] md:justify-end">
          <div className="flex items-center gap-2 justify-center md:justify-end">
            <div className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-orendt-black sm:block" />
            <span className="max-w-full truncate text-center font-display text-[10px] font-medium uppercase tracking-[0.15em] text-orendt-gray-500 md:text-right">
              {survey.title}
            </span>
          </div>
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
          <QuestionHeadline>{q.question}</QuestionHeadline>

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
                  onClick={() => pickSingleAndAdvance(opt)}
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
                  onChange={(val) => pickRatingAndMaybeAdvance(item, val)}
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

          {/* Navigation — Weiter nur wenn nötig (Mehrfachauswahl, Text, optionale Einzel-/Rating-Fragen) */}
          <div
            className={`mt-10 flex items-center ${showManualNextButton ? "justify-between" : "justify-start"}`}
          >
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

            {showManualNextButton && (
              <button
                type="button"
                onClick={() => void goNext()}
                disabled={!canProceed() || submitting}
                className={`
                  flex min-h-[44px] items-center gap-2 px-6 py-3 rounded-xl font-display font-semibold text-sm
                  tracking-wide transition-all duration-200 border-0
                  ${canProceed()
                    ? "bg-orendt-black text-orendt-accent hover:opacity-90"
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
            )}
          </div>

          <div className="mt-10 flex justify-center border-t border-orendt-gray-100 pt-6">
            <LegalNavLinks className="justify-center gap-6 text-[9px] font-normal tracking-[0.18em] text-orendt-gray-300" />
          </div>
        </div>
      </main>
    </div>
  )
}
