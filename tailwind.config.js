/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Discord-inspired color palette
        primary: '#5865F2',
        success: '#3BA55C',
        warning: '#FAA81A',
        danger: '#ED4245',
        background: '#36393F',
        surface: '#2F3136',
        'surface-hover': '#292B2F',
        text: '#DCDDDE',
        'text-secondary': '#B9BBBE',
        'text-muted': '#72767D',
        accent: '#4F545C',
        border: '#202225',
        'online': '#3BA55C',
        'idle': '#FAA81A',
        'dnd': '#ED4245',
        'offline': '#747F8D',
      },
      fontFamily: {
        sans: ['gg sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'elevation-low': '0 1px 0 rgba(4,4,5,0.2), 0 1.5px 0 rgba(6,6,7,0.05), 0 2px 0 rgba(4,4,5,0.05)',
        'elevation-medium': '0 4px 4px rgba(0,0,0,0.16)',
        'elevation-high': '0 8px 16px rgba(0,0,0,0.24)',
      },
    },
  },
  plugins: [],
}