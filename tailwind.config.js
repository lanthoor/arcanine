/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme colors
        light: {
          background: '#ffffff',
          surface: '#f5f5f5',
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#7c3aed',
          text: '#1e293b',
          'text-secondary': '#64748b',
          border: '#e2e8f0',
          error: '#dc2626',
          success: '#16a34a',
          warning: '#ea580c',
        },
        // Dark theme colors
        dark: {
          background: '#0f172a',
          surface: '#1e293b',
          primary: '#3b82f6',
          secondary: '#64748b',
          accent: '#8b5cf6',
          text: '#f1f5f9',
          'text-secondary': '#94a3b8',
          border: '#334155',
          error: '#ef4444',
          success: '#22c55e',
          warning: '#f97316',
        },
      },
    },
  },
  plugins: [],
};
