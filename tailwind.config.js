/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette for AI Lead Scoring CRM
        primary: {
          custom: 'var(--primary-custom)',
          DEFAULT: 'var(--primary)',
        },
        secondary: {
          custom: 'var(--secondary-custom)',
          DEFAULT: 'var(--secondary)',
        },
        background: 'var(--background)',
        surface: 'var(--surface)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          custom: 'var(--border-custom)',
          DEFAULT: 'var(--border)',
        },
        success: {
          custom: 'var(--success-custom)',
          DEFAULT: 'var(--success)',
        },
        warning: {
          custom: 'var(--warning-custom)',
          DEFAULT: 'var(--warning)',
        },
        danger: {
          custom: 'var(--danger-custom)',
          DEFAULT: 'var(--danger)',
        },
        info: {
          custom: 'var(--info-custom)',
          DEFAULT: 'var(--info)',
        },
      },
      borderRadius: {
        card: 'var(--radius-card)',
        button: 'var(--radius-button)',
        input: 'var(--radius-input)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  // Purge unused styles in production
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './src/**/*.{js,ts,jsx,tsx}',
    ],
    options: {
      safelist: [
        // Add any dynamic classes that should never be purged
        'bg-primary-custom',
        'bg-secondary-custom',
        'bg-success-custom',
        'bg-warning-custom',
        'bg-danger-custom',
        'bg-info-custom',
      ],
    },
  },
}