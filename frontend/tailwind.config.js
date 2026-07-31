/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'display-sm': ['1.625rem', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-base': ['1.875rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
      },
      colors: {
        canvas: '#ffffff',
        'soft-cloud': '#f5f5f5',
        ink: '#111111',
        charcoal: '#39393b',
        ash: '#4b4b4d',
        mute: '#707072',
        stone: '#9e9ea0',
        hairline: '#cacacb',
        'hairline-soft': '#e5e5e5',
        stellar: {
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c0d5ff',
          300: '#a0c0ff',
          400: '#7aa8ff',
          500: '#3a6fff',
          600: '#1a4fff',
          700: '#0035d6',
          800: '#0029a3',
          900: '#001d70',
        },
        sale: '#d30005',
        success: '#1eaa52',
      },
      fontFamily: {
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '2xs': '2px', 'xs': '4px', 'sm': '8px', 'md': '12px',
        'lg': '18px', 'xl': '24px', '2xl': '30px', 'section': '48px',
      },
      borderRadius: {
        pill: '9999px',
        card: '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
