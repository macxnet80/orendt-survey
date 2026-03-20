import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import LegalFooter from "@/components/LegalFooter"

export const metadata = {
  title: "Mitarbeiter-Umfrage | Orendt Studios",
  description: "Anonyme Umfrage zur Prozessverbesserung bei Orendt Studios",
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className="antialiased">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              {children}
            </main>
            <LegalFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
