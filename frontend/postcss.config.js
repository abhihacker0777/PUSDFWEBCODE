export default {
  plugins: {
    // BUG FIX: Ensure the keys are quoted for better compatibility 
    // across different PostCSS parser versions
    "tailwindcss": {},
    "autoprefixer": {},
  },
}