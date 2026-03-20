import Link from "next/link"

export default function LegalFooter() {
  return (
    <footer className="w-full py-8 mt-auto border-t border-orendt-gray-100 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-center items-center gap-6 text-xs font-medium uppercase tracking-widest text-orendt-gray-400">
        <span className="hidden md:inline text-orendt-gray-300">© {new Date().getFullYear()} Orendt Studios</span>
        <div className="flex gap-8">
          <Link 
            href="/impressum" 
            className="hover:text-orendt-black transition-colors duration-200"
          >
            Impressum
          </Link>
          <Link 
            href="/datenschutz" 
            className="hover:text-orendt-black transition-colors duration-200"
          >
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  )
}
