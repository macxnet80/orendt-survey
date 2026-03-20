import Link from "next/link"

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-orendt-gray-100 z-50">
        <div className="max-w-4xl mx-auto h-full px-6 flex items-center">
          <Link href="/" className="font-display text-xl font-bold text-orendt-black uppercase tracking-tighter">
            Orendt Studios
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-40 pb-20 px-6">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-orendt-black uppercase tracking-tight mb-12">
          Impressum
        </h1>

        <div className="space-y-12 text-orendt-gray-800 leading-relaxed font-body">
          <section>
            <p className="text-sm uppercase tracking-widest text-orendt-gray-400 font-bold mb-4">Angaben gemäß § 5 DDG</p>
            <div className="text-xl font-medium">
              <p>ORENDT STUDIOS Holding GmbH</p>
              <p>Essener Bogen 5</p>
              <p>22419 Hamburg, Deutschland</p>
            </div>
          </section>

          <section>
            <p className="text-sm uppercase tracking-widest text-orendt-gray-400 font-bold mb-4">Vertreten durch</p>
            <p className="text-xl font-medium">Torsten Orendt (Geschäftsführer)</p>
          </section>

          <section>
            <p className="text-sm uppercase tracking-widest text-orendt-gray-400 font-bold mb-4">Kontakt</p>
            <div className="text-xl font-medium space-y-2">
              <p>Telefon: +49 (0) 40 398 34 500</p>
              <p>E-Mail: <a href="mailto:mail@orendtstudios.com" className="underline underline-offset-4 decoration-orendt-accent hover:decoration-orendt-black transition-all">mail@orendtstudios.com</a></p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-sm uppercase tracking-widest text-orendt-gray-400 font-bold mb-4">Handelsregister</p>
              <p className="text-xl font-medium">Amtsgericht Hamburg, HRB 132182</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-orendt-gray-400 font-bold mb-4">USt-ID</p>
              <p className="text-xl font-medium">DE 296 137 558</p>
            </div>
          </section>

          <section>
            <p className="text-sm uppercase tracking-widest text-orendt-gray-400 font-bold mb-4">Verantwortlich für den Inhalt nach § 55 RStV</p>
            <p className="text-xl font-medium">Torsten Orendt</p>
          </section>

          <div className="pt-12 border-t border-orendt-gray-100">
            <Link href="/" className="text-orendt-black font-bold uppercase tracking-widest text-sm flex items-center gap-2 group">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
