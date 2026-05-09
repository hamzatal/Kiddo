<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;
use App\Models\Word;

class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        // ══════════════════════════════════════════════════════════════════
        // 🎨 الوحدة الترحيبية: Welcome Hello!
        // ══════════════════════════════════════════════════════════════════
        $welcome = Unit::create([
            'unit_number' => 1,
            'title' => 'Welcome Hello!',
            'description' => 'التعارف، الألوان، والأرقام من 1-10',
            'image_path' => '/assets/lessons/welcome/hero.png',
            'color_key' => 'purple',
            'lessons_count' => 4
        ]);

        $welcomeWords = [
            // التحيات والشخصيات
            ['w' => 'Hello', 'img' => 'hello.png', 'wrong' => ['Hi', 'Good morning']],
            ['w' => 'Hi', 'img' => 'hi.png', 'wrong' => ['Hello', 'Good morning']],
            ['w' => 'Good morning', 'img' => 'good_morning.png', 'wrong' => ['Hello', 'Hi']],
            ['w' => 'Hala', 'img' => 'hala.png', 'wrong' => ['Lama', 'Bill']],
            ['w' => 'Lama', 'img' => 'lama.png', 'wrong' => ['Hala', 'Malek']],
            ['w' => 'Bill', 'img' => 'bill.png', 'wrong' => ['Malek', 'Hala']],
            ['w' => 'Malek', 'img' => 'malek.png', 'wrong' => ['Bill', 'Lama']],

            // الألوان الستة
            ['w' => 'Blue', 'img' => 'blue.png', 'wrong' => ['Red', 'Green']],
            ['w' => 'Green', 'img' => 'green.png', 'wrong' => ['Yellow', 'Blue']],
            ['w' => 'Orange', 'img' => 'orange.png', 'wrong' => ['Brown', 'Red']],
            ['w' => 'Red', 'img' => 'red.png', 'wrong' => ['Blue', 'Yellow']],
            ['w' => 'Yellow', 'img' => 'yellow.png', 'wrong' => ['Green', 'Orange']],
            ['w' => 'Brown', 'img' => 'brown.png', 'wrong' => ['Orange', 'Red']],

            // الأرقام 1-10
            ['w' => 'One', 'img' => 'one.png', 'wrong' => ['Two', 'Three']],
            ['w' => 'Two', 'img' => 'two.png', 'wrong' => ['One', 'Four']],
            ['w' => 'Three', 'img' => 'three.png', 'wrong' => ['Five', 'Two']],
            ['w' => 'Four', 'img' => 'four.png', 'wrong' => ['Six', 'Three']],
            ['w' => 'Five', 'img' => 'five.png', 'wrong' => ['Four', 'Seven']],
            ['w' => 'Six', 'img' => 'six.png', 'wrong' => ['Nine', 'Five']],
            ['w' => 'Seven', 'img' => 'seven.png', 'wrong' => ['Eight', 'Six']],
            ['w' => 'Eight', 'img' => 'eight.png', 'wrong' => ['Seven', 'Ten']],
            ['w' => 'Nine', 'img' => 'nine.png', 'wrong' => ['Ten', 'Six']],
            ['w' => 'Ten', 'img' => 'ten.png', 'wrong' => ['Nine', 'Eight']],
        ];

        foreach ($welcomeWords as $item) {
            $wrong1 = str_replace(' ', '_', strtolower($item['wrong'][0]));
            $wrong2 = str_replace(' ', '_', strtolower($item['wrong'][1]));
            $audioName = str_replace(' ', '_', strtolower($item['w']));

            Word::create([
                'unit_id' => $welcome->id,
                'word' => $item['w'],
                'audio_path' => '/assets/audio/lessons/welcome/' . $audioName . '.mp3',
                'image_path' => '/assets/lessons/welcome/' . $item['img'],
                'wrong_options' => [
                    ['word' => $item['wrong'][0], 'image_path' => '/assets/lessons/welcome/' . $wrong1 . '.png'],
                    ['word' => $item['wrong'][1], 'image_path' => '/assets/lessons/welcome/' . $wrong2 . '.png'],
                ]
            ]);
        }

        // ══════════════════════════════════════════════════════════════════
        // 👨‍👩‍👧‍👦 الوحدة الأولى: Family and friends
        // ══════════════════════════════════════════════════════════════════
        $family = Unit::create([
            'unit_number' => 2,
            'title' => 'Family and friends',
            'description' => 'العائلة، الأصدقاء، والحروف الصوتية',
            'image_path' => '/assets/lessons/family/hero.png',
            'color_key' => 'green',
            'lessons_count' => 7
        ]);

        $familyWords = [
            // المفردات الأساسية
            ['w' => 'Boy', 'img' => 'boy.png', 'wrong' => ['Girl', 'Cat']],
            ['w' => 'Girl', 'img' => 'girl.png', 'wrong' => ['Boy', 'Friend']],
            ['w' => 'Cat', 'img' => 'cat.png', 'wrong' => ['Boy', 'Girl']],
            ['w' => 'Friend', 'img' => 'friend.png', 'wrong' => ['Boy', 'Sister']],
            ['w' => 'Mum', 'img' => 'mum.png', 'wrong' => ['Dad', 'Sister']],
            ['w' => 'Dad', 'img' => 'dad.png', 'wrong' => ['Mum', 'Brother']],
            ['w' => 'Brother', 'img' => 'brother.png', 'wrong' => ['Sister', 'Dad']],
            ['w' => 'Sister', 'img' => 'sister.png', 'wrong' => ['Brother', 'Mum']],

            // Phonics - Ss
            ['w' => 'Sing', 'img' => 'sing.png', 'wrong' => ['Sun', 'Dig']],
            ['w' => 'Six', 'img' => 'six.png', 'wrong' => ['Sun', 'Sister']],
            ['w' => 'Sister', 'img' => 'sister_phonics.png', 'wrong' => ['Sing', 'Sun']],
            ['w' => 'Sun', 'img' => 'sun.png', 'wrong' => ['Sing', 'Six']],

            // Phonics - Dd
            ['w' => 'Dig', 'img' => 'dig.png', 'wrong' => ['Duck', 'Doll']],
            ['w' => 'Dad', 'img' => 'dad_phonics.png', 'wrong' => ['Duck', 'Doll']],
            ['w' => 'Doll', 'img' => 'doll.png', 'wrong' => ['Duck', 'Dig']],
            ['w' => 'Duck', 'img' => 'duck.png', 'wrong' => ['Doll', 'Dad']],

            // Phonics - Cc
            ['w' => 'Cut', 'img' => 'cut.png', 'wrong' => ['Cup', 'Cap']],
            ['w' => 'Cap', 'img' => 'cap.png', 'wrong' => ['Cup', 'Cat']],
            ['w' => 'Cat', 'img' => 'cat_phonics.png', 'wrong' => ['Cup', 'Cut']],
            ['w' => 'Cup', 'img' => 'cup.png', 'wrong' => ['Cap', 'Cut']],

            // Phonics - Aa
            ['w' => 'Apple', 'img' => 'apple.png', 'wrong' => ['Ant', 'Alligator']],
            ['w' => 'Alligator', 'img' => 'alligator.png', 'wrong' => ['Ant', 'Apple']],
            ['w' => 'Ann', 'img' => 'ann.png', 'wrong' => ['Ant', 'Apple']],
            ['w' => 'Ant', 'img' => 'ant.png', 'wrong' => ['Apple', 'Ann']],
        ];

        foreach ($familyWords as $item) {
            $wrong1 = str_replace(' ', '_', strtolower($item['wrong'][0]));
            $wrong2 = str_replace(' ', '_', strtolower($item['wrong'][1]));
            $audioName = str_replace(' ', '_', strtolower($item['w']));

            Word::create([
                'unit_id' => $family->id,
                'word' => $item['w'],
                'audio_path' => '/assets/audio/lessons/family/' . $audioName . '.mp3',
                'image_path' => '/assets/lessons/family/' . $item['img'],
                'wrong_options' => [
                    ['word' => $item['wrong'][0], 'image_path' => '/assets/lessons/family/' . $wrong1 . '.png'],
                    ['word' => $item['wrong'][1], 'image_path' => '/assets/lessons/family/' . $wrong2 . '.png'],
                ]
            ]);
        }

        echo "✅ تم إدخال الوحدة الترحيبية: " . $welcomeWords->count() . " كلمة\n";
        echo "✅ تم إدخال وحدة العائلة: " . count($familyWords) . " كلمة\n";
        echo "🎉 المنهاج الكامل جاهز!\n";
    }
}
