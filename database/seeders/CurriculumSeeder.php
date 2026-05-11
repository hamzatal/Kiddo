<?php

namespace Database\Seeders;

use App\Models\AudioTrack;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\Word;
use Illuminate\Database\Seeder;

/**
 * Team Together 1A (Jordan reprint) — full curriculum seeder.
 *
 * Structure supplied by the project owner:
 *   U0  Welcome: Hello!           p4-5
 *   U1  Family and friends        p6-13   (Lessons 1, 3, 5, 7, 9, 10, 11, Picture dict.)
 *   U2  My school bag             p14-21  (same 8-lesson pattern)
 *   U3  Our classroom             p22-29
 *   U4  My favourite toy          p30-37
 *   U5  Learning Club             p38-39  (Days of the week)
 *
 * Each lesson is bound by code to its NCCD audio track (see
 * NccdAudioTrackSeeder), so LessonDeckBuilder can ship the real
 * MoE audio straight to the React engine.
 */
class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        $u0 = $this->upsertUnit([
            'code' => 'U0', 'unit_number' => 0,
            'title' => 'Welcome: Hello!',
            'description' => 'Meet the characters, greetings, colours and numbers 1-10.',
            'image_path' => 'assets/lessons/welcome/hut.png',
            'color_key' => 'purple',
        ]);
        $this->seedWelcome($u0->id);

        $u1 = $this->upsertUnit([
            'code' => 'U1', 'unit_number' => 1,
            'title' => 'Family and friends',
            'description' => 'Family members, pets, and phonics Ss, Dd, Cc, Aa.',
            'image_path' => 'assets/lessons/family/treehouse.png',
            'color_key' => 'green',
        ]);
        $this->seedFamily($u1->id);

        $u2 = $this->upsertUnit([
            'code' => 'U2', 'unit_number' => 2,
            'title' => 'My school bag',
            'description' => 'School items, I\'ve got / I haven\'t got, phonics Pp, Rr, Ee, Bb.',
            'image_path' => 'assets/lessons/schoolbag/bag.png',
            'color_key' => 'blue',
        ]);
        $this->seedSchoolBag($u2->id);

        $u3 = $this->upsertUnit([
            'code' => 'U3', 'unit_number' => 3,
            'title' => 'Our classroom',
            'description' => 'Classroom objects, locations, phonics Tt, Mm, Ww, Ii.',
            'image_path' => 'assets/lessons/classroom/desk.png',
            'color_key' => 'orange',
        ]);
        $this->seedClassroom($u3->id);

        $u4 = $this->upsertUnit([
            'code' => 'U4', 'unit_number' => 4,
            'title' => 'My favourite toy',
            'description' => 'Toys, colours, feelings, and CVC word blending.',
            'image_path' => 'assets/lessons/toy/toy.png',
            'color_key' => 'pink',
        ]);
        $this->seedToy($u4->id);

        $u5 = $this->upsertUnit([
            'code' => 'U5', 'unit_number' => 5,
            'title' => 'Learning Club: Days of the week',
            'description' => 'Language booster — Sunday to Saturday.',
            'image_path' => 'assets/lessons/lc/calendar.png',
            'color_key' => 'yellow',
        ]);
        $this->seedLearningClub($u5->id);
    }

    // ══════════════════════════════════════════════════════════
    // U0  Welcome: Hello!  (pages 4-5)
    // ══════════════════════════════════════════════════════════
    protected function seedWelcome(int $unitId): void
    {
        $folder = 'welcome';
        $words = [
            // Greetings
            ['w' => 'Hello',        'cat' => 'greeting',  'img' => 'hello.png',
             'w1' => 'Hi',          'w1img' => 'hi.png',           'w2' => 'Good morning', 'w2img' => 'goodmorning.png'],
            ['w' => 'Hi',           'cat' => 'greeting',  'img' => 'hi.png',
             'w1' => 'Hello',       'w1img' => 'hello.png',        'w2' => 'Good morning', 'w2img' => 'goodmorning.png'],
            ['w' => 'Good morning', 'cat' => 'greeting',  'img' => 'goodmorning.png',
             'w1' => 'Hello',       'w1img' => 'hello.png',        'w2' => 'Hi',           'w2img' => 'hi.png'],
            // Characters
            ['w' => 'Hala',  'cat' => 'character', 'img' => 'hala.png',  'w1' => 'Bill',  'w1img' => 'bill.png',  'w2' => 'Lama',  'w2img' => 'lama.png'],
            ['w' => 'Meg',   'cat' => 'character', 'img' => 'meg.png',   'w1' => 'Lama',  'w1img' => 'lama.png',  'w2' => 'Hala',  'w2img' => 'hala.png'],
            ['w' => 'Lama',  'cat' => 'character', 'img' => 'lama.png',  'w1' => 'Hala',  'w1img' => 'hala.png',  'w2' => 'Meg',   'w2img' => 'meg.png'],
            ['w' => 'Tom',   'cat' => 'character', 'img' => 'tom.png',   'w1' => 'Bill',  'w1img' => 'bill.png',  'w2' => 'Malek', 'w2img' => 'malek.png'],
            ['w' => 'Bill',  'cat' => 'character', 'img' => 'bill.png',  'w1' => 'Tom',   'w1img' => 'tom.png',   'w2' => 'Malek', 'w2img' => 'malek.png'],
            ['w' => 'Malek', 'cat' => 'character', 'img' => 'malek.png', 'w1' => 'Bill',  'w1img' => 'bill.png',  'w2' => 'Tom',   'w2img' => 'tom.png'],
            // Colours
            ['w' => 'Blue',   'cat' => 'colour', 'img' => 'blue.png',   'w1' => 'Red',    'w1img' => 'red.png',    'w2' => 'Green',  'w2img' => 'green.png'],
            ['w' => 'Green',  'cat' => 'colour', 'img' => 'green.png',  'w1' => 'Blue',   'w1img' => 'blue.png',   'w2' => 'Orange', 'w2img' => 'orange.png'],
            ['w' => 'Orange', 'cat' => 'colour', 'img' => 'orange.png', 'w1' => 'Red',    'w1img' => 'red.png',    'w2' => 'Brown',  'w2img' => 'brown.png'],
            ['w' => 'Red',    'cat' => 'colour', 'img' => 'red.png',    'w1' => 'Blue',   'w1img' => 'blue.png',   'w2' => 'Yellow', 'w2img' => 'yellow.png'],
            ['w' => 'Yellow', 'cat' => 'colour', 'img' => 'yellow.png', 'w1' => 'Green',  'w1img' => 'green.png',  'w2' => 'Orange', 'w2img' => 'orange.png'],
            ['w' => 'Brown',  'cat' => 'colour', 'img' => 'brown.png',  'w1' => 'Red',    'w1img' => 'red.png',    'w2' => 'Blue',   'w2img' => 'blue.png'],
            // Numbers 1-10
            ['w' => 'One',   'cat' => 'number', 'img' => 'one.png',   'w1' => 'Two',   'w1img' => 'two.png',   'w2' => 'Three', 'w2img' => 'three.png'],
            ['w' => 'Two',   'cat' => 'number', 'img' => 'two.png',   'w1' => 'One',   'w1img' => 'one.png',   'w2' => 'Four',  'w2img' => 'four.png'],
            ['w' => 'Three', 'cat' => 'number', 'img' => 'three.png', 'w1' => 'Two',   'w1img' => 'two.png',   'w2' => 'Five',  'w2img' => 'five.png'],
            ['w' => 'Four',  'cat' => 'number', 'img' => 'four.png',  'w1' => 'Three', 'w1img' => 'three.png', 'w2' => 'Five',  'w2img' => 'five.png'],
            ['w' => 'Five',  'cat' => 'number', 'img' => 'five.png',  'w1' => 'Four',  'w1img' => 'four.png',  'w2' => 'Six',   'w2img' => 'six.png'],
            ['w' => 'Six',   'cat' => 'number', 'img' => 'six.png',   'w1' => 'Seven', 'w1img' => 'seven.png', 'w2' => 'Eight', 'w2img' => 'eight.png'],
            ['w' => 'Seven', 'cat' => 'number', 'img' => 'seven.png', 'w1' => 'Six',   'w1img' => 'six.png',   'w2' => 'Eight', 'w2img' => 'eight.png'],
            ['w' => 'Eight', 'cat' => 'number', 'img' => 'eight.png', 'w1' => 'Seven', 'w1img' => 'seven.png', 'w2' => 'Nine',  'w2img' => 'nine.png'],
            ['w' => 'Nine',  'cat' => 'number', 'img' => 'nine.png',  'w1' => 'Eight', 'w1img' => 'eight.png', 'w2' => 'Ten',   'w2img' => 'ten.png'],
            ['w' => 'Ten',   'cat' => 'number', 'img' => 'ten.png',   'w1' => 'Nine',  'w1img' => 'nine.png',  'w2' => 'Eight', 'w2img' => 'eight.png'],
        ];
        $this->createWords($unitId, $folder, $words, 'vocab');

        $this->createLessons($unitId, [
            ['num' => 1, 'title' => 'Greetings', 'page' => 4, 'type' => 'intro',
             'audio' => 'PB4', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Hello', 'Hi', 'Good morning'],
                'prompt' => 'Listen, point and say.',
                'audio_tracks' => ['AB4', 'AB4_2', 'PB4'],
             ]],
            ['num' => 2, 'title' => 'Meet the characters', 'page' => 4, 'type' => 'vocab-game',
             'audio' => 'AB4_2', 'conf' => [
                'mode' => 'vocab-game',
                'category' => 'character', 'rounds' => 6, 'question_style' => 'word-to-image',
                'options_per_round' => 3, 'decoy_pool' => 'same_category',
                'prompt' => 'Who is this?',
             ]],
            ['num' => 3, 'title' => 'Colours', 'page' => 5, 'type' => 'vocab-game',
             'audio' => 'AB5', 'conf' => [
                'mode' => 'vocab-game',
                'category' => 'colour', 'rounds' => 6, 'question_style' => 'word-to-image',
                'options_per_round' => 3, 'decoy_pool' => 'same_category',
                'prompt' => 'Find the colour!',
             ]],
            ['num' => 4, 'title' => 'Numbers 1-10', 'page' => 5, 'type' => 'vocab-game',
             'audio' => 'PB5', 'conf' => [
                'mode' => 'vocab-game',
                'category' => 'number', 'rounds' => 8, 'question_style' => 'word-to-image',
                'options_per_round' => 3, 'decoy_pool' => 'same_category',
                'prompt' => 'Listen and count!',
             ]],
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // U1  Family and friends  (pages 6-13)
    // ══════════════════════════════════════════════════════════
    protected function seedFamily(int $unitId): void
    {
        $folder = 'family';
        $words = [
            // Vocab
            ['w' => 'Boy',     'cat' => 'family', 'img' => 'boy.png',     'w1' => 'Girl',    'w1img' => 'girl.png',    'w2' => 'Friend',  'w2img' => 'friend.png'],
            ['w' => 'Brother', 'cat' => 'family', 'img' => 'brother.png', 'w1' => 'Sister',  'w1img' => 'sister.png',  'w2' => 'Dad',     'w2img' => 'dad.png'],
            ['w' => 'Cat',     'cat' => 'family', 'img' => 'cat.png',    'w1' => 'Friend',  'w1img' => 'friend.png',  'w2' => 'Boy',     'w2img' => 'boy.png'],
            ['w' => 'Dad',     'cat' => 'family', 'img' => 'dad.png',     'w1' => 'Mum',     'w1img' => 'mum.png',     'w2' => 'Brother', 'w2img' => 'brother.png'],
            ['w' => 'Friend',  'cat' => 'family', 'img' => 'friend.png',  'w1' => 'Boy',     'w1img' => 'boy.png',     'w2' => 'Girl',    'w2img' => 'girl.png'],
            ['w' => 'Girl',    'cat' => 'family', 'img' => 'girl.png',    'w1' => 'Boy',     'w1img' => 'boy.png',     'w2' => 'Friend',  'w2img' => 'friend.png'],
            ['w' => 'Mum',     'cat' => 'family', 'img' => 'mum.png',     'w1' => 'Dad',     'w1img' => 'dad.png',     'w2' => 'Sister',  'w2img' => 'sister.png'],
            ['w' => 'Sister',  'cat' => 'family', 'img' => 'sister.png',  'w1' => 'Brother', 'w1img' => 'brother.png', 'w2' => 'Mum',     'w2img' => 'mum.png'],
        ];
        $this->createWords($unitId, $folder, $words, 'vocab');

        // Phonics Ss, Dd, Cc, Aa
        $phonics = [
            ['w' => 'Sing',      'cat' => 's', 'img' => 'sing.png',      'w1' => 'Sun',   'w1img' => 'sun.png',   'w2' => 'Sister', 'w2img' => 'sister.png'],
            ['w' => 'Sun',       'cat' => 's', 'img' => 'sun.png',       'w1' => 'Sing',  'w1img' => 'sing.png',  'w2' => 'Six',    'w2img' => 'six.png'],
            ['w' => 'Dig',       'cat' => 'd', 'img' => 'dig.png',       'w1' => 'Duck',  'w1img' => 'duck.png',  'w2' => 'Doll',   'w2img' => 'doll.png'],
            ['w' => 'Duck',      'cat' => 'd', 'img' => 'duck.png',      'w1' => 'Doll',  'w1img' => 'doll.png',  'w2' => 'Dig',    'w2img' => 'dig.png'],
            ['w' => 'Doll',      'cat' => 'd', 'img' => 'doll.png',      'w1' => 'Duck',  'w1img' => 'duck.png',  'w2' => 'Dig',    'w2img' => 'dig.png'],
            ['w' => 'Cut',       'cat' => 'c', 'img' => 'cut.png',       'w1' => 'Cup',   'w1img' => 'cup.png',   'w2' => 'Cap',    'w2img' => 'cap.png'],
            ['w' => 'Cap',       'cat' => 'c', 'img' => 'cap.png',       'w1' => 'Cup',   'w1img' => 'cup.png',   'w2' => 'Cut',    'w2img' => 'cut.png'],
            ['w' => 'Cup',       'cat' => 'c', 'img' => 'cup.png',       'w1' => 'Cap',   'w1img' => 'cap.png',   'w2' => 'Cut',    'w2img' => 'cut.png'],
            ['w' => 'Apple',     'cat' => 'a', 'img' => 'apple.png',     'w1' => 'Ant',   'w1img' => 'ant.png',   'w2' => 'Alligator', 'w2img' => 'alligator.png'],
            ['w' => 'Ant',       'cat' => 'a', 'img' => 'ant.png',       'w1' => 'Apple', 'w1img' => 'apple.png', 'w2' => 'Alligator', 'w2img' => 'alligator.png'],
            ['w' => 'Alligator', 'cat' => 'a', 'img' => 'alligator.png', 'w1' => 'Ant',   'w1img' => 'ant.png',   'w2' => 'Apple',  'w2img' => 'apple.png'],
        ];
        $this->createWords($unitId, $folder, $phonics, 'phonics');

        $this->createLessons($unitId, [
            ['num' => 1, 'title' => 'Meet my family', 'page' => 6, 'type' => 'intro',
             'audio' => 'PB6', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Boy', 'Brother', 'Cat', 'Dad', 'Friend', 'Girl', 'Mum', 'Sister'],
                'prompt' => 'Listen, point and say.',
                'audio_tracks' => ['AB6', 'PB6', 'PB6_2'],
             ]],
            ['num' => 2, 'title' => 'Language practice', 'page' => 7, 'type' => 'vocab-game',
             'audio' => 'PB7', 'conf' => [
                'mode' => 'vocab-game', 'category' => 'family',
                'rounds' => 6, 'question_style' => 'word-to-image',
                'options_per_round' => 3, 'decoy_pool' => 'same_category',
                'prompt' => "Listen and circle.",
                'audio_tracks' => ['AB7', 'AB7_2', 'PB7', 'PB7_2', 'PB7_3'],
             ]],
            ['num' => 3, 'title' => 'Story: Find Ann', 'page' => 8, 'type' => 'intro',
             'audio' => 'PB8', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Mum', 'Dad', 'Cat', 'Girl', 'Boy'],
                'prompt' => 'Listen and read — Find Ann.',
                'value' => 'Be helpful.',
                'audio_tracks' => ['PB8'],
             ]],
            ['num' => 4, 'title' => 'Sing & match', 'page' => 9, 'type' => 'review',
             'audio' => 'PB9_3', 'conf' => [
                'mode' => 'review', 'categories' => ['family'],
                'rounds' => 6, 'styles' => ['word-to-image', 'image-to-word'],
                'prompt' => 'Listen, match and sing!',
                'audio_tracks' => ['AB9', 'PB9', 'PB9_2', 'PB9_3'],
             ]],
            ['num' => 5, 'title' => 'Phonics: Ss and Dd', 'page' => 10, 'type' => 'phonics-game',
             'audio' => 'PB10', 'conf' => [
                'mode' => 'phonics-game', 'phonics_sets' => ['s', 'd'],
                'rounds' => 6, 'question_style' => 'sound-to-word',
                'options_per_round' => 3,
                'prompt' => 'Listen and circle the sound.',
                'audio_tracks' => ['AB10', 'AB10_2', 'PB10', 'PB10_2'],
             ]],
            ['num' => 6, 'title' => 'Phonics: Cc and Aa', 'page' => 11, 'type' => 'phonics-game',
             'audio' => 'PB11', 'conf' => [
                'mode' => 'phonics-game', 'phonics_sets' => ['c', 'a'],
                'rounds' => 6, 'question_style' => 'sound-to-word',
                'options_per_round' => 3,
                'prompt' => 'Listen and circle the sound.',
                'audio_tracks' => ['AB11', 'AB11_2', 'PB11', 'PB11_2'],
             ]],
            ['num' => 7, 'title' => 'Project: Finger puppets', 'page' => 12, 'type' => 'intro',
             'audio' => 'PB12_2', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Mum', 'Dad', 'Brother', 'Sister'],
                'prompt' => 'Make your finger puppets and sing!',
                'audio_tracks' => ['AB12', 'AB12_2', 'PB12_2'],
                'video_track' => 'PB12V',
             ]],
            ['num' => 8, 'title' => 'Picture dictionary', 'page' => 13, 'type' => 'review',
             'audio' => 'PB13', 'conf' => [
                'mode' => 'review', 'categories' => ['family'],
                'rounds' => 8, 'styles' => ['word-to-image', 'image-to-word'],
                'prompt' => 'Listen and trace.',
                'audio_tracks' => ['AB13', 'PB13', 'PB13_2'],
             ]],
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // U2  My school bag  (pages 14-21)
    // ══════════════════════════════════════════════════════════
    protected function seedSchoolBag(int $unitId): void
    {
        $folder = 'schoolbag';
        $words = [
            ['w' => 'Bag',         'cat' => 'object', 'img' => 'bag.png',         'w1' => 'Book',   'w1img' => 'book.png',   'w2' => 'Pencil', 'w2img' => 'pencil.png'],
            ['w' => 'Book',        'cat' => 'object', 'img' => 'book.png',        'w1' => 'Bag',    'w1img' => 'bag.png',    'w2' => 'Ruler',  'w2img' => 'ruler.png'],
            ['w' => 'Crayon',      'cat' => 'object', 'img' => 'crayon.png',      'w1' => 'Pen',    'w1img' => 'pen.png',    'w2' => 'Pencil', 'w2img' => 'pencil.png'],
            ['w' => 'Eraser',      'cat' => 'object', 'img' => 'eraser.png',      'w1' => 'Ruler',  'w1img' => 'ruler.png',  'w2' => 'Bag',    'w2img' => 'bag.png'],
            ['w' => 'Pen',         'cat' => 'object', 'img' => 'pen.png',         'w1' => 'Pencil', 'w1img' => 'pencil.png', 'w2' => 'Crayon', 'w2img' => 'crayon.png'],
            ['w' => 'Pencil',      'cat' => 'object', 'img' => 'pencil.png',      'w1' => 'Pen',    'w1img' => 'pen.png',    'w2' => 'Eraser', 'w2img' => 'eraser.png'],
            ['w' => 'Pencil case', 'cat' => 'object', 'img' => 'pencilcase.png',  'w1' => 'Bag',    'w1img' => 'bag.png',    'w2' => 'Book',   'w2img' => 'book.png'],
            ['w' => 'Ruler',       'cat' => 'object', 'img' => 'ruler.png',       'w1' => 'Pen',    'w1img' => 'pen.png',    'w2' => 'Crayon', 'w2img' => 'crayon.png'],
        ];
        $this->createWords($unitId, $folder, $words, 'vocab');

        $phonics = [
            ['w' => 'Pink',     'cat' => 'p', 'img' => 'pink.png',     'w1' => 'Pen',    'w1img' => 'pen.png',    'w2' => 'Pencil', 'w2img' => 'pencil.png'],
            ['w' => 'Pen',      'cat' => 'p', 'img' => 'pen.png',      'w1' => 'Pink',   'w1img' => 'pink.png',   'w2' => 'Pencil', 'w2img' => 'pencil.png'],
            ['w' => 'Pencil',   'cat' => 'p', 'img' => 'pencil.png',   'w1' => 'Pen',    'w1img' => 'pen.png',    'w2' => 'Pink',   'w2img' => 'pink.png'],
            ['w' => 'Rabbit',   'cat' => 'r', 'img' => 'rabbit.png',   'w1' => 'Run',    'w1img' => 'run.png',    'w2' => 'Ruler',  'w2img' => 'ruler.png'],
            ['w' => 'Red',      'cat' => 'r', 'img' => 'red.png',      'w1' => 'Rabbit', 'w1img' => 'rabbit.png', 'w2' => 'Run',    'w2img' => 'run.png'],
            ['w' => 'Run',      'cat' => 'r', 'img' => 'run.png',      'w1' => 'Ruler',  'w1img' => 'ruler.png',  'w2' => 'Rabbit', 'w2img' => 'rabbit.png'],
            ['w' => 'Egg',      'cat' => 'e', 'img' => 'egg.png',      'w1' => 'Elbow',  'w1img' => 'elbow.png',  'w2' => 'Elephant', 'w2img' => 'elephant.png'],
            ['w' => 'Elephant', 'cat' => 'e', 'img' => 'elephant.png', 'w1' => 'Egg',    'w1img' => 'egg.png',    'w2' => 'Elbow',  'w2img' => 'elbow.png'],
            ['w' => 'Ball',     'cat' => 'b', 'img' => 'ball.png',     'w1' => 'Bag',    'w1img' => 'bag.png',    'w2' => 'Book',   'w2img' => 'book.png'],
            ['w' => 'Boy',      'cat' => 'b', 'img' => 'boy.png',      'w1' => 'Bag',    'w1img' => 'bag.png',    'w2' => 'Ball',   'w2img' => 'ball.png'],
        ];
        $this->createWords($unitId, $folder, $phonics, 'phonics');

        $this->createLessons($unitId, [
            ['num' => 1, 'title' => "What's in my bag?", 'page' => 14, 'type' => 'intro',
             'audio' => 'PB14', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Pen', 'Eraser', 'Ruler', 'Bag', 'Book', 'Pencil', 'Crayon', 'Pencil case'],
                'prompt' => 'Listen, point and say.',
                'audio_tracks' => ['AB14', 'PB14', 'PB14_2'],
             ]],
            ['num' => 2, 'title' => "I've got / I haven't got", 'page' => 15, 'type' => 'vocab-game',
             'audio' => 'PB15', 'conf' => [
                'mode' => 'vocab-game', 'category' => 'object',
                'rounds' => 6, 'question_style' => 'word-to-image',
                'options_per_round' => 3, 'decoy_pool' => 'same_category',
                'prompt' => 'Listen and circle.',
                'audio_tracks' => ['AB15', 'AB15_2', 'PB15', 'PB15_2', 'PB15_3'],
             ]],
            ['num' => 3, 'title' => 'Story: Find Lama', 'page' => 16, 'type' => 'intro',
             'audio' => 'PB16', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Bag', 'Pen', 'Ruler', 'Book'],
                'prompt' => 'Listen and read — Find Lama.',
                'value' => 'Look after your things.',
                'audio_tracks' => ['PB16'],
             ]],
            ['num' => 4, 'title' => 'Sing & match', 'page' => 17, 'type' => 'review',
             'audio' => 'PB17_3', 'conf' => [
                'mode' => 'review', 'categories' => ['object'],
                'rounds' => 6, 'styles' => ['word-to-image', 'image-to-word'],
                'prompt' => 'Listen, match and sing!',
                'audio_tracks' => ['PB17', 'PB17_2', 'PB17_3', 'PB17_4'],
             ]],
            ['num' => 5, 'title' => 'Phonics: Pp and Rr', 'page' => 18, 'type' => 'phonics-game',
             'audio' => 'PB18', 'conf' => [
                'mode' => 'phonics-game', 'phonics_sets' => ['p', 'r'],
                'rounds' => 6, 'question_style' => 'sound-to-word',
                'options_per_round' => 3,
                'prompt' => 'Listen and circle the sound.',
                'audio_tracks' => ['AB18', 'AB18_2', 'PB18', 'PB18_2'],
             ]],
            ['num' => 6, 'title' => 'Phonics: Ee and Bb', 'page' => 19, 'type' => 'phonics-game',
             'audio' => 'PB19', 'conf' => [
                'mode' => 'phonics-game', 'phonics_sets' => ['e', 'b'],
                'rounds' => 6, 'question_style' => 'sound-to-word',
                'options_per_round' => 3,
                'prompt' => 'Listen and circle the sound.',
                'audio_tracks' => ['AB19', 'AB19_2', 'PB19', 'PB19_2'],
             ]],
            ['num' => 7, 'title' => 'Project: A school bag', 'page' => 20, 'type' => 'intro',
             'audio' => 'PB20_2', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Bag', 'Book', 'Pen', 'Pencil', 'Ruler', 'Crayon'],
                'prompt' => 'Make your school bag and sing!',
                'audio_tracks' => ['AB20', 'AB20_2', 'PB20_2'],
                'video_track' => 'PB20V',
             ]],
            ['num' => 8, 'title' => 'Picture dictionary', 'page' => 21, 'type' => 'review',
             'audio' => 'PB21', 'conf' => [
                'mode' => 'review', 'categories' => ['object'],
                'rounds' => 8, 'styles' => ['word-to-image', 'image-to-word'],
                'prompt' => 'Listen and trace.',
                'audio_tracks' => ['AB21', 'PB21', 'PB21_2'],
             ]],
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // U3  Our classroom  (pages 22-29)
    // ══════════════════════════════════════════════════════════
    protected function seedClassroom(int $unitId): void
    {
        $folder = 'classroom';
        $words = [
            ['w' => 'Chair',      'cat' => 'classroom', 'img' => 'chair.png',      'w1' => 'Desk',       'w1img' => 'desk.png',       'w2' => 'Floor',  'w2img' => 'floor.png'],
            ['w' => 'Desk',       'cat' => 'classroom', 'img' => 'desk.png',       'w1' => 'Chair',      'w1img' => 'chair.png',      'w2' => 'Wall',   'w2img' => 'wall.png'],
            ['w' => 'Door',       'cat' => 'classroom', 'img' => 'door.png',       'w1' => 'Window',     'w1img' => 'window.png',     'w2' => 'Wall',   'w2img' => 'wall.png'],
            ['w' => 'Floor',      'cat' => 'classroom', 'img' => 'floor.png',      'w1' => 'Chair',      'w1img' => 'chair.png',      'w2' => 'Desk',   'w2img' => 'desk.png'],
            ['w' => 'Teacher',    'cat' => 'classroom', 'img' => 'teacher.png',    'w1' => 'Wall',       'w1img' => 'wall.png',       'w2' => 'Door',   'w2img' => 'door.png'],
            ['w' => 'Wall',       'cat' => 'classroom', 'img' => 'wall.png',       'w1' => 'Whiteboard', 'w1img' => 'whiteboard.png', 'w2' => 'Window', 'w2img' => 'window.png'],
            ['w' => 'Whiteboard', 'cat' => 'classroom', 'img' => 'whiteboard.png', 'w1' => 'Wall',       'w1img' => 'wall.png',       'w2' => 'Door',   'w2img' => 'door.png'],
            ['w' => 'Window',     'cat' => 'classroom', 'img' => 'window.png',     'w1' => 'Door',       'w1img' => 'door.png',       'w2' => 'Wall',   'w2img' => 'wall.png'],
        ];
        $this->createWords($unitId, $folder, $words, 'vocab');

        $phonics = [
            ['w' => 'Teddy',   'cat' => 't', 'img' => 'teddy.png',   'w1' => 'Teacher', 'w1img' => 'teacher.png', 'w2' => 'Ten',    'w2img' => 'ten.png'],
            ['w' => 'Teacher', 'cat' => 't', 'img' => 'teacher.png', 'w1' => 'Teddy',   'w1img' => 'teddy.png',   'w2' => 'Two',    'w2img' => 'two.png'],
            ['w' => 'Ten',     'cat' => 't', 'img' => 'ten.png',     'w1' => 'Two',     'w1img' => 'two.png',     'w2' => 'Teddy',  'w2img' => 'teddy.png'],
            ['w' => 'Mouse',   'cat' => 'm', 'img' => 'mouse.png',   'w1' => 'Milk',    'w1img' => 'milk.png',    'w2' => 'Moon',   'w2img' => 'moon.png'],
            ['w' => 'Milk',    'cat' => 'm', 'img' => 'milk.png',    'w1' => 'Moon',    'w1img' => 'moon.png',    'w2' => 'Mouse',  'w2img' => 'mouse.png'],
            ['w' => 'Moon',    'cat' => 'm', 'img' => 'moon.png',    'w1' => 'Milk',    'w1img' => 'milk.png',    'w2' => 'Mouse',  'w2img' => 'mouse.png'],
            ['w' => 'Mum',     'cat' => 'm', 'img' => 'mum.png',     'w1' => 'Milk',    'w1img' => 'milk.png',    'w2' => 'Moon',   'w2img' => 'moon.png'],
            ['w' => 'Wave',    'cat' => 'w', 'img' => 'wave.png',    'w1' => 'Wall',    'w1img' => 'wall.png',    'w2' => 'Water',  'w2img' => 'water.png'],
            ['w' => 'Wall',    'cat' => 'w', 'img' => 'wall.png',    'w1' => 'Water',   'w1img' => 'water.png',   'w2' => 'Wave',   'w2img' => 'wave.png'],
            ['w' => 'Water',   'cat' => 'w', 'img' => 'water.png',   'w1' => 'Wall',    'w1img' => 'wall.png',    'w2' => 'Wave',   'w2img' => 'wave.png'],
            ['w' => 'Insect',  'cat' => 'i', 'img' => 'insect.png',  'w1' => 'Ink',     'w1img' => 'ink.png',     'w2' => 'Igloo',  'w2img' => 'igloo.png'],
            ['w' => 'Ink',     'cat' => 'i', 'img' => 'ink.png',     'w1' => 'Insect',  'w1img' => 'insect.png',  'w2' => 'Igloo',  'w2img' => 'igloo.png'],
            ['w' => 'Igloo',   'cat' => 'i', 'img' => 'igloo.png',   'w1' => 'Ink',     'w1img' => 'ink.png',     'w2' => 'Insect', 'w2img' => 'insect.png'],
        ];
        $this->createWords($unitId, $folder, $phonics, 'phonics');

        $this->createLessons($unitId, [
            ['num' => 1, 'title' => 'Our classroom', 'page' => 22, 'type' => 'intro',
             'audio' => 'PB22', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Teacher', 'Whiteboard', 'Door', 'Window', 'Chair', 'Desk', 'Floor', 'Wall'],
                'prompt' => 'Listen, point and say.',
                'audio_tracks' => ['AB22', 'PB22', 'PB22_2'],
             ]],
            ['num' => 2, 'title' => "What's this?", 'page' => 23, 'type' => 'vocab-game',
             'audio' => 'PB23', 'conf' => [
                'mode' => 'vocab-game', 'category' => 'classroom',
                'rounds' => 6, 'question_style' => 'word-to-image',
                'options_per_round' => 3, 'decoy_pool' => 'same_category',
                'prompt' => 'Listen and number.',
                'audio_tracks' => ['AB23', 'AB23_2', 'PB23', 'PB23_2', 'PB23_3'],
             ]],
            ['num' => 3, 'title' => 'Story: Find the pens', 'page' => 24, 'type' => 'intro',
             'audio' => 'PB24', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Desk', 'Chair', 'Pen', 'Bag'],
                'prompt' => 'Listen and read — Find the pens.',
                'value' => 'Be tidy.',
                'audio_tracks' => ['PB24'],
             ]],
            ['num' => 4, 'title' => 'Sing & match', 'page' => 25, 'type' => 'review',
             'audio' => 'PB25_3', 'conf' => [
                'mode' => 'review', 'categories' => ['classroom'],
                'rounds' => 6, 'styles' => ['word-to-image', 'image-to-word'],
                'prompt' => 'Listen, match and sing!',
                'audio_tracks' => ['PB25', 'PB25_2', 'PB25_3', 'PB25_4'],
             ]],
            ['num' => 5, 'title' => 'Phonics: Tt and Mm', 'page' => 26, 'type' => 'phonics-game',
             'audio' => 'PB26', 'conf' => [
                'mode' => 'phonics-game', 'phonics_sets' => ['t', 'm'],
                'rounds' => 6, 'question_style' => 'sound-to-word',
                'options_per_round' => 3,
                'prompt' => 'Listen and circle the sound.',
                'audio_tracks' => ['AB26', 'PB26', 'PB26_2'],
             ]],
            ['num' => 6, 'title' => 'Phonics: Ww and Ii', 'page' => 27, 'type' => 'phonics-game',
             'audio' => 'PB27', 'conf' => [
                'mode' => 'phonics-game', 'phonics_sets' => ['w', 'i'],
                'rounds' => 6, 'question_style' => 'sound-to-word',
                'options_per_round' => 3,
                'prompt' => 'Listen and circle the sound.',
                'audio_tracks' => ['AB27', 'AB27_2', 'PB27', 'PB27_2'],
             ]],
            ['num' => 7, 'title' => 'Project: A pen pot', 'page' => 28, 'type' => 'intro',
             'audio' => 'PB28_2', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Pen', 'Pencil', 'Crayon', 'Ruler'],
                'prompt' => 'Make your pen pot and play!',
                'audio_tracks' => ['AB28', 'AB28_2', 'PB28_2'],
                'video_track' => 'PB28V',
             ]],
            ['num' => 8, 'title' => 'Picture dictionary', 'page' => 29, 'type' => 'review',
             'audio' => 'PB29', 'conf' => [
                'mode' => 'review', 'categories' => ['classroom'],
                'rounds' => 8, 'styles' => ['word-to-image', 'image-to-word'],
                'prompt' => 'Listen and trace.',
                'audio_tracks' => ['AB29', 'PB29', 'PB29_2'],
             ]],
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // U4  My favourite toy  (pages 30-37)
    // ══════════════════════════════════════════════════════════
    protected function seedToy(int $unitId): void
    {
        $folder = 'toy';
        $words = [
            ['w' => 'Ball',   'cat' => 'toy', 'img' => 'ball.png',   'w1' => 'Car',    'w1img' => 'car.png',    'w2' => 'Doll',  'w2img' => 'dolltoy.png'],
            ['w' => 'Car',    'cat' => 'toy', 'img' => 'car.png',    'w1' => 'Ball',   'w1img' => 'ball.png',   'w2' => 'Train', 'w2img' => 'train.png'],
            ['w' => 'Doll',   'cat' => 'toy', 'img' => 'dolltoy.png','w1' => 'Robot',  'w1img' => 'robot.png',  'w2' => 'Teddy', 'w2img' => 'teddy.png'],
            ['w' => 'Plane',  'cat' => 'toy', 'img' => 'plane.png',  'w1' => 'Car',    'w1img' => 'car.png',    'w2' => 'Train', 'w2img' => 'train.png'],
            ['w' => 'Robot',  'cat' => 'toy', 'img' => 'robot.png',  'w1' => 'Doll',   'w1img' => 'dolltoy.png','w2' => 'Teddy', 'w2img' => 'teddy.png'],
            ['w' => 'Teddy',  'cat' => 'toy', 'img' => 'teddy.png',  'w1' => 'Ball',   'w1img' => 'ball.png',   'w2' => 'Doll',  'w2img' => 'dolltoy.png'],
            ['w' => 'Train',  'cat' => 'toy', 'img' => 'train.png',  'w1' => 'Car',    'w1img' => 'car.png',    'w2' => 'Plane', 'w2img' => 'plane.png'],
            ['w' => 'Yoyo',   'cat' => 'toy', 'img' => 'yoyo.png',   'w1' => 'Ball',   'w1img' => 'ball.png',   'w2' => 'Doll',  'w2img' => 'dolltoy.png'],
            // Feelings
            ['w' => 'Happy',  'cat' => 'feeling', 'img' => 'happy.png', 'w1' => 'Sad',   'w1img' => 'sad.png',   'w2' => 'Ball',  'w2img' => 'ball.png'],
            ['w' => 'Sad',    'cat' => 'feeling', 'img' => 'sad.png',   'w1' => 'Happy', 'w1img' => 'happy.png', 'w2' => 'Doll',  'w2img' => 'dolltoy.png'],
        ];
        $this->createWords($unitId, $folder, $words, 'vocab');

        // CVC words (Unit 4 Lessons 9-10)
        $cvc = [
            ['w' => 'Red', 'cat' => 'cvc', 'img' => 'red.png', 'w1' => 'Bed', 'w1img' => 'bed.png', 'w2' => 'Web', 'w2img' => 'web.png'],
            ['w' => 'Cat', 'cat' => 'cvc', 'img' => 'cat.png', 'w1' => 'Bat', 'w1img' => 'bat.png', 'w2' => 'Mat', 'w2img' => 'mat.png'],
            ['w' => 'Mat', 'cat' => 'cvc', 'img' => 'mat.png', 'w1' => 'Cat', 'w1img' => 'cat.png', 'w2' => 'Bat', 'w2img' => 'bat.png'],
            ['w' => 'Sit', 'cat' => 'cvc', 'img' => 'sit.png', 'w1' => 'Sad', 'w1img' => 'sad.png', 'w2' => 'Tap', 'w2img' => 'tap.png'],
            ['w' => 'Bed', 'cat' => 'cvc', 'img' => 'bed.png', 'w1' => 'Red', 'w1img' => 'red.png', 'w2' => 'Web', 'w2img' => 'web.png'],
            ['w' => 'Web', 'cat' => 'cvc', 'img' => 'web.png', 'w1' => 'Wet', 'w1img' => 'wet.png', 'w2' => 'Red', 'w2img' => 'red.png'],
            ['w' => 'Sad', 'cat' => 'cvc', 'img' => 'sad.png', 'w1' => 'Sit', 'w1img' => 'sit.png', 'w2' => 'Cap', 'w2img' => 'cap.png'],
            ['w' => 'Wet', 'cat' => 'cvc', 'img' => 'wet.png', 'w1' => 'Web', 'w1img' => 'web.png', 'w2' => 'Red', 'w2img' => 'red.png'],
            ['w' => 'Map', 'cat' => 'cvc', 'img' => 'map.png', 'w1' => 'Mat', 'w1img' => 'mat.png', 'w2' => 'Cap', 'w2img' => 'cap.png'],
            ['w' => 'Bat', 'cat' => 'cvc', 'img' => 'bat.png', 'w1' => 'Cat', 'w1img' => 'cat.png', 'w2' => 'Mat', 'w2img' => 'mat.png'],
            ['w' => 'Cap', 'cat' => 'cvc', 'img' => 'cap.png', 'w1' => 'Cat', 'w1img' => 'cat.png', 'w2' => 'Map', 'w2img' => 'map.png'],
            ['w' => 'Tap', 'cat' => 'cvc', 'img' => 'tap.png', 'w1' => 'Cat', 'w1img' => 'cat.png', 'w2' => 'Cap', 'w2img' => 'cap.png'],
        ];
        $this->createWords($unitId, $folder, $cvc, 'cvc');

        $this->createLessons($unitId, [
            ['num' => 1, 'title' => 'My favourite toy', 'page' => 30, 'type' => 'intro',
             'audio' => 'PB30', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Car', 'Ball', 'Teddy', 'Robot', 'Doll', 'Plane', 'Train', 'Yoyo'],
                'prompt' => 'Listen, point and say.',
                'audio_tracks' => ['AB30', 'PB30', 'PB30_2'],
             ]],
            ['num' => 2, 'title' => 'What colour is it?', 'page' => 31, 'type' => 'vocab-game',
             'audio' => 'PB31', 'conf' => [
                'mode' => 'vocab-game', 'category' => 'toy',
                'rounds' => 6, 'question_style' => 'word-to-image',
                'options_per_round' => 3, 'decoy_pool' => 'same_category',
                'prompt' => 'Listen and circle.',
                'audio_tracks' => ['AB31', 'AB31_2', 'PB31', 'PB31_2', 'PB31_3'],
             ]],
            ['num' => 3, 'title' => 'Story: Find Sue', 'page' => 32, 'type' => 'intro',
             'audio' => 'PB32', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Ball', 'Car', 'Doll', 'Teddy'],
                'prompt' => 'Listen and read — Find Sue.',
                'value' => 'Share.',
                'audio_tracks' => ['AB32', 'PB32'],
             ]],
            ['num' => 4, 'title' => 'Sing & match (feelings)', 'page' => 33, 'type' => 'review',
             'audio' => 'PB33_3', 'conf' => [
                'mode' => 'review', 'categories' => ['toy', 'feeling'],
                'rounds' => 6, 'styles' => ['word-to-image', 'image-to-word'],
                'prompt' => 'How do you feel? Listen, match and sing!',
                'audio_tracks' => ['PB33', 'PB33_2', 'PB33_3', 'PB33_4'],
             ]],
            ['num' => 5, 'title' => 'CVC words 1', 'page' => 34, 'type' => 'phonics-game',
             'audio' => 'PB34', 'conf' => [
                'mode' => 'phonics-game', 'phonics_sets' => ['cvc'],
                'rounds' => 6, 'question_style' => 'sound-to-word',
                'options_per_round' => 3,
                'prompt' => 'Listen and blend the sounds.',
                'audio_tracks' => ['AB34', 'AB34_2', 'PB34', 'PB34_2'],
             ]],
            ['num' => 6, 'title' => 'CVC words 2', 'page' => 35, 'type' => 'phonics-game',
             'audio' => 'PB35', 'conf' => [
                'mode' => 'phonics-game', 'phonics_sets' => ['cvc'],
                'rounds' => 6, 'question_style' => 'sound-to-word',
                'options_per_round' => 3,
                'prompt' => 'Listen, order and write.',
                'audio_tracks' => ['AB35', 'PB35'],
             ]],
            ['num' => 7, 'title' => 'Project: A toy box', 'page' => 36, 'type' => 'intro',
             'audio' => 'PB36_2', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Ball', 'Car', 'Teddy', 'Robot', 'Doll'],
                'prompt' => 'Make your toy box and sing!',
                'audio_tracks' => ['PB36_2'],
                'video_track' => 'PB36V',
             ]],
            ['num' => 8, 'title' => 'Picture dictionary', 'page' => 37, 'type' => 'review',
             'audio' => 'PB37', 'conf' => [
                'mode' => 'review', 'categories' => ['toy'],
                'rounds' => 8, 'styles' => ['word-to-image', 'image-to-word'],
                'prompt' => 'Listen and trace.',
                'audio_tracks' => ['AB37', 'PB37', 'PB37_2'],
             ]],
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // U5  Learning Club: Days of the week  (pages 38-39)
    // ══════════════════════════════════════════════════════════
    protected function seedLearningClub(int $unitId): void
    {
        $folder = 'lc';
        $days = [
            ['w' => 'Sunday',    'cat' => 'day', 'img' => 'sunday.png',    'w1' => 'Monday',   'w1img' => 'monday.png',   'w2' => 'Saturday', 'w2img' => 'saturday.png'],
            ['w' => 'Monday',    'cat' => 'day', 'img' => 'monday.png',    'w1' => 'Tuesday',  'w1img' => 'tuesday.png',  'w2' => 'Sunday',   'w2img' => 'sunday.png'],
            ['w' => 'Tuesday',   'cat' => 'day', 'img' => 'tuesday.png',   'w1' => 'Wednesday','w1img' => 'wednesday.png','w2' => 'Monday',   'w2img' => 'monday.png'],
            ['w' => 'Wednesday', 'cat' => 'day', 'img' => 'wednesday.png', 'w1' => 'Thursday', 'w1img' => 'thursday.png', 'w2' => 'Tuesday',  'w2img' => 'tuesday.png'],
            ['w' => 'Thursday',  'cat' => 'day', 'img' => 'thursday.png',  'w1' => 'Friday',   'w1img' => 'friday.png',   'w2' => 'Wednesday','w2img' => 'wednesday.png'],
            ['w' => 'Friday',    'cat' => 'day', 'img' => 'friday.png',    'w1' => 'Saturday', 'w1img' => 'saturday.png', 'w2' => 'Thursday', 'w2img' => 'thursday.png'],
            ['w' => 'Saturday',  'cat' => 'day', 'img' => 'saturday.png',  'w1' => 'Sunday',   'w1img' => 'sunday.png',   'w2' => 'Friday',   'w2img' => 'friday.png'],
        ];
        $this->createWords($unitId, $folder, $days, 'vocab');

        $this->createLessons($unitId, [
            ['num' => 1, 'title' => 'Days of the week', 'page' => 38, 'type' => 'intro',
             'audio' => 'PB38', 'conf' => [
                'mode' => 'intro',
                'word_filter' => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                'prompt' => 'Listen, point and say.',
                'audio_tracks' => ['PB38', 'PB38_2'],
             ]],
            ['num' => 2, 'title' => 'Practice: days', 'page' => 39, 'type' => 'vocab-game',
             'audio' => 'PB39', 'conf' => [
                'mode' => 'vocab-game', 'category' => 'day',
                'rounds' => 7, 'question_style' => 'word-to-image',
                'options_per_round' => 3, 'decoy_pool' => 'same_category',
                'prompt' => 'Listen and circle / Look, order and say.',
                'audio_tracks' => ['PB39', 'PB39_2'],
             ]],
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // Helpers
    // ══════════════════════════════════════════════════════════
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
     * Seed words with a shared type (vocab / phonics / cvc).
     * An existing (unit_id, word) row is updated; its type and
     * category may shift if the same word appears in a different
     * pedagogical role. For phonics/cvc rows we append a suffix to
     * word so vocab and phonics rows for the same word can coexist.
     */
    protected function createWords(int $unitId, string $folder, array $items, string $type): void
    {
        foreach ($items as $it) {
            $isVocab = $type === 'vocab';
            $wordKey = $isVocab ? $it['w'] : "{$it['w']} ({$type}:{$it['cat']})";

            $wrong = null;
            if (isset($it['w1'], $it['w2'])) {
                $wrong = [
                    ['word' => $it['w1'], 'image_path' => "assets/lessons/{$folder}/{$it['w1img']}"],
                    ['word' => $it['w2'], 'image_path' => "assets/lessons/{$folder}/{$it['w2img']}"],
                ];
            }

            Word::updateOrCreate(
                ['unit_id' => $unitId, 'word' => $wordKey],
                [
                    'type'          => $type,
                    'category'      => $it['cat'] ?? null,
                    'image_path'    => isset($it['img']) ? "assets/lessons/{$folder}/{$it['img']}" : null,
                    'audio_path'    => 'assets/audio/words/' . $folder . '/'
                        . strtolower(str_replace(' ', '', $it['w'])) . '.mp3',
                    'wrong_options' => $wrong,
                ]
            );
        }
    }

    protected function createLessons(int $unitId, array $lessons): void
    {
        foreach ($lessons as $l) {
            $trackId = null;
            if (! empty($l['audio'])) {
                $trackId = AudioTrack::where('code', $l['audio'])->value('id');
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
