<?php

namespace App\Http\Controllers;

use App\Models\AudioTrack;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\Word;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Admin control centre.
 *
 * All routes live under /admin and are protected by the `admin`
 * middleware. The controller exposes four resource surfaces:
 *   • Dashboard  — quick counts + pointers
 *   • Units      — list / create / edit / delete
 *   • Lessons    — list / create / edit / delete (scoped to a unit)
 *   • Words      — inline edit of segment_start/end + audio_track + images
 *   • Tracks     — AudioTrack CRUD (full URL, label, kind, local_path)
 *
 * All write actions are idempotent JSON endpoints so the React UI can
 * PATCH a single row without a full page reload.
 */
class AdminController extends Controller
{
    // ═══════════════════════════════════════════════════════════
    // Dashboard
    // ═══════════════════════════════════════════════════════════
    public function dashboard()
    {
        return Inertia::render('Admin/Dashboard', [
            'counts' => [
                'units'        => Unit::count(),
                'lessons'      => Lesson::count(),
                'words'        => Word::count(),
                'audioTracks'  => AudioTrack::count(),
                'linkedTracks' => AudioTrack::whereHas('lessons')->count(),
                'wordsWithSegments' => Word::whereNotNull('segment_start_ms')
                    ->whereNotNull('segment_end_ms')->count(),
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    // Units
    // ═══════════════════════════════════════════════════════════
    public function units()
    {
        return Inertia::render('Admin/Units', [
            'units' => Unit::orderBy('unit_number')->withCount('lessons')->get()->map(fn ($u) => [
                'id'            => $u->id,
                'code'          => $u->code,
                'unit_number'   => $u->unit_number,
                'title'         => $u->title,
                'description'   => $u->description,
                'image_path'    => $u->image_path,
                'color_key'     => $u->color_key,
                'lessons_count' => $u->lessons_count,
                'real_count'    => $u->lessons_count,
            ]),
        ]);
    }

    public function updateUnit(Request $request, Unit $unit)
    {
        $data = $request->validate([
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image_path'  => 'nullable|string|max:255',
            'color_key'   => 'nullable|string|max:32',
        ]);
        $unit->update($data);
        return response()->json(['ok' => true, 'unit' => $unit->fresh()]);
    }

    /**
     * FIX 9.1 — Create a new unit. Uses the next free unit_number,
     * sane defaults, and an auto-generated code when not provided.
     */
    public function createUnit(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image_path'  => 'nullable|string|max:255',
            'color_key'   => 'nullable|string|max:32',
            'code'        => 'nullable|string|max:8',
            'unit_number' => 'nullable|integer|min:0',
        ]);

        $nextNumber = $data['unit_number'] ?? ((int) Unit::max('unit_number') + 1);
        $code = $data['code'] ?? ('U' . $nextNumber);

        $unit = Unit::create([
            'unit_number' => $nextNumber,
            'code'        => $code,
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'image_path'  => $data['image_path'] ?? null,
            'color_key'   => $data['color_key'] ?? 'purple',
            'lessons_count' => 0,
        ]);

        return response()->json(['ok' => true, 'unit' => $unit]);
    }

    public function deleteUnit(Unit $unit)
    {
        $unit->delete();
        return response()->json(['ok' => true]);
    }

    // ═══════════════════════════════════════════════════════════
    // Lessons
    // ═══════════════════════════════════════════════════════════
    public function lessons(Request $request)
    {
        $unitId = $request->query('unit');

        $query = Lesson::query()
            ->with(['unit:id,code,title,unit_number', 'audioTrack:id,code,label,url,format'])
            ->orderBy('unit_id')
            ->orderBy('lesson_number');

        if ($unitId) {
            $query->where('unit_id', $unitId);
        }

        return Inertia::render('Admin/Lessons', [
            'units'    => Unit::orderBy('unit_number')->get(['id', 'code', 'title', 'unit_number']),
            'tracks'   => AudioTrack::orderBy('source')->orderBy('page')->orderBy('track_no')
                ->get(['id', 'code', 'label']),
            'selected' => (int) $unitId ?: null,
            'lessons'  => $query->get()->map(fn (Lesson $l) => [
                'id'            => $l->id,
                'unit_id'       => $l->unit_id,
                'unit_title'    => $l->unit?->title,
                'lesson_number' => $l->lesson_number,
                'page_number'   => $l->page_number,
                'title'         => $l->title,
                'type'          => $l->type,
                'config'        => $l->config,
                'audio_track'   => $l->audioTrack ? [
                    'id'     => $l->audioTrack->id,
                    'code'   => $l->audioTrack->code,
                    'label'  => $l->audioTrack->label,
                    'url'    => $l->audioTrack->url,
                    'format' => $l->audioTrack->format,
                ] : null,
            ]),
        ]);
    }

    public function updateLesson(Request $request, Lesson $lesson)
    {
        $data = $request->validate([
            'title'          => 'nullable|string|max:255',
            'type'           => 'nullable|string|max:32',
            'page_number'    => 'nullable|integer|min:0',
            'audio_track_id' => 'nullable|integer|exists:audio_tracks,id',
            'config'         => 'nullable|array',
        ]);
        $lesson->update($data);
        $lesson->load('audioTrack');
        return response()->json(['ok' => true, 'lesson' => $lesson]);
    }

    /**
     * FIX 9.1 — Create a new lesson inside a unit. Picks the next
     * lesson_number automatically when omitted and bumps the unit's
     * cached lessons_count counter.
     */
    public function createLesson(Request $request)
    {
        $data = $request->validate([
            'unit_id'        => 'required|integer|exists:units,id',
            'title'          => 'required|string|max:255',
            'type'           => 'required|string|max:32',
            'page_number'    => 'nullable|integer|min:0',
            'audio_track_id' => 'nullable|integer|exists:audio_tracks,id',
            'lesson_number'  => 'nullable|integer|min:1',
        ]);

        $unitId = $data['unit_id'];
        $next   = $data['lesson_number'] ?? ((int) Lesson::where('unit_id', $unitId)->max('lesson_number') + 1);

        $lesson = Lesson::create([
            'unit_id'        => $unitId,
            'lesson_number'  => $next,
            'page_number'    => $data['page_number'] ?? null,
            'title'          => $data['title'],
            'type'           => $data['type'],
            'audio_track_id' => $data['audio_track_id'] ?? null,
            'config'         => ['mode' => $data['type']],
        ]);

        Unit::where('id', $unitId)->update([
            'lessons_count' => Lesson::where('unit_id', $unitId)->count(),
        ]);

        $lesson->load(['unit:id,code,title,unit_number', 'audioTrack:id,code,label,url,format']);

        return response()->json(['ok' => true, 'lesson' => $lesson]);
    }

    public function deleteLesson(Lesson $lesson)
    {
        $unitId = $lesson->unit_id;
        $lesson->delete();
        Unit::where('id', $unitId)->update([
            'lessons_count' => Lesson::where('unit_id', $unitId)->count(),
        ]);
        return response()->json(['ok' => true]);
    }

    // ═══════════════════════════════════════════════════════════
    // Audio tracks
    // ═══════════════════════════════════════════════════════════
    public function tracks(Request $request)
    {
        $search = $request->query('q');
        $query = AudioTrack::query()->orderBy('source')->orderBy('page')->orderBy('track_no');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('label', 'like', "%{$search}%")
                    ->orWhere('url', 'like', "%{$search}%");
            });
        }

        $tracks = $query->paginate(40)->through(fn (AudioTrack $t) => [
            'id'           => $t->id,
            'code'         => $t->code,
            'source'       => $t->source,
            'book_type'    => $t->book_type,
            'page'         => $t->page,
            'track_no'     => $t->track_no,
            'label'        => $t->label,
            'kind'         => $t->kind,
            'url'          => $t->url,
            'local_path'   => $t->local_path,
            'format'       => $t->format,
            'duration_sec' => $t->duration_sec,
            'lessons_count' => $t->lessons()->count(),
        ]);

        return Inertia::render('Admin/Tracks', [
            'tracks' => $tracks,
            'search' => $search,
        ]);
    }

    public function createTrack(Request $request)
    {
        $data = $request->validate([
            'code'       => 'required|string|max:32|unique:audio_tracks,code',
            'source'     => 'required|string|max:32',
            'book_type'  => 'required|string|max:8',
            'page'       => 'required|integer|min:1',
            'track_no'   => 'required|integer|min:1',
            'label'      => 'nullable|string|max:255',
            'kind'       => 'required|string|max:32',
            'url'        => 'required|string|max:512',
            'format'     => 'required|string|max:8',
        ]);
        $track = AudioTrack::create($data);
        return response()->json(['ok' => true, 'track' => $track]);
    }

    public function updateTrack(Request $request, AudioTrack $track)
    {
        $data = $request->validate([
            'code'       => 'nullable|string|max:32|unique:audio_tracks,code,' . $track->id,
            'label'      => 'nullable|string|max:255',
            'kind'       => 'nullable|string|max:32',
            'url'        => 'nullable|string|max:512',
            'local_path' => 'nullable|string|max:512',
            'page'       => 'nullable|integer|min:1',
            'track_no'   => 'nullable|integer|min:1',
        ]);
        $track->update($data);
        return response()->json(['ok' => true, 'track' => $track->fresh()]);
    }

    public function deleteTrack(AudioTrack $track)
    {
        if ($track->lessons()->exists() || $track->words()->exists()) {
            return response()->json([
                'ok' => false,
                'error' => 'Track is still linked to lessons or words.',
            ], 422);
        }
        $track->delete();
        return response()->json(['ok' => true]);
    }

    // ═══════════════════════════════════════════════════════════
    // Words (the core admin screen for segment control)
    // ═══════════════════════════════════════════════════════════
    public function words(Request $request)
    {
        $unitId = $request->query('unit');
        $search = $request->query('q');

        $query = Word::query()
            ->with(['unit:id,code,title', 'audioTrack:id,code,label,url,format'])
            ->orderBy('unit_id')
            ->orderBy('type')
            ->orderBy('word');

        if ($unitId) {
            $query->where('unit_id', $unitId);
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('word', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $words = $query->paginate(50)->through(fn (Word $w) => [
            'id'               => $w->id,
            'unit_id'          => $w->unit_id,
            'unit_title'       => $w->unit?->title,
            'word'             => $w->word,
            'type'             => $w->type,
            'category'         => $w->category,
            'image_path'       => $w->image_path,
            'audio_path'       => $w->audio_path,
            'audio_track_id'   => $w->audio_track_id,
            'segment_start_ms' => $w->segment_start_ms,
            'segment_end_ms'   => $w->segment_end_ms,
            'audio_track'      => $w->audioTrack ? [
                'id'     => $w->audioTrack->id,
                'code'   => $w->audioTrack->code,
                'label'  => $w->audioTrack->label,
                'url'    => $w->audioTrack->url,
                'format' => $w->audioTrack->format,
            ] : null,
        ]);

        return Inertia::render('Admin/Words', [
            'units'  => Unit::orderBy('unit_number')->get(['id', 'code', 'title', 'unit_number']),
            'tracks' => AudioTrack::orderBy('source')->orderBy('page')->orderBy('track_no')
                ->get(['id', 'code', 'label', 'url', 'format']),
            'words'    => $words,
            'selected' => (int) $unitId ?: null,
            'search'   => $search,
        ]);
    }

    public function updateWord(Request $request, Word $word)
    {
        $data = $request->validate([
            'word'             => 'nullable|string|max:100',
            'category'         => 'nullable|string|max:32',
            'type'             => 'nullable|string|max:32',
            'image_path'       => 'nullable|string|max:255',
            'audio_path'       => 'nullable|string|max:255',
            'audio_track_id'   => 'nullable|integer|exists:audio_tracks,id',
            'segment_start_ms' => 'nullable|integer|min:0',
            'segment_end_ms'   => 'nullable|integer|min:0',
        ]);

        // Coerce empty strings to null so the admin can "unset" values
        foreach (['image_path', 'audio_path', 'audio_track_id', 'segment_start_ms', 'segment_end_ms', 'category'] as $k) {
            if (array_key_exists($k, $data) && $data[$k] === '') {
                $data[$k] = null;
            }
        }

        // Sanity: end must be greater than start
        if (
            ($data['segment_start_ms'] ?? null) !== null &&
            ($data['segment_end_ms'] ?? null) !== null &&
            $data['segment_end_ms'] <= $data['segment_start_ms']
        ) {
            return response()->json([
                'ok' => false,
                'error' => 'segment_end_ms must be greater than segment_start_ms',
            ], 422);
        }

        $word->update($data);
        $word->load('audioTrack');
        return response()->json(['ok' => true, 'word' => $word]);
    }

    /**
     * FIX 9.1 / 9.5 — Create a new word for a unit (and optionally
     * the inline "add a word to this lesson" form on the lessons
     * admin page).
     */
    public function createWord(Request $request)
    {
        $data = $request->validate([
            'unit_id'          => 'required|integer|exists:units,id',
            'word'             => 'required|string|max:100',
            'type'             => 'nullable|string|max:32',
            'category'         => 'nullable|string|max:32',
            'image_path'       => 'nullable|string|max:255',
            'audio_track_id'   => 'nullable|integer|exists:audio_tracks,id',
            'segment_start_ms' => 'nullable|integer|min:0',
            'segment_end_ms'   => 'nullable|integer|min:0',
        ]);

        $word = Word::create([
            'unit_id'          => $data['unit_id'],
            'word'             => $data['word'],
            'type'             => $data['type'] ?? 'vocab',
            'category'         => $data['category'] ?? null,
            'image_path'       => $data['image_path'] ?? null,
            'audio_track_id'   => $data['audio_track_id'] ?? null,
            'segment_start_ms' => $data['segment_start_ms'] ?? null,
            'segment_end_ms'   => $data['segment_end_ms'] ?? null,
            'wrong_options'    => [],
        ]);

        $word->load(['unit:id,code,title', 'audioTrack:id,code,label,url,format']);

        return response()->json(['ok' => true, 'word' => $word]);
    }

    public function deleteWord(Word $word)
    {
        $word->delete();
        return response()->json(['ok' => true]);
    }

    /**
     * FIX 9.2/9.3 — Image upload for unit/lesson/word covers. Saves to
     * public/assets/lessons/<folder>/ and appends a timestamp suffix
     * if a file with that name already exists, so a second upload of
     * "cat.png" doesn't clobber the first one.
     *
     * Returns: { path: 'assets/lessons/welcome/cat-1700000000.png' }
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image'  => 'required|file|image|mimes:png,jpg,jpeg,gif,webp|max:4096',
            'folder' => 'nullable|string|max:64',
        ]);

        $folder = preg_replace('~[^a-zA-Z0-9_-]~', '', (string) $request->input('folder', 'misc')) ?: 'misc';
        $base   = public_path('assets/lessons/' . $folder);
        if (! is_dir($base)) {
            File::makeDirectory($base, 0755, true);
        }

        $file = $request->file('image');
        $orig = $file->getClientOriginalName();
        $ext  = strtolower($file->getClientOriginalExtension() ?: 'png');
        $stem = pathinfo($orig, PATHINFO_FILENAME);
        $stem = Str::slug($stem) ?: 'img';

        // FIX 9.3 — collision-safe filename. If it already exists we
        // append a UNIX timestamp so we never overwrite an existing
        // image silently.
        $name = "{$stem}.{$ext}";
        if (file_exists($base . DIRECTORY_SEPARATOR . $name)) {
            $name = "{$stem}-" . time() . ".{$ext}";
            // Extreme race-condition fallback: still collides? add random.
            if (file_exists($base . DIRECTORY_SEPARATOR . $name)) {
                $name = "{$stem}-" . time() . '-' . Str::random(4) . ".{$ext}";
            }
        }

        $file->move($base, $name);
        $rel = "assets/lessons/{$folder}/{$name}";

        return response()->json([
            'ok'   => true,
            'path' => $rel,
            'url'  => '/' . $rel,
        ]);
    }
}
