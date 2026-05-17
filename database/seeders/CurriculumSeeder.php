<?php

namespace Database\Seeders;

use App\Models\AudioTrack;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\Word;
use Illuminate\Database\Seeder;

/**
 * Team Together 1A (Jordan) — exact book structure (Units 0, 1, 2).
 */
class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        // تنظيف أي وحدات قديمة لضمان بقاء الوحدات 0 و 1 و 2 فقط
        Unit::whereNotIn('code', ['U0', 'U1', 'U2'])->delete();

        // ══════ Unit 0: Welcome ══════
        $u0 = $this->upsertUnit([
            'code' => 'U0',
            'unit_number' => 0,
            'title' => 'Welcome: Hello!',
            'description' => 'Characters, greetings, colours and numbers 1-10.',
            'image_path' => 'assets/lessons/welcome/hut.png',
            'color_key' => 'purple',
        ]);
        $this->seedWelcome($u0->id);

        // ══════ Unit 1: Family and friends ══════
        $u1 = $this->upsertUnit([
            'code' => 'U1',
            'unit_number' => 1,
            'title' => 'Family and friends',
            'description' => 'Family members, pets, phonics Ss Dd Cc Aa.',
            'image_path' => 'assets/lessons/family/treehouse.png',
            'color_key' => 'green',
        ]);
        $this->seedFamily($u1->id);

        // ══════ Unit 2: My school bag ══════
        $u2 = $this->upsertUnit([
            'code' => 'U2',
            'unit_number' => 2,
            'title' => 'My school bag',
            'description' => "School items, I've got / I haven't got, phonics Pp Rr Ee Bb.",
            'image_path' => 'assets/lessons/schoolbag/bag.png',
            'color_key' => 'blue',
        ]);
        $this->seedSchoolBag($u2->id);
    }

    // ═══════════════════════════════════════════════════════════════
    // U0 — Welcome: Hello!  (pages 4-5)
    // ═══════════════════════════════════════════════════════════════
    protected function seedWelcome(int $unitId): void
    {
        $folder = 'welcome';
        $trackP4 = $this->trackId('PB4');
        $trackP5 = $this->trackId('PB5');

        // Greetings
        $this->upsertWord($unitId, $folder, 'Hello',        'greeting',  'hello.png',        $trackP4, [['Hi', 'hi.png'], ['Good morning', 'goodmorning.png']]);
        $this->upsertWord($unitId, $folder, 'Hi',           'greeting',  'hi.png',           $trackP4, [['Hello', 'hello.png'], ['Good morning', 'goodmorning.png']]);
        $this->upsertWord($unitId, $folder, 'Good morning', 'greeting',  'goodmorning.png',  $trackP4, [['Hello', 'hello.png'], ['Hi', 'hi.png']]);

        // Characters (Jordanian Adaptation: Hala, Lama, Bill, Malek ONLY)
        $this->upsertWord($unitId, $folder, 'Hala',  'character', 'hala.png',  $trackP4, [['Bill', 'bill.png'], ['Lama', 'lama.png']]);
        $this->upsertWord($unitId, $folder, 'Lama',  'character', 'lama.png',  $trackP4, [['Hala', 'hala.png'], ['Malek', 'malek.png']]);
        $this->upsertWord($unitId, $folder, 'Bill',  'character', 'bill.png',  $trackP4, [['Malek', 'malek.png'], ['Lama', 'lama.png']]);
        $this->upsertWord($unitId, $folder, 'Malek', 'character', 'malek.png', $trackP4, [['Bill', 'bill.png'], ['Hala', 'hala.png']]);

        // Colours (p5)
        $this->upsertWord($unitId, $folder, 'Blue',   'colour', 'blue.png',   $trackP5, [['Red', 'red.png'], ['Green', 'green.png']]);
        $this->upsertWord($unitId, $folder, 'Green',  'colour', 'green.png',  $trackP5, [['Blue', 'blue.png'], ['Orange', 'orange.png']]);
        $this->upsertWord($unitId, $folder, 'Orange', 'colour', 'orange.png', $trackP5, [['Red', 'red.png'], ['Brown', 'brown.png']]);
        $this->upsertWord($unitId, $folder, 'Red',    'colour', 'red.png',    $trackP5, [['Blue', 'blue.png'], ['Yellow', 'yellow.png']]);
        $this->upsertWord($unitId, $folder, 'Yellow', 'colour', 'yellow.png', $trackP5, [['Green', 'green.png'], ['Orange', 'orange.png']]);
        $this->upsertWord($unitId, $folder, 'Brown',  'colour', 'brown.png',  $trackP5, [['Red', 'red.png'], ['Blue', 'blue.png']]);

        // Numbers 1-10 (p5)
        $numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
        foreach ($numbers as $i => $n) {
            $img = strtolower($n) . '.png';
            $next = $i < 9 ? $numbers[$i + 1] : 'Nine';
            $prev = $i > 0 ? $numbers[$i - 1] : 'Two';
            $this->upsertWord($unitId, $folder, $n, 'number', $img, $trackP5, [[$next, strtolower($next) . '.png'], [$prev, strtolower($prev) . '.png']]);
        }

        $this->createLessons($unitId, [
            [
                'num' => 1,
                'title' => 'Greetings & characters',
                'page' => 4,
                'book_lesson' => 'Lesson 1',
                'type' => 'intro',
                'audio' => 'PB4',
                'conf' => [
                    'mode' => 'intro',
                    'word_filter' => ['Hello', 'Hi', 'Good morning', 'Hala', 'Bill', 'Lama', 'Malek'],
                    'prompt' => 'Listen, point and say.',
                    'audio_tracks' => ['PB4', 'PB4_2', 'AB4', 'AB4_2'],
                    'instruction_key' => 'listen_point_say',
                ],
            ],
            [
                'num' => 2,
                'title' => 'Colours & Numbers 1-10',
                'page' => 5,
                'book_lesson' => 'Lesson 2',
                'type' => 'vocab-game',
                'audio' => 'PB5',
                'conf' => [
                    'mode' => 'vocab-game',
                    'categories' => ['colour', 'number'],
                    'rounds' => 8,
                    'question_style' => 'word-to-image',
                    'options_per_round' => 3,
                    'decoy_pool' => 'same_category',
                    'prompt' => 'Find the colour or number!',
                    'audio_tracks' => ['PB5', 'AB5'],
                ],
            ],
            [
                'num' => 3,
                'title' => 'Circle the colour!',
                'page' => 5,
                'book_lesson' => 'Bonus 1',
                'type' => 'draw-circle',
                'audio' => 'PB5',
                'conf' => [
                    'mode' => 'draw-circle',
                    'category' => 'colour',
                    'rounds' => 5,
                    'options_per_round' => 3,
                    'prompt' => 'Circle the correct colour!',
                ],
            ],
            [
                'num' => 4,
                'title' => 'Match the words',
                'page' => 5,
                'book_lesson' => 'Bonus 2',
                'type' => 'match-connect',
                'audio' => 'PB5',
                'conf' => [
                    'mode' => 'match-connect',
                    'category' => 'colour',
                    'rounds' => 4,
                    'options_per_round' => 4,
                    'prompt' => 'Match the word to the picture!',
                ],
            ],
            [
                'num' => 5,
                'title' => 'Memory flip — colours',
                'page' => 5,
                'book_lesson' => 'Bonus 3',
                'type' => 'memory-flip',
                'audio' => 'PB5',
                'conf' => [
                    'mode' => 'memory-flip',
                    'category' => 'colour',
                    'rounds' => 4,
                    'prompt' => 'Find the matching pairs!',
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

        // Core family vocabulary
        $fam = [
            ['Boy', 'boy.png'],
            ['Brother', 'brother.png'],
            ['Cat', 'cat.png'],
            ['Dad', 'dad.png'],
            ['Friend', 'friend.png'],
            ['Girl', 'girl.png'],
            ['Mum', 'mum.png'],
            ['Sister', 'sister.png'],
        ];
        foreach ($fam as $i => [$w, $img]) {
            $siblings = array_values(array_filter($fam, fn($x) => $x[0] !== $w));
            $this->upsertWord($unitId, $folder, $w, 'family', $img, $p6, [
                [$siblings[0][0], $siblings[0][1]],
                [$siblings[1][0], $siblings[1][1]],
            ]);
        }

        // Phonics Ss (p10)
        foreach ([['Sing', 'sing.png'], ['Sun', 'sun.png'], ['Six', 'six.png'], ['Sister', 'sister.png']] as $row) {
            $this->upsertWord($unitId, $folder, $row[0] . ' (Ss)', 's', $row[1], $p10, [['Dig', 'dig.png'], ['Doll', 'doll.png']], 'phonics');
        }
        // Phonics Dd (p10)
        foreach ([['Dig', 'dig.png'], ['Duck', 'duck.png'], ['Doll', 'doll.png'], ['Dad', 'dad.png']] as $row) {
            $this->upsertWord($unitId, $folder, $row[0] . ' (Dd)', 'd', $row[1], $p10, [['Sing', 'sing.png'], ['Sun', 'sun.png']], 'phonics');
        }
        // Phonics Cc (p11)
        foreach ([['Cut', 'cut.png'], ['Cup', 'cup.png'], ['Cap', 'cap.png'], ['Cat', 'cat.png']] as $row) {
            $this->upsertWord($unitId, $folder, $row[0] . ' (Cc)', 'c', $row[1], $p11, [['Apple', 'apple.png'], ['Ant', 'ant.png']], 'phonics');
        }
        // Phonics Aa (p11)
        foreach ([['Apple', 'apple.png'], ['Ant', 'ant.png'], ['Alligator', 'alligator.png'], ['Ann', 'ann.png']] as $row) {
            $this->upsertWord($unitId, $folder, $row[0] . ' (Aa)', 'a', $row[1], $p11, [['Cup', 'cup.png'], ['Cap', 'cap.png']], 'phonics');
        }

        $this->createLessons($unitId, [
            [
                'num' => 1,
                'title' => 'Meet my family',
                'page' => 6,
                'book_lesson' => 'Lesson 1',
                'type' => 'intro',
                'audio' => 'PB6',
                'conf' => [
                    'mode' => 'intro',
                    'word_filter' => ['Boy', 'Brother', 'Cat', 'Dad', 'Friend', 'Girl', 'Mum', 'Sister'],
                    'prompt' => 'Listen, point and say.',
                    'audio_tracks' => ['PB6', 'PB6_2', 'AB6', 'AB6_2'],
                    'instruction_key' => 'listen_follow_point_say',
                ],
            ],
            [
                'num' => 2,
                'title' => 'Language practice',
                'page' => 7,
                'book_lesson' => 'Lesson 3',
                'type' => 'vocab-game',
                'audio' => 'PB7',
                'conf' => [
                    'mode' => 'vocab-game',
                    'category' => 'family',
                    'rounds' => 6,
                    'question_style' => 'audio-to-image',
                    'options_per_round' => 3,
                    'decoy_pool' => 'same_category',
                    'prompt' => 'Listen and circle.',
                    'audio_tracks' => ['PB7', 'PB7_2', 'PB7_3', 'AB7', 'AB7_2'],
                ],
            ],
            [
                'num' => 3,
                'title' => 'Story: Find Ann',
                'page' => 8,
                'book_lesson' => 'Lesson 5',
                'type' => 'story',
                'audio' => 'PB8',
                'conf' => [
                    'mode' => 'story',
                    'story_title' => 'Find Ann',
                    'value' => 'Be helpful.',
                    'characters' => ['Hala', 'Bill', 'Ann'],
                    'audio_tracks' => ['PB8'],
                ],
            ],
            [
                'num' => 4,
                'title' => 'Listen, match & sing',
                'page' => 9,
                'book_lesson' => 'Lesson 7',
                'type' => 'song',
                'audio' => 'PB9_3',
                'conf' => [
                    'mode' => 'song',
                    'categories' => ['family'],
                    'rounds' => 4,
                    'question_style' => 'audio-to-image',
                    'options_per_round' => 3,
                    'song_title' => 'The family song',
                    'prompt' => 'Listen, match and sing!',
                    'audio_tracks' => ['PB9', 'PB9_2', 'PB9_3'],
                ],
            ],
            [
                'num' => 5,
                'title' => 'Phonics: Ss and Dd',
                'page' => 10,
                'book_lesson' => 'Lesson 9',
                'type' => 'phonics-game',
                'audio' => 'PB10',
                'conf' => [
                    'mode' => 'phonics-game',
                    'phonics_sets' => ['s', 'd'],
                    'rounds' => 8,
                    'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB10', 'PB10_2', 'AB10', 'AB10_2'],
                ],
            ],
            [
                'num' => 6,
                'title' => 'Phonics: Cc and Aa',
                'page' => 11,
                'book_lesson' => 'Lesson 10',
                'type' => 'phonics-game',
                'audio' => 'PB11',
                'conf' => [
                    'mode' => 'phonics-game',
                    'phonics_sets' => ['c', 'a'],
                    'rounds' => 8,
                    'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB11', 'PB11_2', 'AB11', 'AB11_2'],
                ],
            ],
            [
                'num' => 7,
                'title' => 'Project: Finger puppets',
                'page' => 12,
                'book_lesson' => 'Lesson 11',
                'type' => 'project',
                'audio' => 'PB12_2',
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
                'num' => 8,
                'title' => 'Picture dictionary',
                'page' => 13,
                'book_lesson' => 'Picture dict.',
                'type' => 'picture-dict',
                'audio' => 'PB13',
                'conf' => [
                    'mode' => 'picture-dict',
                    'word_filter' => ['Boy', 'Brother', 'Cat', 'Dad', 'Friend', 'Girl', 'Mum', 'Sister'],
                    'prompt' => 'Listen and trace.',
                    'audio_tracks' => ['PB13', 'PB13_2', 'AB13'],
                ],
            ],
            [
                'num' => 9,
                'title' => 'Bubble pop — family',
                'page' => 13,
                'book_lesson' => 'Bonus',
                'type' => 'bubble-pop',
                'audio' => 'PB6',
                'conf' => [
                    'mode' => 'bubble-pop',
                    'category' => 'family',
                    'rounds' => 5,
                    'options_per_round' => 5,
                    'prompt' => 'Listen and pop the right word!',
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
            ['Bag', 'bag.png'],
            ['Book', 'book.png'],
            ['Crayon', 'crayon.png'],
            ['Eraser', 'eraser.png'],
            ['Pen', 'pen.png'],
            ['Pencil', 'pencil.png'],
            ['Pencil case', 'pencilcase.png'],
            ['Ruler', 'ruler.png'],
        ];
        foreach ($items as $i => [$w, $img]) {
            $sib = array_values(array_filter($items, fn($x) => $x[0] !== $w));
            $this->upsertWord($unitId, $folder, $w, 'object', $img, $p14, [
                [$sib[0][0], $sib[0][1]],
                [$sib[1][0], $sib[1][1]],
            ]);
        }

        // Phonics Pp (p18)
        foreach ([['Pen', 'pen.png'], ['Pencil', 'pencil.png'], ['Pink', 'pink.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Pp)', 'p', $r[1], $p18, [['Rabbit', 'rabbit.png'], ['Red', 'red.png']], 'phonics');
        }
        // Phonics Rr (p18)
        foreach ([['Rabbit', 'rabbit.png'], ['Red', 'red.png'], ['Run', 'run.png'], ['Ruler', 'ruler.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Rr)', 'r', $r[1], $p18, [['Pen', 'pen.png'], ['Pink', 'pink.png']], 'phonics');
        }
        // Phonics Ee (p19)
        foreach ([['Elephant', 'elephant.png'], ['Egg', 'egg.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Ee)', 'e', $r[1], $p19, [['Book', 'book.png'], ['Ball', 'ball.png']], 'phonics');
        }
        // Phonics Bb (p19)
        foreach ([['Book', 'book.png'], ['Ball', 'ball.png'], ['Bag', 'bag.png'], ['Boy', 'boy.png']] as $r) {
            $this->upsertWord($unitId, $folder, $r[0] . ' (Bb)', 'b', $r[1], $p19, [['Elephant', 'elephant.png'], ['Egg', 'egg.png']], 'phonics');
        }

        $this->createLessons($unitId, [
            [
                'num' => 1,
                'title' => "What's in my bag?",
                'page' => 14,
                'book_lesson' => 'Lesson 1',
                'type' => 'intro',
                'audio' => 'PB14',
                'conf' => [
                    'mode' => 'intro',
                    'word_filter' => ['Pen', 'Eraser', 'Ruler', 'Bag', 'Book', 'Pencil', 'Crayon', 'Pencil case'],
                    'prompt' => 'Listen, point and say.',
                    'audio_tracks' => ['PB14', 'PB14_2', 'AB14', 'AB14_2'],
                ],
            ],
            [
                'num' => 2,
                'title' => "I've got / I haven't got",
                'page' => 15,
                'book_lesson' => 'Lesson 3',
                'type' => 'vocab-game',
                'audio' => 'PB15',
                'conf' => [
                    'mode' => 'vocab-game',
                    'category' => 'object',
                    'rounds' => 6,
                    'question_style' => 'audio-to-image',
                    'options_per_round' => 3,
                    'decoy_pool' => 'same_category',
                    'prompt' => "Listen and circle — I've got / I haven't got.",
                    'audio_tracks' => ['PB15', 'PB15_2', 'PB15_3', 'AB15', 'AB15_2'],
                ],
            ],
            [
                'num' => 3,
                'title' => 'Story: Find Lama',
                'page' => 16,
                'book_lesson' => 'Lesson 5',
                'type' => 'story',
                'audio' => 'PB16',
                'conf' => [
                    'mode' => 'story',
                    'story_title' => 'Find Lama',
                    'value' => 'Look after your things.',
                    'characters' => ['Lama', 'Malek', 'Hala'],
                    'audio_tracks' => ['PB16', 'AB16'],
                ],
            ],
            [
                'num' => 4,
                'title' => 'Listen, match & sing',
                'page' => 17,
                'book_lesson' => 'Lesson 7',
                'type' => 'song',
                'audio' => 'PB17_3',
                'conf' => [
                    'mode' => 'song',
                    'categories' => ['object'],
                    'rounds' => 4,
                    'question_style' => 'audio-to-image',
                    'options_per_round' => 3,
                    'song_title' => 'My school bag song',
                    'prompt' => 'Listen, match and sing!',
                    'audio_tracks' => ['PB17', 'PB17_2', 'PB17_3', 'PB17_4'],
                ],
            ],
            [
                'num' => 5,
                'title' => 'Phonics: Pp and Rr',
                'page' => 18,
                'book_lesson' => 'Lesson 9',
                'type' => 'phonics-game',
                'audio' => 'PB18',
                'conf' => [
                    'mode' => 'phonics-game',
                    'phonics_sets' => ['p', 'r'],
                    'rounds' => 8,
                    'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB18', 'PB18_2', 'AB18', 'AB18_2'],
                ],
            ],
            [
                'num' => 6,
                'title' => 'Phonics: Ee and Bb',
                'page' => 19,
                'book_lesson' => 'Lesson 10',
                'type' => 'phonics-game',
                'audio' => 'PB19',
                'conf' => [
                    'mode' => 'phonics-game',
                    'phonics_sets' => ['e', 'b'],
                    'rounds' => 8,
                    'question_style' => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt' => 'Listen and circle the sound.',
                    'audio_tracks' => ['PB19', 'PB19_2', 'AB19', 'AB19_2'],
                ],
            ],
            [
                'num' => 7,
                'title' => 'Project: A school bag',
                'page' => 20,
                'book_lesson' => 'Lesson 11',
                'type' => 'project',
                'audio' => 'PB20_2',
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
                'num' => 8,
                'title' => 'Picture dictionary',
                'page' => 21,
                'book_lesson' => 'Picture dict.',
                'type' => 'picture-dict',
                'audio' => 'PB21',
                'conf' => [
                    'mode' => 'picture-dict',
                    'word_filter' => ['Bag', 'Book', 'Crayon', 'Eraser', 'Pen', 'Pencil', 'Pencil case', 'Ruler'],
                    'prompt' => 'Listen and trace.',
                    'audio_tracks' => ['PB21', 'PB21_2', 'AB21'],
                ],
            ],
            [
                'num' => 9,
                'title' => 'Build the sentence',
                'page' => 21,
                'book_lesson' => 'Bonus',
                'type' => 'sequence-build',
                'audio' => 'PB14',
                'conf' => [
                    'mode' => 'sequence-build',
                    'rounds' => 3,
                    'prompt' => 'Drag the words in order: I have a ___.',
                    'sentences' => [
                        ['I', 'have', 'a', 'pen'],
                        ['I', 'have', 'a', 'book'],
                        ['I', 'have', 'a', 'bag'],
                    ],
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

    protected function upsertWord(int $unitId, string $folder, string $word, string $category, string $image, ?int $audioTrackId, array $wrong, string $type = 'vocab'): void
    {
        Word::updateOrCreate(
            ['unit_id' => $unitId, 'word' => $word],
            [
                'type'             => $type,
                'category'         => $category,
                'image_path'       => "assets/lessons/{$folder}/{$image}",
                'audio_path'       => null,
                'audio_track_id'   => $audioTrackId,
                'segment_start_ms' => null,
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

    private static array $trackCache = [];
    protected function trackId(string $code): ?int
    {
        if (! array_key_exists($code, self::$trackCache)) {
            self::$trackCache[$code] = AudioTrack::where('code', $code)->value('id');
        }
        return self::$trackCache[$code];
    }
}
