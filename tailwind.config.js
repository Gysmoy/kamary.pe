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
        cart: '#151D2B',
        // Paleta de la web pública de Kamary
        kf: {
          red: '#c81b1f',
          'red-dark': '#a3161a',
          navy: '#293381',
          'navy-deep': '#1b2260',
          blue: '#1e66bf',
          ink: '#0f131f',
          text: '#35415b',
          muted: '#6b7690',
          surface: '#F3F1EC',
          canvas: '#FBFAF8',
          sand: '#F3F1EC',
          mint: '#eef3f1',
          line: '#e3e7f0',
          wa: '#25d366'
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif']
      },
      keyframes: {
        'kf-marquee': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'kf-kenburns': { '0%': { transform: 'scale(1.02)' }, '100%': { transform: 'scale(1.1)' } },
      },
      animation: {
        'kf-marquee': 'kf-marquee 40s linear infinite',
        'kf-kenburns': 'kf-kenburns 14s ease-out forwards',
      }
    },
  },
  plugins: [
    require('tailwindcss-animated'),
    // Otros plugins si los tienes
  ],
}
