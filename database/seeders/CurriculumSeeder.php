<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;
use App\Models\Word;

class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        // 1. الوحدة الأولى: Welcome / Hello
        $unit1 = Unit::create([
            'unit_number' => 1,
            'title' => 'Welcome / Hello',
            'image_path' => '/assets/lessons/welcome/hello.png',
            'color_key' => 'purple'
        ]);

        Word::create(['unit_id' => $unit1->id, 'word' => 'Boy', 'image_path' => '/assets/lessons/welcome/boy.png', 'audio_path' => '/assets/audio/boy.mp3', 'wrong_options' => ['Girl', 'Car', 'Apple']]);
        Word::create(['unit_id' => $unit1->id, 'word' => 'Girl', 'image_path' => '/assets/lessons/welcome/girl.png', 'audio_path' => '/assets/audio/girl.mp3', 'wrong_options' => ['Boy', 'Dog', 'Desk']]);
        Word::create(['unit_id' => $unit1->id, 'word' => 'Teacher', 'image_path' => '/assets/lessons/welcome/teacher.png', 'audio_path' => '/assets/audio/teacher.mp3', 'wrong_options' => ['Boy', 'Bear', 'Bag']]);

        // 2. الوحدة الثانية: Family and Friends
        $unit2 = Unit::create([
            'unit_number' => 2,
            'title' => 'Family and Friends',
            'image_path' => '/assets/lessons/family/family_group.png',
            'color_key' => 'green'
        ]);

        Word::create(['unit_id' => $unit2->id, 'word' => 'Dad', 'image_path' => '/assets/lessons/family/dad.png', 'audio_path' => '/assets/audio/dad.mp3', 'wrong_options' => ['Mum', 'Brother', 'Cat']]);
        Word::create(['unit_id' => $unit2->id, 'word' => 'Mum', 'image_path' => '/assets/lessons/family/mum.png', 'audio_path' => '/assets/audio/mum.mp3', 'wrong_options' => ['Dad', 'Sister', 'Dog']]);
        Word::create(['unit_id' => $unit2->id, 'word' => 'Brother', 'image_path' => '/assets/lessons/family/brother.png', 'audio_path' => '/assets/audio/brother.mp3', 'wrong_options' => ['Sister', 'Mum', 'Bird']]);
        Word::create(['unit_id' => $unit2->id, 'word' => 'Sister', 'image_path' => '/assets/lessons/family/sister.png', 'audio_path' => '/assets/audio/sister.mp3', 'wrong_options' => ['Brother', 'Dad', 'Fish']]);

        // 3. الوحدة الثالثة: My School Bag
        $unit3 = Unit::create([
            'unit_number' => 3,
            'title' => 'My School Bag',
            'image_path' => '/assets/lessons/schoolbag/bag.png',
            'color_key' => 'blue'
        ]);

        Word::create(['unit_id' => $unit3->id, 'word' => 'Bag', 'image_path' => '/assets/lessons/schoolbag/bag.png', 'audio_path' => '/assets/audio/bag.mp3', 'wrong_options' => ['Book', 'Car', 'Desk']]);
        Word::create(['unit_id' => $unit3->id, 'word' => 'Book', 'image_path' => '/assets/lessons/schoolbag/book.png', 'audio_path' => '/assets/audio/book.mp3', 'wrong_options' => ['Bag', 'Ball', 'Chair']]);
        Word::create(['unit_id' => $unit3->id, 'word' => 'Pencil', 'image_path' => '/assets/lessons/schoolbag/pencil.png', 'audio_path' => '/assets/audio/pencil.mp3', 'wrong_options' => ['Pen', 'Bear', 'Board']]);

        // 4. الوحدة الرابعة: Our Classroom
        $unit4 = Unit::create([
            'unit_number' => 4,
            'title' => 'Our Classroom',
            'image_path' => '/assets/lessons/classroom/desk.png',
            'color_key' => 'pink'
        ]);

        Word::create(['unit_id' => $unit4->id, 'word' => 'Desk', 'image_path' => '/assets/lessons/classroom/desk.png', 'audio_path' => '/assets/audio/desk.mp3', 'wrong_options' => ['Chair', 'Bag', 'Window']]);
        Word::create(['unit_id' => $unit4->id, 'word' => 'Chair', 'image_path' => '/assets/lessons/classroom/chair.png', 'audio_path' => '/assets/audio/chair.mp3', 'wrong_options' => ['Desk', 'Book', 'Door']]);
        Word::create(['unit_id' => $unit4->id, 'word' => 'Board', 'image_path' => '/assets/lessons/classroom/board.png', 'audio_path' => '/assets/audio/board.mp3', 'wrong_options' => ['Window', 'Door', 'Pencil']]);

        // 5. الوحدة الخامسة: My Favourite Toy
        $unit5 = Unit::create([
            'unit_number' => 5,
            'title' => 'My Favourite Toy',
            'image_path' => '/assets/lessons/toy/ball.png',
            'color_key' => 'amber'
        ]);

        Word::create(['unit_id' => $unit5->id, 'word' => 'Ball', 'image_path' => '/assets/lessons/toy/ball.png', 'audio_path' => '/assets/audio/ball.mp3', 'wrong_options' => ['Doll', 'Car', 'Desk']]);
        Word::create(['unit_id' => $unit5->id, 'word' => 'Car', 'image_path' => '/assets/lessons/toy/car.png', 'audio_path' => '/assets/audio/car.mp3', 'wrong_options' => ['Ball', 'Train', 'Book']]);
        Word::create(['unit_id' => $unit5->id, 'word' => 'Bear', 'image_path' => '/assets/lessons/toy/bear.png', 'audio_path' => '/assets/audio/bear.mp3', 'wrong_options' => ['Dog', 'Cat', 'Bag']]);
    }
}
