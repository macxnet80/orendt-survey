"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithMagicLink } from "@/lib/supabase"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")
    const { error: authError } = await signInWithMagicLink(email)
    setLoading(false)
    if (authError) {
      setError("Fehler beim Senden des Links. Bitte prüfe die E-Mail-Adresse.")
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-orendt-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <div className="h-16 px-6 py-3 bg-orendt-black rounded-2xl flex items-center justify-center shadow-xl transform -rotate-2">
            <img
              src="/orendtstudios_logo.png"
              alt="Orendt Studios"
              className="h-full w-auto object-contain"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.parentNode.style.color = "white"
                e.target.parentNode.style.fontWeight = "bold"
                e.target.parentNode.innerText = "ORENDT"
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-orendt-gray-200 p-8 shadow-sm">
          {sent ? (
            // ── Success State ──────────────────────────
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-bold text-orendt-black mb-2">E-Mail gesendet!</h2>
              <p className="text-sm text-orendt-gray-500 leading-relaxed">
                Wir haben einen Magic Link an <span className="font-semibold text-orendt-black">{email}</span> gesendet. Bitte klicke auf den Link in der E-Mail.
              </p>
              <button
                onClick={() => { setSent(false); setEmail("") }}
                className="mt-6 text-xs text-orendt-gray-400 hover:text-orendt-black underline underline-offset-4 transition-colors"
              >
                Andere E-Mail verwenden
              </button>
            </div>
          ) : (
            // ── Login Form ─────────────────────────────
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="w-14 h-14 rounded-full bg-orendt-gray-100 flex items-center justify-center text-orendt-gray-500">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-center mb-1 text-orendt-black">Admin Login</h2>
              <p className="text-sm text-orendt-gray-500 text-center mb-6">
                Magic Link per E-Mail anfordern
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  autoFocus
                  required
                  className={`
                    w-full px-4 py-3 rounded-xl border-2 font-body text-sm
                    focus:outline-none transition-colors duration-200
                    ${error
                      ? "border-red-400 bg-red-50 placeholder:text-red-300"
                      : "border-orendt-gray-200 bg-orendt-gray-50 focus:border-orendt-black placeholder:text-orendt-gray-400"
                    }
                  `}
                />
                {error && (
                  <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-orendt-black text-orendt-accent font-display font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-orendt-accent/30 border-t-orendt-accent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      Magic Link senden
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
