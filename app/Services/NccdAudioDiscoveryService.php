<?php

namespace App\Services;

use App\Models\AudioTrack;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Probes the NCCD QR server for valid audio URLs and persists every
 * working file into audio_tracks. The NCCD pattern is fixed:
 *
 *   https://qr.nccd.gov.jo/QR/Eng/{grade}/{book}/p{page}.mp3
 *   https://qr.nccd.gov.jo/QR/Eng/{grade}/{book}/p{page}.{n}.mp3
 *   https://qr.nccd.gov.jo/QR/Eng/{grade}/{book}/p{page}.mp4
 *
 * Some pages have only one track (p4.mp3), some have two (p4.mp3 +
 * p4.2.mp3), some have a video clip (p12.mp4). This service fans out
 * over every plausible page/track combination, fires HEAD requests
 * in parallel and only keeps the URLs that return a valid audio
 * payload (HTTP 2xx + audio/* / video/* content type).
 *
 * The discovery output is idempotent — re-running it just upserts
 * the audio_tracks rows by `code` so the admin can safely click
 * "Discover" again any time NCCD adds new content.
 */
class NccdAudioDiscoveryService
{
    public const BASE = 'https://qr.nccd.gov.jo/QR/Eng/';

    public function __construct(
        private readonly AudioSegmentationService $segmentation,
    ) {
    }

    public static function make(): self
    {
        return new self(AudioSegmentationService::make());
    }

    /**
     * Run a fresh discovery sweep for a single book in a grade.
     *
     * @param string $book   'ab' | 'pb'
     * @param int    $grade  1-6 (NCCD grade folder)
     * @param array  $pages  inclusive page list, e.g. range(4, 39)
     * @return array{
     *   tried:int, found:int, created:int, updated:int,
     *   tracks: array<int,array<string,mixed>>
     * }
     */
    public function discoverBook(string $book, int $grade, array $pages): array
    {
        $book = strtolower($book);
        if (! in_array($book, ['ab', 'pb'], true)) {
            return ['tried' => 0, 'found' => 0, 'created' => 0, 'updated' => 0, 'tracks' => []];
        }

        $tried = 0;
        $found = 0;
        $created = 0;
        $updated = 0;
        $tracks = [];

        foreach ($pages as $page) {
            // Audio: p{page}.mp3, p{page}.2.mp3 .. p{page}.6.mp3
            // Video: p{page}.mp4
            $candidates = [
                ['file' => "p{$page}.mp3", 'track_no' => 1, 'format' => 'mp3'],
            ];
            for ($i = 2; $i <= 6; $i++) {
                $candidates[] = ['file' => "p{$page}.{$i}.mp3", 'track_no' => $i, 'format' => 'mp3'];
            }
            $candidates[] = ['file' => "p{$page}.mp4", 'track_no' => 1, 'format' => 'mp4'];

            foreach ($candidates as $c) {
                $tried++;
                $url = self::BASE . "{$grade}/{$book}/" . $c['file'];
                $probe = $this->segmentation->probeUrl($url);
                if (! ($probe['ok'] ?? false)) {
                    continue;
                }
                $found++;

                $code = $this->codeFor($book, $page, $c['track_no'], $c['format']);
                $existing = AudioTrack::where('code', $code)->first();
                $payload = [
                    'code'      => $code,
                    'source'    => $book,
                    'book_type' => $book,
                    'semester'  => 1,
                    'page'      => $page,
                    'track_no'  => $c['track_no'],
                    'label'     => $existing?->label ?: $this->guessLabel($book, $page, $c['track_no'], $c['format']),
                    'kind'      => $existing?->kind ?: $this->guessKind($c['format']),
                    'url'       => $url,
                    'format'    => $c['format'],
                    'file_size' => $probe['size'] ?? null,
                ];

                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                    $row = $existing->fresh();
                } else {
                    $row = AudioTrack::create($payload);
                    $created++;
                }
                $tracks[] = [
                    'code'   => $row->code,
                    'page'   => $row->page,
                    'track'  => $row->track_no,
                    'format' => $row->format,
                    'url'    => $row->url,
                    'size'   => $payload['file_size'],
                ];
            }
        }

        Log::info('NCCD discovery sweep', compact('book', 'grade', 'tried', 'found', 'created', 'updated'));

        return [
            'tried'   => $tried,
            'found'   => $found,
            'created' => $created,
            'updated' => $updated,
            'tracks'  => $tracks,
        ];
    }

    /**
     * Run discovery for both ab + pb of a grade across the typical
     * Team Together 1A page range (4-43). Returns the merged report.
     */
    public function discoverGrade(int $grade, ?array $pages = null): array
    {
        $pages ??= range(4, 43);
        $reports = [
            'ab' => $this->discoverBook('ab', $grade, $pages),
            'pb' => $this->discoverBook('pb', $grade, $pages),
        ];
        $totals = [
            'tried'   => $reports['ab']['tried']   + $reports['pb']['tried'],
            'found'   => $reports['ab']['found']   + $reports['pb']['found'],
            'created' => $reports['ab']['created'] + $reports['pb']['created'],
            'updated' => $reports['ab']['updated'] + $reports['pb']['updated'],
        ];
        return ['totals' => $totals, 'books' => $reports];
    }

    private function codeFor(string $book, int $page, int $trackNo, string $format): string
    {
        $prefix = strtoupper($book); // AB | PB
        $suffix = $trackNo > 1 ? '_' . $trackNo : '';
        $videoSuffix = $format === 'mp4' ? 'V' : '';
        return $prefix . $page . $suffix . $videoSuffix;
    }

    private function guessLabel(string $book, int $page, int $trackNo, string $format): string
    {
        $bookName = $book === 'pb' ? "Pupil's Book" : 'Activity Book';
        $extra    = $trackNo > 1 ? " (track {$trackNo})" : '';
        $type     = $format === 'mp4' ? ' video' : '';
        return "{$bookName} p{$page}{$type}{$extra}";
    }

    private function guessKind(string $format): string
    {
        return $format === 'mp4' ? 'dialogue' : 'listen_point_say';
    }
}
