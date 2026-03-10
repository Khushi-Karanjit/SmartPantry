/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1c1c",
        muted: "#6b6b6b",
        sage: "#93a676",
        sageSoft: "rgba(147,166,118,0.18)",
        sand: "#fbfbf7",
        cloud: "#ffffff",
      },
      boxShadow: {
        soft: "0 12px 28px rgba(0,0,0,0.06)",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
