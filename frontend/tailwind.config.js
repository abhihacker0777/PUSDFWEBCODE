/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // BUG FIX: Ensure the extend object exists (even if empty) 
      // to prevent "Cannot read property 'extend' of undefined" 
      // during some specific PostCSS build cycles.
    },
  },
  plugins: [],
}