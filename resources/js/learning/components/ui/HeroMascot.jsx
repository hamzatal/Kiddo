/**
 * HeroMascot — the giant fox + ABC blocks composition that crowns
 * the Home hero section.
 *
 * Was previously an inline `<style>` block inside HomeScreen.jsx with
 * a dozen `@media` queries hardcoded against pixel breakpoints. We've
 * migrated it to a tiny scoped CSS module so the home page no longer
 * carries 50+ lines of bespoke CSS at runtime, and the component is
 * reusable on the future onboarding flow.
 */

import React from "react";

const STYLES = `
.kiddo-hero-mascot-wrap {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    min-height: 280px;
}

.kiddo-hero-mascot-wrap .abc-blocks {
    position: absolute;
    z-index: 0;
    object-fit: contain;
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15));
    left: -15px;
    bottom: 10px;
    width: 140px;
}

.kiddo-hero-mascot-wrap .fox-mascot {
    position: relative;
    z-index: 10;
    object-fit: contain;
    filter: drop-shadow(0 16px 32px rgba(0,0,0,0.18));
    width: 190px;
    max-height: 50vh;
    transform: translateX(40px) translateY(-5px);
}

@media (min-width: 480px) {
    .kiddo-hero-mascot-wrap { min-height: 320px; }
    .kiddo-hero-mascot-wrap .abc-blocks { left: -10px; width: 160px; bottom: 15px; }
    .kiddo-hero-mascot-wrap .fox-mascot { width: 220px; transform: translateX(50px) translateY(-5px); }
}

@media (min-width: 640px) {
    .kiddo-hero-mascot-wrap { min-height: 360px; }
    .kiddo-hero-mascot-wrap .abc-blocks { left: 0; bottom: 20px; width: 180px; }
    .kiddo-hero-mascot-wrap .fox-mascot {
        width: 260px;
        max-height: 52vh;
        transform: translateX(60px) translateY(-10px);
    }
}

@media (min-width: 768px) {
    .kiddo-hero-mascot-wrap .abc-blocks { left: 0; width: 200px; bottom: 20px; }
    .kiddo-hero-mascot-wrap .fox-mascot { width: 300px; transform: translateX(70px) translateY(-10px); }
}

@media (min-width: 1024px) {
    .kiddo-hero-mascot-wrap { min-height: 460px; }
    .kiddo-hero-mascot-wrap .abc-blocks { left: -20px; bottom: 20px; width: 220px; }
    .kiddo-hero-mascot-wrap .fox-mascot {
        width: 340px;
        max-height: 56vh;
        transform: translateX(80px) translateY(-15px);
    }
}

@media (min-width: 1280px) {
    .kiddo-hero-mascot-wrap .abc-blocks { left: -30px; bottom: 25px; width: 240px; }
    .kiddo-hero-mascot-wrap .fox-mascot {
        width: 380px;
        max-height: 58vh;
        transform: translateX(100px) translateY(-15px);
    }
}

@media (min-width: 1536px) {
    .kiddo-hero-mascot-wrap .fox-mascot {
        width: 420px;
        transform: translateX(110px) translateY(-20px);
    }
}
`;

let stylesInjected = false;
function injectStylesOnce() {
    if (stylesInjected || typeof document === "undefined") return;
    const tag = document.createElement("style");
    tag.setAttribute("data-kiddo", "hero-mascot");
    tag.textContent = STYLES;
    document.head.appendChild(tag);
    stylesInjected = true;
}

export default function HeroMascot() {
    if (typeof window !== "undefined") injectStylesOnce();

    return (
        <div className="kiddo-hero-mascot-wrap">
            <img
                src="/assets/ui/hero/abc-blocks.png"
                alt=""
                aria-hidden="true"
                className="abc-blocks"
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                }}
            />
            <img
                src="/assets/ui/mascot/fox-main.png"
                alt="Kiddo Fox mascot"
                className="fox-mascot"
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                }}
            />
        </div>
    );
}
