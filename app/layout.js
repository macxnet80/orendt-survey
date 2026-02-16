import "./globals.css"

export const metadata = {
  title: "Mitarbeiter-Umfrage | Orendt Studios",
  description: "Anonyme Umfrage zur Prozessverbesserung bei Orendt Studios",
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
