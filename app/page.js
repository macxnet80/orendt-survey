"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getSurveys } from "@/lib/supabase"

export default function Home() {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await getSurveys()
      if (data) setSurveys(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orendt-gray-50 flex flex-col items-center justify-center p-6 bg-[url('/grid.svg')]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-orendt-gray-100">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-orendt-black mb-2 uppercase tracking-tight">Orendt Studios</h1>
          <p className="text-orendt-gray-500 text-sm tracking-wide uppercase font-medium">Verfügbare Umfragen</p>
        </div>

        <div className="space-y-4">
          {surveys.length === 0 ? (
            <p className="text-center text-orendt-gray-400">Keine aktiven Umfragen gefunden.</p>
          ) : (
            surveys.map(survey => (
              <Link
                key={survey.id}
                href={`/${survey.slug}`}
                className="block group"
              >
                <div className="p-5 rounded-xl border-2 border-orendt-gray-200 hover:border-orendt-black bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-display text-xs font-bold text-orendt-accent bg-orendt-black px-2 py-0.5 rounded">
                      AKTIV
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orendt-gray-300 group-hover:text-orendt-black transition-colors">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-orendt-black mb-1 group-hover:text-orendt-black transition-colors">
                    {survey.title}
                  </h3>
                  {survey.description && (
                    <p className="text-sm text-orendt-gray-500 line-clamp-2">
                      {survey.description}
                    </p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="mt-12 text-center">
          <Link href="/admin" className="text-xs text-orendt-gray-400 hover:text-orendt-black underline underline-offset-4 decoration-orendt-gray-200 hover:decoration-orendt-black transition-all">
            Zum Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
