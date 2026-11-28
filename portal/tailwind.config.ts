import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        //* CSS variables from globals.css so classes follow light/dark mode
        brand: {
          DEFAULT: 'var(--pf-primary)',
          dark: 'var(--pf-primary-dark)',
          light: 'var(--pf-primary-light)',
        },
        accent: 'var(--pf-accent)',
        rust: 'var(--pf-rust)',
        peach: 'var(--pf-peach)',
        sunshine: 'var(--pf-sunshine)',
        ink: 'var(--pf-ink)',
        slate: 'var(--pf-slate)',
        cream: 'var(--pf-cream)',
        paper: 'var(--pf-paper)',
        line: 'var(--pf-line)',
        sand: 'var(--pf-sand)',
        soft: 'var(--pf-soft)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: 'var(--pf-radius-card)',
        input: 'var(--pf-radius-input)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
