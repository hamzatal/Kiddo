/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.{js,jsx,ts,tsx}",
    ],

    // Kiddo is a LIGHT-ONLY product (school audience, parents on
    // shared devices, accessibility consistency). We disable
    // Tailwind's dark-mode variants entirely so any stray
    // `dark:bg-slate-900` utility added by mistake is treated as
    // unknown — far safer than letting a half-applied dark theme
    // leak through. The matching `<meta name="color-scheme"
    // content="light only">` in app.blade.php and the
    // `:root { color-scheme: light }` rule in app.css extend this
    // contract to native form controls + scrollbars.
    darkMode: ["selector", '[data-kiddo-theme="dark"]'],

    theme: {
        // FIX: add a tighter `xs` breakpoint so the home hero
        // collapses cleanly on devices < 480px (older Androids).
        screens: {
            xs: "420px",
            sm: "640px",
            md: "768px",
            lg: "1024px",
            xl: "1280px",
            "2xl": "1536px",
        },

        extend: {
            fontFamily: {
                sans: [
                    "Nunito",
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif",
                ],
            },

            // FIX: massively expanded palette so the 200+ hardcoded
            // hex values across the codebase can be migrated to
            // semantic tokens. Each entry is a regular Tailwind
            // shade scale so utilities like `bg-kiddo-purple-100`,
            // `text-kiddo-purple-700` keep working.
            colors: {
                kiddo: {
                    DEFAULT: "#7C3AED",
                    bg: "#F8FBFF",
                    text: "#1E293B",
                    purple: {
                        50:  "#FAF5FF",
                        100: "#F3E8FF",
                        200: "#E9D5FF",
                        300: "#D8B4FE",
                        400: "#C084FC",
                        500: "#A855F7",
                        600: "#9333EA",
                        700: "#7C3AED",
                        800: "#6D28D9",
                        900: "#5B21B6",
                    },
                    green: {
                        50:  "#F0FDF4",
                        100: "#DCFCE7",
                        300: "#86EFAC",
                        400: "#4ADE80",
                        500: "#22C55E",
                        600: "#16A34A",
                        700: "#15803D",
                        800: "#166534",
                    },
                    blue: {
                        50:  "#EFF6FF",
                        100: "#DBEAFE",
                        300: "#93C5FD",
                        500: "#3B82F6",
                        600: "#2563EB",
                        700: "#1D4ED8",
                    },
                    amber: {
                        50:  "#FFFBEB",
                        100: "#FEF3C7",
                        300: "#FCD34D",
                        500: "#F59E0B",
                        600: "#D97706",
                        700: "#B45309",
                    },
                    pink: {
                        50:  "#FFF1F2",
                        100: "#FFE4E6",
                        300: "#FDA4AF",
                        500: "#F43F5E",
                        600: "#E11D48",
                        700: "#BE123C",
                    },
                    sky: {
                        50:  "#F0F9FF",
                        100: "#E0F2FE",
                        300: "#7DD3FC",
                        500: "#0EA5E9",
                        600: "#0284C7",
                        700: "#0369A1",
                    },
                },
            },

            borderRadius: {
                "4xl": "2rem",
                "5xl": "3rem",
            },

            boxShadow: {
                soft: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)",
                card: "0 15px 35px -5px rgba(43,80,216,0.10)",
                // The signature "juicy" 3D button shadow used in
                // 30+ places — extracted so we update one place.
                juicy: "0 5px 0 0 rgba(91,15,153,0.80), inset 0 1px 0 0 rgba(255,255,255,0.40)",
                "juicy-press":
                    "0 1px 0 0 rgba(91,15,153,0.80), inset 0 1px 0 0 rgba(255,255,255,0.40)",
            },

            keyframes: {
                celebPop: {
                    "0%":   { opacity: "0", transform: "scale(0.8) translateY(20px)" },
                    "60%":  { transform: "scale(1.03) translateY(-5px)" },
                    "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
                },
                bounceIn: {
                    "0%":   { transform: "scale(0)" },
                    "50%":  { transform: "scale(1.2)" },
                    "100%": { transform: "scale(1)" },
                },
                fadeInScale: {
                    "0%":   { opacity: "0", transform: "scale(0.92) translateY(10px)" },
                    "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
                },
            },
            animation: {
                celebPop: "celebPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                bounceIn: "bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                fadeInScale: "fadeInScale 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            },
        },
    },

    plugins: [],
};
