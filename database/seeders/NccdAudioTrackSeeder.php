<?php

namespace Database\Seeders;

use App\Models\AudioTrack;
use Illuminate\Database\Seeder;

/**
 * Seeds every audio track from the official NCCD directory
 *     https://qr.nccd.gov.jo/QR/Eng/1/ab/
 *
 * The directory listing that backs this seeder was captured from the
 * Jordanian MoE server on 2024-07-31 / 2024-09-04. Activity labels and
 * "kind" classification come from the Team Together 1A Activity Book
 * pages 4-20 (Welcome + Unit 1 "Family and friends") as mapped by the
 * project owner.
 *
 * Pages 21-37 belong to later units (Semester 1 remainder) and are
 * seeded with generic labels so they can be bound to lessons once the
 * corresponding book pages are wired up.
 */
class NccdAudioTrackSeeder extends Seeder
{
    private const BASE_URL = 'https://qr.nccd.gov.jo/QR/Eng/1/ab/';

    public function run(): void
    {
        foreach ($this->tracks() as $t) {
            $file = $t['file'];                                  // e.g. p4.mp3
            $format = str_ends_with($file, '.mp4') ? 'mp4' : 'mp3';
            $code = $this->codeFor($file, $format);

            AudioTrack::updateOrCreate(
                ['code' => $code],
                [
                    'source'    => 'ab',
                    'book_type' => 'ab',
                    'semester'  => 1,
                    'page'      => $t['page'],
                    'track_no'  => $t['track_no'],
                    'label'     => $t['label'],
                    'kind'      => $t['kind'],
                    'url'       => self::BASE_URL . $file,
                    'format'    => $format,
                    'file_size' => $t['size'] ?? null,
                ]
            );
        }
    }

    /**
     * Convert a file name into a stable uppercase code.
     *  p4.mp3      -> AB4
     *  p4.2.mp3    -> AB4_2
     *  p12.mp4     -> AB12V
     */
    private function codeFor(string $file, string $format): string
    {
        $base = rtrim(basename($file), '.mp3');
        $base = str_replace(['.mp4', '.mp3'], '', $base);      // p4, p4.2, p12
        $parts = explode('.', substr($base, 1));               // ["4"] or ["4","2"]
        $page = (int) $parts[0];
        $trackSuffix = isset($parts[1]) ? '_' . $parts[1] : '';

        return 'AB' . $page . $trackSuffix . ($format === 'mp4' ? 'V' : '');
    }

    /**
     * Full manifest of files in /QR/Eng/1/ab/.
     * Labels on pages 4-20 come from the project owner's book analysis.
     */
    private function tracks(): array
    {
        return [
            // ───── Welcome: Hello! (pages 4-9) ─────
            ['file' => 'p4.mp3',    'page' => 4,  'track_no' => 1, 'kind' => 'listen_and_point',
             'label' => 'Welcome: Listen and point (greetings scene)',       'size' => 2178608],
            ['file' => 'p4.2.mp3',  'page' => 4,  'track_no' => 2, 'kind' => 'listen_point_say',
             'label' => 'Welcome: Listen, point and say (Hello/Hi/Good morning; Bill, Hala, Malek, Lama)', 'size' => 653046],

            ['file' => 'p5.mp3',    'page' => 5,  'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'Colours: Listen, point and say (blue, green, orange, red, yellow, brown)', 'size' => 937876],

            ['file' => 'p6.mp3',    'page' => 6,  'track_no' => 1, 'kind' => 'listen_and_count',
             'label' => 'Numbers 1-5: Listen and count, point and say',       'size' => 2675652],

            ['file' => 'p7.mp3',    'page' => 7,  'track_no' => 1, 'kind' => 'story',
             'label' => 'Story: Find Ann (Listen and read)',                  'size' => 678086],
            ['file' => 'p7.2.mp3',  'page' => 7,  'track_no' => 2, 'kind' => 'listen_and_point',
             'label' => 'Story: Listen and point',                            'size' => 621120],

            // Note: page 8 revision has no dedicated track on NCCD.

            ['file' => 'p9.mp3',    'page' => 9,  'track_no' => 1, 'kind' => 'listen_and_count',
             'label' => 'Numbers 6-10: Listen and count, point and say',      'size' => 1119416],

            // ───── Unit 1: Family and friends (pages 10-20) ─────
            ['file' => 'p10.mp3',   'page' => 10, 'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'Family intro: Listen, point and say (girl, boy, cat, friend)', 'size' => 638648],
            ['file' => 'p10.2.mp3', 'page' => 10, 'track_no' => 2, 'kind' => 'listen_and_point',
             'label' => 'Family intro: Listen and point',                     'size' => 693736],

            ['file' => 'p11.mp3',   'page' => 11, 'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'Trace and circle + match: teacher prompts',          'size' => 1433042],
            ['file' => 'p11.2.mp3', 'page' => 11, 'track_no' => 2, 'kind' => 'listen_and_point',
             'label' => 'Listen and point',                                   'size' => 1111278],

            ['file' => 'p12.mp3',   'page' => 12, 'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'Family members: Listen, point and say (mum, dad, brother, sister)', 'size' => 1174504],
            ['file' => 'p12.2.mp3', 'page' => 12, 'track_no' => 2, 'kind' => 'listen_and_point',
             'label' => 'Family members: Listen and point (This is my mum!)', 'size' => 669322],
            ['file' => 'p12.mp4',   'page' => 12, 'track_no' => 1, 'kind' => 'dialogue',
             'label' => 'Family members: animated scene (video)',             'size' => 25980965],

            ['file' => 'p13.mp3',   'page' => 13, 'track_no' => 1, 'kind' => 'listen_and_trace',
             'label' => 'Listen and trace (This is my sister / dad / cat)',   'size' => 908454],

            ['file' => 'p14.mp3',   'page' => 14, 'track_no' => 1, 'kind' => 'phonics',
             'label' => 'Phonics Ss & Dd: Listen, point and say + circle the sound', 'size' => 3772404],

            ['file' => 'p15.mp3',   'page' => 15, 'track_no' => 1, 'kind' => 'listen_and_trace',
             'label' => 'Phonics Ss & Dd: Listen and trace',                  'size' => 669948],
            ['file' => 'p15.2.mp3', 'page' => 15, 'track_no' => 2, 'kind' => 'listen_point_say',
             'label' => 'Phonics Ss & Dd: Look, write and say prompts',       'size' => 698744],

            // Note: pages 16-17 (Phonics c, a) have no audio on NCCD /ab/; p14 covers s/d.

            ['file' => 'p18.mp3',   'page' => 18, 'track_no' => 1, 'kind' => 'story',
             'label' => 'Story Let\'s play: Listen and read',                  'size' => 657428],
            ['file' => 'p18.2.mp3', 'page' => 18, 'track_no' => 2, 'kind' => 'listen_and_point',
             'label' => 'Story Let\'s play: Listen and point',                 'size' => 1404246],

            ['file' => 'p19.mp3',   'page' => 19, 'track_no' => 1, 'kind' => 'revision',
             'label' => 'Revision: Count and circle prompts',                 'size' => 979192],
            ['file' => 'p19.2.mp3', 'page' => 19, 'track_no' => 2, 'kind' => 'listen_and_trace',
             'label' => 'Revision: Listen and trace (A boy and a dad, A cat and a doll)', 'size' => 745694],

            ['file' => 'p20.mp3',   'page' => 20, 'track_no' => 1, 'kind' => 'listen_write_colour',
             'label' => 'Review: Listen, write and colour',                   'size' => 1180138],
            ['file' => 'p20.2.mp3', 'page' => 20, 'track_no' => 2, 'kind' => 'listen_and_match',
             'label' => 'Review: Look, match and trace prompts',              'size' => 681216],
            ['file' => 'p20.mp4',   'page' => 20, 'track_no' => 1, 'kind' => 'revision',
             'label' => 'Review: animated recap (video)',                     'size' => 25876403],

            // ───── Pages 21-37 (upcoming units, labels are provisional) ─────
            ['file' => 'p21.mp3',   'page' => 21, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 21 audio',  'size' => 768856],
            ['file' => 'p22.mp3',   'page' => 22, 'track_no' => 1, 'kind' => 'story',       'label' => 'Page 22 story',  'size' => 2475958],
            ['file' => 'p23.mp3',   'page' => 23, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 23 audio',  'size' => 689980],
            ['file' => 'p23.2.mp3', 'page' => 23, 'track_no' => 2, 'kind' => 'other',       'label' => 'Page 23 audio 2','size' => 870894],
            ['file' => 'p26.mp3',   'page' => 26, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 26 audio',  'size' => 650542],
            ['file' => 'p27.mp3',   'page' => 27, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 27 audio',  'size' => 966672],
            ['file' => 'p27.2.mp3', 'page' => 27, 'track_no' => 2, 'kind' => 'other',       'label' => 'Page 27 audio 2','size' => 527846],
            ['file' => 'p28.mp3',   'page' => 28, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 28 audio',  'size' => 1473106],
            ['file' => 'p28.2.mp3', 'page' => 28, 'track_no' => 2, 'kind' => 'other',       'label' => 'Page 28 audio 2','size' => 657428],
            ['file' => 'p28.mp4',   'page' => 28, 'track_no' => 1, 'kind' => 'dialogue',    'label' => 'Page 28 video',  'size' => 52510638],
            ['file' => 'p29.mp3',   'page' => 29, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 29 audio',  'size' => 976062],
            ['file' => 'p30.mp3',   'page' => 30, 'track_no' => 1, 'kind' => 'story',       'label' => 'Page 30 story',  'size' => 2815876],
            ['file' => 'p31.mp3',   'page' => 31, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 31 audio',  'size' => 684972],
            ['file' => 'p31.2.mp3', 'page' => 31, 'track_no' => 2, 'kind' => 'other',       'label' => 'Page 31 audio 2','size' => 1141326],
            ['file' => 'p32.mp3',   'page' => 32, 'track_no' => 1, 'kind' => 'revision',    'label' => 'Page 32 revision','size' => 1153220],
            ['file' => 'p34.mp3',   'page' => 34, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 34 audio',  'size' => 636144],
            ['file' => 'p35.mp3',   'page' => 35, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 35 audio',  'size' => 1011744],
            ['file' => 'p36.mp4',   'page' => 36, 'track_no' => 1, 'kind' => 'revision',    'label' => 'Page 36 video',  'size' => 44487947],
            ['file' => 'p37.mp3',   'page' => 37, 'track_no' => 1, 'kind' => 'other',       'label' => 'Page 37 audio',  'size' => 1046174],
        ];
    }
}
