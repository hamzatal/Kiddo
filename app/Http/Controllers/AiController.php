<?php

namespace App\Http\Controllers;

use App\Models\AiInteraction;
use App\Models\Unit;
use App\Models\Word;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    // 1) مساعد الدرس للطفل
    public function lessonHelper(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'unitId'   => 'required|integer|exists:units,id',
            'wordId'   => 'required|integer|exists:words,id',
            'prompt'   => 'required|string',
        ]);

        $unit = Unit::findOrFail($data['unitId']);
        $word = Word::findOrFail($data['wordId']);

        // هنا لاحقاً سنستدعي GPT API
        $responseText = "This is a placeholder answer about the word {$word->word}. Soon I'll use GPT here.";

        AiInteraction::create([
            'user_id' => $user?->id,
            'context' => 'lesson-helper',
            'unit_id' => $unit->id,
            'lesson_id' => null,
            'payload' => [
                'prompt' => $data['prompt'],
                'word'   => $word->word,
                'unit'   => $unit->title,
            ],
            'response' => $responseText,
        ]);

        return response()->json([
            'answer' => $responseText,
        ]);
    }

    // 2) تقرير الأهل
    public function parentReport(Request $request)
    {
        $user = $request->user();

        // في المستقبل: جمع بيانات الأداء وإرسالها لـ GPT
        $responseText = "This is a placeholder AI report about your child's progress.";

        AiInteraction::create([
            'user_id'  => $user?->id,
            'context'  => 'parent-report',
            'unit_id'  => null,
            'lesson_id' => null,
            'payload'  => [],
            'response' => $responseText,
        ]);

        return response()->json([
            'report' => $responseText,
        ]);
    }

    // 3) Help Center
    public function helpCenter(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'question' => 'required|string',
        ]);

        $responseText = "Thanks for your question. This is a placeholder Help Center AI answer.";

        AiInteraction::create([
            'user_id'  => $user?->id,
            'context'  => 'help-center',
            'unit_id'  => null,
            'lesson_id' => null,
            'payload'  => [
                'question' => $data['question'],
            ],
            'response' => $responseText,
        ]);

        return response()->json([
            'answer' => $responseText,
        ]);
    }
}
