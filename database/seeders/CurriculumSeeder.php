<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Unit;
use App\Models\Word;

class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        // الوحدة الأولى
        $unit1 = Unit::create(['unit_number' => 1, 'title' => 'Welcome Island', 'image_path' => '/assets/lessons/welcome/hut.png', 'color_key' => 'purple']);
        Word::create(['unit_id' => $unit1->id, 'word' => 'Hello', 'image_path' => '/assets/lessons/welcome/hello.png', 'wrong_options' => ['Desk', 'Bag']]);

        // الوحدة الثانية
        $unit2 = Unit::create(['unit_number' => 2, 'title' => 'Family Tree', 'image_path' => '/assets/lessons/family/treehouse.png', 'color_key' => 'blue']);
        Word::create(['unit_id' => $unit2->id, 'word' => 'Family', 'image_path' => '/assets/lessons/family/family_group.png', 'wrong_options' => ['toy', 'Pencil']]);

        // الوحدة الثالثة
        $unit3 = Unit::create(['unit_number' => 3, 'title' => 'My School Bag', 'image_path' => '/assets/lessons/schoolbag/bag.png', 'color_key' => 'pink']);
        Word::create(['unit_id' => $unit3->id, 'word' => 'Pencil', 'image_path' => '/assets/lessons/schoolbag/pencil.png', 'wrong_options' => ['Family', 'Hello']]);

        // الوحدة الرابعة
        $unit4 = Unit::create(['unit_number' => 4, 'title' => 'Our Classroom', 'image_path' => '/assets/lessons/classroom/desk.png', 'color_key' => 'orange']);
        Word::create(['unit_id' => $unit4->id, 'word' => 'Desk', 'image_path' => '/assets/lessons/classroom/desk.png', 'wrong_options' => ['Bag', 'toy']]);

        // الوحدة الخامسة
        $unit5 = Unit::create(['unit_number' => 5, 'title' => 'My Favourite Toy', 'image_path' => '/assets/lessons/toy/toy.png', 'color_key' => 'green']);
        Word::create(['unit_id' => $unit5->id, 'word' => 'toy', 'image_path' => '/assets/lessons/toy/toy.png', 'wrong_options' => ['Hello', 'Desk']]);
    }
}