/** @type {import('tailwindcss').Config} */
export default {
  // This is the crucial part. It tells Tailwind to scan all of these files
  // for class names and to include them in the final CSS build.
  content: [
    "./index.html",
    "./{components,hooks,services,context}/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}