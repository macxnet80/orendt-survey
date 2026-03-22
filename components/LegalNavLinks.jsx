import Link from "next/link"

/**
 * @param {"light" | "dark"} variant — dark: für schwarze Hintergründe (Landing)
 */
export default function LegalNavLinks({ className = "", variant = "light" }) {
  const isDark = variant === "dark"
  const linkClass = isDark
    ? "hover:text-orendt-accent transition-colors duration-200"
    : "hover:text-orendt-black transition-colors duration-200"

  return (
    <nav
      aria-label="Rechtliches"
      className={`
        flex flex-wrap items-center gap-x-6 gap-y-2 font-display font-medium uppercase tracking-widest
        ${isDark ? "text-orendt-gray-700" : "text-xs text-orendt-gray-400"}
        ${className}
      `}
    >
      <Link href="/impressum" className={linkClass}>
        Impressum
      </Link>
      <Link href="/datenschutz" className={linkClass}>
        Datenschutz
      </Link>
    </nav>
  )
}
