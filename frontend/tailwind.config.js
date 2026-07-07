module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2C4A5E",
          "primary-dark": "#1A2E3B",
          accent: "#E67E4A",
          "accent-dark": "#C85A2E",
          cream: "#F5EFE0",
          "off-white": "#FAF7F0",
          text: "#1A2E3B",
          "text-light": "#6B7D8A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};