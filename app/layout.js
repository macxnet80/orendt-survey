import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"

export const metadata = {
  title: "Mitarbeiter-Umfrage | Orendt Studios",
  description: "Anonyme Umfrage zur Prozessverbesserung bei Orendt Studios",
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className="antialiased">
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
