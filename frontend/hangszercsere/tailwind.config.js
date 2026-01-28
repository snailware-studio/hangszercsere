// tailwind.config.js
module.exports = {
  darkMode: 'class', // enables dark mode with .dark class
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Dark Mode Palette ---
        'site-bg': '#1B1226',         // main background
        'card-bg': '#2A1F3B',         // cards
        'navbar-bg': '#231C32',       // navbar/footer
        'text-primary': '#EDE8F7',    // main text
        'text-secondary': '#B9A7D1',  // description / meta
        'accent': '#9B59D1',          // buttons / highlights
        'accent-hover': '#BB86FC',    // button hover

        // --- Light Mode Palette ---
        'light-site-bg': '#F5F0FA',       // soft lavender-ish background
        'light-card-bg': '#F8F5FC',       // off-white cards
        'light-navbar-bg': '#EDE6F7',     // navbar/footer
        'light-text-primary': '#2A1F3B',  // dark text for light bg
        'price-text': '#ffffff',         // price text
        'light-text-secondary': '#5C4A72',// muted purple for descriptions
        'light-accent': '#8E44AD',        // light mode button accent
        'light-accent-hover': '#A569E6',  // light mode hover
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
