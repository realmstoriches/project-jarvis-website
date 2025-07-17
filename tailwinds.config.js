/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}", // Looks for any HTML/JS file in the 'src' folder
    "./*.html"              // Looks for any HTML file in the main project folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}