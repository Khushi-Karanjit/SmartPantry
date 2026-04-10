/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#60a5fa",
        accent: "#93c5fd",
        foreground: "#111827",
      },
      boxShadow: {
        soft: "0 12px 28px rgba(0,0,0,0.06)",
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
      },
    },
  },
  plugins: [],
}
