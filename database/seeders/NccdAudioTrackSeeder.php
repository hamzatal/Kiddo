<?php

namespace Database\Seeders;

use App\Models\AudioTrack;
use Illuminate\Database\Seeder;

/**
 * Full audio index for the NCCD Team Together 1A (Jordan) curriculum.
 *
 * Sources mirrored from:
 *   https://qr.nccd.gov.jo/QR/Eng/1/ab/   (Activity Book, 2024)
 *   https://qr.nccd.gov.jo/QR/Eng/1/pb/   (Pupil's Book, 2024)
 *
 * Codes follow a simple scheme consumed by CurriculumSeeder:
 *   AB{page}[_{track}][V]   — Activity Book  (V suffix = mp4 video)
 *   PB{page}[_{track}][V]   — Pupil's Book
 *
 * Activity labels reflect the 5-part book structure provided by the
 * project owner (Welcome p4-5; U1 Family p6-13; U2 School bag p14-21;
 * U3 Classroom p22-29; U4 Toy p30-37; Learning Club p38-39).
 */
class NccdAudioTrackSeeder extends Seeder
{
    private const BASE = 'https://qr.nccd.gov.jo/QR/Eng/1/';

    public function run(): void
    {
        foreach ($this->abTracks() as $t) {
            $this->upsert('ab', $t);
        }
        foreach ($this->pbTracks() as $t) {
            $this->upsert('pb', $t);
        }
    }

    private function upsert(string $source, array $t): void
    {
        $file = $t['file'];
        $format = str_ends_with($file, '.mp4') ? 'mp4' : 'mp3';
        $code = $this->codeFor($source, $file, $format);
        $bookType = $source === 'pb' ? 'pb' : 'ab';

        AudioTrack::updateOrCreate(
            ['code' => $code],
            [
                'source'    => $source,
                'book_type' => $bookType,
                'semester'  => 1,
                'page'      => $t['page'],
                'track_no'  => $t['track_no'],
                'label'     => $t['label'],
                'kind'      => $t['kind'],
                'url'       => self::BASE . $source . '/' . $file,
                'format'    => $format,
                'file_size' => $t['size'] ?? null,
            ]
        );
    }

    /**
     * p4.mp3   -> AB4 / PB4
     * p4.2.mp3 -> AB4_2 / PB4_2
     * p12.mp4  -> AB12V / PB12V
     */
    private function codeFor(string $source, string $file, string $format): string
    {
        $prefix = $source === 'pb' ? 'PB' : 'AB';
        $base = str_replace(['.mp3', '.mp4'], '', $file);       // p4 | p4.2 | p12
        $parts = explode('.', substr($base, 1));                // ["4"] or ["4","2"]
        $page = (int) $parts[0];
        $suffix = isset($parts[1]) ? '_' . $parts[1] : '';
        return $prefix . $page . $suffix . ($format === 'mp4' ? 'V' : '');
    }

    // ══════════════════════════════════════════════════════
    // /ab/  — Activity Book tracks (42 files)
    // ══════════════════════════════════════════════════════

    private function abTracks(): array
    {
        return [
            // ── Welcome: Hello! (p4-5) ──
            ['file' => 'p4.mp3',    'page' => 4,  'track_no' => 1, 'kind' => 'listen_and_point',
             'label' => 'Welcome p4: Listen and point (Hello/Hi/Good morning scene)'],
            ['file' => 'p4.2.mp3',  'page' => 4,  'track_no' => 2, 'kind' => 'listen_point_say',
             'label' => 'Welcome p4: Listen, point and say (characters Bill, Hala, Malek, Lama)'],
            ['file' => 'p5.mp3',    'page' => 5,  'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'Welcome p5: Listen, point and say (colours & numbers 1-10)'],

            // ── U1 Family and friends (p6-13) ──
            ['file' => 'p6.mp3',    'page' => 6,  'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'U1 L1 p6: Listen, point and say (boy, brother, cat, dad, friend, girl, mum, sister)'],
            ['file' => 'p7.mp3',    'page' => 7,  'track_no' => 1, 'kind' => 'listen_and_circle',
             'label' => 'U1 L3 p7: Language practice — Listen and circle'],
            ['file' => 'p7.2.mp3',  'page' => 7,  'track_no' => 2, 'kind' => 'listen_point_say',
             'label' => 'U1 L3 p7: Listen and number'],
            ['file' => 'p9.mp3',    'page' => 9,  'track_no' => 1, 'kind' => 'song',
             'label' => 'U1 L7 p9: Listen again / Listen and match / Listen and sing'],
            ['file' => 'p10.mp3',   'page' => 10, 'track_no' => 1, 'kind' => 'phonics',
             'label' => 'U1 L9 p10: Phonics Ss, Dd — Listen, point and say (sing, dig, sun, duck)'],
            ['file' => 'p10.2.mp3', 'page' => 10, 'track_no' => 2, 'kind' => 'phonics',
             'label' => 'U1 L9 p10: Listen and circle the sound'],
            ['file' => 'p11.mp3',   'page' => 11, 'track_no' => 1, 'kind' => 'phonics',
             'label' => 'U1 L10 p11: Phonics Cc, Aa — Listen, point and say (cut, cap, apple, ant)'],
            ['file' => 'p11.2.mp3', 'page' => 11, 'track_no' => 2, 'kind' => 'phonics',
             'label' => 'U1 L10 p11: Listen and circle the sound'],
            ['file' => 'p12.mp3',   'page' => 12, 'track_no' => 1, 'kind' => 'song',
             'label' => 'U1 L11 p12: Finger puppets project — Sing and play'],
            ['file' => 'p12.2.mp3', 'page' => 12, 'track_no' => 2, 'kind' => 'dialogue',
             'label' => 'U1 L11 p12: Make and show instructions'],
            ['file' => 'p12.mp4',   'page' => 12, 'track_no' => 1, 'kind' => 'dialogue',
             'label' => 'U1 L11 p12: Finger puppets video'],
            ['file' => 'p13.mp3',   'page' => 13, 'track_no' => 1, 'kind' => 'listen_and_trace',
             'label' => 'U1 Picture dictionary p13: Listen and trace (8 family words)'],

            // ── U2 My school bag (p14-21) ──
            ['file' => 'p14.mp3',   'page' => 14, 'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'U2 L1 p14: Listen, point and say (pen, eraser, ruler, bag; pencil case, crayon, book, pencil)'],
            ['file' => 'p15.mp3',   'page' => 15, 'track_no' => 1, 'kind' => 'listen_and_circle',
             'label' => 'U2 L3 p15: Language practice — Listen and circle (I\'ve got / I haven\'t got)'],
            ['file' => 'p15.2.mp3', 'page' => 15, 'track_no' => 2, 'kind' => 'listen_point_say',
             'label' => 'U2 L3 p15: Listen and number'],
            ['file' => 'p18.mp3',   'page' => 18, 'track_no' => 1, 'kind' => 'phonics',
             'label' => 'U2 L9 p18: Phonics Pp, Rr — Listen, point and say (pen, pink, pencil; rabbit, red, run, ruler)'],
            ['file' => 'p18.2.mp3', 'page' => 18, 'track_no' => 2, 'kind' => 'phonics',
             'label' => 'U2 L9 p18: Listen and circle the sound'],
            ['file' => 'p19.mp3',   'page' => 19, 'track_no' => 1, 'kind' => 'phonics',
             'label' => 'U2 L10 p19: Phonics Ee, Bb — Listen, point and say (elephant, egg; book, ball, bag, boy)'],
            ['file' => 'p19.2.mp3', 'page' => 19, 'track_no' => 2, 'kind' => 'phonics',
             'label' => 'U2 L10 p19: Listen and circle the sound'],
            ['file' => 'p20.mp3',   'page' => 20, 'track_no' => 1, 'kind' => 'song',
             'label' => 'U2 L11 p20: A school bag project — Sing and play'],
            ['file' => 'p20.2.mp3', 'page' => 20, 'track_no' => 2, 'kind' => 'dialogue',
             'label' => 'U2 L11 p20: Make and show instructions'],
            ['file' => 'p20.mp4',   'page' => 20, 'track_no' => 1, 'kind' => 'dialogue',
             'label' => 'U2 L11 p20: School bag project video'],
            ['file' => 'p21.mp3',   'page' => 21, 'track_no' => 1, 'kind' => 'listen_and_trace',
             'label' => 'U2 Picture dictionary p21: Listen and trace (8 school objects)'],

            // ── U3 Our classroom (p22-29) ──
            ['file' => 'p22.mp3',   'page' => 22, 'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'U3 L1 p22: Listen, point and say (teacher, whiteboard, door, window; chair, desk, floor, wall)'],
            ['file' => 'p23.mp3',   'page' => 23, 'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'U3 L3 p23: Language practice — Listen and number (on/in/under)'],
            ['file' => 'p23.2.mp3', 'page' => 23, 'track_no' => 2, 'kind' => 'listen_and_circle',
             'label' => 'U3 L3 p23: Listen and tick'],
            ['file' => 'p26.mp3',   'page' => 26, 'track_no' => 1, 'kind' => 'phonics',
             'label' => 'U3 L9 p26: Phonics Tt, Mm — Listen, point and say (teddy, teacher; mouse, milk, moon, mum)'],
            ['file' => 'p27.mp3',   'page' => 27, 'track_no' => 1, 'kind' => 'phonics',
             'label' => 'U3 L10 p27: Phonics Ww, Ii — Listen, point and say (wave, wall, water, whiteboard; insect, ink, igloo)'],
            ['file' => 'p27.2.mp3', 'page' => 27, 'track_no' => 2, 'kind' => 'phonics',
             'label' => 'U3 L10 p27: Listen and circle the sound'],
            ['file' => 'p28.mp3',   'page' => 28, 'track_no' => 1, 'kind' => 'song',
             'label' => 'U3 L11 p28: A pen pot project — Listen and play'],
            ['file' => 'p28.2.mp3', 'page' => 28, 'track_no' => 2, 'kind' => 'dialogue',
             'label' => 'U3 L11 p28: Make and show instructions'],
            ['file' => 'p28.mp4',   'page' => 28, 'track_no' => 1, 'kind' => 'dialogue',
             'label' => 'U3 L11 p28: Pen pot project video'],
            ['file' => 'p29.mp3',   'page' => 29, 'track_no' => 1, 'kind' => 'listen_and_trace',
             'label' => 'U3 Picture dictionary p29: Listen and trace (8 classroom words)'],

            // ── U4 My favourite toy (p30-37) ──
            ['file' => 'p30.mp3',   'page' => 30, 'track_no' => 1, 'kind' => 'listen_point_say',
             'label' => 'U4 L1 p30: Listen, point and say (car, ball, teddy, robot; doll, plane, train, yoyo)'],
            ['file' => 'p31.mp3',   'page' => 31, 'track_no' => 1, 'kind' => 'listen_and_circle',
             'label' => 'U4 L3 p31: Language practice — Listen and circle (What colour is it?)'],
            ['file' => 'p31.2.mp3', 'page' => 31, 'track_no' => 2, 'kind' => 'listen_point_say',
             'label' => 'U4 L3 p31: Listen and number'],
            ['file' => 'p32.mp3',   'page' => 32, 'track_no' => 1, 'kind' => 'story',
             'label' => 'U4 L5 p32: Story Find Sue — Listen and read (value: share)'],
            ['file' => 'p34.mp3',   'page' => 34, 'track_no' => 1, 'kind' => 'phonics',
             'label' => 'U4 L9 p34: CVC words — sound blending (red, cat, mat, sit, bed, web)'],
            ['file' => 'p35.mp3',   'page' => 35, 'track_no' => 1, 'kind' => 'phonics',
             'label' => 'U4 L10 p35: CVC words — Listen, order and write (sad, wet, map, bat, cap, tap)'],
            ['file' => 'p36.mp4',   'page' => 36, 'track_no' => 1, 'kind' => 'dialogue',
             'label' => 'U4 L11 p36: A toy box project video'],
            ['file' => 'p37.mp3',   'page' => 37, 'track_no' => 1, 'kind' => 'listen_and_trace',
             'label' => 'U4 Picture dictionary p37: Listen and trace (8 toy words)'],
        ];
    }

    // ══════════════════════════════════════════════════════
    // /pb/  — Pupil's Book tracks (77 files)
    // ══════════════════════════════════════════════════════

    private function pbTracks(): array
    {
        return [
            // ── Welcome ──
            ['file' => 'p4.mp3',    'page' => 4,  'track_no' => 1, 'kind' => 'listen_point_say', 'label' => 'PB Welcome p4: Listen, point and say'],
            ['file' => 'p5.mp3',    'page' => 5,  'track_no' => 1, 'kind' => 'listen_point_say', 'label' => 'PB Welcome p5: Colours and numbers'],

            // ── U1 Family and friends ──
            ['file' => 'p6.mp3',    'page' => 6,  'track_no' => 1, 'kind' => 'listen_point_say', 'label' => 'PB U1 L1 p6: Listen and follow (family vocabulary)'],
            ['file' => 'p6.2.mp3',  'page' => 6,  'track_no' => 2, 'kind' => 'listen_point_say', 'label' => 'PB U1 L1 p6: Listen, point and say'],
            ['file' => 'p7.mp3',    'page' => 7,  'track_no' => 1, 'kind' => 'listen_and_circle', 'label' => 'PB U1 L3 p7: Listen and circle'],
            ['file' => 'p7.2.mp3',  'page' => 7,  'track_no' => 2, 'kind' => 'listen_point_say', 'label' => 'PB U1 L3 p7: Listen and number'],
            ['file' => 'p7.3.mp3',  'page' => 7,  'track_no' => 3, 'kind' => 'listen_point_say', 'label' => 'PB U1 L3 p7: Listen. Then say'],
            ['file' => 'p8.mp3',    'page' => 8,  'track_no' => 1, 'kind' => 'story',            'label' => 'PB U1 L5 p8: Story Find Ann — Listen and read (value: be helpful)'],
            ['file' => 'p9.mp3',    'page' => 9,  'track_no' => 1, 'kind' => 'listen_and_match', 'label' => 'PB U1 L7 p9: Listen again'],
            ['file' => 'p9.2.mp3',  'page' => 9,  'track_no' => 2, 'kind' => 'listen_and_match', 'label' => 'PB U1 L7 p9: Listen and match'],
            ['file' => 'p9.3.mp3',  'page' => 9,  'track_no' => 3, 'kind' => 'song',             'label' => 'PB U1 L7 p9: Listen and sing'],
            ['file' => 'p9.4.mp3',  'page' => 9,  'track_no' => 4, 'kind' => 'song',             'label' => 'PB U1 L7 p9: Song karaoke'],
            ['file' => 'p10.mp3',   'page' => 10, 'track_no' => 1, 'kind' => 'phonics',          'label' => 'PB U1 L9 p10: Phonics Ss, Dd — Listen, point and say'],
            ['file' => 'p10.2.mp3', 'page' => 10, 'track_no' => 2, 'kind' => 'phonics',          'label' => 'PB U1 L9 p10: Listen and circle the sound'],
            ['file' => 'p11.mp3',   'page' => 11, 'track_no' => 1, 'kind' => 'phonics',          'label' => 'PB U1 L10 p11: Phonics Cc, Aa — Listen, point and say'],
            ['file' => 'p11.2.mp3', 'page' => 11, 'track_no' => 2, 'kind' => 'phonics',          'label' => 'PB U1 L10 p11: Listen and circle the sound'],
            ['file' => 'p12.2.mp3', 'page' => 12, 'track_no' => 2, 'kind' => 'song',             'label' => 'PB U1 L11 p12: Finger puppets — Sing and play'],
            ['file' => 'p12.mp4',   'page' => 12, 'track_no' => 1, 'kind' => 'dialogue',         'label' => 'PB U1 L11 p12: Finger puppets video'],
            ['file' => 'p13.mp3',   'page' => 13, 'track_no' => 1, 'kind' => 'listen_and_trace', 'label' => 'PB U1 Picture dictionary p13: Listen and trace'],
            ['file' => 'p13.2.mp3', 'page' => 13, 'track_no' => 2, 'kind' => 'listen_and_trace', 'label' => 'PB U1 Picture dictionary p13 (alt)'],

            // ── U2 My school bag ──
            ['file' => 'p14.mp3',   'page' => 14, 'track_no' => 1, 'kind' => 'listen_point_say', 'label' => 'PB U2 L1 p14: Listen and follow (school items)'],
            ['file' => 'p14.2.mp3', 'page' => 14, 'track_no' => 2, 'kind' => 'listen_point_say', 'label' => 'PB U2 L1 p14: Listen, point and say'],
            ['file' => 'p15.mp3',   'page' => 15, 'track_no' => 1, 'kind' => 'listen_and_circle', 'label' => 'PB U2 L3 p15: Listen and circle'],
            ['file' => 'p15.2.mp3', 'page' => 15, 'track_no' => 2, 'kind' => 'listen_point_say', 'label' => 'PB U2 L3 p15: Listen and number'],
            ['file' => 'p15.3.mp3', 'page' => 15, 'track_no' => 3, 'kind' => 'listen_point_say', 'label' => 'PB U2 L3 p15: Listen. Then say'],
            ['file' => 'p16.mp3',   'page' => 16, 'track_no' => 1, 'kind' => 'story',            'label' => 'PB U2 L5 p16: Story Find Lama — Listen and read (value: look after your things)'],
            ['file' => 'p17.mp3',   'page' => 17, 'track_no' => 1, 'kind' => 'listen_and_match', 'label' => 'PB U2 L7 p17: Listen again'],
            ['file' => 'p17.2.mp3', 'page' => 17, 'track_no' => 2, 'kind' => 'listen_and_match', 'label' => 'PB U2 L7 p17: Listen and match'],
            ['file' => 'p17.3.mp3', 'page' => 17, 'track_no' => 3, 'kind' => 'song',             'label' => 'PB U2 L7 p17: Listen and sing'],
            ['file' => 'p17.4.mp3', 'page' => 17, 'track_no' => 4, 'kind' => 'song',             'label' => 'PB U2 L7 p17: Song karaoke'],
            ['file' => 'p18.mp3',   'page' => 18, 'track_no' => 1, 'kind' => 'phonics',          'label' => 'PB U2 L9 p18: Phonics Pp, Rr — Listen, point and say'],
            ['file' => 'p18.2.mp3', 'page' => 18, 'track_no' => 2, 'kind' => 'phonics',          'label' => 'PB U2 L9 p18: Listen and circle'],
            ['file' => 'p19.mp3',   'page' => 19, 'track_no' => 1, 'kind' => 'phonics',          'label' => 'PB U2 L10 p19: Phonics Ee, Bb — Listen, point and say'],
            ['file' => 'p19.2.mp3', 'page' => 19, 'track_no' => 2, 'kind' => 'phonics',          'label' => 'PB U2 L10 p19: Listen and circle'],
            ['file' => 'p20.2.mp3', 'page' => 20, 'track_no' => 2, 'kind' => 'song',             'label' => 'PB U2 L11 p20: School bag project — Sing and play'],
            ['file' => 'p20.mp4',   'page' => 20, 'track_no' => 1, 'kind' => 'dialogue',         'label' => 'PB U2 L11 p20: Project video'],
            ['file' => 'p21.mp3',   'page' => 21, 'track_no' => 1, 'kind' => 'listen_and_trace', 'label' => 'PB U2 Picture dictionary p21: Listen and trace'],
            ['file' => 'p21.2.mp3', 'page' => 21, 'track_no' => 2, 'kind' => 'listen_and_trace', 'label' => 'PB U2 Picture dictionary p21 (alt)'],

            // ── U3 Our classroom ──
            ['file' => 'p22.mp3',   'page' => 22, 'track_no' => 1, 'kind' => 'listen_point_say', 'label' => 'PB U3 L1 p22: Listen and follow (classroom)'],
            ['file' => 'p22.2.mp3', 'page' => 22, 'track_no' => 2, 'kind' => 'listen_point_say', 'label' => 'PB U3 L1 p22: Listen, point and say'],
            ['file' => 'p23.mp3',   'page' => 23, 'track_no' => 1, 'kind' => 'listen_point_say', 'label' => 'PB U3 L3 p23: Listen and number'],
            ['file' => 'p23.2.mp3', 'page' => 23, 'track_no' => 2, 'kind' => 'listen_and_circle', 'label' => 'PB U3 L3 p23: Listen and tick'],
            ['file' => 'p23.3.mp3', 'page' => 23, 'track_no' => 3, 'kind' => 'listen_point_say', 'label' => 'PB U3 L3 p23: Listen. Then say'],
            ['file' => 'p24.mp3',   'page' => 24, 'track_no' => 1, 'kind' => 'story',            'label' => 'PB U3 L5 p24: Story Find the pens — Listen and read (value: be tidy)'],
            ['file' => 'p25.mp3',   'page' => 25, 'track_no' => 1, 'kind' => 'listen_and_match', 'label' => 'PB U3 L7 p25: Listen again'],
            ['file' => 'p25.2.mp3', 'page' => 25, 'track_no' => 2, 'kind' => 'listen_and_match', 'label' => 'PB U3 L7 p25: Listen and match'],
            ['file' => 'p25.3.mp3', 'page' => 25, 'track_no' => 3, 'kind' => 'song',             'label' => 'PB U3 L7 p25: Listen and sing'],
            ['file' => 'p25.4.mp3', 'page' => 25, 'track_no' => 4, 'kind' => 'song',             'label' => 'PB U3 L7 p25: Song karaoke'],
            ['file' => 'p26.mp3',   'page' => 26, 'track_no' => 1, 'kind' => 'phonics',          'label' => 'PB U3 L9 p26: Phonics Tt, Mm — Listen, point and say'],
            ['file' => 'p26.2.mp3', 'page' => 26, 'track_no' => 2, 'kind' => 'phonics',          'label' => 'PB U3 L9 p26: Listen and circle'],
            ['file' => 'p27.mp3',   'page' => 27, 'track_no' => 1, 'kind' => 'phonics',          'label' => 'PB U3 L10 p27: Phonics Ww, Ii — Listen, point and say'],
            ['file' => 'p27.2.mp3', 'page' => 27, 'track_no' => 2, 'kind' => 'phonics',          'label' => 'PB U3 L10 p27: Listen and circle'],
            ['file' => 'p28.2.mp3', 'page' => 28, 'track_no' => 2, 'kind' => 'song',             'label' => 'PB U3 L11 p28: Pen pot — Listen and play'],
            ['file' => 'p28.mp4',   'page' => 28, 'track_no' => 1, 'kind' => 'dialogue',         'label' => 'PB U3 L11 p28: Pen pot video'],
            ['file' => 'p29.mp3',   'page' => 29, 'track_no' => 1, 'kind' => 'listen_and_trace', 'label' => 'PB U3 Picture dictionary p29: Listen and trace'],
            ['file' => 'p29.2.mp3', 'page' => 29, 'track_no' => 2, 'kind' => 'listen_and_trace', 'label' => 'PB U3 Picture dictionary p29 (alt)'],

            // ── U4 My favourite toy ──
            ['file' => 'p30.mp3',   'page' => 30, 'track_no' => 1, 'kind' => 'listen_point_say', 'label' => 'PB U4 L1 p30: Listen and follow (toys)'],
            ['file' => 'p30.2.mp3', 'page' => 30, 'track_no' => 2, 'kind' => 'listen_point_say', 'label' => 'PB U4 L1 p30: Listen, point and say'],
            ['file' => 'p31.mp3',   'page' => 31, 'track_no' => 1, 'kind' => 'listen_and_circle', 'label' => 'PB U4 L3 p31: Listen and circle'],
            ['file' => 'p31.2.mp3', 'page' => 31, 'track_no' => 2, 'kind' => 'listen_point_say', 'label' => 'PB U4 L3 p31: Listen and number'],
            ['file' => 'p31.3.mp3', 'page' => 31, 'track_no' => 3, 'kind' => 'listen_point_say', 'label' => 'PB U4 L3 p31: Listen. Then say'],
            ['file' => 'p32.mp3',   'page' => 32, 'track_no' => 1, 'kind' => 'story',            'label' => 'PB U4 L5 p32: Story Find Sue — Listen and read (value: share)'],
            ['file' => 'p33.mp3',   'page' => 33, 'track_no' => 1, 'kind' => 'listen_and_match', 'label' => 'PB U4 L7 p33: Listen again'],
            ['file' => 'p33.2.mp3', 'page' => 33, 'track_no' => 2, 'kind' => 'listen_and_match', 'label' => 'PB U4 L7 p33: Listen and match'],
            ['file' => 'p33.3.mp3', 'page' => 33, 'track_no' => 3, 'kind' => 'song',             'label' => 'PB U4 L7 p33: Listen and sing'],
            ['file' => 'p33.4.mp3', 'page' => 33, 'track_no' => 4, 'kind' => 'song',             'label' => 'PB U4 L7 p33: Song karaoke'],
            ['file' => 'p34.mp3',   'page' => 34, 'track_no' => 1, 'kind' => 'phonics',          'label' => 'PB U4 L9 p34: CVC words — sound blending (red, cat, mat, sit, bed, web)'],
            ['file' => 'p34.2.mp3', 'page' => 34, 'track_no' => 2, 'kind' => 'phonics',          'label' => 'PB U4 L9 p34: Listen and circle'],
            ['file' => 'p35.mp3',   'page' => 35, 'track_no' => 1, 'kind' => 'phonics',          'label' => 'PB U4 L10 p35: CVC words — Listen, order and write (sad, wet, map, bat, cap, tap)'],
            ['file' => 'p36.2.mp3', 'page' => 36, 'track_no' => 2, 'kind' => 'song',             'label' => 'PB U4 L11 p36: A toy box — Sing and play'],
            ['file' => 'p36.mp4',   'page' => 36, 'track_no' => 1, 'kind' => 'dialogue',         'label' => 'PB U4 L11 p36: Toy box video'],
            ['file' => 'p37.mp3',   'page' => 37, 'track_no' => 1, 'kind' => 'listen_and_trace', 'label' => 'PB U4 Picture dictionary p37: Listen and trace'],
            ['file' => 'p37.2.mp3', 'page' => 37, 'track_no' => 2, 'kind' => 'listen_and_trace', 'label' => 'PB U4 Picture dictionary p37 (alt)'],

            // ── Learning Club: Days of the week (p38-39) ──
            ['file' => 'p38.mp3',   'page' => 38, 'track_no' => 1, 'kind' => 'listen_point_say', 'label' => 'LC p38: Listen and follow (days of the week)'],
            ['file' => 'p38.2.mp3', 'page' => 38, 'track_no' => 2, 'kind' => 'listen_point_say', 'label' => 'LC p38: Listen, point and say (Sunday → Saturday)'],
            ['file' => 'p39.mp3',   'page' => 39, 'track_no' => 1, 'kind' => 'listen_and_circle', 'label' => 'LC p39: Listen and circle'],
            ['file' => 'p39.2.mp3', 'page' => 39, 'track_no' => 2, 'kind' => 'listen_point_say', 'label' => 'LC p39: Look, order and say / Listen. Then say'],

            // ── Extras present in /pb/ (p40-43) — bonus tracks ──
            ['file' => 'p40.mp3',   'page' => 40, 'track_no' => 1, 'kind' => 'other', 'label' => 'PB bonus p40'],
            ['file' => 'p41.mp3',   'page' => 41, 'track_no' => 1, 'kind' => 'other', 'label' => 'PB bonus p41'],
            ['file' => 'p42.mp3',   'page' => 42, 'track_no' => 1, 'kind' => 'other', 'label' => 'PB bonus p42'],
            ['file' => 'p43.mp3',   'page' => 43, 'track_no' => 1, 'kind' => 'other', 'label' => 'PB bonus p43'],
        ];
    }
}
