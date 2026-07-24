/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        cream: { 50: '#FDFAF6', 100: '#FBF5EE', 200: '#F5EBDC' },
        blush: { 50: '#FDF2F4', 100: '#FCE7EC', 200: '#F8C8D2', 300: '#F3A5B6', 400: '#E68197', 500: '#D86A82' },
        sage:  { 50: '#F1F5F1', 100: '#DDE7DC', 200: '#BDD0BC', 300: '#9BB89C', 400: '#7CA17E', 500: '#5F8762' },
        sky:   { 50: '#F0F7FB', 100: '#DDEBF4', 200: '#B8D4E8', 300: '#8FB8D6' },
        sand:  { 50: '#FAF6F0', 100: '#F1E7D6', 200: '#E2CDA9' },
        ink:   { 900: '#2A2A33', 700: '#4B4B58', 500: '#7A7A87' }
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 4px 20px -8px rgba(216, 106, 130, 0.15)',
        card: '0 8px 30px -12px rgba(42, 42, 51, 0.12)'
      },
      borderRadius: { '4xl': '2rem' }
    }
  },
  plugins: []
};
