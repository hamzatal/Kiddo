<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'openai' => [
        'key'   => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),

        // ── Text-to-speech ────────────────────────────────────────
        // We default to OpenAI's newest expressive TTS model
        // `gpt-4o-mini-tts` because it accepts an `instructions`
        // field that lets us steer the voice's personality
        // ("warm kindergarten teacher, gentle pace, cheerful").
        // Fallback target is `tts-1-hd` for environments where the
        // newer model isn't available — same API, no instructions.
        //
        // Voice presets:
        //   nova    — bright, expressive, child-friendly (default)
        //   shimmer — soft, warm, lullaby-like (alt for Welcome unit)
        //   alloy   — neutral, clear (good for older learners)
        //   coral   — playful (good for stories/songs)
        //   sage    — calm narrator (good for instructions)
        //
        // Speed 1 keeps natural prosody — slowing the audio is now
        // handled inside the prompt's `instructions` so single-word
        // vocabulary cards still sound expressive instead of slurred.
        'tts_model'        => env('OPENAI_TTS_MODEL', 'gpt-4o-mini-tts'),
        'tts_fallback_model' => env('OPENAI_TTS_FALLBACK_MODEL', 'tts-1-hd'),
        'voice'            => env('OPENAI_TTS_VOICE', 'nova'),
        'tts_speed'        => env('OPENAI_TTS_SPEED', 1.0),
        // Default voice instructions used when no per-call override is
        // provided. The wording is tuned for first-grade English
        // pronunciation flashcards: friendly, slow, very clear.
        'tts_instructions' => env('OPENAI_TTS_INSTRUCTIONS',
            'Speak like a warm, encouraging kindergarten teacher reading vocabulary flashcards to a six-year-old.'
            . ' Use a bright, friendly tone with a gentle, unhurried pace.'
            . ' Pronounce each phoneme clearly so the child can copy it.'
            . ' Add a tiny smile to the voice. Avoid robotic flatness.'
        ),
    ],

];
