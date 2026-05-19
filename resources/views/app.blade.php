<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="UTF-8">
    {{--
        FIX: We removed `maximum-scale=1.0`. Locking the zoom level
        breaks WCAG 2.1 1.4.4 (Resize text) — children with low vision
        and parents on tablets must be able to pinch-zoom. The
        modern `viewport-fit=cover` keeps the layout going edge-to-edge
        on iPhones with notches without disabling zoom.
    --}}
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    {{--
        FIX (Kiddo is a LIGHT-ONLY product): we explicitly opt OUT of
        the OS-level dark mode here. The previous value
        `<meta name="color-scheme" content="light dark">` told Chrome /
        Edge / Safari to render native form controls (`<input>`,
        `<select>`, `<textarea>`, date pickers, scrollbars …) using the
        OS dark theme whenever the user's machine was set to dark
        mode — which is exactly the "بعض الحقول لونها دارك" complaint:
        the rest of the page is white but the inputs draw with a
        slate-grey background and white text. Pinning to `light` keeps
        every native UI element looking the way our Tailwind theme
        expects, regardless of the visitor's OS setting. The CSS
        `:root { color-scheme: light }` rule in app.css backs this up
        for browsers that honour the property but ignore the meta tag.

        The single `theme-color` ensures the address-bar / status-bar
        on mobile picks the brand purple consistently — no separate
        dark variant since we don't ship a dark theme.
    --}}
    <meta name="theme-color" content="#7C3AED">
    <meta name="color-scheme" content="light">
    <meta name="description" content="Kiddo — playful English-learning adventure for kids aged 6-7. Curriculum-aligned vocabulary, audio, games, and a friendly Fox helper.">
    <meta name="format-detection" content="telephone=no">

    {{-- FIX: CSRF token now exposed so axios/fetch can sign requests. --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Kiddo') }}</title>

    {{-- Favicons --}}
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/favicon.ico">
    <link rel="manifest" href="/site.webmanifest">

    {{-- Fonts: preconnect first so the DNS/TLS handshake completes
         before the font request, then load Nunito with display=swap so
         the page never blocks on the font. NOTE: we no longer @import
         the same font from app.css (was causing a duplicate request). --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>

{{--
    FIX: removed `overflow-hidden` from <body>. The full-screen
    layouts (LessonScreen, MapScreen) handle their own scrolling
    region; pages like HomeScreen and AboutScreen now scroll
    naturally instead of being silently clipped. The <html>
    element keeps `overflow-x-hidden` to avoid horizontal scroll
    from rotated decorative elements.
--}}
<body class="min-h-screen bg-[#F0F4FF] antialiased selection:bg-[#7C3AED] selection:text-white font-sans">
    @inertia
</body>

</html>
