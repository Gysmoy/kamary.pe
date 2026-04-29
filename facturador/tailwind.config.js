/** @type {import('tailwindcss').Config} */
export default {
  content: ["./resources/views/**/*.blade.php", "./resources/react-app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf7ff",
          100: "#d9ecff",
          200: "#b9ddff",
          300: "#85c6ff",
          400: "#4aa6ff",
          500: "#1f82ff",
          600: "#0e67e8",
          700: "#0e53bc",
          800: "#134795",
          900: "#163f77"
        }
      },
      boxShadow: {
        soft: "0 12px 35px -20px rgba(17, 30, 61, 0.45)"
      },
      fontFamily: {
        sans: ["Segoe UI", "Tahoma", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};
