<?php

namespace Database\Seeders;

use App\Models\AudioTrack;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\Word;
use Illuminate\Database\Seeder;

/**
 * Team Together 1A (Jordan) — exact book structure.
 *
 *   Welcome: Hello!              p4-5    (2 lessons)     -> U0
 *   U1  Family and friends        p6-13   (8 lessons)     -> U1
 *   U2  My school bag             p14-21  (8 lessons)     -> U2
 *   U3  Our classroom             p22-29  (8 lessons)     -> U3
 *   U4  My favourite toy          p30-37  (8 lessons)     -> U4
 *   Learning Club (days of week)  p38-39  (2 lessons)     -> U5
 *                                          TOTAL = 36 lessons
 *
 * Each unit follows the Team Together lesson pattern:
 *   Lesson 1  — Vocabulary intro      (Listen & follow, Listen, point and say)
 *   Lesson 3  — Language practice     (Listen & circle/number, "Listen. Then say")
 *   Lesson 5  — Story + value         (Listen and read)
 *   Lesson 7  — Listen again & sing   (match + song)
 *   Lesson 9  — Phonics set A
 *   Lesson 10 — Phonics set B
 *   Lesson 11 — Project (make & show, sing & play, video)
 *   Picture dictionary                 (Listen and trace)
 *
 * Every Word row is linked to its primary audio track (PB code) so
 * the React engine can stream the right MP3 from qr.nccd.gov.jo and
 * play a specific millisecond segment per click — no local download.
 * Segment start/end ms are intentionally NULL so the teacher can
 * fine-tune them later via a small UI without editing this file.
 */
class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        // Cleanup: ensure any previously-seeded units outside the canonical
        // U0/U1/U2 set are removed so re-seeding leaves no orphans. Cascading
        // deletes on lessons/words will handle child rows.
        Unit::whereNotIn('code', ['U0', 'U1', 'U2'])->delete();

        $u0 = $this->upsertUnit([
            'code' => 'U0', 'unit_number' => 0,
            'title' => 'Welcome: Hello!',
            'description' => 'Characters, greetings, colours and numbers 1-10.',
            'image_path' => 'assets/lessons/welcome/hut.png',
            'color_key' => 'purple',
        ]);
        $this->seedWelcome($u0->id);

        $u1 = $this->upsertUnit([
            'code' => 'U1', 'unit_number' => 1,
            'title' => 'Family and friends',
            'description' => 'Family members, pets, phonics Ss Dd Cc Aa.',
            'image_path' => 'assets/lessons/family/treehouse.png',
            'color_key' => 'green',
        ]);
        $this->seedFamily($u1->id);

        $u2 = $this->upsertUnit([
            'code' => 'U2', 'unit_number' => 2,
            'title' => 'My school bag',
            'description' => "School items, I've got / I haven't got, phonics Pp Rr Ee Bb.",
            'image_path' => 'assets/lessons/schoolbag/bag.png',
            'color_key' => 'blue',
        ]);
        $this->seedSchoolBag($u2->id);
    }

    // ═══════════════════════════════════════════════════════════════
    // U0 — Welcome: Hello!  (pages 4-5)  — 2 lessons
    // ═══════════════════════════════════════════════════════════════
    protected function seedWelcome(int $unitId): void
    {
        $folder = 'welcome';
        $trackP4 = $this->trackId('PB4');
        $trackP5 = $this->trackId('PB5');

        // Greetings + characters share page 4 audio
        $this->upsertWord($unitId, $folder, 'Hello',        'greeting',  'hello.png',        $trackP4, [['Hi', 'hi.png'], ['Good morning', 'goodmorning.png']]);
        $this->upsertWord($unitId, $folder, 'Hi',           'greeting',  'hi.png',           $trackP4, [['Hello', 'hello.png'], ['Good morning', 'goodmorning.png']]);
        $this->upsertWord($unitId, $folder, 'Good morning', 'greeting',  'goodmorning.png',  $trackP4, [['Hello', 'hello.png'], ['Hi', 'hi.png']]);

        $this->upsertWord($unitId, $folder, 'Hala',  'character', 'hala.png',  $trackP4, [['Bill', 'bill.png'], ['Lama', 'lama.png']]);
        $this->upsertWord($unitId, $folder, 'Meg',   'character', 'meg.png',   $trackP4, [['Lama', 'lama.png'], ['Hala', 'hala.png']]);
        $this->upsertWord($unitId, $folder, 'Lama',  'character', 'lama.png',  $trackP4, [['Hala', 'hala.png'], ['Meg', 'meg.png']]);
        $this->upsertWord($unitId, $folder, 'Tom',   'character', 'tom.png',   $trackP4, [['Bill', 'bill.png'], ['Malek', 'malek.png']]);
        $this->upsertWord($unitId, $folder, 'Bill',  'character', 'bill.png',  $trackP4, [['Tom', 'tom.png'], ['Malek', 'malek.png']]);
        $this->upsertWord($unitId, $folder, 'Malek', 'character', 'malek.png', $trackP4, [['Bill', 'bill.png'], ['Tom', 'tom.png']]);

        // Colours (p5)
        $this->upsertWord($unitId, $folder, 'Blue',   'colour', 'blue.png',   $trackP5, [['Red', 'red.png'], ['Green', 'green.png']]);
        $this->upsertWord($unitId, $folder, 'Green',  'colour', 'green.png',  $trackP5, [['Blue', 'blue.png'], ['Orange', 'orange.png']]);
        $this->upsertWord($unitId, $folder, 'Orange', 'colour', 'orange.png', $trackP5, [['Red', 'red.png'], ['Brown', 'brown.png']]);
        $this->upsertWord($unitId, $folder, 'Red',    'colour', 'red.png',    $trackP5, [['Blue', 'blue.png'], ['Yellow', 'yellow.png']]);
        $this->upsertWord($unitId, $folder, 'Yellow', 'colour', 'yellow.png', $trackP5, [['Green', 'green.png'], ['Orange', 'orange.png']]);
        $this->upsertWord($unitId, $folder, 'Brown',  'colour', 'brown.png',  $trackP5, [['Red', 'red.png'], ['Blue', 'blue.png']]);

        // Numbers 1-10 (p5)
        foreach (['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'] as $i => $n) {
            $img = strtolower($n) . '.png';
            $next = $i < 9 ? ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][$i + 1] : 'Nine';
            $prev = $i > 0 ? ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][$i - 1] : 'Two';
            $this->upsertWord(
                $unitId,
                $folder,
                $n,
                'number',
                $img,
                $trackP5,
                [[$next, strtolower($next) . '.png'], [$prev, strtolower($prev) . '.png']]
            );
        }

        $this->createLessons($unitId, [
            [
                'num' => 1, 'title' => 'Greetings & characters', 'page' => 4, 'book_lesson' => 'Lesson 1',
                'type' => 'intro', 'audio' => 'PB4',
                'conf' => [
                    'mode' => 'intro',
                    'word_filter' => ['Hello', 'Hi', 'Good morning', 'Hala', 'Bill', 'Lama', 'Malek', 'Meg', 'Tom'],
                    'prompt' => 'Listen, point and say.',
                    'audio_tracks' => ['PB4', 'PB4_2', 'AB4', 'AB4_2'],
                    'instruction_key' => 'listen_point_say',
                ],
            ],
            [
                'num' => 2, 'title' => 'Colours & Numbers 1-10', 'page' => 5, 'book_lesson' => 'Lesson 2',
                'type' => 'vocab-game', 'audio' => 'PB5',
                'conf' => [
                    'mode' => 'vocab-game',
                    'categories' => ['colour', 'number'],
                    'rounds' => 8, 'question_style' => 'word-to-image',
                    'options_per_round' => 3, 'decoy_pool' => 'same_category',
                    'prompt' => 'Find the colour or number!',
                    'audio_tracks' => ['PB5', 'AB5'],
                ],
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // U1 — Family and friends  (pages 6-13)  — 8 lessons
    // ═══════════════════════════════════════════════════════════════
    protected function seedFamily(int $unitId): void
    {
        $folder = 'family';
        $p6 = $this->trackId('PB6');
        $p10 = $this->trackId('PB10');
        $p11 = $this->trackId('PB11');

        // Core family vocabulary (shared on page 6)
        $fam = [
            ['Boy', 'boy.png'], ['Brother', 'brother.png'], ['Cat', 'cat.png'],
            ['Dad', 'dad.png'], ['Friend', 'friend.png'], ['Girl', 'girl.png'],
            ['Mum', 'mum.png'], ['Sister', 'sister.png'],
        ];
        foreach ($fam as $i => [$w, $img]) {
            $siblings = array_values(array_filter($fam, fn ($x) => $x[0] !== $w));
            $this->upsertWord($unitId, $folder, $w, 'family', $img, $p6, [
                [$siblings[0][0], $siblings[0][1]],
                [$siblings[1][0], $siblings[1][1]],
            ]);
        }

        // Phonics Ss (p10)
        foreach ([['Sing', 'sing.png'], ['Sun', 'sun.png'], ['Six', 'six.png'], ['Sister', 'sister.png']] as $row) {
            $this->upsertWord($unitId, $folder, $row[0] . ' (Ss)', 's', $row[1], $p10,
                [['Dig', 'dig.png'], ['Doll', 'doll.png']], 'phonics');
        }
        // Phonics Dd (p10)
        foreach ([['Dig', 'dig.png'], ['Duck', 'duck.png'], ['Doll', 'doll.png'], ['Dad', 'dad.png']] as $row) {
            $this->upsertWord($unitId, $folder, $row[0] . ' (Dd)', 'd', $row[1], $p10,
                [['Sing', 'sing.png'], ['Sun', 'sun.png']], 'phonics');
        }
        // Phonics Cc (p11)
        foreach ([['Cut', 'cut.png'], ['Cup', 'cup.png'], ['Cap', 'cap.png'], ['Cat', 'cat.png']] as $row) {
            $this->upsertWord($unitId, $folder, $row[0] . ' (Cc)', 'c', $row[1], $p11,
                [['Apple', 'apple.png'], ['Ant', 'ant.png']], 'phonics');
        }
        // Phonics Aa (p11)
        foreach ([['Apple', 'apple.png'], ['Ant', 'ant.png'], ['Alligator', 'alligator.png'], ['Ann', 'ann.png']] as $row) {
            $this->upsertWord($unitId, $folder, $row[0] . ' (Aa)', 'a', $row[1], $p11,
                [['Cup', 'cup.png'], ['Cap', 'cap.png']], 'phonics');
        }

        $this->createLessons($unitId, [
            [
                'num' => 1, 'title' => 'Meet my family', 'page' => 6, 'book_lesson' => 'Lesson 1',
                'type' => 'intro', 'audio' => 'PB6',
                'conf' => [
                    'mode' => 'intro',
                    'word_filter' => ['Boy', 'Brother', 'Cat', 'Dad', 'Friend', 'Girl', 'Mum', 'Sister'],
                    'prompt' => 'Listen, point and say.',
                    'audio_tracks' => ['PB6', 'PB6_2', 'AB6', 'AB6_2'],
                    'instruction_key' => 'listen_follow_point_say',
                ],
            ],
            [
                'num' => 2, 'title' => 'Language practice', 'page' => 7, 'book_lesson' => 'Lesson 3',
                'type' => 'vocab-game', 'audio' => 'PB7',
                'conf' => [
                    'mode' => 'vocab-game', 'category' => 'family',
                    'rounds' => 6, 'question_style' => 'audio-to-image',
                    'options_per_round' => 3, 'decoy_pool' => 'same_category',
                    'prompt' => 'Listen and circle.',
                    'audio_tracks' => ['PB7', 'PB7_2', 'PB7_3', 'AB7', 'AB7_2'],
                ],
            ],
            [
                'num' => 3, 'title' => 'Story: Find Ann', 'page' => 8, 'book_lesson' => 'Lesson 5',
                'type' => 'story', 'audio' => 'PB8',
                'conf' => [
                    'mode' => 'story',
                    'story_title' => 'Find Ann',
                    'value' => 'Be helpful.',
                    'characters' => ['Hala', 'Bill', 'Ann'],
                    'audio_tracks' => ['PB8'],
                ],
            ],
            [
                'num' => 4, 'title' => 'Listen, match & sing', 'page' => 9, 'book_lesson' => 'Lesson 7',
                'type' => 'song', 'audio' => 'PB9_3',
                'conf' => [
                    'mode' => 'song', 'categories' => ['family'],
                    'rounds' => 4, 'question_style' => 'audio-to-image',
                    'options_per_round' => 3,
                    'song_title' => 'The family song',
                    'prompt' => 'Listen, match and sing!',
                    'audio_tracks' => ['PB9', 'PB9_2', 'PB9_3'],
                ],
            ],
            [
                'num' => 5, 'title' => 'Phonics: Ss and Dd', 'page' => 10, 'book_lesson' => 'Lesson 9',
                'type' => 'phonics-game', 'audio' => 'PB10',
                'conf' => [
                    'mode' => 'phonics-game', 'phonics_sets' => ['s', 'd'],
                    'rounds' => 8, 'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB10', 'PB10_2', 'AB10', 'AB10_2'],
                ],
            ],
            [
                'num' => 6, 'title' => 'Phonics: Cc and Aa', 'page' => 11, 'book_lesson' => 'Lesson 10',
                'type' => 'phonics-game', 'audio' => 'PB11',
                'conf' => [
                    'mode' => 'phonics-game', 'phonics_sets' => ['c', 'a'],
                    'rounds' => 8, 'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB11', 'PB11_2', 'AB11', 'AB11_2'],
                ],
            ],
            [
                'num' => 7, 'title' => 'Project: Finger puppets', 'page' => 12, 'book_lesson' => 'Lesson 11',
                'type' => 'project', 'audio' => 'PB12_2',
                'conf' => [
                    'mode' => 'project',
                    'project_title' => 'Finger puppets',
                    'word_filter' => ['Mum', 'Dad', 'Brother', 'Sister'],
                    'steps' => [
                        'Colour the four family puppets.',
                        'Cut them out carefully.',
                        'Tape each one into a small ring.',
                        'Put them on your fingers and sing!',
                    ],
                    'audio_tracks' => ['PB12_2', 'AB12', 'AB12_2'],
                    'video_track' => 'PB12V',
                ],
            ],
            [
                'num' => 8, 'title' => 'Picture dictionary', 'page' => 13, 'book_lesson' => 'Picture dict.',
                'type' => 'picture-dict', 'audio' => 'PB13',
                'conf' => [
                    'mode' => 'picture-dict',
                    'word_filter' => ['Boy', 'Brother', 'Cat', 'Dad', 'Friend', 'Girl', 'Mum', 'Sister'],
                    'prompt' => 'Listen and trace.',
                    'audio_tracks' => ['PB13', 'PB13_2', 'AB13'],
                ],
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // U2 — My school bag  (pages 14-21)  — 8 lessons
    // ═══════════════════════════════════════════════════════════════
    protected function seedSchoolBag(int $unitId): void
    {
        $folder = 'schoolbag';
        $p14 = $this->trackId('PB14');
        $p18 = $this->trackId('PB18');
        $p19 = $this->trackId('PB19');

        $items = [
            ['Bag', 'bag.png'], ['Book', 'book.png'], ['Crayon', 'crayon.png'],
            ['Eraser', 'eraser.png'], ['Pen', 'pen.png'], ['Pencil', 'pencil.png'],
            ['Pencil case', 'pencilcase.png'], ['Ruler', 'ruler.png'],
        ];
        foreach ($items as $i => [$w, $img]) {
            $sib = array_values(array_filter($items, fn ($x) => $x[0] !== $w));
            $this->upsertWord($unitId, $folder, $w, 'object', $img, $p14, [
                [$sib[0][0], $sib[0][1]], [$sib[1][0], $sib[1][1]],
            ]);
        }

        // Phonics Pp (p18)
        foreach ([['Pen', 'pen.png'], ['Pencil', 'pencil.png'], ['Pink', 'pink.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Pp)', 'p', $r[1], $p18,
                [['Rabbit', 'rabbit.png'], ['Red', 'red.png']], 'phonics');
        }
        // Phonics Rr (p18)
        foreach ([['Rabbit', 'rabbit.png'], ['Red', 'red.png'], ['Run', 'run.png'], ['Ruler', 'ruler.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Rr)', 'r', $r[1], $p18,
                [['Pen', 'pen.png'], ['Pink', 'pink.png']], 'phonics');
        }
        // Phonics Ee (p19)
        foreach ([['Elephant', 'elephant.png'], ['Egg', 'egg.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Ee)', 'e', $r[1], $p19,
                [['Book', 'book.png'], ['Ball', 'ball.png']], 'phonics');
        }
        // Phonics Bb (p19)
        foreach ([['Book', 'book.png'], ['Ball', 'ball.png'], ['Bag', 'bag.png'], ['Boy', 'boy.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Bb)', 'b', $r[1], $p19,
                [['Elephant', 'elephant.png'], ['Egg', 'egg.png']], 'phonics');
        }

        $this->createLessons($unitId, [
            [
                'num' => 1, 'title' => "What's in my bag?", 'page' => 14, 'book_lesson' => 'Lesson 1',
                'type' => 'intro', 'audio' => 'PB14',
                'conf' => [
                    'mode' => 'intro',
                    'word_filter' => ['Pen', 'Eraser', 'Ruler', 'Bag', 'Book', 'Pencil', 'Crayon', 'Pencil case'],
                    'prompt' => 'Listen, point and say.',
                    'audio_tracks' => ['PB14', 'PB14_2', 'AB14', 'AB14_2'],
                ],
            ],
            [
                'num' => 2, 'title' => "I've got / I haven't got", 'page' => 15, 'book_lesson' => 'Lesson 3',
                'type' => 'vocab-game', 'audio' => 'PB15',
                'conf' => [
                    'mode' => 'vocab-game', 'category' => 'object',
                    'rounds' => 6, 'question_style' => 'audio-to-image',
                    'options_per_round' => 3, 'decoy_pool' => 'same_category',
                    'prompt' => "Listen and circle — I've got / I haven't got.",
                    'audio_tracks' => ['PB15', 'PB15_2', 'PB15_3', 'AB15', 'AB15_2'],
                ],
            ],
            [
                'num' => 3, 'title' => 'Story: Find Lama', 'page' => 16, 'book_lesson' => 'Lesson 5',
                'type' => 'story', 'audio' => 'PB16',
                'conf' => [
                    'mode' => 'story',
                    'story_title' => 'Find Lama',
                    'value' => 'Look after your things.',
                    'characters' => ['Lama', 'Malek', 'Hala'],
                    'audio_tracks' => ['PB16', 'AB16'],
                ],
            ],
            [
                'num' => 4, 'title' => 'Listen, match & sing', 'page' => 17, 'book_lesson' => 'Lesson 7',
                'type' => 'song', 'audio' => 'PB17_3',
                'conf' => [
                    'mode' => 'song', 'categories' => ['object'],
                    'rounds' => 4, 'question_style' => 'audio-to-image',
                    'options_per_round' => 3,
                    'song_title' => 'My school bag song',
                    'prompt' => 'Listen, match and sing!',
                    'audio_tracks' => ['PB17', 'PB17_2', 'PB17_3', 'PB17_4'],
                ],
            ],
            [
                'num' => 5, 'title' => 'Phonics: Pp and Rr', 'page' => 18, 'book_lesson' => 'Lesson 9',
                'type' => 'phonics-game', 'audio' => 'PB18',
                'conf' => [
                    'mode' => 'phonics-game', 'phonics_sets' => ['p', 'r'],
                    'rounds' => 8, 'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB18', 'PB18_2', 'AB18', 'AB18_2'],
                ],
            ],
            [
                'num' => 6, 'title' => 'Phonics: Ee and Bb', 'page' => 19, 'book_lesson' => 'Lesson 10',
                'type' => 'phonics-game', 'audio' => 'PB19',
                'conf' => [
                    'mode' => 'phonics-game', 'phonics_sets' => ['e', 'b'],
                    'rounds' => 8, 'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB19', 'PB19_2', 'AB19', 'AB19_2'],
                ],
            ],
            [
                'num' => 7, 'title' => 'Project: A school bag', 'page' => 20, 'book_lesson' => 'Lesson 11',
                'type' => 'project', 'audio' => 'PB20_2',
                'conf' => [
                    'mode' => 'project',
                    'project_title' => 'A school bag',
                    'word_filter' => ['Bag', 'Book', 'Pen', 'Pencil', 'Ruler', 'Crayon'],
                    'steps' => [
                        'Draw and colour a big school bag.',
                        'Draw the items you have inside.',
                        'Show your bag and sing the song!',
                    ],
                    'audio_tracks' => ['PB20_2', 'AB20', 'AB20_2'],
                    'video_track' => 'PB20V',
                ],
            ],
            [
                'num' => 8, 'title' => 'Picture dictionary', 'page' => 21, 'book_lesson' => 'Picture dict.',
                'type' => 'picture-dict', 'audio' => 'PB21',
                'conf' => [
                    'mode' => 'picture-dict',
                    'word_filter' => ['Bag', 'Book', 'Crayon', 'Eraser', 'Pen', 'Pencil', 'Pencil case', 'Ruler'],
                    'prompt' => 'Listen and trace.',
                    'audio_tracks' => ['PB21', 'PB21_2', 'AB21'],
                ],
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // U3 — Our classroom  (pages 22-29)  — 8 lessons
    // ═══════════════════════════════════════════════════════════════
    protected function seedClassroom(int $unitId): void
    {
        $folder = 'classroom';
        $p22 = $this->trackId('PB22');
        $p26 = $this->trackId('PB26');
        $p27 = $this->trackId('PB27');

        $items = [
            ['Chair', 'chair.png'], ['Desk', 'desk.png'], ['Door', 'door.png'],
            ['Floor', 'floor.png'], ['Teacher', 'teacher.png'], ['Wall', 'wall.png'],
            ['Whiteboard', 'whiteboard.png'], ['Window', 'window.png'],
        ];
        foreach ($items as [$w, $img]) {
            $sib = array_values(array_filter($items, fn ($x) => $x[0] !== $w));
            $this->upsertWord($unitId, $folder, $w, 'classroom', $img, $p22, [
                [$sib[0][0], $sib[0][1]], [$sib[1][0], $sib[1][1]],
            ]);
        }

        // Phonics Tt (p26)
        foreach ([['Teddy', 'teddy.png'], ['Teacher', 'teacher.png'], ['Ten', 'ten.png'], ['Two', 'two.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Tt)', 't', $r[1], $p26,
                [['Mouse', 'mouse.png'], ['Milk', 'milk.png']], 'phonics');
        }
        // Phonics Mm (p26)
        foreach ([['Mouse', 'mouse.png'], ['Milk', 'milk.png'], ['Moon', 'moon.png'], ['Mum', 'mum.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Mm)', 'm', $r[1], $p26,
                [['Teddy', 'teddy.png'], ['Ten', 'ten.png']], 'phonics');
        }
        // Phonics Ww (p27)
        foreach ([['Wave', 'wave.png'], ['Wall', 'wall.png'], ['Water', 'water.png'], ['Whiteboard', 'whiteboard.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Ww)', 'w', $r[1], $p27,
                [['Insect', 'insect.png'], ['Ink', 'ink.png']], 'phonics');
        }
        // Phonics Ii (p27)
        foreach ([['Insect', 'insect.png'], ['Ink', 'ink.png'], ['Igloo', 'igloo.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Ii)', 'i', $r[1], $p27,
                [['Wave', 'wave.png'], ['Wall', 'wall.png']], 'phonics');
        }

        $this->createLessons($unitId, [
            [
                'num' => 1, 'title' => 'Our classroom', 'page' => 22, 'book_lesson' => 'Lesson 1',
                'type' => 'intro', 'audio' => 'PB22',
                'conf' => [
                    'mode' => 'intro',
                    'word_filter' => ['Teacher', 'Whiteboard', 'Door', 'Window', 'Chair', 'Desk', 'Floor', 'Wall'],
                    'prompt' => 'Listen, point and say.',
                    'audio_tracks' => ['PB22', 'PB22_2', 'AB22', 'AB22_2'],
                ],
            ],
            [
                'num' => 2, 'title' => "What's this? Where is it?", 'page' => 23, 'book_lesson' => 'Lesson 3',
                'type' => 'vocab-game', 'audio' => 'PB23',
                'conf' => [
                    'mode' => 'vocab-game', 'category' => 'classroom',
                    'rounds' => 6, 'question_style' => 'audio-to-image',
                    'options_per_round' => 3, 'decoy_pool' => 'same_category',
                    'prompt' => 'Listen and number / Listen and tick.',
                    'audio_tracks' => ['PB23', 'PB23_2', 'PB23_3', 'AB23', 'AB23_2'],
                ],
            ],
            [
                'num' => 3, 'title' => 'Story: Find the pens', 'page' => 24, 'book_lesson' => 'Lesson 5',
                'type' => 'story', 'audio' => 'PB24',
                'conf' => [
                    'mode' => 'story',
                    'story_title' => 'Find the pens',
                    'value' => 'Be tidy.',
                    'characters' => ['Malek', 'Hala', 'Bill'],
                    'audio_tracks' => ['PB24'],
                ],
            ],
            [
                'num' => 4, 'title' => 'Listen, match & sing', 'page' => 25, 'book_lesson' => 'Lesson 7',
                'type' => 'song', 'audio' => 'PB25_3',
                'conf' => [
                    'mode' => 'song', 'categories' => ['classroom'],
                    'rounds' => 4, 'question_style' => 'audio-to-image',
                    'options_per_round' => 3,
                    'song_title' => 'The classroom song',
                    'prompt' => 'Listen, match and sing!',
                    'audio_tracks' => ['PB25', 'PB25_2', 'PB25_3', 'PB25_4'],
                ],
            ],
            [
                'num' => 5, 'title' => 'Phonics: Tt and Mm', 'page' => 26, 'book_lesson' => 'Lesson 9',
                'type' => 'phonics-game', 'audio' => 'PB26',
                'conf' => [
                    'mode' => 'phonics-game', 'phonics_sets' => ['t', 'm'],
                    'rounds' => 8, 'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB26', 'PB26_2', 'AB26'],
                ],
            ],
            [
                'num' => 6, 'title' => 'Phonics: Ww and Ii', 'page' => 27, 'book_lesson' => 'Lesson 10',
                'type' => 'phonics-game', 'audio' => 'PB27',
                'conf' => [
                    'mode' => 'phonics-game', 'phonics_sets' => ['w', 'i'],
                    'rounds' => 8, 'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB27', 'PB27_2', 'AB27', 'AB27_2'],
                ],
            ],
            [
                'num' => 7, 'title' => 'Project: A pen pot', 'page' => 28, 'book_lesson' => 'Lesson 11',
                'type' => 'project', 'audio' => 'PB28_2',
                'conf' => [
                    'mode' => 'project',
                    'project_title' => 'A pen pot',
                    'word_filter' => ['Pen', 'Pencil', 'Crayon', 'Ruler'],
                    'steps' => [
                        'Cover a small cup with coloured paper.',
                        'Decorate it with stickers.',
                        'Put your pens and pencils inside!',
                    ],
                    'audio_tracks' => ['PB28_2', 'AB28', 'AB28_2'],
                    'video_track' => 'PB28V',
                ],
            ],
            [
                'num' => 8, 'title' => 'Picture dictionary', 'page' => 29, 'book_lesson' => 'Picture dict.',
                'type' => 'picture-dict', 'audio' => 'PB29',
                'conf' => [
                    'mode' => 'picture-dict',
                    'word_filter' => ['Chair', 'Desk', 'Door', 'Floor', 'Teacher', 'Wall', 'Whiteboard', 'Window'],
                    'prompt' => 'Listen and trace.',
                    'audio_tracks' => ['PB29', 'PB29_2', 'AB29'],
                ],
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // U4 — My favourite toy  (pages 30-37)  — 8 lessons
    // ═══════════════════════════════════════════════════════════════
    protected function seedToy(int $unitId): void
    {
        $folder = 'toy';
        $p30 = $this->trackId('PB30');
        $p34 = $this->trackId('PB34');
        $p35 = $this->trackId('PB35');

        $toys = [
            ['Ball', 'ball.png'], ['Car', 'car.png'], ['Doll', 'dolltoy.png'],
            ['Plane', 'plane.png'], ['Robot', 'robot.png'], ['Teddy', 'teddy.png'],
            ['Train', 'train.png'], ['Yoyo', 'yoyo.png'],
        ];
        foreach ($toys as [$w, $img]) {
            $sib = array_values(array_filter($toys, fn ($x) => $x[0] !== $w));
            $this->upsertWord($unitId, $folder, $w, 'toy', $img, $p30, [
                [$sib[0][0], $sib[0][1]], [$sib[1][0], $sib[1][1]],
            ]);
        }
        // Feelings
        $this->upsertWord($unitId, $folder, 'Happy', 'feeling', 'happy.png', $p30, [['Sad', 'sad.png'], ['Ball', 'ball.png']]);
        $this->upsertWord($unitId, $folder, 'Sad', 'feeling', 'sad.png', $p30, [['Happy', 'happy.png'], ['Doll', 'dolltoy.png']]);

        // CVC (p34-35)
        $cvc = [
            ['Red', 'red.png'], ['Cat', 'cat.png'], ['Mat', 'mat.png'], ['Sit', 'sit.png'],
            ['Bed', 'bed.png'], ['Web', 'web.png'], ['Sad', 'sad.png'], ['Wet', 'wet.png'],
            ['Map', 'map.png'], ['Bat', 'bat.png'], ['Cap', 'cap.png'], ['Tap', 'tap.png'],
        ];
        foreach ($cvc as [$w, $img]) {
            $sib = array_values(array_filter($cvc, fn ($x) => $x[0] !== $w));
            $this->upsertWord($unitId, $folder, $w . ' (CVC)', 'cvc', $img, $p34, [
                [$sib[0][0], $sib[0][1]], [$sib[1][0], $sib[1][1]],
            ], 'cvc');
        }

        $this->createLessons($unitId, [
            [
                'num' => 1, 'title' => 'My favourite toy', 'page' => 30, 'book_lesson' => 'Lesson 1',
                'type' => 'intro', 'audio' => 'PB30',
                'conf' => [
                    'mode' => 'intro',
                    'word_filter' => ['Ball', 'Car', 'Doll', 'Plane', 'Robot', 'Teddy', 'Train', 'Yoyo'],
                    'prompt' => 'Listen, point and say.',
                    'audio_tracks' => ['PB30', 'PB30_2', 'AB30', 'AB30_2'],
                ],
            ],
            [
                'num' => 2, 'title' => 'What colour is it?', 'page' => 31, 'book_lesson' => 'Lesson 3',
                'type' => 'vocab-game', 'audio' => 'PB31',
                'conf' => [
                    'mode' => 'vocab-game', 'categories' => ['toy', 'feeling'],
                    'rounds' => 6, 'question_style' => 'audio-to-image',
                    'options_per_round' => 3, 'decoy_pool' => 'same_category',
                    'prompt' => 'Listen and circle / number.',
                    'audio_tracks' => ['PB31', 'PB31_2', 'PB31_3', 'AB31', 'AB31_2'],
                ],
            ],
            [
                'num' => 3, 'title' => 'Story: Find Sue', 'page' => 32, 'book_lesson' => 'Lesson 5',
                'type' => 'story', 'audio' => 'PB32',
                'conf' => [
                    'mode' => 'story',
                    'story_title' => 'Find Sue',
                    'value' => 'Share.',
                    'characters' => ['Sue', 'Bill', 'Hala'],
                    'audio_tracks' => ['PB32', 'AB32'],
                ],
            ],
            [
                'num' => 4, 'title' => 'Listen, match & sing', 'page' => 33, 'book_lesson' => 'Lesson 7',
                'type' => 'song', 'audio' => 'PB33_3',
                'conf' => [
                    'mode' => 'song', 'categories' => ['toy', 'feeling'],
                    'rounds' => 4, 'question_style' => 'audio-to-image',
                    'options_per_round' => 3,
                    'song_title' => 'The toys song',
                    'prompt' => 'How do you feel? Listen, match and sing!',
                    'audio_tracks' => ['PB33', 'PB33_2', 'PB33_3', 'PB33_4'],
                ],
            ],
            [
                'num' => 5, 'title' => 'CVC words — blend', 'page' => 34, 'book_lesson' => 'Lesson 9',
                'type' => 'phonics-game', 'audio' => 'PB34',
                'conf' => [
                    'mode' => 'phonics-game', 'phonics_sets' => ['cvc'],
                    'rounds' => 6, 'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and blend the sounds.',
                    'audio_tracks' => ['PB34', 'PB34_2', 'AB34', 'AB34_2'],
                ],
            ],
            [
                'num' => 6, 'title' => 'CVC words — order & write', 'page' => 35, 'book_lesson' => 'Lesson 10',
                'type' => 'phonics-game', 'audio' => 'PB35',
                'conf' => [
                    'mode' => 'phonics-game', 'phonics_sets' => ['cvc'],
                    'rounds' => 6, 'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen, order and write.',
                    'audio_tracks' => ['PB35', 'AB35'],
                ],
            ],
            [
                'num' => 7, 'title' => 'Project: A toy box', 'page' => 36, 'book_lesson' => 'Lesson 11',
                'type' => 'project', 'audio' => 'PB36_2',
                'conf' => [
                    'mode' => 'project',
                    'project_title' => 'A toy box',
                    'word_filter' => ['Ball', 'Car', 'Teddy', 'Robot', 'Doll'],
                    'steps' => [
                        'Decorate a small box with colours.',
                        'Draw your favourite toys on it.',
                        'Sing the toys song and show your box!',
                    ],
                    'audio_tracks' => ['PB36_2'],
                    'video_track' => 'PB36V',
                ],
            ],
            [
                'num' => 8, 'title' => 'Picture dictionary', 'page' => 37, 'book_lesson' => 'Picture dict.',
                'type' => 'picture-dict', 'audio' => 'PB37',
                'conf' => [
                    'mode' => 'picture-dict',
                    'word_filter' => ['Ball', 'Car', 'Doll', 'Plane', 'Robot', 'Teddy', 'Train', 'Yoyo'],
                    'prompt' => 'Listen and trace.',
                    'audio_tracks' => ['PB37', 'PB37_2', 'AB37'],
                ],
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // U5 — Learning Club: Days of the week  (pages 38-39)  — 2 lessons
    // ═══════════════════════════════════════════════════════════════
    protected function seedLearningClub(int $unitId): void
    {
        $folder = 'lc';
        $p38 = $this->trackId('PB38');
        $days = [
            ['Sunday', 'sunday.png'], ['Monday', 'monday.png'], ['Tuesday', 'tuesday.png'],
            ['Wednesday', 'wednesday.png'], ['Thursday', 'thursday.png'],
            ['Friday', 'friday.png'], ['Saturday', 'saturday.png'],
        ];
        foreach ($days as [$w, $img]) {
            $sib = array_values(array_filter($days, fn ($x) => $x[0] !== $w));
            $this->upsertWord($unitId, $folder, $w, 'day', $img, $p38, [
                [$sib[0][0], $sib[0][1]], [$sib[1][0], $sib[1][1]],
            ]);
        }

        $this->createLessons($unitId, [
            [
                'num' => 1, 'title' => 'Days of the week', 'page' => 38, 'book_lesson' => 'LC intro',
                'type' => 'intro', 'audio' => 'PB38',
                'conf' => [
                    'mode' => 'intro',
                    'word_filter' => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    'prompt' => 'Listen, point and say.',
                    'audio_tracks' => ['PB38', 'PB38_2'],
                ],
            ],
            [
                'num' => 2, 'title' => 'Days practice', 'page' => 39, 'book_lesson' => 'LC practice',
                'type' => 'vocab-game', 'audio' => 'PB39',
                'conf' => [
                    'mode' => 'vocab-game', 'category' => 'day',
                    'rounds' => 7, 'question_style' => 'audio-to-image',
                    'options_per_round' => 3, 'decoy_pool' => 'same_category',
                    'prompt' => 'Listen and circle / Look, order and say.',
                    'audio_tracks' => ['PB39', 'PB39_2'],
                ],
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════
    protected function upsertUnit(array $d): Unit
    {
        return Unit::updateOrCreate(
            ['code' => $d['code']],
            [
                'unit_number'   => $d['unit_number'],
                'title'         => $d['title'],
                'description'   => $d['description'],
                'image_path'    => $d['image_path'],
                'color_key'     => $d['color_key'],
                'lessons_count' => 0,
            ]
        );
    }

    /**
     * Insert/update one Word with all the goodies wired.
     *
     * $wrong is a list of [word, image] pairs (2 of them) used as decoys
     * in matching games. We always store the raw assets path so the
     * frontend can render them immediately without an extra lookup.
     */
    protected function upsertWord(
        int $unitId,
        string $folder,
        string $word,
        string $category,
        string $image,
        ?int $audioTrackId,
        array $wrong,
        string $type = 'vocab'
    ): void {
        Word::updateOrCreate(
            ['unit_id' => $unitId, 'word' => $word],
            [
                'type'             => $type,
                'category'         => $category,
                'image_path'       => "assets/lessons/{$folder}/{$image}",
                'audio_path'       => null,  // no per-word file; everything streams via audio_track
                'audio_track_id'   => $audioTrackId,
                'segment_start_ms' => null, // Filled later by the teacher-admin tool.
                'segment_end_ms'   => null,
                'wrong_options'    => [
                    ['word' => $wrong[0][0], 'image_path' => "assets/lessons/{$folder}/{$wrong[0][1]}"],
                    ['word' => $wrong[1][0], 'image_path' => "assets/lessons/{$folder}/{$wrong[1][1]}"],
                ],
            ]
        );
    }

    protected function createLessons(int $unitId, array $lessons): void
    {
        foreach ($lessons as $l) {
            $trackId = ! empty($l['audio']) ? $this->trackId($l['audio']) : null;

            $config = $l['conf'];
            if (! empty($l['book_lesson'])) {
                $config['book_lesson'] = $l['book_lesson'];
            }

            Lesson::updateOrCreate(
                ['unit_id' => $unitId, 'lesson_number' => $l['num']],
                [
                    'title'          => $l['title'],
                    'type'           => $l['type'],
                    'page_number'    => $l['page'] ?? null,
                    'config'         => $config,
                    'audio_track_id' => $trackId,
                ]
            );
        }

        Unit::where('id', $unitId)->update(['lessons_count' => count($lessons)]);
    }

    /**
     * Tiny cache-on-miss lookup so we don't hit the DB once per word.
     */
    private static array $trackCache = [];
    protected function trackId(string $code): ?int
    {
        if (! array_key_exists($code, self::$trackCache)) {
            self::$trackCache[$code] = AudioTrack::where('code', $code)->value('id');
        }
        return self::$trackCache[$code];
    }
}
