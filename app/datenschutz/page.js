import Link from "next/link"

export default function PrivacyPage() {
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
          Datenschutz
        </h1>

        <div className="space-y-12 text-orendt-gray-800 leading-relaxed font-body">
          <p className="text-xl font-medium text-orendt-gray-900 bg-orendt-gray-50 p-8 rounded-2xl border-l-4 border-orendt-accent">
            Da diese Umfragen zur Prozessverbesserung dienen und wir Wert auf absolute Offenheit legen, ist die Teilnahme zu 100% anonym.
          </p>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-orendt-black uppercase tracking-tight mb-6">1. Verantwortliche Stelle</h2>
              <div className="text-lg font-medium">
                <p>ORENDT STUDIOS Holding GmbH</p>
                <p>Essener Bogen 5</p>
                <p>22419 Hamburg, Deutschland</p>
                <p className="mt-4 text-sm uppercase tracking-widest text-orendt-gray-400 font-bold">Kontakt</p>
                <p>+49 (0) 40 398 34 500</p>
                <p><a href="mailto:mail@orendtstudios.com" className="underline underline-offset-4 decoration-orendt-accent hover:decoration-orendt-black transition-all">mail@orendtstudios.com</a></p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-orendt-black uppercase tracking-tight mb-6">2. Datenschutzbeauftragter</h2>
              <div className="text-lg font-medium">
                <p>IBS data protection services and consulting GmbH</p>
                <p>Zirkusweg 1, 20359 Hamburg</p>
                <p className="mt-4 text-sm uppercase tracking-widest text-orendt-gray-400 font-bold">E-Mail</p>
                <p><a href="mailto:dsb@ibs-data-protection.de" className="underline underline-offset-4 decoration-orendt-accent hover:decoration-orendt-black transition-all">dsb@ibs-data-protection.de</a></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-orendt-black uppercase tracking-tight mb-6">3. Hosting und Infrastruktur</h2>
            <div className="space-y-4">
              <p>Diese Anwendung wird bei <span className="font-bold">Vercel</span> gehostet (Vercel Inc., San Francisco, USA). Wir haben den Serverstandort bewusst auf die <span className="font-bold">Europäische Union (Deutschland)</span> begrenzt, um höchste Datenschutzstandards zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO).</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-orendt-black uppercase tracking-tight mb-6">4. Datenverarbeitung & Server-Log-Files</h2>
            <div className="space-y-4">
              <p>Bei jedem Zugriff auf diese Anwendung werden automatisch Informationen durch den Webbrowser an uns bzw. unseren Hosting-Provider übermittelt. Diese sogenannten Server-Log-Files umfassen u.a.:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Browsertyp und -version</li>
                <li>Verwendetes Betriebssystem</li>
                <li>Hinterlegte Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
              </ul>
              <p className="mt-4"><span className="font-bold">Besonderheit dieser App:</span> IP-Adressen werden im Rahmen dieser spezifischen Umfrage-Anwendung <span className="underline decoration-orendt-accent decoration-2 underline-offset-4 font-bold">weder protokolliert noch dauerhaft gespeichert</span>, um eine vollständige Anonymität der Teilnehmer zu gewährleisten.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-orendt-black uppercase tracking-tight mb-6">5. Ihre Rechte (Betroffenenrechte)</h2>
            <p className="mb-4">Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen (DSGVO) jederzeit das Recht auf:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 font-medium text-orendt-gray-900">
              <li className="flex gap-3"><span className="text-orendt-accent font-bold">01.</span> Auskunft (Art. 15)</li>
              <li className="flex gap-3"><span className="text-orendt-accent font-bold">02.</span> Berichtigung (Art. 16)</li>
              <li className="flex gap-3"><span className="text-orendt-accent font-bold">03.</span> Löschung (Art. 17)</li>
              <li className="flex gap-3"><span className="text-orendt-accent font-bold">04.</span> Einschränkung der Verarbeitung (Art. 18)</li>
              <li className="flex gap-3"><span className="text-orendt-accent font-bold">05.</span> Datenübertragbarkeit (Art. 20)</li>
              <li className="flex gap-3"><span className="text-orendt-accent font-bold">06.</span> Widerspruch (Art. 21)</li>
            </ul>
            <p className="mt-8">Darüber hinaus besteht ein Beschwerderecht bei einer zuständigen Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO).</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-orendt-black uppercase tracking-tight mb-6">6. Cookies</h2>
            <div className="space-y-4">
              <p>Diese Website verwendet keine Tracking- oder Marketing-Cookies. Es kommen lediglich technisch notwendige Session-Daten zum Einsatz, die sicherstellen, dass die Umfrage reibungslos funktioniert.</p>
            </div>
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
