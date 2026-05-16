<?php

namespace App\Http\Controllers;

use App\Models\AudioTrack;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\Word;
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
        // Detect the silent "PHP truncated the upload before we even saw it"
        // case. When `post_max_size` is exceeded, $_POST/$_FILES are empty
        // and Laravel's validator just complains about the missing field
        // — that's the source of the confusing 422 the user reported.
        if ($truncated = $this->detectUploadTruncation($request)) {
            return response()->json($truncated, 413);
        }

        // Accept any image type and large sizes (up to 20MB)
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

    public function uploadWordImage(Request $request, Word $word)
    {
        if ($truncated = $this->detectUploadTruncation($request)) {
            return response()->json($truncated, 413);
        }

        // Accept any image type and large sizes (up to 20MB)
        $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,gif,webp,svg,bmp|max:20480'
        ]);
        $file = $request->file('image');
        $ext = strtolower($file->getClientOriginalExtension() ?: 'png');
        $filename = 'word_' . $word->id . '_' . time() . '.' . $ext;
        $dir = public_path('assets/uploads/words');
        if (! is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        $file->move($dir, $filename);
        $relativePath = 'assets/uploads/words/' . $filename;
        $word->update(['image_path' => $relativePath]);
        return response()->json(['ok' => true, 'image_path' => $relativePath]);
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
                    'error' => 'The image exceeds the upload size limit. Pick a file under 20 MB.',
                    'errors'=> ['image' => ['File too large.']],
                ];
            }
        }

        return null;
    }

}
