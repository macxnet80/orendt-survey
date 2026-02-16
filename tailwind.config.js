/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        orendt: {
          black: "#0A0A0A",
          dark: "#1A1A1A",
          gray: {
            900: "#222222",
            800: "#333333",
            700: "#555555",
            600: "#777777",
            500: "#999999",
            400: "#BBBBBB",
            300: "#DDDDDD",
            200: "#EEEEEE",
            100: "#F5F5F5",
            50: "#FAFAFA",
          },
          white: "#FFFFFF",
          accent: "#E8FF00",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "slide-right": "slideRight 0.4s ease forwards",
        "slide-left": "slideLeft 0.4s ease forwards",
        "scale-in": "scaleIn 0.5s ease forwards",
        pulse: "accentPulse 2.5s infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideLeft: {
          from: { opacity: "0", transform: "translateX(-40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { transform: "scale(0.9)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        accentPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232, 255, 0, 0)" },
          "50%": { boxShadow: "0 0 0 6px rgba(232, 255, 0, 0.15)" },
        },
      },
    },
  },
  plugins: [],
}
