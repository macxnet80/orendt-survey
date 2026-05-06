/**
 * Server-only: Umfragedaten zusammenfasen (Claude primaer, OpenAI Fallback).
 */

const RESPONSES_FETCH_PAGE = 1000
const FETCH_TIMEOUT_MS = 30_000
const TEXT_SAMPLE_PER_QUESTION = 40
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"

function pickOptions(q) {
  if (!Array.isArray(q.options)) return []
  return q.options.filter((o) => o != null && String(o).trim() !== "")
}

function pickRatingItems(q) {
  if (!Array.isArray(q.rating_items)) return []
  return q.rating_items.filter((o) => o != null && String(o).trim() !== "")
}

/**
 * Kompakte statistische Eingabe + Stichwort-Text fuer das Modell (Deutsch).
 */
export function buildSummaryPrompt({ survey, questions, responses }) {
  const n = responses.length
  const lines = []
  lines.push(`Umfragetitel: ${survey?.title ?? "—"}`)
  if (survey?.description) lines.push(`Beschreibung: ${survey.description}`)
  lines.push(`Anzahl Abgaben: ${n}`)
  lines.push("")
  lines.push(
    'Erstelle eine professionelle deutschsprachige Zusammenfassung fuer die Geschaeftsleitung. Strukturiere sie mit Markdown ueberschriften (##) in genau diesem Aufbau:'
  )
  lines.push("")
  lines.push("## Top-Erkenntnisse")
  lines.push("## Themen und Muster")
  lines.push("## Auffaelligkeiten / Risiken")
  lines.push("## Moegliche Massnahmen (allgemein, ohne Personenbezug)")
  lines.push("")
  lines.push(`Ziel-Laenge etwa 250 bis 450 Woerter. Keine konkreten Personen oder verdaechtigen Rueckschluesse auf Einzelpersonen. ` +
    `Beton aggregierte Trends. Bei wenigen Antworten klar erwaehnen dass Stichprobengroesse klein ist.`)
  lines.push("")
  lines.push("---")
  lines.push("")
  lines.push(`## Datenbasis (${n} Antworten)`)
  lines.push("")

  if (n === 0) {
    lines.push("(Keine Antworten)")
    return lines.join("\n")
  }

  const sortedQ = [...questions].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  sortedQ.forEach((q) => {
    lines.push(`### [${String(q.category || "").trim() || "?"}] ${q.question}`)
    lines.push(`Typ: ${q.type}`)

    if (q.type === "single") {
      const counts = {}
      pickOptions(q).forEach((o) => {
        counts[o] = 0
      })
      responses.forEach((r) => {
        const val = r.answers?.[q.id]
        if (val == null || val === "") return
        if (counts[val] === undefined) counts[val] = 0
        counts[val]++
      })
      const pairs = Object.entries(counts).sort((a, b) => b[1] - a[1])
      pairs.forEach(([opt, cnt]) => {
        const pct = n > 0 ? ((cnt / n) * 100).toFixed(0) : "0"
        lines.push(`  - "${opt}": ${cnt} (${pct}% der Teilnehmer)`)
      })
      lines.push("")
      return
    }

    if (q.type === "multiple") {
      const counts = {}
      pickOptions(q).forEach((o) => {
        counts[o] = 0
      })
      responses.forEach((r) => {
        const vals = r.answers?.[q.id]
        if (!Array.isArray(vals)) return
        vals.forEach((v) => {
          if (v == null || v === "") return
          if (counts[v] === undefined) counts[v] = 0
          counts[v]++
        })
      })
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([opt, cnt]) => {
          const pct = n > 0 ? ((cnt / n) * 100).toFixed(0) : "0"
          lines.push(`  - "${opt}": genannt von ${cnt} Antwortzeilen (${pct}%)`)
        })
      lines.push("")
      return
    }

    if (q.type === "rating") {
      const items = new Set(pickRatingItems(q))
      responses.forEach((r) => {
        Object.keys(r.answers?.[q.id] || {}).forEach((k) => items.add(k))
      })
      ;[...items].sort().forEach((item) => {
        let sum = 0
        let c = 0
        responses.forEach((r) => {
          const val = r.answers?.[q.id]?.[item]
          if (val != null && val !== "") {
            sum += Number(val)
            c++
          }
        })
        const avg = c > 0 ? (sum / c).toFixed(2) : "—"
        lines.push(`  - "${item}": Durchschnitt ${avg} / 5 (n=${c})`)
      })
      lines.push("")
      return
    }

    if (q.type === "text") {
      const nonempty = responses
        .map((r) => r.answers?.[q.id])
        .filter((t) => t != null && String(t).trim() !== "")
      lines.push(`  Freitext-Antworten (${nonempty.length} nicht leer)`)
      const sample = nonempty.slice(0, TEXT_SAMPLE_PER_QUESTION)
      sample.forEach((txt, idx) => {
        const clipped = String(txt).replace(/\s+/g, " ").slice(0, 400)
        lines.push(`  ${idx + 1}. „${clipped}${String(txt).length > 400 ? "…" : ""}“`)
      })
      if (nonempty.length > TEXT_SAMPLE_PER_QUESTION) {
        lines.push(`  … und ${nonempty.length - TEXT_SAMPLE_PER_QUESTION} weitere`)
      }
      lines.push("")
    }
  })

  return lines.join("\n")
}

async function fetchJsonWithTimeout(url, init) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal })
    let body
    try {
      body = await res.json()
    } catch {
      body = {}
    }
    return { ok: res.ok, status: res.status, body }
  } finally {
    clearTimeout(t)
  }
}

/**
 * Extrahiert sichtbaren Text aus Claude Messages API Response.
 */
function extractAnthropicContent(body) {
  const parts = body?.content
  if (!Array.isArray(parts)) return ""
  return parts
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim()
}

async function callClaude(prompt) {
  const key = process.env.ANTHROPIC_API_KEY
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5"
  if (!key) throw new Error("ANTHROPIC_API_KEY fehlt.")

  const { ok, status, body } = await fetchJsonWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": key,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    }
  )

  if (!ok) {
    const msg = body?.error?.message ?? JSON.stringify(body) ?? String(status)
    throw new Error(`Claude (${status}): ${msg}`)
  }

  const text = extractAnthropicContent(body)
  if (!text) throw new Error("Claude lieferte leeren Text.")
  return { text, modelUsed: `${model}` }
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || "gpt-4o"
  if (!key) throw new Error("OPENAI_API_KEY fehlt.")

  const { ok, status, body } = await fetchJsonWithTimeout(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
    }),
  })

  if (!ok) {
    const msg = body?.error?.message ?? JSON.stringify(body) ?? String(status)
    throw new Error(`OpenAI (${status}): ${msg}`)
  }

  const text = body?.choices?.[0]?.message?.content ?? ""
  const trimmed = String(text).trim()
  if (!trimmed) throw new Error("OpenAI lieferte leeren Text.")
  return { text: trimmed, modelUsed: `${model}` }
}

export async function summarizeSurveyData({ survey, questions, responses }) {
  const prompt = buildSummaryPrompt({ survey, questions, responses })

  try {
    const { text, modelUsed } = await callClaude(prompt)
    return { summary: text, model: modelUsed }
  } catch (claudeErr) {
    try {
      const { text, modelUsed } = await callOpenAI(prompt)
      return { summary: text, model: `${modelUsed} (Fallback nach Claude)` }
    } catch (openAiErr) {
      const ce = claudeErr instanceof Error ? claudeErr.message : String(claudeErr)
      const oe = openAiErr instanceof Error ? openAiErr.message : String(openAiErr)
      throw new Error(`KI nicht verfügbar. Claude: ${ce} | OpenAI: ${oe}`)
    }
  }
}
