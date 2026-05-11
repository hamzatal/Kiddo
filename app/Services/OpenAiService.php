<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin wrapper around the OpenAI Chat Completions API, tailored for
 * Kiddo's 3 classroom use-cases:
 *
 *   - Child-facing Fox Helper      (short, 1-2 sentences, only allowed words)
 *   - Parent progress insight      (3-5 sentences in parent's language)
 *   - Help Center chat             (friendly tips, longer paragraphs)
 *
 * Requires OPENAI_API_KEY in .env. If the key is missing or the API
 * call fails, a safe fallback string is returned so the UI never
 * breaks for the kid.
 */
class OpenAiService
{
    private const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

    public function __construct(
        private readonly ?string $apiKey = null,
        private readonly string $model = 'gpt-4o-mini',
    ) {
    }

    public static function make(): self
    {
        return new self(
            config('services.openai.key'),
            config('services.openai.model', 'gpt-4o-mini'),
        );
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Low-level chat request. Returns the assistant string or a
     * fallback when OpenAI is unreachable or unconfigured.
     */
    public function chat(array $messages, float $temperature = 0.6, int $maxTokens = 220): string
    {
        if (! $this->isConfigured()) {
            return $this->fallback($messages);
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(15)
                ->acceptJson()
                ->post(self::ENDPOINT, [
                    'model'       => $this->model,
                    'messages'    => $messages,
                    'temperature' => $temperature,
                    'max_tokens'  => $maxTokens,
                ]);

            if (! $response->successful()) {
                Log::warning('OpenAI API non-200', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return $this->fallback($messages);
            }

            $text = $response->json('choices.0.message.content');
            return is_string($text) ? trim($text) : $this->fallback($messages);
        } catch (\Throwable $e) {
            Log::warning('OpenAI call failed: ' . $e->getMessage());
            return $this->fallback($messages);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Use-case-specific helpers
    // ═══════════════════════════════════════════════════════════

    public function foxHelper(string $word, string $unitTitle, array $allowedWords, string $userPrompt): string
    {
        $system = "You are Kiddo Fox, a friendly helper for a first-grader learning English. "
            . "The child is studying the unit '{$unitTitle}' and the current word is '{$word}'. "
            . "Only use words from this allowed list: " . implode(', ', $allowedWords) . ". "
            . "Rules: reply in EXACTLY 1-2 short sentences (max 15 words), cheerful tone, "
            . "no slang, no difficult grammar. If the child wants an example sentence, "
            . "make it very simple like 'This is my mum.' or 'I have a red ball.'.";

        return $this->chat([
            ['role' => 'system', 'content' => $system],
            ['role' => 'user',   'content' => $userPrompt],
        ], 0.5, 80);
    }

    public function parentInsight(array $childStats): string
    {
        $system = "You are Kiddo, an insight generator for parents. Given a child's learning stats "
            . "from the 'Team Together 1A' curriculum, write a concise, warm report. Rules: "
            . "3-5 short bullet-like sentences, in English, focused on (1) strengths, (2) one area to practice, "
            . "(3) one concrete activity the parent can do at home using the same curriculum. "
            . "Do NOT invent new vocabulary — use only the unit words listed.";

        $user = "Child stats:\n" . json_encode($childStats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return $this->chat([
            ['role' => 'system', 'content' => $system],
            ['role' => 'user',   'content' => $user],
        ], 0.7, 260);
    }

    public function helpCenterReply(string $question): string
    {
        $system = "You are Kiddo Support, a helpful assistant for parents and teachers of first-graders "
            . "using the Team Together 1A curriculum (units: Welcome, Family, School bag, Classroom, Toys, Days). "
            . "Rules: be supportive and practical, 2-4 sentences, suggest a small activity the parent can do "
            . "at home using only the words from these units. Keep the tone gentle and non-judgemental.";

        return $this->chat([
            ['role' => 'system', 'content' => $system],
            ['role' => 'user',   'content' => $question],
        ], 0.7, 220);
    }

    /**
     * Deterministic fallback when OpenAI is offline / unconfigured.
     * Uses the user prompt to pick a safe canned response rather than
     * leaking any "Sorry, I can't reply" text to the kid.
     */
    private function fallback(array $messages): string
    {
        $user = '';
        foreach ($messages as $m) {
            if (($m['role'] ?? '') === 'user') {
                $user = strtolower($m['content'] ?? '');
                break;
            }
        }

        if (str_contains($user, 'sentence') || str_contains($user, 'example')) {
            return "Great! Try saying: 'I can see a friend.'";
        }
        if (str_contains($user, 'say it slowly') || str_contains($user, 'slowly')) {
            return "Sure! Listen carefully and repeat after me, nice and slow.";
        }
        if (str_contains($user, 'explain') || str_contains($user, 'what')) {
            return "It's a word you can point to on the page. Look and listen!";
        }
        return "You're doing great! Keep going and have fun.";
    }
}
