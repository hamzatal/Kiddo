<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;
use App\Models\Word;
use App\Models\Lesson;

class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        // === 1) إنشاء الوحدات الخمس الأساسية ===
        $unitsData = [
            'U1' => [
                'unit_number'   => 1,
                'title'         => 'Welcome / Hello',
                'description'   => 'Greetings, colours and numbers 1–10.',
                'image_path'    => 'assets/lessons/welcome/hut.png',
                'color_key'     => 'purple',
            ],
            'U2' => [
                'unit_number'   => 2,
                'title'         => 'Family and friends',
                'description'   => 'Family members, pets and basic questions.',
                'image_path'    => 'assets/lessons/family/treehouse.png',
                'color_key'     => 'green',
            ],
            'U3' => [
                'unit_number'   => 3,
                'title'         => 'My school bag',
                'description'   => 'School items and using I’ve got / I haven’t got.',
                'image_path'    => 'assets/lessons/schoolbag/bag.png',
                'color_key'     => 'blue',
            ],
            'U4' => [
                'unit_number'   => 4,
                'title'         => 'Our classroom',
                'description'   => 'Things in the classroom and where they are.',
                'image_path'    => 'assets/lessons/classroom/desk.png',
                'color_key'     => 'orange',
            ],
            'U5' => [
                'unit_number'   => 5,
                'title'         => 'My favourite toy',
                'description'   => 'Toys, colours and feelings.',
                'image_path'    => 'assets/lessons/toy/toy.png',
                'color_key'     => 'pink',
            ],
        ];

        $unitIds = [];

        foreach ($unitsData as $code => $data) {
            $unit = Unit::updateOrCreate(
                ['code' => $code],
                [
                    'unit_number'   => $data['unit_number'],
                    'title'         => $data['title'],
                    'code'          => $code,
                    'description'   => $data['description'],
                    'image_path'    => $data['image_path'],
                    'color_key'     => $data['color_key'],
                    'lessons_count' => 0,
                ]
            );

            $unitIds[$code] = $unit->id;
        }

        // === 2) كلمات كل وحدة ===

        // ---------- Unit 1: Welcome / Hello ----------
        $this->seedWelcomeUnit($unitIds['U1']);

        // ---------- Unit 2: Family and friends ----------
        $this->seedFamilyUnit($unitIds['U2']);

        // ---------- Unit 3: My school bag ----------
        $this->seedSchoolBagUnit($unitIds['U3']);

        // ---------- Unit 4: Our classroom ----------
        $this->seedClassroomUnit($unitIds['U4']);

        // ---------- Unit 5: My favourite toy ----------
        $this->seedToyUnit($unitIds['U5']);
    }

    // ================== UNIT 1: WELCOME / HELLO ==================

    protected function seedWelcomeUnit(int $unitId): void
    {
        $folder = 'welcome';

        $words = [
            // Greetings
            [
                'w'  => 'Hello',
                'type' => 'vocab',
                'cat'  => 'greeting',
                'img'  => 'hello.png',
                'audio' => 'hello',
                'w1'   => 'Hi',
                'w1img' => 'hi.png',
                'w2'   => 'Good morning',
                'w2img' => 'goodmorning.png',
            ],
            [
                'w'  => 'Hi',
                'type' => 'vocab',
                'cat'  => 'greeting',
                'img'  => 'hi.png',
                'audio' => 'hi',
                'w1'   => 'Hello',
                'w1img' => 'hello.png',
                'w2'   => 'Good morning',
                'w2img' => 'goodmorning.png',
            ],
            [
                'w'  => 'Good morning',
                'type' => 'vocab',
                'cat'  => 'greeting',
                'img'  => 'goodmorning.png',
                'audio' => 'goodmorning',
                'w1'   => 'Hello',
                'w1img' => 'hello.png',
                'w2'   => 'Hi',
                'w2img' => 'hi.png',
            ],

            // Colours
            ['w' => 'Blue',   'type' => 'vocab', 'cat' => 'colour', 'img' => 'blue.png',   'audio' => 'blue',   'w1' => 'Red',   'w1img' => 'red.png',   'w2' => 'Green', 'w2img' => 'green.png'],
            ['w' => 'Red',    'type' => 'vocab', 'cat' => 'colour', 'img' => 'red.png',    'audio' => 'red',    'w1' => 'Blue',  'w1img' => 'blue.png',  'w2' => 'Yellow', 'w2img' => 'yellow.png'],
            ['w' => 'Green',  'type' => 'vocab', 'cat' => 'colour', 'img' => 'green.png',  'audio' => 'green',  'w1' => 'Blue',  'w1img' => 'blue.png',  'w2' => 'Orange', 'w2img' => 'orange.png'],
            ['w' => 'Orange', 'type' => 'vocab', 'cat' => 'colour', 'img' => 'orange.png', 'audio' => 'orange', 'w1' => 'Red',   'w1img' => 'red.png',   'w2' => 'Brown', 'w2img' => 'brown.png'],
            ['w' => 'Yellow', 'type' => 'vocab', 'cat' => 'colour', 'img' => 'yellow.png', 'audio' => 'yellow', 'w1' => 'Green', 'w1img' => 'green.png', 'w2' => 'Orange', 'w2img' => 'orange.png'],
            ['w' => 'Brown',  'type' => 'vocab', 'cat' => 'colour', 'img' => 'brown.png',  'audio' => 'brown',  'w1' => 'Red',   'w1img' => 'red.png',   'w2' => 'Blue',  'w2img' => 'blue.png'],

            // Numbers 1–10
            ['w' => 'One',   'type' => 'vocab', 'cat' => 'number', 'img' => 'one.png',   'audio' => 'one',   'w1' => 'Two',   'w1img' => 'two.png',   'w2' => 'Three', 'w2img' => 'three.png'],
            ['w' => 'Two',   'type' => 'vocab', 'cat' => 'number', 'img' => 'two.png',   'audio' => 'two',   'w1' => 'One',   'w1img' => 'one.png',   'w2' => 'Four',  'w2img' => 'four.png'],
            ['w' => 'Three', 'type' => 'vocab', 'cat' => 'number', 'img' => 'three.png', 'audio' => 'three', 'w1' => 'Two',   'w1img' => 'two.png',   'w2' => 'Five',  'w2img' => 'five.png'],
            ['w' => 'Four',  'type' => 'vocab', 'cat' => 'number', 'img' => 'four.png',  'audio' => 'four',  'w1' => 'Three', 'w1img' => 'three.png', 'w2' => 'Six',   'w2img' => 'six.png'],
            ['w' => 'Five',  'type' => 'vocab', 'cat' => 'number', 'img' => 'five.png',  'audio' => 'five',  'w1' => 'Four',  'w1img' => 'four.png',  'w2' => 'Seven', 'w2img' => 'seven.png'],
            ['w' => 'Six',   'type' => 'vocab', 'cat' => 'number', 'img' => 'six.png',   'audio' => 'six',   'w1' => 'Five',  'w1img' => 'five.png',  'w2' => 'Eight', 'w2img' => 'eight.png'],
            ['w' => 'Seven', 'type' => 'vocab', 'cat' => 'number', 'img' => 'seven.png', 'audio' => 'seven', 'w1' => 'Six',   'w1img' => 'six.png',   'w2' => 'Nine',  'w2img' => 'nine.png'],
            ['w' => 'Eight', 'type' => 'vocab', 'cat' => 'number', 'img' => 'eight.png', 'audio' => 'eight', 'w1' => 'Seven', 'w1img' => 'seven.png', 'w2' => 'Ten',   'w2img' => 'ten.png'],
            ['w' => 'Nine',  'type' => 'vocab', 'cat' => 'number', 'img' => 'nine.png',  'audio' => 'nine',  'w1' => 'Eight', 'w1img' => 'eight.png', 'w2' => 'Ten',   'w2img' => 'ten.png'],
            ['w' => 'Ten',   'type' => 'vocab', 'cat' => 'number', 'img' => 'ten.png',   'audio' => 'ten',   'w1' => 'Nine',  'w1img' => 'nine.png',  'w2' => 'Eight', 'w2img' => 'eight.png'],
        ];

        $this->createWordsForUnit($unitId, $folder, $words);

        // دروس الوحدة 1
        $lessons = [
            [
                'num'   => 1,
                'title' => 'Greetings',
                'type'  => 'intro',
                'conf'  => [
                    'component'   => 'U1GreetingsIntro',
                    'word_filter' => ['Hello', 'Hi', 'Good morning'],
                    'audio_track' => [
                        'code'    => 'U1_P6_1_1',
                        'url'     => 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p06.1.mp3',
                        'segment' => ['start' => 0, 'end' => 15],
                    ],
                ],
            ],
            [
                'num'   => 2,
                'title' => 'Colours',
                'type'  => 'vocab-game',
                'conf'  => [
                    'component' => 'U1ColoursGame',
                    'category'  => 'colour',
                    'audio_track' => [
                        'code' => 'U1_P7_1_2',
                        'url'  => 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p07.2.mp3',
                    ],
                ],
            ],
            [
                'num'   => 3,
                'title' => 'Numbers 1–10',
                'type'  => 'vocab-game',
                'conf'  => [
                    'component' => 'U1NumbersGame',
                    'category'  => 'number',
                    'audio_track' => [
                        'code' => 'U1_P7_1_3',
                        'url'  => 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p07.3.mp3',
                    ],
                ],
            ],
            [
                'num'   => 4,
                'title' => 'Review: colours and numbers',
                'type'  => 'review',
                'conf'  => [
                    'component' => 'U1ReviewMix',
                    'categories' => ['colour', 'number'],
                ],
            ],
        ];

        $this->createLessonsForUnit($unitId, $lessons);
    }

    // ================== UNIT 2: FAMILY AND FRIENDS ==================

    protected function seedFamilyUnit(int $unitId): void
    {
        $folder = 'family';

        $words = [
            // Family members
            ['w' => 'Boy',     'type' => 'vocab', 'cat' => 'family', 'img' => 'boy.png',     'audio' => 'boy',     'w1' => 'Girl',   'w1img' => 'girl.png',   'w2' => 'Friend', 'w2img' => 'friend.png'],
            ['w' => 'Girl',    'type' => 'vocab', 'cat' => 'family', 'img' => 'girl.png',    'audio' => 'girl',    'w1' => 'Boy',    'w1img' => 'boy.png',    'w2' => 'Friend', 'w2img' => 'friend.png'],
            ['w' => 'Cat',     'type' => 'vocab', 'cat' => 'pet',    'img' => 'cat.png',     'audio' => 'cat',     'w1' => 'Boy',    'w1img' => 'boy.png',    'w2' => 'Girl',  'w2img' => 'girl.png'],
            ['w' => 'Friend',  'type' => 'vocab', 'cat' => 'family', 'img' => 'friend.png',  'audio' => 'friend',  'w1' => 'Boy',    'w1img' => 'boy.png',    'w2' => 'Sister', 'w2img' => 'sister.png'],
            ['w' => 'Mum',     'type' => 'vocab', 'cat' => 'family', 'img' => 'mum.png',     'audio' => 'mum',     'w1' => 'Dad',    'w1img' => 'dad.png',    'w2' => 'Sister', 'w2img' => 'sister.png'],
            ['w' => 'Dad',     'type' => 'vocab', 'cat' => 'family', 'img' => 'dad.png',     'audio' => 'dad',     'w1' => 'Mum',    'w1img' => 'mum.png',    'w2' => 'Brother', 'w2img' => 'brother.png'],
            ['w' => 'Brother', 'type' => 'vocab', 'cat' => 'family', 'img' => 'brother.png', 'audio' => 'brother', 'w1' => 'Sister', 'w1img' => 'sister.png', 'w2' => 'Dad',   'w2img' => 'dad.png'],
            ['w' => 'Sister',  'type' => 'vocab', 'cat' => 'family', 'img' => 'sister.png',  'audio' => 'sister',  'w1' => 'Brother', 'w1img' => 'brother.png', 'w2' => 'Mum',   'w2img' => 'mum.png'],

            // Phonics Ss
            ['w' => 'Sing',   'type' => 'phonics', 'cat' => 's', 'img' => 'sing.png',   'audio' => 'sing',   'w1' => 'Sun',   'w1img' => 'sun.png',   'w2' => 'Six',    'w2img' => 'sixphonics.png'],
            ['w' => 'Six',    'type' => 'phonics', 'cat' => 's', 'img' => 'sixphonics.png', 'audio' => 'six', 'w1' => 'Sun',   'w1img' => 'sun.png',   'w2' => 'Sister', 'w2img' => 'sisterphonics.png'],
            ['w' => 'Sister', 'type' => 'phonics', 'cat' => 's', 'img' => 'sisterphonics.png', 'audio' => 'sister', 'w1' => 'Sing', 'w1img' => 'sing.png', 'w2' => 'Sun', 'w2img' => 'sun.png'],
            ['w' => 'Sun',    'type' => 'phonics', 'cat' => 's', 'img' => 'sun.png',   'audio' => 'sun',    'w1' => 'Six',   'w1img' => 'sixphonics.png', 'w2' => 'Sing', 'w2img' => 'sing.png'],

            // Phonics Dd
            ['w' => 'Dig',  'type' => 'phonics', 'cat' => 'd', 'img' => 'dig.png',   'audio' => 'dig',   'w1' => 'Duck', 'w1img' => 'duck.png', 'w2' => 'Doll', 'w2img' => 'doll.png'],
            ['w' => 'Dad',  'type' => 'phonics', 'cat' => 'd', 'img' => 'dadphonics.png', 'audio' => 'dad', 'w1' => 'Duck', 'w1img' => 'duck.png', 'w2' => 'Doll', 'w2img' => 'doll.png'],
            ['w' => 'Doll', 'type' => 'phonics', 'cat' => 'd', 'img' => 'doll.png',  'audio' => 'doll',  'w1' => 'Duck', 'w1img' => 'duck.png', 'w2' => 'Dig', 'w2img' => 'dig.png'],
            ['w' => 'Duck', 'type' => 'phonics', 'cat' => 'd', 'img' => 'duck.png',  'audio' => 'duck',  'w1' => 'Doll', 'w1img' => 'doll.png', 'w2' => 'Dad', 'w2img' => 'dadphonics.png'],

            // Phonics Cc
            ['w' => 'Cut', 'type' => 'phonics', 'cat' => 'c', 'img' => 'cut.png', 'audio' => 'cut', 'w1' => 'Cup', 'w1img' => 'cup.png', 'w2' => 'Cap', 'w2img' => 'cap.png'],
            ['w' => 'Cap', 'type' => 'phonics', 'cat' => 'c', 'img' => 'cap.png', 'audio' => 'cap', 'w1' => 'Cup', 'w1img' => 'cup.png', 'w2' => 'Cat', 'w2img' => 'catphonics.png'],
            ['w' => 'Cat', 'type' => 'phonics', 'cat' => 'c', 'img' => 'catphonics.png', 'audio' => 'cat', 'w1' => 'Cup', 'w1img' => 'cup.png', 'w2' => 'Cut', 'w2img' => 'cut.png'],
            ['w' => 'Cup', 'type' => 'phonics', 'cat' => 'c', 'img' => 'cup.png', 'audio' => 'cup', 'w1' => 'Cap', 'w1img' => 'cap.png', 'w2' => 'Cut', 'w2img' => 'cut.png'],

            // Phonics Aa
            ['w' => 'Apple',     'type' => 'phonics', 'cat' => 'a', 'img' => 'apple.png',     'audio' => 'apple',     'w1' => 'Ant', 'w1img' => 'ant.png', 'w2' => 'Alligator', 'w2img' => 'alligator.png'],
            ['w' => 'Alligator', 'type' => 'phonics', 'cat' => 'a', 'img' => 'alligator.png', 'audio' => 'alligator', 'w1' => 'Ant', 'w1img' => 'ant.png', 'w2' => 'Apple', 'w2img' => 'apple.png'],
            ['w' => 'Ann',       'type' => 'phonics', 'cat' => 'a', 'img' => 'ann.png',       'audio' => 'ann',       'w1' => 'Ant', 'w1img' => 'ant.png', 'w2' => 'Apple', 'w2img' => 'apple.png'],
            ['w' => 'Ant',       'type' => 'phonics', 'cat' => 'a', 'img' => 'ant.png',       'audio' => 'ant',       'w1' => 'Apple', 'w1img' => 'apple.png', 'w2' => 'Ann', 'w2img' => 'ann.png'],
        ];

        $this->createWordsForUnit($unitId, $folder, $words);

        $lessons = [
            [
                'num'   => 1,
                'title' => 'Meet my family',
                'type'  => 'intro',
                'conf'  => [
                    'component'   => 'U2FamilyIntro',
                    'word_filter' => ['Mum', 'Dad', 'Brother', 'Sister', 'Boy', 'Girl', 'Friend', 'Cat'],
                    'audio_track' => [
                        'code' => 'U2_P8_1_1',
                        'url'  => 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p08.1.mp3',
                    ],
                ],
            ],
            [
                'num'   => 2,
                'title' => 'Who\'s this?',
                'type'  => 'vocab-game',
                'conf'  => [
                    'component'   => 'U2WhoIsThisGame',
                    'category'    => 'family',
                ],
            ],
            [
                'num'   => 3,
                'title' => 'Phonics: Ss and Dd',
                'type'  => 'phonics-game',
                'conf'  => [
                    'component'   => 'U2PhonicsSDGame',
                    'phonics_sets' => ['s', 'd'],
                ],
            ],
            [
                'num'   => 4,
                'title' => 'Phonics: Cc and Aa',
                'type'  => 'phonics-game',
                'conf'  => [
                    'component'   => 'U2PhonicsCAGame',
                    'phonics_sets' => ['c', 'a'],
                ],
            ],
            [
                'num'   => 5,
                'title' => 'Family review',
                'type'  => 'review',
                'conf'  => [
                    'component'   => 'U2FamilyReview',
                    'categories'  => ['family', 'pet'],
                ],
            ],
        ];

        $this->createLessonsForUnit($unitId, $lessons);
    }

    // ================== UNIT 3: MY SCHOOL BAG ==================

    protected function seedSchoolBagUnit(int $unitId): void
    {
        $folder = 'schoolbag';

        $words = [
            // Classroom objects
            ['w' => 'Bag',        'type' => 'vocab', 'cat' => 'object', 'img' => 'bag.png',        'audio' => 'bag',        'w1' => 'Book',   'w1img' => 'book.png',   'w2' => 'Pencil', 'w2img' => 'pencil.png'],
            ['w' => 'Book',       'type' => 'vocab', 'cat' => 'object', 'img' => 'book.png',       'audio' => 'book',       'w1' => 'Bag',    'w1img' => 'bag.png',    'w2' => 'Ruler', 'w2img' => 'ruler.png'],
            ['w' => 'Crayon',     'type' => 'vocab', 'cat' => 'object', 'img' => 'crayon.png',     'audio' => 'crayon',     'w1' => 'Pen',    'w1img' => 'pen.png',    'w2' => 'Pencil', 'w2img' => 'pencil.png'],
            ['w' => 'Eraser',     'type' => 'vocab', 'cat' => 'object', 'img' => 'eraser.png',     'audio' => 'eraser',     'w1' => 'Ruler',  'w1img' => 'ruler.png',  'w2' => 'Bag',   'w2img' => 'bag.png'],
            ['w' => 'Pen',        'type' => 'vocab', 'cat' => 'object', 'img' => 'pen.png',        'audio' => 'pen',        'w1' => 'Pencil', 'w1img' => 'pencil.png', 'w2' => 'Crayon', 'w2img' => 'crayon.png'],
            ['w' => 'Pencil',     'type' => 'vocab', 'cat' => 'object', 'img' => 'pencil.png',     'audio' => 'pencil',     'w1' => 'Pen',    'w1img' => 'pen.png',    'w2' => 'Eraser', 'w2img' => 'eraser.png'],
            ['w' => 'Pencil case', 'type' => 'vocab', 'cat' => 'object', 'img' => 'pencilcase.png', 'audio' => 'pencilcase', 'w1' => 'Bag',    'w1img' => 'bag.png',    'w2' => 'Book',  'w2img' => 'book.png'],
            ['w' => 'Ruler',      'type' => 'vocab', 'cat' => 'object', 'img' => 'ruler.png',      'audio' => 'ruler',      'w1' => 'Pen',    'w1img' => 'pen.png',    'w2' => 'Crayon', 'w2img' => 'crayon.png'],

            // Phonics Pp / Rr
            ['w' => 'Pink',     'type' => 'phonics', 'cat' => 'p', 'img' => 'pink.png',     'audio' => 'pink',     'w1' => 'Red',   'w1img' => 'red.png',   'w2' => 'Rabbit', 'w2img' => 'rabbit.png'],
            ['w' => 'Rabbit',   'type' => 'phonics', 'cat' => 'p', 'img' => 'rabbit.png',   'audio' => 'rabbit',   'w1' => 'Run',   'w1img' => 'run.png',   'w2' => 'Red',   'w2img' => 'red.png'],
            ['w' => 'Red',      'type' => 'phonics', 'cat' => 'p', 'img' => 'red.png',      'audio' => 'red',      'w1' => 'Pink',  'w1img' => 'pink.png',  'w2' => 'Rabbit', 'w2img' => 'rabbit.png'],
            ['w' => 'Run',      'type' => 'phonics', 'cat' => 'p', 'img' => 'run.png',      'audio' => 'run',      'w1' => 'Ruler', 'w1img' => 'ruler.png', 'w2' => 'Rabbit', 'w2img' => 'rabbit.png'],
            ['w' => 'Ruler',    'type' => 'phonics', 'cat' => 'r', 'img' => 'ruler.png',    'audio' => 'ruler',    'w1' => 'Red',   'w1img' => 'red.png',   'w2' => 'Run',   'w2img' => 'run.png'],

            // Phonics Ee / Bb
            ['w' => 'Egg',      'type' => 'phonics', 'cat' => 'e', 'img' => 'egg.png',      'audio' => 'egg',      'w1' => 'Elbow',  'w1img' => 'elbow.png',  'w2' => 'Elephant', 'w2img' => 'elephant.png'],
            ['w' => 'Elbow',    'type' => 'phonics', 'cat' => 'e', 'img' => 'elbow.png',    'audio' => 'elbow',    'w1' => 'Egg',    'w1img' => 'egg.png',    'w2' => 'Elephant', 'w2img' => 'elephant.png'],
            ['w' => 'Elephant', 'type' => 'phonics', 'cat' => 'e', 'img' => 'elephant.png', 'audio' => 'elephant', 'w1' => 'Egg',    'w1img' => 'egg.png',    'w2' => 'Elbow', 'w2img' => 'elbow.png'],
            ['w' => 'Bag',      'type' => 'phonics', 'cat' => 'b', 'img' => 'bag.png',      'audio' => 'bag',      'w1' => 'Ball',   'w1img' => 'ball.png',   'w2' => 'Book',   'w2img' => 'book.png'],
            ['w' => 'Ball',     'type' => 'phonics', 'cat' => 'b', 'img' => 'ball.png',     'audio' => 'ball',     'w1' => 'Bag',    'w1img' => 'bag.png',    'w2' => 'Book',   'w2img' => 'book.png'],
            ['w' => 'Book',     'type' => 'phonics', 'cat' => 'b', 'img' => 'book.png',     'audio' => 'book',     'w1' => 'Bag',    'w1img' => 'bag.png',    'w2' => 'Ball',   'w2img' => 'ball.png'],
            ['w' => 'Boy',      'type' => 'phonics', 'cat' => 'b', 'img' => 'boy.png',      'audio' => 'boy',      'w1' => 'Bag',    'w1img' => 'bag.png',    'w2' => 'Ball',   'w2img' => 'ball.png'],
        ];

        $this->createWordsForUnit($unitId, $folder, $words);

        $lessons = [
            [
                'num'   => 1,
                'title' => 'What\'s in my bag?',
                'type'  => 'intro',
                'conf'  => [
                    'component'   => 'U3BagIntro',
                    'category'    => 'object',
                    'audio_track' => [
                        'code' => 'U3_P16_2_1',
                        'url'  => 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p16.1.mp3',
                    ],
                ],
            ],
            [
                'num'   => 2,
                'title' => 'I\'ve got...',
                'type'  => 'vocab-game',
                'conf'  => [
                    'component'   => 'U3IveGotGame',
                    'category'    => 'object',
                ],
            ],
            [
                'num'   => 3,
                'title' => 'Phonics: Pp and Rr',
                'type'  => 'phonics-game',
                'conf'  => [
                    'component'   => 'U3PhonicsPRGame',
                    'phonics_sets' => ['p', 'r'],
                ],
            ],
            [
                'num'   => 4,
                'title' => 'Phonics: Ee and Bb',
                'type'  => 'phonics-game',
                'conf'  => [
                    'component'   => 'U3PhonicsEBGame',
                    'phonics_sets' => ['e', 'b'],
                ],
            ],
            [
                'num'   => 5,
                'title' => 'Bag review',
                'type'  => 'review',
                'conf'  => [
                    'component'   => 'U3BagReview',
                    'category'    => 'object',
                ],
            ],
        ];

        $this->createLessonsForUnit($unitId, $lessons);
    }

    // ================== UNIT 4: OUR CLASSROOM ==================

    protected function seedClassroomUnit(int $unitId): void
    {
        $folder = 'classroom';

        $words = [
            // In the classroom
            ['w' => 'Chair',      'type' => 'vocab', 'cat' => 'classroom', 'img' => 'chair.png',      'audio' => 'chair',      'w1' => 'Desk',       'w1img' => 'desk.png',       'w2' => 'Floor', 'w2img' => 'floor.png'],
            ['w' => 'Desk',       'type' => 'vocab', 'cat' => 'classroom', 'img' => 'desk.png',       'audio' => 'desk',       'w1' => 'Chair',      'w1img' => 'chair.png',      'w2' => 'Wall', 'w2img' => 'wall.png'],
            ['w' => 'Door',       'type' => 'vocab', 'cat' => 'classroom', 'img' => 'door.png',       'audio' => 'door',       'w1' => 'Window',     'w1img' => 'window.png',     'w2' => 'Wall', 'w2img' => 'wall.png'],
            ['w' => 'Floor',      'type' => 'vocab', 'cat' => 'classroom', 'img' => 'floor.png',      'audio' => 'floor',      'w1' => 'Chair',      'w1img' => 'chair.png',      'w2' => 'Desk', 'w2img' => 'desk.png'],
            ['w' => 'Teacher',    'type' => 'vocab', 'cat' => 'classroom', 'img' => 'teacher.png',    'audio' => 'teacher',    'w1' => 'Wall',       'w1img' => 'wall.png',       'w2' => 'Door', 'w2img' => 'door.png'],
            ['w' => 'Wall',       'type' => 'vocab', 'cat' => 'classroom', 'img' => 'wall.png',       'audio' => 'wall',       'w1' => 'Whiteboard', 'w1img' => 'whiteboard.png', 'w2' => 'Window', 'w2img' => 'window.png'],
            ['w' => 'Whiteboard', 'type' => 'vocab', 'cat' => 'classroom', 'img' => 'whiteboard.png', 'audio' => 'whiteboard', 'w1' => 'Wall',       'w1img' => 'wall.png',       'w2' => 'Door', 'w2img' => 'door.png'],
            ['w' => 'Window',     'type' => 'vocab', 'cat' => 'classroom', 'img' => 'window.png',     'audio' => 'window',     'w1' => 'Door',       'w1img' => 'door.png',       'w2' => 'Wall', 'w2img' => 'wall.png'],

            // Phonics Tt / Mm
            ['w' => 'Teacher', 'type' => 'phonics', 'cat' => 't', 'img' => 'teacher.png', 'audio' => 'teacher', 'w1' => 'Teddy', 'w1img' => 'teddy.png', 'w2' => 'Ten', 'w2img' => 'ten.png'],
            ['w' => 'Teddy',   'type' => 'phonics', 'cat' => 't', 'img' => 'teddy.png',   'audio' => 'teddy',   'w1' => 'Teacher', 'w1img' => 'teacher.png', 'w2' => 'Ten', 'w2img' => 'ten.png'],
            ['w' => 'Ten',     'type' => 'phonics', 'cat' => 't', 'img' => 'ten.png',     'audio' => 'ten',     'w1' => 'Two',   'w1img' => 'two.png',   'w2' => 'Teacher', 'w2img' => 'teacher.png'],
            ['w' => 'Two',     'type' => 'phonics', 'cat' => 't', 'img' => 'two.png',     'audio' => 'two',     'w1' => 'Ten',   'w1img' => 'ten.png',   'w2' => 'Teacher', 'w2img' => 'teacher.png'],
            ['w' => 'Milk',    'type' => 'phonics', 'cat' => 'm', 'img' => 'milk.png',    'audio' => 'milk',    'w1' => 'Moon',  'w1img' => 'moon.png',  'w2' => 'Mouse', 'w2img' => 'mouse.png'],
            ['w' => 'Moon',    'type' => 'phonics', 'cat' => 'm', 'img' => 'moon.png',    'audio' => 'moon',    'w1' => 'Milk',  'w1img' => 'milk.png',  'w2' => 'Mouse', 'w2img' => 'mouse.png'],
            ['w' => 'Mouse',   'type' => 'phonics', 'cat' => 'm', 'img' => 'mouse.png',   'audio' => 'mouse',   'w1' => 'Milk',  'w1img' => 'milk.png',  'w2' => 'Moon', 'w2img' => 'moon.png'],
            ['w' => 'Mum',     'type' => 'phonics', 'cat' => 'm', 'img' => 'mum.png',     'audio' => 'mum',     'w1' => 'Milk',  'w1img' => 'milk.png',  'w2' => 'Moon', 'w2img' => 'moon.png'],

            // Phonics Ww / Ii
            ['w' => 'Wall',      'type' => 'phonics', 'cat' => 'w', 'img' => 'wall.png',      'audio' => 'wall',      'w1' => 'Water', 'w1img' => 'water.png', 'w2' => 'Wave', 'w2img' => 'wave.png'],
            ['w' => 'Water',     'type' => 'phonics', 'cat' => 'w', 'img' => 'water.png',     'audio' => 'water',     'w1' => 'Wall', 'w1img' => 'wall.png', 'w2' => 'Wave', 'w2img' => 'wave.png'],
            ['w' => 'Wave',      'type' => 'phonics', 'cat' => 'w', 'img' => 'wave.png',      'audio' => 'wave',      'w1' => 'Wall', 'w1img' => 'wall.png', 'w2' => 'Water', 'w2img' => 'water.png'],
            ['w' => 'Whiteboard', 'type' => 'phonics', 'cat' => 'w', 'img' => 'whiteboard.png', 'audio' => 'whiteboard', 'w1' => 'Wall', 'w1img' => 'wall.png', 'w2' => 'Water', 'w2img' => 'water.png'],
            ['w' => 'Igloo',     'type' => 'phonics', 'cat' => 'i', 'img' => 'igloo.png',     'audio' => 'igloo',     'w1' => 'In',   'w1img' => 'in.png',    'w2' => 'Ink', 'w2img' => 'ink.png'],
            ['w' => 'In',        'type' => 'phonics', 'cat' => 'i', 'img' => 'in.png',        'audio' => 'in',        'w1' => 'Igloo', 'w1img' => 'igloo.png', 'w2' => 'Ink', 'w2img' => 'ink.png'],
            ['w' => 'Ink',       'type' => 'phonics', 'cat' => 'i', 'img' => 'ink.png',       'audio' => 'ink',       'w1' => 'Igloo', 'w1img' => 'igloo.png', 'w2' => 'In', 'w2img' => 'in.png'],
            ['w' => 'Insect',    'type' => 'phonics', 'cat' => 'i', 'img' => 'insect.png',    'audio' => 'insect',    'w1' => 'Igloo', 'w1img' => 'igloo.png', 'w2' => 'Ink', 'w2img' => 'ink.png'],
        ];

        $this->createWordsForUnit($unitId, $folder, $words);

        $lessons = [
            [
                'num'   => 1,
                'title' => 'Things in our classroom',
                'type'  => 'intro',
                'conf'  => [
                    'component'   => 'U4ClassroomIntro',
                    'category'    => 'classroom',
                    'audio_track' => [
                        'code' => 'U4_P24_3_1',
                        'url'  => 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p24.1.mp3',
                    ],
                ],
            ],
            [
                'num'   => 2,
                'title' => 'What\'s this?',
                'type'  => 'vocab-game',
                'conf'  => [
                    'component'   => 'U4WhatsThisGame',
                    'category'    => 'classroom',
                ],
            ],
            [
                'num'   => 3,
                'title' => 'The book is on the chair',
                'type'  => 'vocab-game',
                'conf'  => [
                    'component'   => 'U4PrepositionsGame',
                    'category'    => 'classroom',
                ],
            ],
            [
                'num'   => 4,
                'title' => 'Phonics: Tt and Mm',
                'type'  => 'phonics-game',
                'conf'  => [
                    'component'   => 'U4PhonicsTMGame',
                    'phonics_sets' => ['t', 'm'],
                ],
            ],
            [
                'num'   => 5,
                'title' => 'Phonics: Ww and Ii',
                'type'  => 'phonics-game',
                'conf'  => [
                    'component'   => 'U4PhonicsWIGame',
                    'phonics_sets' => ['w', 'i'],
                ],
            ],
        ];

        $this->createLessonsForUnit($unitId, $lessons);
    }

    // ================== UNIT 5: MY FAVOURITE TOY ==================

    protected function seedToyUnit(int $unitId): void
    {
        $folder = 'toy';

        $words = [
            // Toys
            ['w' => 'Ball',   'type' => 'vocab', 'cat' => 'toy', 'img' => 'ball.png',   'audio' => 'ball',   'w1' => 'Car',   'w1img' => 'car.png',   'w2' => 'Doll', 'w2img' => 'doll.png'],
            ['w' => 'Car',    'type' => 'vocab', 'cat' => 'toy', 'img' => 'car.png',    'audio' => 'car',    'w1' => 'Ball',  'w1img' => 'ball.png',  'w2' => 'Train', 'w2img' => 'train.png'],
            ['w' => 'Doll',   'type' => 'vocab', 'cat' => 'toy', 'img' => 'dolltoy.png', 'audio' => 'doll',   'w1' => 'Robot', 'w1img' => 'robot.png', 'w2' => 'Teddy', 'w2img' => 'teddy.png'],
            ['w' => 'Plane',  'type' => 'vocab', 'cat' => 'toy', 'img' => 'plane.png',  'audio' => 'plane',  'w1' => 'Car',   'w1img' => 'car.png',   'w2' => 'Train', 'w2img' => 'train.png'],
            ['w' => 'Robot',  'type' => 'vocab', 'cat' => 'toy', 'img' => 'robot.png',  'audio' => 'robot',  'w1' => 'Doll',  'w1img' => 'dolltoy.png', 'w2' => 'Teddy', 'w2img' => 'teddy.png'],
            ['w' => 'Teddy',  'type' => 'vocab', 'cat' => 'toy', 'img' => 'teddy.png',  'audio' => 'teddy',  'w1' => 'Ball',  'w1img' => 'ball.png',  'w2' => 'Doll', 'w2img' => 'dolltoy.png'],
            ['w' => 'Train',  'type' => 'vocab', 'cat' => 'toy', 'img' => 'train.png',  'audio' => 'train',  'w1' => 'Car',   'w1img' => 'car.png',   'w2' => 'Plane', 'w2img' => 'plane.png'],
            ['w' => 'Yoyo',   'type' => 'vocab', 'cat' => 'toy', 'img' => 'yoyo.png',   'audio' => 'yoyo',   'w1' => 'Ball',  'w1img' => 'ball.png',  'w2' => 'Doll', 'w2img' => 'dolltoy.png'],

            // Feelings
            ['w' => 'Happy', 'type' => 'vocab', 'cat' => 'feeling', 'img' => 'happy.png', 'audio' => 'happy', 'w1' => 'Sad', 'w1img' => 'sad.png', 'w2' => 'Ball', 'w2img' => 'ball.png'],
            ['w' => 'Sad',   'type' => 'vocab', 'cat' => 'feeling', 'img' => 'sad.png',   'audio' => 'sad',   'w1' => 'Happy', 'w1img' => 'happy.png', 'w2' => 'Doll', 'w2img' => 'dolltoy.png'],

            // CVC words (Phonics)
            ['w' => 'Cat', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'cat.png', 'audio' => 'cat', 'w1' => 'Cap', 'w1img' => 'cap.png', 'w2' => 'Bat', 'w2img' => 'bat.png'],
            ['w' => 'Bat', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'bat.png', 'audio' => 'bat', 'w1' => 'Cat', 'w1img' => 'cat.png', 'w2' => 'Cap', 'w2img' => 'cap.png'],
            ['w' => 'Cap', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'cap.png', 'audio' => 'cap', 'w1' => 'Cat', 'w1img' => 'cat.png', 'w2' => 'Map', 'w2img' => 'map.png'],
            ['w' => 'Map', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'map.png', 'audio' => 'map', 'w1' => 'Mat', 'w1img' => 'mat.png', 'w2' => 'Cap', 'w2img' => 'cap.png'],
            ['w' => 'Mat', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'mat.png', 'audio' => 'mat', 'w1' => 'Map', 'w1img' => 'map.png', 'w2' => 'Cat', 'w2img' => 'cat.png'],
            ['w' => 'Red', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'red.png', 'audio' => 'red', 'w1' => 'Wet', 'w1img' => 'wet.png', 'w2' => 'Web', 'w2img' => 'web.png'],
            ['w' => 'Sit', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'sit.png', 'audio' => 'sit', 'w1' => 'Sad', 'w1img' => 'sad.png', 'w2' => 'Tap', 'w2img' => 'tap.png'],
            ['w' => 'Tap', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'tap.png', 'audio' => 'tap', 'w1' => 'Cat', 'w1img' => 'cat.png', 'w2' => 'Web', 'w2img' => 'web.png'],
            ['w' => 'Web', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'web.png', 'audio' => 'web', 'w1' => 'Wet', 'w1img' => 'wet.png', 'w2' => 'Red', 'w2img' => 'red.png'],
            ['w' => 'Wet', 'type' => 'cvc', 'cat' => 'cvc', 'img' => 'wet.png', 'audio' => 'wet', 'w1' => 'Web', 'w1img' => 'web.png', 'w2' => 'Red', 'w2img' => 'red.png'],
        ];

        $this->createWordsForUnit($unitId, $folder, $words);

        $lessons = [
            [
                'num'   => 1,
                'title' => 'My favourite toy',
                'type'  => 'intro',
                'conf'  => [
                    'component'   => 'U5ToyIntro',
                    'category'    => 'toy',
                    'audio_track' => [
                        'code' => 'U5_P32_4_1',
                        'url'  => 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p32.1.mp3',
                    ],
                ],
            ],
            [
                'num'   => 2,
                'title' => 'What colour is it?',
                'type'  => 'vocab-game',
                'conf'  => [
                    'component'   => 'U5ToyColourGame',
                    'category'    => 'toy',
                ],
            ],
            [
                'num'   => 3,
                'title' => 'How do you feel?',
                'type'  => 'vocab-game',
                'conf'  => [
                    'component'   => 'U5FeelingsGame',
                    'category'    => 'feeling',
                ],
            ],
            [
                'num'   => 4,
                'title' => 'CVC words 1',
                'type'  => 'phonics-game',
                'conf'  => [
                    'component'   => 'U5CvcGame1',
                    'phonics_sets' => ['cvc'],
                ],
            ],
            [
                'num'   => 5,
                'title' => 'CVC words 2',
                'type'  => 'phonics-game',
                'conf'  => [
                    'component'   => 'U5CvcGame2',
                    'phonics_sets' => ['cvc'],
                ],
            ],
        ];

        $this->createLessonsForUnit($unitId, $lessons);
    }

    // ================== مساعدات مشتركة ==================

    protected function createWordsForUnit(int $unitId, string $folder, array $items): void
    {
        foreach ($items as $item) {
            $wrong = null;

            if (isset($item['w1']) && isset($item['w2'])) {
                $wrong = [
                    [
                        'word'       => $item['w1'],
                        'image_path' => "assets/lessons/{$folder}/{$item['w1img']}",
                    ],
                    [
                        'word'       => $item['w2'],
                        'image_path' => "assets/lessons/{$folder}/{$item['w2img']}",
                    ],
                ];
            }

            Word::updateOrCreate(
                [
                    'unit_id' => $unitId,
                    'word'    => $item['w'],
                ],
                [
                    'type'          => $item['type'] ?? 'vocab',
                    'audio_path'    => isset($item['audio'])
                        ? "assets/audio/lessons/{$folder}/" . $this->slugAudio($item['audio']) . ".mp3"
                        : null,
                    'image_path'    => isset($item['img'])
                        ? "assets/lessons/{$folder}/{$item['img']}"
                        : null,
                    'category'      => $item['cat'] ?? null,
                    'wrong_options' => $wrong,
                ]
            );
        }
    }

    protected function createLessonsForUnit(int $unitId, array $lessons): void
    {
        foreach ($lessons as $l) {
            Lesson::updateOrCreate(
                [
                    'unit_id'       => $unitId,
                    'lesson_number' => $l['num'],
                ],
                [
                    'title' => $l['title'],
                    'type'  => $l['type'],
                    'config' => $l['conf'],
                ]
            );
        }

        Unit::where('id', $unitId)->update([
            'lessons_count' => count($lessons),
        ]);
    }

    protected function slugAudio(string $name): string
    {
        return strtolower(str_replace(' ', '', $name));
    }
}
