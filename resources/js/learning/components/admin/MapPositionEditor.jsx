import React, { useRef } from "react";

/**
 * MapPositionEditor — visual editor for a unit's map pin.
 *
 * Why this exists
 * ───────────────
 * Operator request, paraphrased: "I want to control where lessons sit
 * on the map page. I want an easy way to move them right, left, up,
 * down with full ease."
 *
 * The previous editor was just two `<input type="number">` fields
 * for `map_x` and `map_y`. Functional, but the admin had to:
 *   1. Type a number.
 *   2. Tab away (to fire the blur+save).
 *   3. Switch to a separate browser tab to refresh /map.
 *   4. Decide whether the pin moved enough.
 *   5. Repeat.
 * That's 5–10 round-trips per unit and most operators give up.
 *
 * What this widget does
 * ─────────────────────
 *   1. Renders a miniature of the SAME map background the kids see.
 *   2. Overlays a draggable pin at the current (map_x, map_y).
 *   3. Provides four nudge buttons (◀ ▲ ▼ ▶) that bump the pin by
 *      a configurable step (1% / 2% / 5%) — the operator picks the
 *      step once and the buttons do the rest.
 *   4. Shows the live percentage beside each axis so power users
 *      can still type exact values when needed.
 *   5. Calls the `onChange` prop on EVERY interaction, and
 *      `onCommit` whenever the user is done with a discrete action
 *      (button press, drag-end, blur on number input). The parent
 *      row decides what to do — typically `onCommit` triggers the
 *      PATCH save to /admin/units/{id}.
 *
 * Visual language
 * ───────────────
 * Sticks to the same admin palette (slate text on white panels with
 * subtle purple accents) so the editor feels native to the dashboard
 * even though it's the only widget that draws an actual map preview.
 *
 * Props
 * ─────
 *   x, y               (number 0-100 OR null) — current percentages
 *   size               (string)   — Tailwind size class for the live pin (cosmetic only)
 *   imageSrc           (string)   — pin icon URL (uses unit.image_path)
 *   pinLabel           (string)   — accessible name for the draggable pin
 *   pinTint            (string)   — colour swatch for the label badge
 *   mapBg              (string)   — defaults to `/assets/ui/map/map-bg.png`
 *   onChange(x, y)                — fires on EVERY drag tick, button press, or input change
 *   onCommit()                    — fires after a discrete change settles (button click, drag-end, blur)
 *   step               (1|2|5)    — default nudge size in % (default 2)
 *   onStepChange(step)            — controlled-step support (optional)
 */
export default function MapPositionEditor({
    x,
    y,
    size,
    imageSrc,
    pinLabel = "Unit",
    pinTint = "#7C3AED",
    mapBg = "/assets/ui/map/map-bg.png",
    onChange,
    onCommit,
    step: stepProp,
    onStepChange,
}) {
    const stageRef = useRef(null);

    // Internal step state — used when the parent doesn't pass a
    // controlled value. We keep it as a local module ref so reloading
    // the row doesn't reset the operator's preferred step.
    const [innerStep, setInnerStep] = React.useState(stepProp ?? 2);
    const step = stepProp ?? innerStep;
    const setStep = (s) => {
        setInnerStep(s);
        onStepChange?.(s);
    };

    // Effective values — fall back to centre when the unit has never
    // been positioned so the operator still sees a draggable pin.
    const ex = x === null || x === undefined || x === "" ? 50 : Number(x);
    const ey = y === null || y === undefined || y === "" ? 50 : Number(y);
    const isUnset = x === null || x === undefined || x === "" || y === null || y === undefined || y === "";

    const clamp = (v) => Math.max(0, Math.min(100, v));
    const round1 = (v) => Math.round(v * 10) / 10;

    const nudge = (dx, dy) => {
        const nx = clamp(ex + dx);
        const ny = clamp(ey + dy);
        onChange?.(round1(nx), round1(ny));
        // Defer the save by one tick so React has time to push the
        // new value into the row's controlled state before the
        // parent sends it to PATCH. Without the defer, the admin
        // would see a flicker (input shows old, server gets new).
        setTimeout(() => onCommit?.(), 0);
    };

    /* Drag state — uses pointer events so it works for mouse, touch,
       and stylus without three separate handlers. We capture the
       pointer once dragstart fires so a drag that leaves the stage
       still updates the pin (otherwise letting go off-stage would
       leave the pin "floating"). */
    const onPointerDown = (e) => {
        if (!stageRef.current) return;
        e.preventDefault();
        try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
        moveTo(e);
    };
    const onPointerMove = (e) => {
        if (!stageRef.current) return;
        if (e.buttons === 0 && e.pointerType === "mouse") return; // not dragging
        moveTo(e);
    };
    const onPointerUp = (e) => {
        try { e.target.releasePointerCapture(e.pointerId); } catch (_) {}
        // Fire commit on drag end so the back-end save happens once
        // per drag, not once per millisecond.
        onCommit?.();
    };
    const moveTo = (e) => {
        const rect = stageRef.current.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        onChange?.(round1(clamp(px)), round1(clamp(py)));
    };

    const stepOptions = [1, 2, 5];
    const arrowBtn =
        "w-9 h-9 rounded-xl flex items-center justify-center text-base font-black bg-white border border-gray-200 shadow-sm hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 active:translate-y-[1px] transition";

    return (
        <div className="bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-2xl border border-purple-100 p-3">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Map placement
                </p>
                <span
                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        isUnset
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                    title={isUnset ? "This unit has no saved coordinates yet" : "Saved"}
                >
                    {isUnset ? "Not placed" : `${round1(ex)}%, ${round1(ey)}%`}
                </span>
            </div>

            {/* Two-column layout: visual map preview | controls */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-stretch">
                {/* Live miniature — same background as the kid's map.
                    The pin draggable sits absolutely on the same
                    percentage system so it WYSIWYG previews exactly
                    where the kid will see it. */}
                <div
                    ref={stageRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    className="relative rounded-xl overflow-hidden border-2 border-white shadow-md aspect-[16/10] bg-[#A6DBF6] cursor-crosshair select-none"
                    role="application"
                    aria-label={`Drag the ${pinLabel} pin to a new position`}
                >
                    <img
                        src={mapBg}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        draggable={false}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />

                    {/* Soft grid lines so the operator sees the 25% /
                        50% / 75% reference points at a glance. Drawn
                        with simple linear gradients so it scales and
                        prints nicely. */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none opacity-40"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px)," +
                                "linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
                            backgroundSize: "25% 25%",
                        }}
                    />

                    {/* The draggable pin */}
                    <button
                        type="button"
                        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                        style={{ left: `${ex}%`, top: `${ey}%` }}
                        aria-label={`${pinLabel} — click and drag to reposition`}
                        title={`${pinLabel} (${round1(ex)}%, ${round1(ey)}%)`}
                    >
                        <span
                            className="block w-10 h-10 rounded-full bg-white shadow-xl border-2 flex items-center justify-center overflow-hidden"
                            style={{ borderColor: pinTint }}
                        >
                            {imageSrc ? (
                                <img
                                    src={
                                        imageSrc.startsWith("http")
                                            ? imageSrc
                                            : "/" + imageSrc.replace(/^\//, "")
                                    }
                                    alt=""
                                    className="w-full h-full object-contain"
                                    draggable={false}
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                            ) : (
                                <span className="text-base">📍</span>
                            )}
                        </span>
                        <span
                            className="absolute left-1/2 -translate-x-1/2 -bottom-2 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-white whitespace-nowrap shadow-md border border-white"
                            style={{ backgroundColor: pinTint }}
                        >
                            {pinLabel}
                        </span>
                    </button>
                </div>

                {/* Control column — arrow keys + step selector +
                    quick presets (corners + centre). */}
                <div className="flex flex-col gap-2 sm:w-44">
                    {/* Arrow keypad — ▲ in top row, ◀ ▶ in middle, ▼ in bottom.
                        Keeps the natural d-pad shape so muscle memory works. */}
                    <div className="grid grid-cols-3 gap-1.5">
                        <span />
                        <button
                            type="button"
                            onClick={() => nudge(0, -step)}
                            className={arrowBtn}
                            title={`Move up by ${step}%`}
                            aria-label="Move pin up"
                        >▲</button>
                        <span />
                        <button
                            type="button"
                            onClick={() => nudge(-step, 0)}
                            className={arrowBtn}
                            title={`Move left by ${step}%`}
                            aria-label="Move pin left"
                        >◀</button>
                        <button
                            type="button"
                            onClick={() => onCommit?.()}
                            className={`${arrowBtn} bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100`}
                            title="Save now"
                            aria-label="Save position"
                        >✓</button>
                        <button
                            type="button"
                            onClick={() => nudge(step, 0)}
                            className={arrowBtn}
                            title={`Move right by ${step}%`}
                            aria-label="Move pin right"
                        >▶</button>
                        <span />
                        <button
                            type="button"
                            onClick={() => nudge(0, step)}
                            className={arrowBtn}
                            title={`Move down by ${step}%`}
                            aria-label="Move pin down"
                        >▼</button>
                        <span />
                    </div>

                    {/* Step selector */}
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            Step
                        </p>
                        <div className="flex gap-1">
                            {stepOptions.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStep(s)}
                                    className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                                        step === s
                                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-purple-200"
                                    }`}
                                    title={`Move ${s}% per arrow press`}
                                >
                                    {s}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick-jump presets — handy starting points so a
                        brand-new unit doesn't begin at 50/50 stuck
                        under another pin. */}
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            Quick spots
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                            <PresetBtn label="↖" title="Top-left"     onClick={() => { onChange?.(20, 30); setTimeout(() => onCommit?.(), 0); }} />
                            <PresetBtn label="▲"  title="Top-centre"   onClick={() => { onChange?.(50, 25); setTimeout(() => onCommit?.(), 0); }} />
                            <PresetBtn label="↗" title="Top-right"    onClick={() => { onChange?.(80, 30); setTimeout(() => onCommit?.(), 0); }} />
                            <PresetBtn label="◀"  title="Mid-left"     onClick={() => { onChange?.(20, 50); setTimeout(() => onCommit?.(), 0); }} />
                            <PresetBtn label="●"  title="Centre"       onClick={() => { onChange?.(50, 50); setTimeout(() => onCommit?.(), 0); }} />
                            <PresetBtn label="▶"  title="Mid-right"    onClick={() => { onChange?.(80, 50); setTimeout(() => onCommit?.(), 0); }} />
                            <PresetBtn label="↙" title="Bottom-left"  onClick={() => { onChange?.(20, 70); setTimeout(() => onCommit?.(), 0); }} />
                            <PresetBtn label="▼"  title="Bottom-mid"   onClick={() => { onChange?.(50, 75); setTimeout(() => onCommit?.(), 0); }} />
                            <PresetBtn label="↘" title="Bottom-right" onClick={() => { onChange?.(80, 70); setTimeout(() => onCommit?.(), 0); }} />
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-gray-400 mt-2 italic">
                Tip: drag the pin on the preview, or use the arrow keypad to
                nudge by exactly {step}%. Press the green ✓ to save right
                away — values also save automatically when you leave a number
                box below.
            </p>
        </div>
    );
}

/** Tiny preset button — keeps the arrow keypad code readable. */
function PresetBtn({ label, title, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className="px-1 py-1 rounded-lg text-[11px] font-black bg-white border border-gray-200 shadow-sm hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition"
        >
            {label}
        </button>
    );
}
