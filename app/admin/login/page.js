"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import LegalNavLinks from "@/components/LegalNavLinks"
import { signInWithPassword, sendPasswordReset } from "@/lib/supabase"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [view, setView] = useState("login") // "login" | "reset"
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("error") === "access_denied") {
      setError("Kein Zugang. Deine E-Mail ist nicht als Admin hinterlegt.")
    }
  }, [searchParams])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError("")
    const { error: authError } = await signInWithPassword(email, password)
    setLoading(false)
    if (authError) {
      setError("E-Mail oder Passwort falsch.")
    } else {
      router.push("/admin")
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")
    const { error: resetError } = await sendPasswordReset(email)
    setLoading(false)
    if (resetError) {
      setError("Fehler beim Senden. Bitte prüfe die E-Mail-Adresse.")
    } else {
      setResetSent(true)
    }
  }

  return (
    <div className="min-h-dvh bg-orendt-gray-50 flex items-center justify-center p-6">
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
                e.target.parentNode.innerText = "ORENDT"
                e.target.parentNode.style.color = "white"
                e.target.parentNode.style.fontWeight = "bold"
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-orendt-gray-200 p-8 shadow-sm">

          {/* ── Reset: Success ── */}
          {view === "reset" && resetSent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-bold text-orendt-black mb-2">E-Mail gesendet!</h2>
              <p className="text-sm text-orendt-gray-500 leading-relaxed">
                Wir haben einen Reset-Link an <span className="font-semibold text-orendt-black">{email}</span> gesendet.
              </p>
              <button
                onClick={() => { setView("login"); setResetSent(false) }}
                className="mt-6 text-xs text-orendt-gray-400 hover:text-orendt-black underline underline-offset-4 transition-colors"
              >
                Zurück zum Login
              </button>
            </div>

          ) : view === "reset" ? (
            /* ── Reset Form ── */
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="w-14 h-14 rounded-full bg-orendt-gray-100 flex items-center justify-center text-orendt-gray-500">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-center mb-1 text-orendt-black">Passwort zurücksetzen</h2>
              <p className="text-sm text-orendt-gray-500 text-center mb-6">
                Wir senden dir einen Reset-Link per E-Mail.
              </p>

              <form onSubmit={handleReset}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  placeholder="deine@email.de"
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-orendt-gray-200 bg-orendt-gray-50 font-body text-sm focus:outline-none focus:border-orendt-black transition-colors placeholder:text-orendt-gray-400"
                />
                {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-orendt-black text-orendt-accent font-display font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-orendt-accent/30 border-t-orendt-accent rounded-full animate-spin" />
                    : "Reset-Link senden"
                  }
                </button>
              </form>

              <button
                onClick={() => { setView("login"); setError("") }}
                className="mt-5 w-full text-center text-xs text-orendt-gray-400 hover:text-orendt-black transition-colors"
              >
                ← Zurück zum Login
              </button>
            </>

          ) : (
            /* ── Login Form ── */
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
                Mit deinen Admin-Zugangsdaten anmelden
              </p>

              {/* Access denied banner */}
              {error && error.includes("Kein Zugang") && (
                <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-xs text-red-700 font-medium leading-snug">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3">
                {/* Email */}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  placeholder="E-Mail"
                  autoFocus
                  required
                  className={`
                    w-full px-4 py-3 rounded-xl border-2 font-body text-sm
                    focus:outline-none transition-colors duration-200
                    ${error && !error.includes("Kein Zugang")
                      ? "border-red-400 bg-red-50 placeholder:text-red-300"
                      : "border-orendt-gray-200 bg-orendt-gray-50 focus:border-orendt-black placeholder:text-orendt-gray-400"
                    }
                  `}
                />

                {/* Password */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
                    placeholder="Passwort"
                    required
                    className={`
                      w-full px-4 py-3 pr-11 rounded-xl border-2 font-body text-sm
                      focus:outline-none transition-colors duration-200
                      ${error && !error.includes("Kein Zugang")
                        ? "border-red-400 bg-red-50 placeholder:text-red-300"
                        : "border-orendt-gray-200 bg-orendt-gray-50 focus:border-orendt-black placeholder:text-orendt-gray-400"
                      }
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-orendt-gray-400 hover:text-orendt-black transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {error && !error.includes("Kein Zugang") && (
                  <p className="text-red-500 text-xs font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-orendt-black text-orendt-accent font-display font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-orendt-accent/30 border-t-orendt-accent rounded-full animate-spin" />
                    : "Anmelden"
                  }
                </button>
              </form>

              <button
                onClick={() => { setView("reset"); setError("") }}
                className="mt-5 w-full text-center text-xs text-orendt-gray-400 hover:text-orendt-black transition-colors underline underline-offset-4 decoration-orendt-gray-200"
              >
                Passwort vergessen?
              </button>
            </>
          )}
        </div>

        <div className="mt-10 flex justify-center">
          <LegalNavLinks className="text-[10px] text-orendt-gray-400 justify-center" />
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
