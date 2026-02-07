import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        d2y: {
          black: "#222222",
          yellow: "#FFC94D",
          white: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
