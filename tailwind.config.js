/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'monospace'],
      },
      colors: {
        // Background - off-white, tonal
        background: '#F8F7F4',
        'background-alt': '#F0EFE9',
        
        // Surface - pure white and warm whites
        surface: '#FFFFFF',
        'surface-warm': '#FFFEFA',
        
        // Border - subtle, technical
        border: {
          light: '#E5E4E0',
          DEFAULT: '#D4D3CD',
          dark: '#B8B7B0',
        },
        
        // Text hierarchy - deep charcoal
        text: {
          primary: '#1A1915',      // Deep charcoal
          secondary: '#3D3C35',    // Medium charcoal
          tertiary: '#6B6A62',     // Light charcoal
          muted: '#8F8E85',        // Muted
        },
        
        // Accent - distinctive BACKBONE color (deep teal)
        accent: {
          primary: '#0D4F4F',      // Deep teal
          secondary: '#1A6B6B',    // Lighter teal
          light: '#E8F3F3',        // Very light teal
        },
        
        // Evidence colors - sophisticated
        evidence: {
          primary: '#2C5F7C',
          secondary: '#4A7A9A',
        },
        
        // Pattern colors - refined purple
        pattern: {
          primary: '#5B4B8A',
          secondary: '#7A6BA8',
        },
        
        // Semantic colors - calm, premium
        success: '#2D6A4F',
        warning: '#C4A35A',
        error: '#A84444',
        info: '#3B7A7A',
        
        // Event type colors - sophisticated
        symptom: '#C97B4A',
        diagnosis: '#B84A4A',
        laboratory: '#4A7AB8',
        medication: '#4A9A6B',
        procedure: '#7A6BA8',
        consultation: '#5A6B9A',
        hospital: '#9A5A7A',
      },
      
      // Typography scale - premium, editorial
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '4.5rem', fontWeight: '600', letterSpacing: '-0.04em' }],
        'display-lg': ['3.5rem', { lineHeight: '4rem', fontWeight: '600', letterSpacing: '-0.035em' }],
        'display': ['3rem', { lineHeight: '3.5rem', fontWeight: '600', letterSpacing: '-0.03em' }],
        'h1': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '600', letterSpacing: '-0.025em' }],
        'h2': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600', letterSpacing: '-0.02em' }],
        'h3': ['1.375rem', { lineHeight: '1.875rem', fontWeight: '500', letterSpacing: '-0.015em' }],
        'h4': ['1.125rem', { lineHeight: '1.625rem', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.625rem', fontWeight: '400' }],
        'body-large': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'body-xl': ['1.25rem', { lineHeight: '1.875rem', fontWeight: '400' }],
        'small': ['0.875rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        'tiny': ['0.75rem', { lineHeight: '1.125rem', fontWeight: '400' }],
      },
      
      // Spacing scale - generous
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '40': '10rem',
        '48': '12rem',
        '56': '14rem',
        '64': '16rem',
      },
      
      // Border radius - refined
      borderRadius: {
        'sm': '2px',
        'md': '4px',
        'lg': '6px',
        'xl': '8px',
        '2xl': '12px',
        '3xl': '16px',
      },
      
      // Shadows - subtle, premium
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(26 25 21 / 0.04)',
        'md': '0 2px 4px 0 rgb(26 25 21 / 0.06)',
        'lg': '0 4px 8px 0 rgb(26 25 21 / 0.08)',
        'xl': '0 8px 16px 0 rgb(26 25 21 / 0.1)',
        '2xl': '0 16px 32px 0 rgb(26 25 21 / 0.12)',
      },
      
      // Transitions - refined
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
        'slower': '600ms',
      },
      
      // Grid textures
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #E5E4E0 1px, transparent 1px), linear-gradient(to bottom, #E5E4E0 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
