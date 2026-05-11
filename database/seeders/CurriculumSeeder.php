<?php

namespace Database\Seeders;

use App\Models\AudioTrack;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\Word;
use Illuminate\Database\Seeder;

/**
 * Seeds the first part of the Team Together 1A (Jordan reprint)
 * curriculum using the pages the project owner supplied:
 *
 *   - Welcome "Hello!"              pages 4-9    -> U0
 *   - Unit 1  "Family and friends"  pages 10-20  -> U1
 *
 * Every lesson is linked to its official NCCD audio track (see
 * NccdAudioTrackSeeder) so the React engine can play the real
 * recordings straight from qr.nccd.gov.jo or the local cache.
 *
 * Run:   php artisan db:seed
 * Re-runs are idempotent; updateOrCreate is used throughout.
 */
class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        // ══════════ U0 — Welcome "Hello!" ══════════
        $u0 = $this->upsertUnit([
            'code'         => 'U0',
            'unit_number'  => 0,
            'title'        => 'Welcome: Hello!',
            'description'  => 'Greetings, characters, colours and numbers 1-10.',
            'image_path'   => 'assets/lessons/welcome/hut.png',
            'color_key'    => 'purple',
        ]);

        $this->seedWelcome($u0->id);

        // ══════════ U1 — Family and friends ══════════
        $u1 = $this->upsertUnit([
            'code'         => 'U1',
            'unit_number'  => 1,
            'title'        => 'Family and friends',
            'description'  => 'Family members, pets, and phonics Ss, Dd, Cc, Aa.',
            'image_path'   => 'assets/lessons/family/treehouse.png',
            'color_key'    => 'green',
        ]);

        $this->seedFamilyAndFriends($u1->id);
    }

    // ────────────────────────────────────────────
    // U0: Welcome Hello! (pages 4-9)
    // ────────────────────────────────────────────

    protected function seedWelcome(int $unitId): void
    {
        $folder = 'welcome';

        // Words used by lessons in this unit.
        // Each entry seeds one Word row. w1/w2 become wrong_options
        // for vocab games (same-category decoys).
        $words = [
            // Greetings (page 4)
            ['w' => 'Hello',        'type' => 'vocab', 'cat' => 'greeting', 'img' => 'hello.png',
             'w1' => 'Hi',          'w1img' => 'hi.png',
             'w2' => 'Good morning','w2img' => 'goodmorning.png'],
            ['w' => 'Hi',           'type' => 'vocab', 'cat' => 'greeting', 'img' => 'hi.png',
             'w1' => 'Hello',       'w1img' => 'hello.png',
             'w2' => 'Good morning','w2img' => 'goodmorning.png'],
            ['w' => 'Good morning', 'type' => 'vocab', 'cat' => 'greeting', 'img' => 'goodmorning.png',
             'w1' => 'Hello',       'w1img' => 'hello.png',
             'w2' => 'Hi',          'w2img' => 'hi.png'],

            // Book characters (page 4)
            ['w' => 'Bill',  'type' => 'vocab', 'cat' => 'character', 'img' => 'bill.png',
             'w1' => 'Hala', 'w1img' => 'hala.png', 'w2' => 'Malek', 'w2img' => 'malek.png'],
            ['w' => 'Hala',  'type' => 'vocab', 'cat' => 'character', 'img' => 'hala.png',
             'w1' => 'Bill', 'w1img' => 'bill.png', 'w2' => 'Lama',  'w2img' => 'lama.png'],
            ['w' => 'Malek', 'type' => 'vocab', 'cat' => 'character', 'img' => 'malek.png',
             'w1' => 'Bill', 'w1img' => 'bill.png', 'w2' => 'Lama',  'w2img' => 'lama.png'],
            ['w' => 'Lama',  'type' => 'vocab', 'cat' => 'character', 'img' => 'lama.png',
             'w1' => 'Hala', 'w1img' => 'hala.png', 'w2' => 'Malek', 'w2img' => 'malek.png'],

            // Colours (page 5)
            ['w' => 'Blue',   'type' => 'vocab', 'cat' => 'colour', 'img' => 'blue.png',
             'w1' => 'Red',   'w1img' => 'red.png',   'w2' => 'Green',  'w2img' => 'green.png'],
            ['w' => 'Red',    'type' => 'vocab', 'cat' => 'colour', 'img' => 'red.png',
             'w1' => 'Blue',  'w1img' => 'blue.png',  'w2' => 'Yellow', 'w2img' => 'yellow.png'],
            ['w' => 'Green',  'type' => 'vocab', 'cat' => 'colour', 'img' => 'green.png',
             'w1' => 'Blue',  'w1img' => 'blue.png',  'w2' => 'Orange', 'w2img' => 'orange.png'],
            ['w' => 'Orange', 'type' => 'vocab', 'cat' => 'colour', 'img' => 'orange.png',
             'w1' => 'Red',   'w1img' => 'red.png',   'w2' => 'Brown',  'w2img' => 'brown.png'],
            ['w' => 'Yellow', 'type' => 'vocab', 'cat' => 'colour', 'img' => 'yellow.png',
             'w1' => 'Green', 'w1img' => 'green.png', 'w2' => 'Orange', 'w2img' => 'orange.png'],
            ['w' => 'Brown',  'type' => 'vocab', 'cat' => 'colour', 'img' => 'brown.png',
             'w1' => 'Red',   'w1img' => 'red.png',   'w2' => 'Blue',   'w2img' => 'blue.png'],

            // Numbers 1-5 (page 6)
            ['w' => 'One',   'type' => 'vocab', 'cat' => 'number_low', 'img' => 'one.png',
             'w1' => 'Two',   'w1img' => 'two.png',   'w2' => 'Three', 'w2img' => 'three.png'],
            ['w' => 'Two',   'type' => 'vocab', 'cat' => 'number_low', 'img' => 'two.png',
             'w1' => 'One',   'w1img' => 'one.png',   'w2' => 'Four',  'w2img' => 'four.png'],
            ['w' => 'Three', 'type' => 'vocab', 'cat' => 'number_low', 'img' => 'three.png',
             'w1' => 'Two',   'w1img' => 'two.png',   'w2' => 'Five',  'w2img' => 'five.png'],
            ['w' => 'Four',  'type' => 'vocab', 'cat' => 'number_low', 'img' => 'four.png',
             'w1' => 'Three', 'w1img' => 'three.png', 'w2' => 'Five',  'w2img' => 'five.png'],
            ['w' => 'Five',  'type' => 'vocab', 'cat' => 'number_low', 'img' => 'five.png',
             'w1' => 'Four',  'w1img' => 'four.png',  'w2' => 'Three', 'w2img' => 'three.png'],

            // Numbers 6-10 (page 9)
            ['w' => 'Six',   'type' => 'vocab', 'cat' => 'number_high', 'img' => 'six.png',
             'w1' => 'Seven', 'w1img' => 'seven.png', 'w2' => 'Eight', 'w2img' => 'eight.png'],
            ['w' => 'Seven', 'type' => 'vocab', 'cat' => 'number_high', 'img' => 'seven.png',
             'w1' => 'Six',   'w1img' => 'six.png',   'w2' => 'Eight', 'w2img' => 'eight.png'],
            ['w' => 'Eight', 'type' => 'vocab', 'cat' => 'number_high', 'img' => 'eight.png',
             'w1' => 'Seven', 'w1img' => 'seven.png', 'w2' => 'Nine',  'w2img' => 'nine.png'],
            ['w' => 'Nine',  'type' => 'vocab', 'cat' => 'number_high', 'img' => 'nine.png',
             'w1' => 'Eight', 'w1img' => 'eight.png', 'w2' => 'Ten',   'w2img' => 'ten.png'],
            ['w' => 'Ten',   'type' => 'vocab', 'cat' => 'number_high', 'img' => 'ten.png',
             'w1' => 'Nine',  'w1img' => 'nine.png',  'w2' => 'Eight', 'w2img' => 'eight.png'],
        ];

        $this->createWordsForUnit($unitId, $folder, $words);

        $lessons = [
            [
                'num' => 1, 'title' => 'Greetings', 'type' => 'intro',
                'page' => 4, 'audio_code' => 'AB4_2',
                'conf' => [
                    'mode'        => 'intro',
                    'word_filter' => ['Hello', 'Hi', 'Good morning'],
                    'prompt'      => 'Listen, point and say.',
                    'audio_tracks' => ['AB4', 'AB4_2'],
                ],
            ],
            [
                'num' => 2, 'title' => 'Colours', 'type' => 'vocab-game',
                'page' => 5, 'audio_code' => 'AB5',
                'conf' => [
                    'mode'              => 'vocab-game',
                    'category'          => 'colour',
                    'rounds'            => 6,
                    'question_style'    => 'word-to-image',
                    'options_per_round' => 3,
                    'decoy_pool'        => 'same_category',
                    'prompt'            => 'Find the colour!',
                ],
            ],
            [
                'num' => 3, 'title' => 'Numbers 1-5', 'type' => 'vocab-game',
                'page' => 6, 'audio_code' => 'AB6',
                'conf' => [
                    'mode'              => 'vocab-game',
                    'category'          => 'number_low',
                    'rounds'            => 5,
                    'question_style'    => 'word-to-image',
                    'options_per_round' => 3,
                    'decoy_pool'        => 'same_category',
                    'prompt'            => 'Listen and count!',
                ],
            ],
            [
                'num' => 4, 'title' => 'Story: Find Ann', 'type' => 'intro',
                'page' => 7, 'audio_code' => 'AB7',
                'conf' => [
                    'mode'         => 'intro',
                    'word_filter'  => ['Red', 'Blue', 'Green', 'Yellow', 'One', 'Two', 'Three'],
                    'prompt'       => 'Listen and read the story.',
                    'audio_tracks' => ['AB7', 'AB7_2'],
                ],
            ],
            [
                'num' => 5, 'title' => 'Numbers 6-10', 'type' => 'vocab-game',
                'page' => 9, 'audio_code' => 'AB9',
                'conf' => [
                    'mode'              => 'vocab-game',
                    'category'          => 'number_high',
                    'rounds'            => 5,
                    'question_style'    => 'word-to-image',
                    'options_per_round' => 3,
                    'decoy_pool'        => 'same_category',
                    'prompt'            => 'Listen and count!',
                ],
            ],
        ];

        $this->createLessonsForUnit($unitId, $lessons);
    }

    // ────────────────────────────────────────────
    // U1: Family and friends (pages 10-20)
    // ────────────────────────────────────────────

    protected function seedFamilyAndFriends(int $unitId): void
    {
        $folder = 'family';

        $words = [
            // Family intro (page 10)
            ['w' => 'Girl',    'type' => 'vocab', 'cat' => 'family_basic', 'img' => 'girl.png',
             'w1' => 'Boy',    'w1img' => 'boy.png',    'w2' => 'Friend', 'w2img' => 'friend.png'],
            ['w' => 'Boy',     'type' => 'vocab', 'cat' => 'family_basic', 'img' => 'boy.png',
             'w1' => 'Girl',   'w1img' => 'girl.png',   'w2' => 'Friend', 'w2img' => 'friend.png'],
            ['w' => 'Cat',     'type' => 'vocab', 'cat' => 'family_basic', 'img' => 'cat.png',
             'w1' => 'Friend', 'w1img' => 'friend.png', 'w2' => 'Boy',    'w2img' => 'boy.png'],
            ['w' => 'Friend',  'type' => 'vocab', 'cat' => 'family_basic', 'img' => 'friend.png',
             'w1' => 'Boy',    'w1img' => 'boy.png',    'w2' => 'Girl',   'w2img' => 'girl.png'],

            // Family members (page 12)
            ['w' => 'Mum',     'type' => 'vocab', 'cat' => 'family_members', 'img' => 'mum.png',
             'w1' => 'Dad',    'w1img' => 'dad.png',    'w2' => 'Sister',  'w2img' => 'sister.png'],
            ['w' => 'Dad',     'type' => 'vocab', 'cat' => 'family_members', 'img' => 'dad.png',
             'w1' => 'Mum',    'w1img' => 'mum.png',    'w2' => 'Brother', 'w2img' => 'brother.png'],
            ['w' => 'Brother', 'type' => 'vocab', 'cat' => 'family_members', 'img' => 'brother.png',
             'w1' => 'Sister', 'w1img' => 'sister.png', 'w2' => 'Dad',     'w2img' => 'dad.png'],
            ['w' => 'Sister',  'type' => 'vocab', 'cat' => 'family_members', 'img' => 'sister.png',
             'w1' => 'Brother','w1img' => 'brother.png','w2' => 'Mum',     'w2img' => 'mum.png'],

            // Phonics Ss (page 14)
            ['w' => 'Sing',    'type' => 'phonics', 'cat' => 's', 'img' => 'sing.png',
             'w1' => 'Sun',    'w1img' => 'sun.png',    'w2' => 'Sister', 'w2img' => 'sister.png'],
            ['w' => 'Six',     'type' => 'phonics', 'cat' => 's', 'img' => 'six.png',
             'w1' => 'Sun',    'w1img' => 'sun.png',    'w2' => 'Sing',   'w2img' => 'sing.png'],
            ['w' => 'Sun',     'type' => 'phonics', 'cat' => 's', 'img' => 'sun.png',
             'w1' => 'Sing',   'w1img' => 'sing.png',   'w2' => 'Six',    'w2img' => 'six.png'],

            // Phonics Dd (page 14)
            ['w' => 'Dig',     'type' => 'phonics', 'cat' => 'd', 'img' => 'dig.png',
             'w1' => 'Duck',   'w1img' => 'duck.png',   'w2' => 'Doll', 'w2img' => 'doll.png'],
            ['w' => 'Doll',    'type' => 'phonics', 'cat' => 'd', 'img' => 'doll.png',
             'w1' => 'Duck',   'w1img' => 'duck.png',   'w2' => 'Dig',  'w2img' => 'dig.png'],
            ['w' => 'Duck',    'type' => 'phonics', 'cat' => 'd', 'img' => 'duck.png',
             'w1' => 'Doll',   'w1img' => 'doll.png',   'w2' => 'Dig',  'w2img' => 'dig.png'],

            // Phonics Cc (page 16)
            ['w' => 'Cut',  'type' => 'phonics', 'cat' => 'c', 'img' => 'cut.png',
             'w1' => 'Cup', 'w1img' => 'cup.png', 'w2' => 'Cap', 'w2img' => 'cap.png'],
            ['w' => 'Cap',  'type' => 'phonics', 'cat' => 'c', 'img' => 'cap.png',
             'w1' => 'Cup', 'w1img' => 'cup.png', 'w2' => 'Cut', 'w2img' => 'cut.png'],
            ['w' => 'Cup',  'type' => 'phonics', 'cat' => 'c', 'img' => 'cup.png',
             'w1' => 'Cap', 'w1img' => 'cap.png', 'w2' => 'Cut', 'w2img' => 'cut.png'],

            // Phonics Aa (page 16)
            ['w' => 'Apple',     'type' => 'phonics', 'cat' => 'a', 'img' => 'apple.png',
             'w1' => 'Ant',      'w1img' => 'ant.png',       'w2' => 'Alligator', 'w2img' => 'alligator.png'],
            ['w' => 'Alligator', 'type' => 'phonics', 'cat' => 'a', 'img' => 'alligator.png',
             'w1' => 'Ant',      'w1img' => 'ant.png',       'w2' => 'Apple',     'w2img' => 'apple.png'],
            ['w' => 'Ant',       'type' => 'phonics', 'cat' => 'a', 'img' => 'ant.png',
             'w1' => 'Apple',    'w1img' => 'apple.png',     'w2' => 'Alligator', 'w2img' => 'alligator.png'],
        ];

        $this->createWordsForUnit($unitId, $folder, $words);

        $lessons = [
            [
                'num' => 1, 'title' => 'Meet my family', 'type' => 'intro',
                'page' => 10, 'audio_code' => 'AB10',
                'conf' => [
                    'mode'         => 'intro',
                    'word_filter'  => ['Girl', 'Boy', 'Cat', 'Friend'],
                    'prompt'       => 'Listen, point and say.',
                    'audio_tracks' => ['AB10', 'AB10_2'],
                ],
            ],
            [
                'num' => 2, 'title' => 'Girl or boy?', 'type' => 'vocab-game',
                'page' => 11, 'audio_code' => 'AB11',
                'conf' => [
                    'mode'              => 'vocab-game',
                    'category'          => 'family_basic',
                    'rounds'            => 4,
                    'question_style'    => 'word-to-image',
                    'options_per_round' => 3,
                    'decoy_pool'        => 'same_category',
                    'prompt'            => 'Listen and point!',
                ],
            ],
            [
                'num' => 3, 'title' => 'Family members', 'type' => 'intro',
                'page' => 12, 'audio_code' => 'AB12',
                'conf' => [
                    'mode'         => 'intro',
                    'word_filter'  => ['Mum', 'Dad', 'Brother', 'Sister'],
                    'prompt'       => 'Listen, point and say.',
                    'audio_tracks' => ['AB12', 'AB12_2'],
                ],
            ],
            [
                'num' => 4, 'title' => 'This is my...', 'type' => 'vocab-game',
                'page' => 13, 'audio_code' => 'AB13',
                'conf' => [
                    'mode'              => 'vocab-game',
                    'category'          => 'family_members',
                    'rounds'            => 4,
                    'question_style'    => 'word-to-image',
                    'options_per_round' => 3,
                    'decoy_pool'        => 'same_category',
                    'prompt'            => 'This is my...',
                ],
            ],
            [
                'num' => 5, 'title' => 'Phonics: Ss and Dd', 'type' => 'phonics-game',
                'page' => 14, 'audio_code' => 'AB14',
                'conf' => [
                    'mode'              => 'phonics-game',
                    'phonics_sets'      => ['s', 'd'],
                    'rounds'            => 6,
                    'question_style'    => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt'            => 'Listen and choose!',
                ],
            ],
            [
                'num' => 6, 'title' => 'Phonics: Cc and Aa', 'type' => 'phonics-game',
                'page' => 16, 'audio_code' => null, // no audio on NCCD for page 16
                'conf' => [
                    'mode'              => 'phonics-game',
                    'phonics_sets'      => ['c', 'a'],
                    'rounds'            => 6,
                    'question_style'    => 'sound-to-word',
                    'options_per_round' => 3,
                    'prompt'            => 'Listen and choose!',
                ],
            ],
            [
                'num' => 7, 'title' => "Story: Let's play!", 'type' => 'intro',
                'page' => 18, 'audio_code' => 'AB18',
                'conf' => [
                    'mode'         => 'intro',
                    'word_filter'  => ['Cat', 'Doll'],
                    'prompt'       => 'Listen and read the story.',
                    'audio_tracks' => ['AB18', 'AB18_2'],
                ],
            ],
            [
                'num' => 8, 'title' => 'Revision: Family and numbers', 'type' => 'review',
                'page' => 19, 'audio_code' => 'AB19_2',
                'conf' => [
                    'mode'       => 'review',
                    'categories' => ['family_basic', 'family_members'],
                    'rounds'     => 8,
                    'styles'     => ['word-to-image', 'image-to-word'],
                    'prompt'     => 'Count and choose!',
                ],
            ],
            [
                'num' => 9, 'title' => 'Unit review', 'type' => 'review',
                'page' => 20, 'audio_code' => 'AB20',
                'conf' => [
                    'mode'       => 'review',
                    'categories' => ['family_basic', 'family_members', 's', 'd', 'c', 'a'],
                    'rounds'     => 10,
                    'styles'     => ['word-to-image', 'image-to-word'],
                    'prompt'     => 'Listen, write and colour.',
                ],
            ],
        ];

        $this->createLessonsForUnit($unitId, $lessons);
    }

    // ────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────

    protected function upsertUnit(array $data): Unit
    {
        return Unit::updateOrCreate(
            ['code' => $data['code']],
            [
                'unit_number'   => $data['unit_number'],
                'title'         => $data['title'],
                'description'   => $data['description'],
                'image_path'    => $data['image_path'],
                'color_key'     => $data['color_key'],
                'lessons_count' => 0, // populated by createLessonsForUnit
            ]
        );
    }

    protected function createWordsForUnit(int $unitId, string $folder, array $items): void
    {
        foreach ($items as $item) {
            $wrong = null;
            if (isset($item['w1'], $item['w2'])) {
                $wrong = [
                    ['word' => $item['w1'], 'image_path' => "assets/lessons/{$folder}/{$item['w1img']}"],
                    ['word' => $item['w2'], 'image_path' => "assets/lessons/{$folder}/{$item['w2img']}"],
                ];
            }

            $audioSlug = strtolower(str_replace(' ', '', $item['w']));

            Word::updateOrCreate(
                ['unit_id' => $unitId, 'word' => $item['w']],
                [
                    'type'          => $item['type'] ?? 'vocab',
                    'category'      => $item['cat'] ?? null,
                    'image_path'    => isset($item['img']) ? "assets/lessons/{$folder}/{$item['img']}" : null,
                    'audio_path'    => "assets/audio/words/{$folder}/{$audioSlug}.mp3",
                    'wrong_options' => $wrong,
                ]
            );
        }
    }

    protected function createLessonsForUnit(int $unitId, array $lessons): void
    {
        foreach ($lessons as $l) {
            $trackId = null;
            if (! empty($l['audio_code'])) {
                $trackId = AudioTrack::where('code', $l['audio_code'])->value('id');
            }

            Lesson::updateOrCreate(
                ['unit_id' => $unitId, 'lesson_number' => $l['num']],
                [
                    'title'          => $l['title'],
                    'type'           => $l['type'],
                    'page_number'    => $l['page'] ?? null,
                    'config'         => $l['conf'],
                    'audio_track_id' => $trackId,
                ]
            );
        }

        Unit::where('id', $unitId)->update(['lessons_count' => count($lessons)]);
    }
}
