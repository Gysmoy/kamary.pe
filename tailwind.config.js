/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
    "./resources/**/*.vue",
  ],
  theme: {
    extend: {
      // Puedes agregar personalizaciones aquí si es necesario
      colors: {
        primary: '#4C6FFF',
        secondary: '#263246',
        deep: '#0B0F14',
        container: '#101621',
        light: '#E6EAF2',
        muted: '#8A93A3',
        cart: '#151D2B'
      }
    },
  },
  plugins: [
    require('tailwindcss-animated'),
    // Otros plugins si los tienes
  ],
}
