<?php

namespace App\Http\Controllers;

use App\Models\AudioTrack;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\Word;
use App\Services\AudioSegmentationService;
use App\Services\CurriculumAutoMapService;
use App\Services\CurriculumIngestService;
use App\Services\NccdAudioDiscoveryService;
use App\Services\TtsAudioService;
use Illuminate\Http\Request;
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

    public function createUnit(Request $request)
    {
        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string|max:1000',
            'color_key'    => 'nullable|string|max:32',
            'unit_number'  => 'required|integer|min:0|unique:units,unit_number',
            'code'         => 'required|string|max:16|unique:units,code',
        ]);
        $data['lessons_count'] = 0;
        $unit = Unit::create($data);
        return response()->json(['ok' => true, 'unit' => $unit]);
    }

    public function uploadUnitImage(Request $request, Unit $unit)
    {
        // Path A: JSON base64 (avoids POST limits — preferred)
        if ($request->isJson() || $request->filled('image_base64')) {
            $payload = $request->validate([
                'image_base64' => 'required|string',
            ]);
            try {
                $saved = $this->saveBase64Image(
                    $payload['image_base64'],
                    'unit_' . $unit->id . '_' . time(),
                    public_path('assets/uploads/units')
                );
            } catch (\Throwable $e) {
                return response()->json([
                    'ok'    => false,
                    'error' => 'Image save failed: ' . $e->getMessage(),
                ], 500);
            }
            $unit->update(['image_path' => $saved]);
            return response()->json(['ok' => true, 'image_path' => $saved]);
        }

        // Path B: classic multipart (kept for backwards compat)
        if ($truncated = $this->detectUploadTruncation($request)) {
            return response()->json($truncated, 413);
        }

        $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,gif,webp,svg,bmp|max:20480'
        ]);
        $file = $request->file('image');
        $ext = strtolower($file->getClientOriginalExtension() ?: 'png');
        $filename = 'unit_' . $unit->id . '_' . time() . '.' . $ext;
        $dir = public_path('assets/uploads/units');
        if (! is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        $file->move($dir, $filename);
        $relativePath = 'assets/uploads/units/' . $filename;
        $unit->update(['image_path' => $relativePath]);
        return response()->json(['ok' => true, 'image_path' => $relativePath]);
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

    public function createLesson(Request $request)
    {
        $data = $request->validate([
            'unit_id'        => 'required|integer|exists:units,id',
            'lesson_number'  => 'required|integer|min:1',
            'title'          => 'required|string|max:255',
            'type'           => 'required|string|max:32',
            'page_number'    => 'nullable|integer|min:0',
            'audio_track_id' => 'nullable|integer|exists:audio_tracks,id',
            'config'         => 'nullable|array',
        ]);
        $lesson = Lesson::create($data);
        
        // Update unit lessons_count
        $unit = Unit::find($data['unit_id']);
        if ($unit) {
            $unit->update(['lessons_count' => $unit->lessons()->count()]);
        }
        
        return response()->json(['ok' => true, 'lesson' => $lesson->load('audioTrack')]);
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

    public function createWord(Request $request)
    {
        $data = $request->validate([
            'unit_id'          => 'required|integer|exists:units,id',
            'word'             => 'required|string|max:100',
            'type'             => 'required|string|max:32',
            'category'         => 'nullable|string|max:32',
            'audio_track_id'   => 'nullable|integer|exists:audio_tracks,id',
            'segment_start_ms' => 'nullable|integer|min:0',
            'segment_end_ms'   => 'nullable|integer|min:0',
        ]);
        $word = Word::create($data);
        return response()->json(['ok' => true, 'word' => $word->load('audioTrack')]);
    }

    /**
     * POST /admin/words/{word}/auto-segment
     * Run Whisper on this word's linked audio track and write the
     * matching start/end timestamps into the row. Lets the admin
     * skip the manual stamp step on a per-word basis from the UI.
     */
    public function autoSegmentWord(Word $word)
    {
        $word->loadMissing('audioTrack');
        if (! $word->audioTrack) {
            return response()->json([
                'ok'    => false,
                'error' => 'This word has no audio track linked yet.',
            ], 422);
        }

        $service = \App\Services\AudioSegmentationService::make();
        if (! $service->isConfigured()) {
            return response()->json([
                'ok'    => false,
                'error' => 'OPENAI_API_KEY is not configured. Add it to .env to enable auto-segment.',
            ], 503);
        }

        // Force overwrite for this single row so the admin always gets
        // the latest Whisper result (the bulk command is conservative
        // and skips already-segmented words by default).
        $result = $service->segmentTrack($word->audioTrack, true);

        if (isset($result['error']) && empty($result['matched'])) {
            return response()->json([
                'ok'    => false,
                'error' => $result['error'],
            ], 422);
        }

        $word->refresh();

        if ($word->segment_start_ms === null || $word->segment_end_ms === null) {
            return response()->json([
                'ok'    => false,
                'error' => 'Whisper transcribed the track but could not match this word ("' . $word->word . '"). Set the segment manually.',
            ], 200);
        }

        return response()->json([
            'ok'               => true,
            'segment_start_ms' => $word->segment_start_ms,
            'segment_end_ms'   => $word->segment_end_ms,
            'word'             => $word,
        ]);
    }

    /**
     * POST /admin/words/{word}/image
     *
     * Two ways to send the image:
     *
     * 1. Classic multipart/form-data with field "image" — works for
     *    small files but capped by PHP's post_max_size / upload_max_filesize
     *    and nginx client_max_body_size. This is the cause of the
     *    "POST data is too large" error.
     *
     * 2. RECOMMENDED — JSON body with field "image_base64" containing
     *    a data URL ("data:image/png;base64,...."). The frontend
     *    resizes and re-encodes the image to ~150 KB before sending
     *    so it always fits comfortably under any limit.
     */
    public function uploadWordImage(Request $request, Word $word)
    {
        // Path A: JSON base64 (post-shrink in the browser, never hits limits)
        if ($request->isJson() || $request->filled('image_base64')) {
            $payload = $request->validate([
                'image_base64' => 'required|string',
            ]);
            try {
                $saved = $this->saveBase64Image(
                    $payload['image_base64'],
                    'word_' . $word->id . '_' . time(),
                    public_path('assets/uploads/words')
                );
            } catch (\Throwable $e) {
                return response()->json([
                    'ok'    => false,
                    'error' => 'Image save failed: ' . $e->getMessage(),
                ], 500);
            }
            $word->update(['image_path' => $saved]);
            return response()->json(['ok' => true, 'image_path' => $saved]);
        }

        // Path B: classic multipart upload (kept for backwards compat)
        if ($truncated = $this->detectUploadTruncation($request)) {
            return response()->json($truncated, 413);
        }

        $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,gif,webp,svg,bmp|max:20480'
        ]);
        $file = $request->file('image');
        $ext = strtolower($file->getClientOriginalExtension() ?: 'png');
        $filename = 'word_' . $word->id . '_' . time() . '.' . $ext;
        $dir = public_path('assets/uploads/words');
        if (! is_dir($dir)) {
            if (! @mkdir($dir, 0775, true) && ! is_dir($dir)) {
                return response()->json([
                    'ok'    => false,
                    'error' => "Server cannot create the upload folder ({$dir}). Check directory permissions.",
                ], 500);
            }
        }
        if (! is_writable($dir)) {
            return response()->json([
                'ok'    => false,
                'error' => "Upload folder is not writable. Run: chmod -R 775 public/assets/uploads",
            ], 500);
        }

        try {
            $file->move($dir, $filename);
        } catch (\Throwable $e) {
            return response()->json([
                'ok'    => false,
                'error' => 'Could not save the image file: ' . $e->getMessage(),
            ], 500);
        }

        $relativePath = 'assets/uploads/words/' . $filename;
        $word->update(['image_path' => $relativePath]);
        return response()->json(['ok' => true, 'image_path' => $relativePath]);
    }

    /**
     * POST /admin/words/auto-segment-all
     *
     * Run Whisper on every audio_track that has at least one linked
     * word. Skips tracks where every word is already segmented unless
     * `overwrite=1` is passed. Returns a per-track summary so the
     * admin can review which calls succeeded / which words couldn't
     * be matched.
     */
    public function autoSegmentAll(Request $request)
    {
        $service = \App\Services\AudioSegmentationService::make();
        if (! $service->isConfigured()) {
            return response()->json([
                'ok'    => false,
                'error' => 'OPENAI_API_KEY is not configured.',
            ], 503);
        }

        $overwrite = (bool) $request->input('overwrite', false);
        $unitId    = $request->input('unit_id');

        $trackIds = Word::query()
            ->whereNotNull('audio_track_id')
            ->when($unitId, fn ($q) => $q->where('unit_id', $unitId))
            ->when(! $overwrite, fn ($q) => $q->where(function ($q) {
                $q->whereNull('segment_start_ms')->orWhereNull('segment_end_ms');
            }))
            ->distinct()
            ->pluck('audio_track_id');

        $tracks = AudioTrack::whereIn('id', $trackIds)->get();
        $report = [];
        $totalMatched = 0;
        $totalWords   = 0;

        foreach ($tracks as $track) {
            $result = $service->segmentTrack($track, $overwrite);
            $matched = $result['matched'] ?? 0;
            $total   = $result['total']   ?? 0;
            $totalMatched += $matched;
            $totalWords   += $total;
            $report[] = [
                'track'   => $track->code,
                'label'   => $track->label,
                'matched' => $matched,
                'total'   => $total,
                'error'   => $result['error']   ?? null,
                'message' => $result['message'] ?? null,
            ];
        }

        return response()->json([
            'ok'             => true,
            'tracks_run'     => count($report),
            'words_matched'  => $totalMatched,
            'words_total'    => $totalWords,
            'report'         => $report,
        ]);
    }

    /**
     * GET /admin/audio/check
     *
     * HEAD-probes every AudioTrack URL and returns the broken ones
     * with status codes / content types. The admin can use this to
     * spot wrong URLs before children hit them in the lesson.
     */
    public function checkAudioUrls()
    {
        $service = \App\Services\AudioSegmentationService::make();

        $tracks = AudioTrack::orderBy('source')->orderBy('page')->orderBy('track_no')->get();
        $broken = [];
        $ok     = 0;

        foreach ($tracks as $t) {
            $probe = $service->probeUrl($t->url);
            if ($probe['ok']) {
                $ok++;
            } else {
                $broken[] = [
                    'id'    => $t->id,
                    'code'  => $t->code,
                    'url'   => $t->url,
                    'label' => $t->label,
                    'error' => $probe['error'] ?? 'unknown',
                    'status'=> $probe['status'] ?? null,
                ];
            }
        }

        return response()->json([
            'ok'      => true,
            'total'   => $tracks->count(),
            'healthy' => $ok,
            'broken'  => $broken,
        ]);
    }

    /**
     * GET /admin/words/duplicates
     *
     * Reports words that appear more than once inside the same unit.
     * Lets the admin de-duplicate the curriculum quickly.
     */
    public function findDuplicateWords()
    {
        $duplicates = Word::query()
            ->selectRaw('LOWER(word) as wlow, unit_id, COUNT(*) as c')
            ->groupBy('wlow', 'unit_id')
            ->having('c', '>', 1)
            ->get();

        $detail = [];
        foreach ($duplicates as $row) {
            $rows = Word::with('unit:id,code,title')
                ->whereRaw('LOWER(word) = ?', [$row->wlow])
                ->where('unit_id', $row->unit_id)
                ->get(['id', 'word', 'unit_id', 'category', 'audio_track_id', 'segment_start_ms', 'segment_end_ms', 'image_path']);
            $detail[] = [
                'word'    => $row->wlow,
                'unit_id' => $row->unit_id,
                'unit'    => $rows->first()?->unit?->title,
                'count'   => (int) $row->c,
                'rows'    => $rows->map(fn ($w) => [
                    'id'             => $w->id,
                    'word'           => $w->word,
                    'category'       => $w->category,
                    'has_segment'    => $w->segment_start_ms !== null && $w->segment_end_ms !== null,
                    'audio_track_id' => $w->audio_track_id,
                ])->all(),
            ];
        }

        return response()->json([
            'ok'         => true,
            'duplicates' => $detail,
        ]);
    }

    /**
     * Decode a data-URL ("data:image/png;base64,...") into a real file
     * under $dir. Returns the public-relative path the frontend can
     * point img.src at. Throws on malformed input.
     */
    private function saveBase64Image(string $dataUrl, string $baseFilename, string $dir): string
    {
        if (! is_dir($dir)) {
            if (! @mkdir($dir, 0775, true) && ! is_dir($dir)) {
                throw new \RuntimeException("Cannot create upload folder ({$dir})");
            }
        }
        if (! is_writable($dir)) {
            throw new \RuntimeException("Upload folder is not writable ({$dir})");
        }

        // Accept either "data:image/png;base64,xxx" or just the bare base64 string
        $mime = 'image/png';
        if (preg_match('~^data:(image/[^;]+);base64,(.+)$~i', trim($dataUrl), $m)) {
            $mime = strtolower($m[1]);
            $b64  = $m[2];
        } else {
            $b64 = trim($dataUrl);
        }
        $bytes = base64_decode($b64, true);
        if ($bytes === false || strlen($bytes) === 0) {
            throw new \RuntimeException('Image data is not valid base64');
        }
        if (strlen($bytes) > 20 * 1024 * 1024) {
            throw new \RuntimeException('Image exceeds 20 MB');
        }

        $extMap = [
            'image/png'  => 'png',
            'image/jpeg' => 'jpg',
            'image/jpg'  => 'jpg',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
            'image/bmp'  => 'bmp',
            'image/svg+xml' => 'svg',
        ];
        $ext = $extMap[$mime] ?? 'png';

        $filename = $baseFilename . '.' . $ext;
        $abs = $dir . DIRECTORY_SEPARATOR . $filename;
        if (file_put_contents($abs, $bytes) === false) {
            throw new \RuntimeException('file_put_contents failed');
        }

        // Convert absolute path to public-relative
        $publicRoot = realpath(public_path()) ?: public_path();
        $rel = ltrim(str_replace($publicRoot, '', realpath($abs) ?: $abs), DIRECTORY_SEPARATOR);
        return str_replace(DIRECTORY_SEPARATOR, '/', $rel);
    }

    /**
     * DELETE /admin/words/{word}
     * Remove a word entirely. Useful for cleaning up duplicates or
     * test entries the admin no longer wants. Also wipes the uploaded
     * image file from public/assets/uploads/words/ so we don't leak
     * orphan files. Seeded assets under assets/lessons/* are left
     * alone in case the path was hand-edited to one of those.
     */
    public function deleteWord(Word $word)
    {
        if (
            $word->image_path &&
            str_starts_with(ltrim($word->image_path, '/'), 'assets/uploads/words/')
        ) {
            $abs = public_path(ltrim($word->image_path, '/'));
            if (is_file($abs)) {
                @unlink($abs);
            }
        }

        $word->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Detect uploads that were silently truncated by PHP's
     * post_max_size / upload_max_filesize. Returns a structured error
     * payload (or null when the request is healthy).
     *
     * Symptom: Content-Length on the request is non-zero but
     *   $_POST and $_FILES are both empty — PHP discarded the body.
     */
    private function detectUploadTruncation(Request $request): ?array
    {
        $contentLen = (int) $request->header('Content-Length', 0);
        if ($contentLen <= 0) {
            return null;
        }

        $hasPost = ! empty($_POST);
        $hasFiles = ! empty($_FILES);

        if (! $hasPost && ! $hasFiles) {
            $maxPost   = ini_get('post_max_size') ?: 'unknown';
            $maxUpload = ini_get('upload_max_filesize') ?: 'unknown';
            return [
                'ok'      => false,
                'error'   => "The image is too large for the server to accept (post_max_size={$maxPost}, upload_max_filesize={$maxUpload}). Try a file under 20 MB.",
                'errors'  => ['image' => ['File too large for current PHP limits.']],
                'limits'  => [
                    'post_max_size'        => $maxPost,
                    'upload_max_filesize'  => $maxUpload,
                ],
            ];
        }

        // Per-file PHP error code (UPLOAD_ERR_INI_SIZE / FORM_SIZE)
        $file = $request->file('image');
        if ($file && ! $file->isValid()) {
            $code = $file->getError();
            if (in_array($code, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
                return [
                    'ok'    => false,
                    'error' => 'The image exceeds the upload size limit. Pick a file under 64 MB.',
                    'errors'=> ['image' => ['File too large.']],
                ];
            }
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════
    // merge #15 — Generic uploads, deletes, NCCD discovery, TTS,
    //              AI curriculum ingest, bulk word delete.
    // ═══════════════════════════════════════════════════════════

    /**
     * POST /admin/uploads/image
     * Generic image uploader used by "create-word" and "create-lesson"
     * forms before a Word/Unit row exists yet. Always accepts JSON
     * base64 (which the React resizer produces) — this is the path
     * that fixes the "POST data is too large" error during creation.
     */
    public function uploadGenericImage(Request $request)
    {
        $payload = $request->validate([
            'image_base64' => 'required|string',
            'folder'       => 'nullable|string|max:64',
        ]);
        $folder = preg_replace('/[^a-z0-9_-]/i', '-', (string) ($payload['folder'] ?? 'misc'));
        $folder = $folder === '' ? 'misc' : substr($folder, 0, 32);

        try {
            $rel = $this->saveBase64Image(
                $payload['image_base64'],
                'img_' . time() . '_' . substr(md5(uniqid('', true)), 0, 6),
                public_path('assets/uploads/' . $folder)
            );
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false, 'error' => 'Image save failed: ' . $e->getMessage(),
            ], 500);
        }
        return response()->json(['ok' => true, 'path' => $rel, 'image_path' => $rel]);
    }

    /**
     * DELETE /admin/units/{unit}
     * Removes a unit, its lessons, words and any uploaded files.
     * Cascades come from FK definitions, but we still wipe uploaded
     * cover images here so the public/ folder stays clean.
     */
    public function deleteUnit(Unit $unit)
    {
        if (
            $unit->image_path &&
            str_starts_with(ltrim($unit->image_path, '/'), 'assets/uploads/units/')
        ) {
            $abs = public_path(ltrim($unit->image_path, '/'));
            if (is_file($abs)) @unlink($abs);
        }
        // Wipe per-word uploads under uploads/words for words in this unit.
        Word::where('unit_id', $unit->id)
            ->whereNotNull('image_path')
            ->get(['id', 'image_path'])
            ->each(function ($w) {
                if (str_starts_with(ltrim($w->image_path, '/'), 'assets/uploads/words/')) {
                    $abs = public_path(ltrim($w->image_path, '/'));
                    if (is_file($abs)) @unlink($abs);
                }
            });
        $unit->delete();
        return response()->json(['ok' => true]);
    }

    /**
     * DELETE /admin/lessons/{lesson}
     * Remove a single lesson. The unit's lessons_count counter is
     * recomputed so the dashboard stays accurate.
     */
    public function deleteLesson(Lesson $lesson)
    {
        $unitId = $lesson->unit_id;
        $lesson->delete();
        $unit = Unit::find($unitId);
        if ($unit) {
            $unit->update(['lessons_count' => $unit->lessons()->count()]);
        }
        return response()->json(['ok' => true]);
    }

    /**
     * POST /admin/words/bulk-delete
     * Delete many words at once — typically used by the duplicates
     * panel ("Keep the first, drop the rest"). Files in
     * public/assets/uploads/words/ are removed alongside.
     */
    public function bulkDeleteWords(Request $request)
    {
        $data = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:words,id',
        ]);

        $words = Word::whereIn('id', $data['ids'])->get();
        $deleted = 0;
        foreach ($words as $w) {
            if (
                $w->image_path &&
                str_starts_with(ltrim($w->image_path, '/'), 'assets/uploads/words/')
            ) {
                $abs = public_path(ltrim($w->image_path, '/'));
                if (is_file($abs)) @unlink($abs);
            }
            // Remove any per-word audio file the admin uploaded
            // or the TTS service generated. Anything under the
            // shared NCCD audio bucket is left alone.
            if (
                $w->audio_path && (
                    str_starts_with(ltrim($w->audio_path, '/'), 'assets/audio/tts/') ||
                    str_starts_with(ltrim($w->audio_path, '/'), 'assets/uploads/words/audio/')
                )
            ) {
                $abs = public_path(ltrim($w->audio_path, '/'));
                if (is_file($abs)) @unlink($abs);
            }
            $w->delete();
            $deleted++;
        }
        return response()->json(['ok' => true, 'deleted' => $deleted]);
    }

    /**
     * POST /admin/words/{word}/audio
     *
     * Upload a custom audio clip for a single word. Accepts mp3/wav/
     * ogg/m4a/aac/webm via either:
     *
     *   • multipart/form-data  — field "audio" (preferred for files
     *     larger than ~1 MB so we don't bloat the request body)
     *   • JSON                — field "audio_base64" containing a
     *     data URL ("data:audio/mpeg;base64,…"). Useful for tiny
     *     recordings made directly in the browser via MediaRecorder.
     *
     * On success the uploaded file is stored under
     * /public/assets/uploads/words/audio/word_{id}_{ts}.{ext}, the
     * Word's `audio_path` is updated to the new file, and the linked
     * NCCD track / segment timestamps are cleared so the lesson plays
     * the operator's clip directly. Returns the same shape as
     * uploadWordImage so the React UI can swap a single field on the
     * row instead of doing a full reload.
     */
    public function uploadWordAudio(Request $request, Word $word)
    {
        // Path A: JSON base64 (preferred for very small clips because
        // the JSON body bypasses POST size limits when the operator
        // records audio in the browser).
        if ($request->isJson() || $request->filled('audio_base64')) {
            $payload = $request->validate([
                'audio_base64' => 'required|string',
            ]);
            try {
                $saved = $this->saveBase64Audio(
                    $payload['audio_base64'],
                    'word_' . $word->id . '_' . time(),
                    public_path('assets/uploads/words/audio')
                );
            } catch (\Throwable $e) {
                return response()->json([
                    'ok'    => false,
                    'error' => 'Audio save failed: ' . $e->getMessage(),
                ], 500);
            }
            $this->cleanupPreviousWordAudio($word, $saved);
            $word->update([
                'audio_path'       => $saved,
                'audio_track_id'   => null,
                'segment_start_ms' => null,
                'segment_end_ms'   => null,
            ]);
            return response()->json([
                'ok'         => true,
                'audio_path' => $saved,
                'word'       => $word->fresh()->load('audioTrack'),
            ]);
        }

        // Path B: classic multipart upload — used for larger files
        // (NCCD recordings, teacher-recorded clips, etc.).
        if ($truncated = $this->detectUploadTruncation($request)) {
            return response()->json($truncated, 413);
        }

        $request->validate([
            // 25 MB ceiling matches OpenAI Whisper's per-file limit;
            // anything bigger is overkill for a single word anyway.
            'audio' => 'required|file|mimes:mp3,wav,ogg,oga,m4a,aac,webm,mp4|max:25600'
        ]);

        $file = $request->file('audio');
        $ext  = $this->normaliseAudioExtension(
            strtolower($file->getClientOriginalExtension() ?: 'mp3'),
            $file->getMimeType() ?: ''
        );
        $filename = 'word_' . $word->id . '_' . time() . '.' . $ext;
        $dir = public_path('assets/uploads/words/audio');
        if (! is_dir($dir)) {
            if (! @mkdir($dir, 0775, true) && ! is_dir($dir)) {
                return response()->json([
                    'ok'    => false,
                    'error' => "Server cannot create the upload folder ({$dir}).",
                ], 500);
            }
        }
        if (! is_writable($dir)) {
            return response()->json([
                'ok'    => false,
                'error' => "Upload folder is not writable. Run: chmod -R 775 public/assets/uploads",
            ], 500);
        }

        try {
            $file->move($dir, $filename);
        } catch (\Throwable $e) {
            return response()->json([
                'ok'    => false,
                'error' => 'Could not save the audio file: ' . $e->getMessage(),
            ], 500);
        }

        $relativePath = 'assets/uploads/words/audio/' . $filename;
        $this->cleanupPreviousWordAudio($word, $relativePath);
        $word->update([
            'audio_path'       => $relativePath,
            'audio_track_id'   => null,
            'segment_start_ms' => null,
            'segment_end_ms'   => null,
        ]);

        return response()->json([
            'ok'         => true,
            'audio_path' => $relativePath,
            'word'       => $word->fresh()->load('audioTrack'),
        ]);
    }

    /**
     * POST /admin/words/{word}/clear-audio
     *
     * Drop every custom audio binding (per-word file + NCCD track
     * link + segment timestamps). The word will fall back to the
     * smart-speak chain on the next playback (server-side TTS, then
     * browser SpeechSynthesis), so it is never silent.
     *
     * Files we created (TTS clips, uploaded custom files) are deleted
     * from disk to avoid orphan files. Files outside the upload
     * buckets are left alone — they may be hand-edited paths to
     * curated assets the admin doesn't want us to remove.
     */
    public function clearWordAudio(Word $word)
    {
        $this->cleanupPreviousWordAudio($word, null);
        $word->update([
            'audio_path'       => null,
            'audio_track_id'   => null,
            'segment_start_ms' => null,
            'segment_end_ms'   => null,
        ]);
        return response()->json([
            'ok'   => true,
            'word' => $word->fresh()->load('audioTrack'),
        ]);
    }

    /**
     * GET /admin/audio/library
     *
     * Returns the curriculum-approved audio library grouped by source/
     * book/page so the Words editor can render a rich picker (instead
     * of one flat dropdown of 200+ codes). Each entry exposes:
     *
     *   { id, code, label, kind, page, track_no, format, url, duration }
     *
     * Plus a small `summary` block with totals so the picker can show
     * "200 tracks across PB (152) · AB (48)" at a glance.
     *
     * The endpoint is intentionally lightweight (no joins, no audit
     * trail) so the picker can re-fetch on demand whenever the operator
     * runs a new NCCD discovery sweep.
     */
    public function audioLibrary(Request $request)
    {
        $query = AudioTrack::query()
            ->orderBy('book_type')
            ->orderBy('page')
            ->orderBy('track_no');

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($w) use ($q) {
                $w->where('code', 'like', "%{$q}%")
                  ->orWhere('label', 'like', "%{$q}%");
            });
        }

        $tracks = $query->get();

        $byBook = [];
        foreach ($tracks as $t) {
            $book = strtoupper((string) ($t->book_type ?: $t->source ?: 'OTHER'));
            $byBook[$book] ??= [];
            $byBook[$book][] = [
                'id'        => $t->id,
                'code'      => $t->code,
                'label'     => $t->label,
                'kind'      => $t->kind,
                'page'      => $t->page,
                'track_no'  => $t->track_no,
                'format'    => $t->format,
                'url'       => $t->url,
                'proxyUrl'  => "/api/audio/{$t->code}",
                'duration'  => $t->duration_sec,
                'links'     => $t->lessons()->count() + $t->words()->count(),
            ];
        }

        return response()->json([
            'ok'      => true,
            'total'   => $tracks->count(),
            'books'   => $byBook,
            'voices'  => $this->availableTtsVoices(),
            'summary' => array_map(fn ($items) => count($items), $byBook),
        ]);
    }

    /**
     * Curated list of TTS voice presets the operator can choose from
     * inside the audio panel. Keeps the React UI in sync with the
     * voices supported by OpenAI's `gpt-4o-mini-tts` model.
     */
    private function availableTtsVoices(): array
    {
        return [
            ['id' => 'nova',    'label' => 'Nova',    'hint' => 'Bright, expressive · default for kids'],
            ['id' => 'shimmer', 'label' => 'Shimmer', 'hint' => 'Soft, warm · gentle for Welcome unit'],
            ['id' => 'coral',   'label' => 'Coral',   'hint' => 'Playful · great for songs/stories'],
            ['id' => 'sage',    'label' => 'Sage',    'hint' => 'Calm narrator · clear instructions'],
            ['id' => 'alloy',   'label' => 'Alloy',   'hint' => 'Neutral, very clear'],
            ['id' => 'fable',   'label' => 'Fable',   'hint' => 'Storyteller · warm narration'],
            ['id' => 'echo',    'label' => 'Echo',    'hint' => 'Steady male · firm articulation'],
            ['id' => 'onyx',    'label' => 'Onyx',    'hint' => 'Deeper male · documentary feel'],
        ];
    }

    /**
     * Decode a data-URL ("data:audio/mpeg;base64,...") into a real
     * file under $dir. Returns the public-relative path. Throws on
     * malformed input so the caller can surface a friendly error.
     */
    private function saveBase64Audio(string $dataUrl, string $baseFilename, string $dir): string
    {
        if (! is_dir($dir)) {
            if (! @mkdir($dir, 0775, true) && ! is_dir($dir)) {
                throw new \RuntimeException("Cannot create upload folder ({$dir})");
            }
        }
        if (! is_writable($dir)) {
            throw new \RuntimeException("Upload folder is not writable ({$dir})");
        }

        $mime = 'audio/mpeg';
        if (preg_match('~^data:(audio/[^;]+|video/mp4);base64,(.+)$~i', trim($dataUrl), $m)) {
            $mime = strtolower($m[1]);
            $b64  = $m[2];
        } else {
            $b64 = trim($dataUrl);
        }
        $bytes = base64_decode($b64, true);
        if ($bytes === false || strlen($bytes) === 0) {
            throw new \RuntimeException('Audio data is not valid base64');
        }
        if (strlen($bytes) > 25 * 1024 * 1024) {
            throw new \RuntimeException('Audio exceeds 25 MB');
        }

        $ext = $this->normaliseAudioExtension('mp3', $mime);
        $filename = $baseFilename . '.' . $ext;
        $abs = $dir . DIRECTORY_SEPARATOR . $filename;
        if (file_put_contents($abs, $bytes) === false) {
            throw new \RuntimeException('file_put_contents failed');
        }

        $publicRoot = realpath(public_path()) ?: public_path();
        $rel = ltrim(str_replace($publicRoot, '', realpath($abs) ?: $abs), DIRECTORY_SEPARATOR);
        return str_replace(DIRECTORY_SEPARATOR, '/', $rel);
    }

    /**
     * Normalise an extension based on the MIME type so files always
     * land with a sensible suffix even when the browser supplies a
     * generic .bin or no extension at all.
     */
    private function normaliseAudioExtension(string $ext, string $mime): string
    {
        $ext = strtolower(trim($ext, '. '));
        if (in_array($ext, ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'webm', 'mp4'], true)) {
            return $ext === 'oga' ? 'ogg' : $ext;
        }
        return match (true) {
            str_contains($mime, 'mpeg')  => 'mp3',
            str_contains($mime, 'wav')   => 'wav',
            str_contains($mime, 'ogg')   => 'ogg',
            str_contains($mime, 'mp4')   => 'm4a',
            str_contains($mime, 'aac')   => 'aac',
            str_contains($mime, 'webm')  => 'webm',
            default => 'mp3',
        };
    }

    /**
     * Delete the previous per-word audio file when the operator is
     * about to swap or clear it. Only files inside the dedicated
     * upload buckets are removed — paths to seeded curriculum assets
     * are left alone so we never wipe a hand-curated recording by
     * accident.
     */
    private function cleanupPreviousWordAudio(Word $word, ?string $newRelative): void
    {
        $current = $word->audio_path ? ltrim($word->audio_path, '/') : null;
        if (! $current) return;
        if ($newRelative && ltrim($newRelative, '/') === $current) return;

        if (
            ! str_starts_with($current, 'assets/audio/tts/') &&
            ! str_starts_with($current, 'assets/uploads/words/audio/')
        ) {
            return;
        }

        $abs = public_path($current);
        if (is_file($abs)) {
            @unlink($abs);
        }
    }

    /**
     * POST /admin/audio/discover
     * Crawls https://qr.nccd.gov.jo/QR/Eng/{grade}/{book}/p{page}.mp3
     * across the typical Team Together 1A page range and persists
     * every working URL into audio_tracks. Idempotent.
     *
     * Body (all optional):
     *   grade      - default 1
     *   page_from  - default 4
     *   page_to    - default 43
     *   book       - "ab" | "pb" | "both"  (default "both")
     */
    public function discoverNccdAudio(Request $request)
    {
        $data = $request->validate([
            'grade'     => 'nullable|integer|min:1|max:6',
            'page_from' => 'nullable|integer|min:1|max:200',
            'page_to'   => 'nullable|integer|min:1|max:200',
            'book'      => 'nullable|string|in:ab,pb,both',
        ]);
        $grade = (int) ($data['grade'] ?? 1);
        $from  = (int) ($data['page_from'] ?? 4);
        $to    = (int) ($data['page_to']   ?? 43);
        if ($to < $from) [$from, $to] = [$to, $from];
        $pages = range($from, $to);
        $book  = $data['book'] ?? 'both';

        $service = NccdAudioDiscoveryService::make();
        if ($book === 'both') {
            $report = $service->discoverGrade($grade, $pages);
        } else {
            $report = ['totals' => ['tried' => 0, 'found' => 0, 'created' => 0, 'updated' => 0],
                       'books'  => [$book => $service->discoverBook($book, $grade, $pages)]];
            $report['totals'] = $report['books'][$book];
        }
        return response()->json(['ok' => true] + $report);
    }

    /**
     * POST /admin/units/{unit}/tts-fallback
     * Generates a child-friendly TTS clip for every word in this
     * unit (or only for words that don't have a clip yet). Used
     * primarily for U0 Welcome (numbers, colours, characters) —
     * NCCD audio doesn't include per-word recordings for those.
     */
    public function generateTtsForUnit(Request $request, Unit $unit)
    {
        $overwrite = (bool) $request->input('overwrite', false);
        $tts = TtsAudioService::make();

        if (! $tts->isConfigured()) {
            return response()->json([
                'ok'    => false,
                'error' => 'OPENAI_API_KEY is not configured. Add it to .env to enable TTS.',
            ], 503);
        }

        $report = $tts->synthesizeUnit($unit, $overwrite);
        return response()->json([
            'ok'        => true,
            'unit'      => ['id' => $unit->id, 'title' => $unit->title],
            'generated' => $report['generated'],
            'skipped'   => $report['skipped'],
            'errors'    => $report['errors'],
        ]);
    }

    /**
     * POST /admin/words/{word}/tts
     * Force-generate a TTS clip for a single word — useful when the
     * NCCD recording doesn't actually pronounce the target word
     * cleanly (e.g. "Sister" said inside a sentence) and the admin
     * wants a clean isolated pronunciation instead.
     *
     * Optional body fields:
     *   • voice         - one of the voices returned by /admin/audio/library
     *                     (defaults to config('services.openai.voice'))
     *   • instructions  - free-form personality instructions for the
     *                     gpt-4o-mini-tts model. Skipped when empty so
     *                     we fall back to the per-word preset
     *                     (kindergarten / phonics / sentence / welcome).
     */
    public function generateTtsForWord(Request $request, Word $word)
    {
        $tts = TtsAudioService::make();
        if (! $tts->isConfigured()) {
            return response()->json([
                'ok'    => false,
                'error' => 'OPENAI_API_KEY is not configured.',
            ], 503);
        }

        $data = $request->validate([
            'voice'        => 'nullable|string|max:32',
            'instructions' => 'nullable|string|max:1500',
        ]);

        $word->loadMissing('unit');
        $rel = $tts->synthesizeWord(
            $word,
            true,
            $data['voice']        ?? null,
            ! empty($data['instructions']) ? $data['instructions'] : null,
        );
        if (! $rel) {
            return response()->json(['ok' => false, 'error' => 'TTS generation failed.'], 500);
        }
        return response()->json([
            'ok'         => true,
            'audio_path' => $rel,
            'word'       => $word->fresh()->load('audioTrack'),
        ]);
    }

    /**
     * POST /admin/units/{unit}/ai-ingest
     * Whisper-transcribe every PB audio in the unit's page range,
     * extract vocabulary + summary + objectives via GPT, then upsert
     * Word rows (with timestamps) and annotate the matching Lesson's
     * `config.ai_summary` / `ai_objectives` / `ai_sentences`.
     */
    public function ingestUnitFromAudio(Request $request, Unit $unit)
    {
        $overwrite = (bool) $request->input('overwrite', false);
        $service = CurriculumIngestService::make();

        if (! $service->isConfigured()) {
            return response()->json([
                'ok'    => false,
                'error' => 'OPENAI_API_KEY is not configured. Add it to .env to enable AI ingest.',
            ], 503);
        }

        @set_time_limit(0);
        $report = $service->ingestUnit($unit, $overwrite);

        return response()->json([
            'ok'     => empty($report['errors']) || ($report['transcribed'] ?? 0) > 0,
            'report' => $report,
        ]);
    }

    /**
     * POST /admin/audio/auto-map
     *
     * Single-button "do everything" endpoint:
     *   • Crawl all four NCCD subfolders (ab/pb/new/part2)
     *   • Whisper-transcribe + GPT-extract vocabulary per unit
     *   • Auto-link tracks to lessons by page
     *   • Auto-segment existing words (idempotent)
     *   • Generate child-friendly TTS for words still missing audio
     *
     * Body (all optional):
     *   • grade        int       default 1
     *   • page_from    int       default 4
     *   • page_to      int       default 43
     *   • overwrite    bool      replace existing segment timestamps. default false
     *   • skip_tts     bool      skip the TTS fill-in step. default false
     *   • units        int[]     restrict to these unit IDs
     */
    public function autoMapCurriculum(Request $request)
    {
        $data = $request->validate([
            'grade'      => 'nullable|integer|min:1|max:6',
            'page_from'  => 'nullable|integer|min:1|max:200',
            'page_to'    => 'nullable|integer|min:1|max:200',
            'overwrite'  => 'nullable|boolean',
            'skip_tts'   => 'nullable|boolean',
            'units'      => 'nullable|array',
            'units.*'    => 'integer|exists:units,id',
        ]);

        $service = CurriculumAutoMapService::make();
        if (! $service->isConfigured()) {
            return response()->json([
                'ok'    => false,
                'error' => 'OPENAI_API_KEY is not configured. Add it to .env to enable AI auto-map.',
            ], 503);
        }

        $grade = (int) ($data['grade'] ?? 1);
        $from  = (int) ($data['page_from'] ?? 4);
        $to    = (int) ($data['page_to']   ?? 43);
        if ($to < $from) [$from, $to] = [$to, $from];
        $pages = range($from, $to);

        $report = $service->run($grade, $pages, [
            'overwrite' => (bool) ($data['overwrite'] ?? false),
            'skip_tts'  => (bool) ($data['skip_tts']  ?? false),
            'units'     => $data['units'] ?? null,
        ]);

        return response()->json([
            'ok'     => empty($report['errors']) || ($report['totals']['tracks_found'] ?? 0) > 0,
            'report' => $report,
        ]);
    }
}
