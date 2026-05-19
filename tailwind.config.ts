import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#160E0A', // Deep dark chocolate brown
          light: '#FAF2E6',   // Soft warm peach/sand cream
          mid: '#D8A65C',     // Champagne gold
        },
        accent: {
          DEFAULT: '#E78C85', // Rose gold pink
          light: '#FCEBEA',   // Soft rose pink accent
        },
        brand: {
          dark: '#160E0A',        // Deep chocolate black background
          brown: '#2C1B12',       // Rich warm chocolate brown
          gold: '#D8A65C',        // Champagne gold
          goldLight: '#F7EAD3',   // Soft champagne accent
          pink: '#E78C85',        // Rose gold pink
          pinkLight: '#FCEBEA',   // Soft pink accent
          creamBg: '#FDFBF7',     // Premium warm cream background
          sand: '#FAF2E6',        // Soft peach/gold tinted sand
          bronze: '#8C6239',      // Rich bronze/gold text accent
        }
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(44, 27, 18, 0.08), 0 2px 8px -1px rgba(44, 27, 18, 0.04)',
        'premium-hover': '0 12px 24px -4px rgba(44, 27, 18, 0.12), 0 4px 12px -2px rgba(44, 27, 18, 0.06)',
      }
    },
  },
  plugins: [],
}
export default config
