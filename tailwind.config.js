/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.jsx",
        "./resources/**/*.js",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Nunito", "sans-serif"], // هنا أجبرنا النظام على استخدام الخط
            },
            colors: {
                kiddo: {
                    blue: "#2B50D8",
                    lightblue: "#EBF3FF",
                    green: "#34A853",
                    purple: "#8A2BE2",
                    red: "#FF4B4B",
                    yellow: "#FFC107",
                    bg: "#F8FBFF",
                    text: "#2D3748",
                },
            },
            borderRadius: {
                "4xl": "2rem",
                "5xl": "3rem",
            },
            boxShadow: {
                soft: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
                card: "0 15px 35px -5px rgba(43, 80, 216, 0.1)",
            },
        },
    },
    plugins: [],
};
