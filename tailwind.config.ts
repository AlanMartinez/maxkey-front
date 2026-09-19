import type { Config } from 'tailwindcss'

// Design tokens from the Chekeys mock (design.md §9).
export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0E',
        surface: '#12121A',
        accent: { DEFAULT: '#7C5CFC', hover: '#8F6FFF' },
        success: '#22D3A8',
        discount: '#22C55E',
      },
      fontFamily: {
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backdropBlur: { glass: '12px' },
    },
  },
}
