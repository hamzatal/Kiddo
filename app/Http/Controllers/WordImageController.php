<?php

namespace App\Http\Controllers;

use App\Models\Word;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * GET /api/word-svg/{word}.svg
 *
 * Renders a friendly SVG card for any Word that doesn't have a real
 * image on disk. Each word gets a stable colour pair (hashed from its
 * text) and a curated emoji from the WORD_EMOJI_MAP. The output is
 * deterministic and cacheable for a year.
 *
 * The SmartImage component on the frontend hits this URL when
 * Word::imageUrl() resolves to a path that doesn't exist — meaning
 * even a freshly-seeded curriculum without uploaded images will
 * always render something delightful instead of a broken-image icon.
 */
class WordImageController extends Controller
{
    /**
     * Hand-curated emoji map covering the entire Team Together 1A
     * vocabulary plus general first-grade nouns. Keep this in sync
     * with the JS WORD_EMOJIS object in SmartImage.jsx so the
     * fallback experience is consistent on both ends.
     */
    private const EMOJI_MAP = [
        // Family
        'mum' => '👩', 'mom' => '👩', 'mummy' => '👩', 'mommy' => '👩', 'mother' => '👩',
        'dad' => '👨', 'daddy' => '👨', 'father' => '👨',
        'brother' => '🧒', 'sister' => '👧', 'baby' => '👶',
        'grandma' => '👵', 'grandpa' => '👴', 'family' => '👨‍👩‍👧‍👦',
        'boy' => '👦', 'girl' => '👧', 'kid' => '🧒', 'child' => '🧒',
        'me' => '🙋', 'friend' => '🤝',

        // Numbers 1-10
        'one' => '1️⃣', 'two' => '2️⃣', 'three' => '3️⃣', 'four' => '4️⃣', 'five' => '5️⃣',
        'six' => '6️⃣', 'seven' => '7️⃣', 'eight' => '8️⃣', 'nine' => '9️⃣', 'ten' => '🔟',

        // Colours
        'red' => '🟥', 'blue' => '🟦', 'green' => '🟩', 'yellow' => '🟨',
        'orange' => '🟧', 'purple' => '🟪', 'pink' => '🌸', 'black' => '⬛',
        'white' => '⬜', 'brown' => '🟫', 'grey' => '⬜', 'gray' => '⬜',

        // School / classroom
        'book' => '📖', 'pen' => '🖊️', 'pencil' => '✏️', 'ruler' => '📏', 'crayon' => '🖍️',
        'bag' => '🎒', 'schoolbag' => '🎒', 'backpack' => '🎒',
        'rubber' => '🧽', 'eraser' => '🧽', 'sharpener' => '✏️',
        'desk' => '🪑', 'chair' => '🪑', 'table' => '🪑', 'board' => '📋', 'whiteboard' => '📋',
        'school' => '🏫', 'classroom' => '🏫', 'teacher' => '👩‍🏫',
        'notebook' => '📓', 'paper' => '📄', 'scissors' => '✂️', 'glue' => '🧴',

        // Toys & play
        'toy' => '🧸', 'ball' => '⚽', 'doll' => '🪆', 'kite' => '🪁',
        'robot' => '🤖', 'puzzle' => '🧩', 'car' => '🚗', 'train' => '🚂', 'bike' => '🚲',
        'teddy' => '🧸', 'bear' => '🐻', 'duck' => '🦆',
        'drum' => '🥁', 'guitar' => '🎸', 'piano' => '🎹', 'plane' => '✈️',

        // Animals
        'cat' => '🐱', 'dog' => '🐶', 'rabbit' => '🐰', 'fish' => '🐠',
        'bird' => '🐦', 'horse' => '🐴', 'cow' => '🐄', 'sheep' => '🐑',
        'pig' => '🐷', 'frog' => '🐸', 'lion' => '🦁', 'tiger' => '🐯',
        'elephant' => '🐘', 'monkey' => '🐒', 'bee' => '🐝', 'fox' => '🦊',
        'panda' => '🐼', 'snake' => '🐍', 'mouse' => '🐭', 'butterfly' => '🦋',

        // Food
        'apple' => '🍎', 'banana' => '🍌', 'grape' => '🍇',
        'bread' => '🍞', 'cake' => '🍰', 'cookie' => '🍪',
        'milk' => '🥛', 'juice' => '🧃', 'water' => '💧',
        'pizza' => '🍕', 'burger' => '🍔', 'egg' => '🥚', 'rice' => '🍚',
        'fruit' => '🍎', 'vegetable' => '🥦',

        // Body
        'head' => '🗣️', 'eye' => '👁️', 'eyes' => '👀', 'ear' => '👂', 'ears' => '👂',
        'nose' => '👃', 'mouth' => '👄', 'hand' => '✋', 'hands' => '🙌',
        'foot' => '🦶', 'feet' => '🦶', 'leg' => '🦵', 'arm' => '💪', 'hair' => '💇',
        'tooth' => '🦷', 'teeth' => '🦷',

        // Greetings & general
        'hello' => '👋', 'hi' => '👋', 'bye' => '👋', 'goodbye' => '👋',
        'good' => '😊', 'morning' => '🌅', 'evening' => '🌆', 'night' => '🌙',
        'yes' => '✅', 'no' => '❌', 'please' => '🙏', 'thanks' => '🙏',

        // Nature
        'sun' => '☀️', 'moon' => '🌙', 'star' => '⭐', 'cloud' => '☁️', 'rain' => '🌧️',
        'tree' => '🌳', 'flower' => '🌸', 'grass' => '🌱', 'leaf' => '🍃',
        'river' => '🏞️', 'mountain' => '⛰️', 'sea' => '🌊', 'beach' => '🏖️',

        // House
        'house' => '🏠', 'home' => '🏠', 'door' => '🚪', 'window' => '🪟',
        'bed' => '🛏️', 'lamp' => '💡', 'tv' => '📺', 'phone' => '📞',

        // Clothes
        'shirt' => '👕', 'trousers' => '👖', 'shoes' => '👟', 'hat' => '👒',
        'sock' => '🧦', 'dress' => '👗', 'skirt' => '👗', 'jacket' => '🧥',

        // Days of week
        'monday' => '1️⃣', 'tuesday' => '2️⃣', 'wednesday' => '3️⃣',
        'thursday' => '4️⃣', 'friday' => '5️⃣', 'saturday' => '6️⃣', 'sunday' => '7️⃣',

        // Verbs / actions
        'play' => '🎲', 'run' => '🏃', 'jump' => '🤸', 'swim' => '🏊', 'read' => '📖',
        'write' => '✍️', 'draw' => '🎨', 'sing' => '🎤', 'dance' => '💃',
        'eat' => '🍽️', 'drink' => '🥤', 'sleep' => '😴', 'walk' => '🚶',
        'happy' => '😊', 'sad' => '😢', 'angry' => '😠',
    ];

    /**
     * Stable colour palettes (10 of them). Each word always picks the
     * same palette so the visual is consistent across visits.
     */
    private const PALETTES = [
        ['#A78BFA', '#7C3AED'], // purple
        ['#60A5FA', '#2563EB'], // blue
        ['#34D399', '#059669'], // emerald
        ['#FBBF24', '#D97706'], // amber
        ['#F472B6', '#DB2777'], // pink
        ['#22D3EE', '#0891B2'], // cyan
        ['#FB7185', '#E11D48'], // rose
        ['#818CF8', '#4F46E5'], // indigo
        ['#2DD4BF', '#0D9488'], // teal
        ['#FB923C', '#EA580C'], // orange
    ];

    public function show(int $wordId): Response
    {
        $word = Word::find($wordId);
        $label = $word?->word ?? 'Word';
        return $this->renderFor($label);
    }

    /**
     * GET /api/word-svg-by-text/{text}.svg
     * Same idea but driven directly by a piece of text. Used by
     * authored decoy options that don't have a Word row.
     */
    public function byText(string $text): Response
    {
        $text = preg_replace('/[^A-Za-z0-9 ]+/', '', $text);
        return $this->renderFor($text ?: '?');
    }

    private function renderFor(string $label): Response
    {
        $key = mb_strtolower(trim($label));
        $emoji = self::EMOJI_MAP[$key] ?? null;

        // Try the first whitespace-separated token (e.g. "good morning" → "morning")
        if (! $emoji) {
            foreach (preg_split('/\s+/', $key) as $part) {
                if (isset(self::EMOJI_MAP[$part])) {
                    $emoji = self::EMOJI_MAP[$part];
                    break;
                }
            }
        }

        if (! $emoji) {
            $fallbacks = ['🌟', '🎈', '🦋', '🌈', '🎨', '🎵', '🌸', '✨', '🎁', '🌻'];
            $emoji = $fallbacks[abs(crc32($key)) % count($fallbacks)];
        }

        $palette = self::PALETTES[abs(crc32($key)) % count(self::PALETTES)];
        [$colorLight, $colorDark] = $palette;

        $displayLabel = mb_strtoupper($label);
        if (mb_strlen($displayLabel) > 12) {
            $displayLabel = mb_substr($displayLabel, 0, 11) . '…';
        }
        $displayLabel = htmlspecialchars($displayLabel, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        // Single SVG with gradient background, big centered emoji,
        // word label below. 320x320 viewBox so it scales from
        // thumbnail to full screen without pixelation.
        $svg = <<<SVG
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{$colorLight}"/>
      <stop offset="100%" stop-color="{$colorDark}"/>
    </linearGradient>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>
  <rect width="320" height="320" rx="36" fill="url(#g)"/>
  <circle cx="80" cy="80" r="40" fill="#ffffff" opacity="0.18" filter="url(#soft)"/>
  <circle cx="240" cy="240" r="60" fill="#ffffff" opacity="0.10" filter="url(#soft)"/>
  <text x="160" y="180" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"
        font-size="140" text-anchor="middle" dominant-baseline="middle">{$emoji}</text>
  <text x="160" y="270" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="28" font-weight="900" letter-spacing="2"
        text-anchor="middle" fill="#ffffff" opacity="0.95"
        style="paint-order:stroke;stroke:rgba(0,0,0,0.18);stroke-width:2px">{$displayLabel}</text>
</svg>
SVG;

        return response($svg, 200, [
            'Content-Type'  => 'image/svg+xml; charset=utf-8',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
