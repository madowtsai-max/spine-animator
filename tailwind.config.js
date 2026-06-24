/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f1a',
          1: '#16162a',
          2: '#1e1e36',
          3: '#252540',
        },
        accent: {
          DEFAULT: '#6c63ff',
          hover: '#7c74ff',
          dim: '#6c63ff33',
        },
        border: '#2e2e50',
      },
    },
  },
  plugins: [],
}
