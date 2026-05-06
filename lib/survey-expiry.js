/**
 * Survey expiry: `expires_at` is a DATE (YYYY-MM-DD). The survey stays active for that entire
 * calendar day in Europe/Berlin; after midnight Berlin it is treated as expired (until pg_cron sets is_active=false).
 */

export function berlinCalendarDate(utcMs = Date.now()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date(utcMs))
}

/**
 * @param {string|null|undefined} expiresAt - DATE from DB (YYYY-MM-DD or ISO string)
 * @returns {boolean}
 */
export function isSurveyExpired(expiresAt) {
  if (expiresAt == null || expiresAt === "") return false
  const d = String(expiresAt).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
  const todayBerlin = berlinCalendarDate()
  return todayBerlin > d
}
