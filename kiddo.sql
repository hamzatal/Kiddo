-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 18, 2026 at 04:04 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kiddo`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_interactions`
--

DROP TABLE IF EXISTS `ai_interactions`;
CREATE TABLE IF NOT EXISTS `ai_interactions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `context` enum('lesson-helper','parent-report','help-center','pronunciation') NOT NULL,
  `unit_id` bigint UNSIGNED DEFAULT NULL,
  `lesson_id` bigint UNSIGNED DEFAULT NULL,
  `payload` json DEFAULT NULL,
  `response` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ai_interactions_user_id_foreign` (`user_id`),
  KEY `ai_interactions_unit_id_foreign` (`unit_id`),
  KEY `ai_interactions_lesson_id_foreign` (`lesson_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ai_interactions`
--

INSERT INTO `ai_interactions` (`id`, `user_id`, `context`, `unit_id`, `lesson_id`, `payload`, `response`, `created_at`, `updated_at`) VALUES
(1, 1, 'parent-report', NULL, NULL, '{\"xp\": 45, \"name\": \"Kiddo Admin\", \"units\": [{\"unit\": \"Welcome: Hello!\", \"status\": \"active\", \"stars_earned\": 4, \"total_lessons\": 4, \"current_lesson\": 5}], \"weakWords\": [{\"word\": \"Orange\", \"wrong\": 2}, {\"word\": \"Yellow\", \"wrong\": 2}, {\"word\": \"One\", \"wrong\": 1}, {\"word\": \"Eight\", \"wrong\": 1}, {\"word\": \"Three\", \"wrong\": 1}, {\"word\": \"Brown\", \"wrong\": 1}], \"total_stars\": 4}', 'You\'re doing great! Keep going and have fun.', '2026-05-15 10:41:10', '2026-05-15 10:41:10'),
(2, 2, 'parent-report', NULL, NULL, '{\"xp\": 235, \"name\": \"hamza\", \"units\": [{\"unit\": \"Welcome: Hello!\", \"status\": \"active\", \"stars_earned\": 5, \"total_lessons\": 4, \"current_lesson\": 5}], \"weakWords\": [{\"word\": \"Red\", \"wrong\": 2}, {\"word\": \"Blue\", \"wrong\": 1}, {\"word\": \"Orange\", \"wrong\": 1}, {\"word\": \"Yellow\", \"wrong\": 1}, {\"word\": \"Sister\", \"wrong\": 1}, {\"word\": \"Brother\", \"wrong\": 1}], \"total_stars\": 24}', 'You\'re doing great! Keep going and have fun.', '2026-05-15 15:27:40', '2026-05-15 15:27:40'),
(3, 1, 'lesson-helper', 1, NULL, '{\"word\": \"Two\", \"prompt\": \"Explain this word in one short, simple sentence.\"}', 'Two means the number after one.', '2026-05-16 07:44:20', '2026-05-16 07:44:20');

-- --------------------------------------------------------

--
-- Table structure for table `audio_tracks`
--

DROP TABLE IF EXISTS `audio_tracks`;
CREATE TABLE IF NOT EXISTS `audio_tracks` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(32) NOT NULL,
  `source` enum('ab','pb','part2','new_g1') NOT NULL DEFAULT 'ab',
  `book_type` enum('ab','pb') NOT NULL DEFAULT 'ab',
  `semester` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `page` smallint UNSIGNED NOT NULL,
  `track_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `label` varchar(191) DEFAULT NULL,
  `kind` enum('listen_and_point','listen_point_say','listen_and_count','listen_and_read','listen_and_trace','listen_and_circle','listen_and_colour','listen_write_colour','listen_and_match','phonics','story','song','dialogue','revision','other') NOT NULL DEFAULT 'other',
  `url` varchar(512) NOT NULL,
  `local_path` varchar(512) DEFAULT NULL,
  `format` enum('mp3','mp4') NOT NULL DEFAULT 'mp3',
  `file_size` int UNSIGNED DEFAULT NULL,
  `duration_sec` smallint UNSIGNED DEFAULT NULL,
  `downloaded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `audio_tracks_code_unique` (`code`),
  KEY `audio_tracks_source_page_index` (`source`,`page`),
  KEY `audio_tracks_book_type_page_track_no_index` (`book_type`,`page`,`track_no`)
) ENGINE=MyISAM AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `audio_tracks`
--

INSERT INTO `audio_tracks` (`id`, `code`, `source`, `book_type`, `semester`, `page`, `track_no`, `label`, `kind`, `url`, `local_path`, `format`, `file_size`, `duration_sec`, `downloaded_at`, `created_at`, `updated_at`) VALUES
(1, 'AB4', 'ab', 'ab', 1, 4, 1, 'Welcome p4: Listen and point (Hello/Hi/Good morning scene)', 'listen_and_point', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p4.mp3', NULL, 'mp3', 2178608, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:07:43'),
(2, 'AB4_2', 'ab', 'ab', 1, 4, 2, 'Welcome p4: Listen, point and say (characters Bill, Hala, Malek, Lama)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p4.2.mp3', NULL, 'mp3', 653046, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:07:44'),
(3, 'AB5', 'ab', 'ab', 1, 5, 1, 'Welcome p5: Listen, point and say (colours & numbers 1-10)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p5.mp3', NULL, 'mp3', 937876, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:07:46'),
(4, 'AB6', 'ab', 'ab', 1, 6, 1, 'U1 L1 p6: Listen, point and say (boy, brother, cat, dad, friend, girl, mum, sister)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p6.mp3', NULL, 'mp3', 2675652, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:07:48'),
(5, 'AB7', 'ab', 'ab', 1, 7, 1, 'U1 L3 p7: Language practice — Listen and circle', 'listen_and_circle', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p7.mp3', NULL, 'mp3', 678086, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:07:51'),
(6, 'AB7_2', 'ab', 'ab', 1, 7, 2, 'U1 L3 p7: Listen and number', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p7.2.mp3', NULL, 'mp3', 621120, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:07:51'),
(7, 'AB9', 'ab', 'ab', 1, 9, 1, 'U1 L7 p9: Listen again / Listen and match / Listen and sing', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p9.mp3', NULL, 'mp3', 1119416, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:07:55'),
(8, 'AB10', 'ab', 'ab', 1, 10, 1, 'U1 L9 p10: Phonics Ss, Dd — Listen, point and say (sing, dig, sun, duck)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p10.mp3', NULL, 'mp3', 638648, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:07:58'),
(9, 'AB10_2', 'ab', 'ab', 1, 10, 2, 'U1 L9 p10: Listen and circle the sound', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p10.2.mp3', NULL, 'mp3', 693736, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:07:58'),
(10, 'AB11', 'ab', 'ab', 1, 11, 1, 'U1 L10 p11: Phonics Cc, Aa — Listen, point and say (cut, cap, apple, ant)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p11.mp3', NULL, 'mp3', 1433042, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:00'),
(11, 'AB11_2', 'ab', 'ab', 1, 11, 2, 'U1 L10 p11: Listen and circle the sound', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p11.2.mp3', NULL, 'mp3', 1111278, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:01'),
(12, 'AB12', 'ab', 'ab', 1, 12, 1, 'U1 L11 p12: Finger puppets project — Sing and play', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p12.mp3', NULL, 'mp3', 1174504, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:03'),
(13, 'AB12_2', 'ab', 'ab', 1, 12, 2, 'U1 L11 p12: Make and show instructions', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p12.2.mp3', NULL, 'mp3', 669322, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:03'),
(14, 'AB12V', 'ab', 'ab', 1, 12, 1, 'U1 L11 p12: Finger puppets video', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p12.mp4', NULL, 'mp4', 25980965, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:05'),
(15, 'AB13', 'ab', 'ab', 1, 13, 1, 'U1 Picture dictionary p13: Listen and trace (8 family words)', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p13.mp3', NULL, 'mp3', 908454, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:05'),
(16, 'AB14', 'ab', 'ab', 1, 14, 1, 'U2 L1 p14: Listen, point and say (pen, eraser, ruler, bag; pencil case, crayon, book, pencil)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p14.mp3', NULL, 'mp3', 3772404, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:08'),
(17, 'AB15', 'ab', 'ab', 1, 15, 1, 'U2 L3 p15: Language practice — Listen and circle (I\'ve got / I haven\'t got)', 'listen_and_circle', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p15.mp3', NULL, 'mp3', 669948, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:12'),
(18, 'AB15_2', 'ab', 'ab', 1, 15, 2, 'U2 L3 p15: Listen and number', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p15.2.mp3', NULL, 'mp3', 698744, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:13'),
(19, 'AB18', 'ab', 'ab', 1, 18, 1, 'U2 L9 p18: Phonics Pp, Rr — Listen, point and say (pen, pink, pencil; rabbit, red, run, ruler)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p18.mp3', NULL, 'mp3', 657428, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:19'),
(20, 'AB18_2', 'ab', 'ab', 1, 18, 2, 'U2 L9 p18: Listen and circle the sound', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p18.2.mp3', NULL, 'mp3', 1404246, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:20'),
(21, 'AB19', 'ab', 'ab', 1, 19, 1, 'U2 L10 p19: Phonics Ee, Bb — Listen, point and say (elephant, egg; book, ball, bag, boy)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p19.mp3', NULL, 'mp3', 979192, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:22'),
(22, 'AB19_2', 'ab', 'ab', 1, 19, 2, 'U2 L10 p19: Listen and circle the sound', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p19.2.mp3', NULL, 'mp3', 745694, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:22'),
(23, 'AB20', 'ab', 'ab', 1, 20, 1, 'U2 L11 p20: A school bag project — Sing and play', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p20.mp3', NULL, 'mp3', 1180138, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:24'),
(24, 'AB20_2', 'ab', 'ab', 1, 20, 2, 'U2 L11 p20: Make and show instructions', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p20.2.mp3', NULL, 'mp3', 681216, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:25'),
(25, 'AB20V', 'ab', 'ab', 1, 20, 1, 'U2 L11 p20: School bag project video', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p20.mp4', NULL, 'mp4', 25876403, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:26'),
(26, 'AB21', 'ab', 'ab', 1, 21, 1, 'U2 Picture dictionary p21: Listen and trace (8 school objects)', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p21.mp3', NULL, 'mp3', 768856, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:27'),
(27, 'AB22', 'ab', 'ab', 1, 22, 1, 'U3 L1 p22: Listen, point and say (teacher, whiteboard, door, window; chair, desk, floor, wall)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p22.mp3', NULL, 'mp3', 2475958, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:29'),
(28, 'AB23', 'ab', 'ab', 1, 23, 1, 'U3 L3 p23: Language practice — Listen and number (on/in/under)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p23.mp3', NULL, 'mp3', 689980, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:32'),
(29, 'AB23_2', 'ab', 'ab', 1, 23, 2, 'U3 L3 p23: Listen and tick', 'listen_and_circle', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p23.2.mp3', NULL, 'mp3', 870894, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:32'),
(30, 'AB26', 'ab', 'ab', 1, 26, 1, 'U3 L9 p26: Phonics Tt, Mm — Listen, point and say (teddy, teacher; mouse, milk, moon, mum)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p26.mp3', NULL, 'mp3', 650542, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:39'),
(31, 'AB27', 'ab', 'ab', 1, 27, 1, 'U3 L10 p27: Phonics Ww, Ii — Listen, point and say (wave, wall, water, whiteboard; insect, ink, igloo)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p27.mp3', NULL, 'mp3', 966672, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:42'),
(32, 'AB27_2', 'ab', 'ab', 1, 27, 2, 'U3 L10 p27: Listen and circle the sound', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p27.2.mp3', NULL, 'mp3', 527846, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:43'),
(33, 'AB28', 'ab', 'ab', 1, 28, 1, 'U3 L11 p28: A pen pot project — Listen and play', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p28.mp3', NULL, 'mp3', 1473106, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:45'),
(34, 'AB28_2', 'ab', 'ab', 1, 28, 2, 'U3 L11 p28: Make and show instructions', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p28.2.mp3', NULL, 'mp3', 657428, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:45'),
(35, 'AB28V', 'ab', 'ab', 1, 28, 1, 'U3 L11 p28: Pen pot project video', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p28.mp4', NULL, 'mp4', 52510638, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:47'),
(36, 'AB29', 'ab', 'ab', 1, 29, 1, 'U3 Picture dictionary p29: Listen and trace (8 classroom words)', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p29.mp3', NULL, 'mp3', 976062, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:47'),
(37, 'AB30', 'ab', 'ab', 1, 30, 1, 'U4 L1 p30: Listen, point and say (car, ball, teddy, robot; doll, plane, train, yoyo)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p30.mp3', NULL, 'mp3', 2815876, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:49'),
(38, 'AB31', 'ab', 'ab', 1, 31, 1, 'U4 L3 p31: Language practice — Listen and circle (What colour is it?)', 'listen_and_circle', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p31.mp3', NULL, 'mp3', 684972, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:52'),
(39, 'AB31_2', 'ab', 'ab', 1, 31, 2, 'U4 L3 p31: Listen and number', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p31.2.mp3', NULL, 'mp3', 1141326, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:52'),
(40, 'AB32', 'ab', 'ab', 1, 32, 1, 'U4 L5 p32: Story Find Sue — Listen and read (value: share)', 'story', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p32.mp3', NULL, 'mp3', 1153220, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:54'),
(41, 'AB34', 'ab', 'ab', 1, 34, 1, 'U4 L9 p34: CVC words — sound blending (red, cat, mat, sit, bed, web)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p34.mp3', NULL, 'mp3', 636144, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:08:59'),
(42, 'AB35', 'ab', 'ab', 1, 35, 1, 'U4 L10 p35: CVC words — Listen, order and write (sad, wet, map, bat, cap, tap)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p35.mp3', NULL, 'mp3', 1011744, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:01'),
(43, 'AB36V', 'ab', 'ab', 1, 36, 1, 'U4 L11 p36: A toy box project video', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p36.mp4', NULL, 'mp4', 44487947, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:05'),
(44, 'AB37', 'ab', 'ab', 1, 37, 1, 'U4 Picture dictionary p37: Listen and trace (8 toy words)', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/ab/p37.mp3', NULL, 'mp3', 1046174, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:06'),
(45, 'PB4', 'pb', 'pb', 1, 4, 1, 'PB Welcome p4: Listen, point and say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p4.mp3', NULL, 'mp3', NULL, NULL, NULL, '2026-05-13 01:13:04', '2026-05-13 01:13:04'),
(46, 'PB5', 'pb', 'pb', 1, 5, 1, 'PB Welcome p5: Colours and numbers', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p5.mp3', NULL, 'mp3', NULL, NULL, NULL, '2026-05-13 01:13:04', '2026-05-13 01:13:04'),
(47, 'PB6', 'pb', 'pb', 1, 6, 1, 'PB U1 L1 p6: Listen and follow (family vocabulary)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p6.mp3', NULL, 'mp3', 2210534, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:27'),
(48, 'PB6_2', 'pb', 'pb', 1, 6, 2, 'PB U1 L1 p6: Listen, point and say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p6.2.mp3', NULL, 'mp3', 644282, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:28'),
(49, 'PB7', 'pb', 'pb', 1, 7, 1, 'PB U1 L3 p7: Listen and circle', 'listen_and_circle', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p7.mp3', NULL, 'mp3', 622372, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:30'),
(50, 'PB7_2', 'pb', 'pb', 1, 7, 2, 'PB U1 L3 p7: Listen and number', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p7.2.mp3', NULL, 'mp3', 1000476, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:30'),
(51, 'PB7_3', 'pb', 'pb', 1, 7, 3, 'PB U1 L3 p7: Listen. Then say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p7.3.mp3', NULL, 'mp3', 719402, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:30'),
(52, 'PB8', 'pb', 'pb', 1, 8, 1, 'PB U1 L5 p8: Story Find Ann — Listen and read (value: be helpful)', 'story', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p8.mp3', NULL, 'mp3', 2712586, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:33'),
(53, 'PB9', 'pb', 'pb', 1, 9, 1, 'PB U1 L7 p9: Listen again', 'listen_and_match', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p9.mp3', NULL, 'mp3', 1730402, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:35'),
(54, 'PB9_2', 'pb', 'pb', 1, 9, 2, 'PB U1 L7 p9: Listen and match', 'listen_and_match', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p9.2.mp3', NULL, 'mp3', 669322, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:35'),
(55, 'PB9_3', 'pb', 'pb', 1, 9, 3, 'PB U1 L7 p9: Listen and sing', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p9.3.mp3', NULL, 'mp3', 1158228, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:36'),
(56, 'PB9_4', 'pb', 'pb', 1, 9, 4, 'PB U1 L7 p9: Song karaoke', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p9.4.mp3', NULL, 'mp3', 3036315, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:36'),
(57, 'PB10', 'pb', 'pb', 1, 10, 1, 'PB U1 L9 p10: Phonics Ss, Dd — Listen, point and say', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p10.mp3', NULL, 'mp3', 445840, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:38'),
(58, 'PB10_2', 'pb', 'pb', 1, 10, 2, 'PB U1 L9 p10: Listen and circle the sound', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p10.2.mp3', NULL, 'mp3', 1225836, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:38'),
(59, 'PB11', 'pb', 'pb', 1, 11, 1, 'PB U1 L10 p11: Phonics Cc, Aa — Listen, point and say', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p11.mp3', NULL, 'mp3', 481522, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:40'),
(60, 'PB11_2', 'pb', 'pb', 1, 11, 2, 'PB U1 L10 p11: Listen and circle the sound', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p11.2.mp3', NULL, 'mp3', 1257762, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:40'),
(61, 'PB12_2', 'pb', 'pb', 1, 12, 2, 'PB U1 L11 p12: Finger puppets — Sing and play', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p12.2.mp3', NULL, 'mp3', 3048540, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:43'),
(62, 'PB12V', 'pb', 'pb', 1, 12, 1, 'PB U1 L11 p12: Finger puppets video', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p12.mp4', NULL, 'mp4', 25980965, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:45'),
(63, 'PB13', 'pb', 'pb', 1, 13, 1, 'PB U1 Picture dictionary p13: Listen and trace', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p13.mp3', NULL, 'mp3', 648038, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:45'),
(64, 'PB13_2', 'pb', 'pb', 1, 13, 2, 'PB U1 Picture dictionary p13 (alt)', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p13.2.mp3', NULL, 'mp3', 557894, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:45'),
(65, 'PB14', 'pb', 'pb', 1, 14, 1, 'PB U2 L1 p14: Listen and follow (school items)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p14.mp3', NULL, 'mp3', 1255258, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:47'),
(66, 'PB14_2', 'pb', 'pb', 1, 14, 2, 'PB U2 L1 p14: Listen, point and say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p14.2.mp3', NULL, 'mp3', 666192, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:48'),
(67, 'PB15', 'pb', 'pb', 1, 15, 1, 'PB U2 L3 p15: Listen and circle', 'listen_and_circle', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p15.mp3', NULL, 'mp3', 636144, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:50'),
(68, 'PB15_2', 'pb', 'pb', 1, 15, 2, 'PB U2 L3 p15: Listen and number', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p15.2.mp3', NULL, 'mp3', 925356, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:50'),
(69, 'PB15_3', 'pb', 'pb', 1, 15, 3, 'PB U2 L3 p15: Listen. Then say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p15.3.mp3', NULL, 'mp3', 437702, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:50'),
(70, 'PB16', 'pb', 'pb', 1, 16, 1, 'PB U2 L5 p16: Story Find Lama — Listen and read (value: look after your things)', 'story', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p16.mp3', NULL, 'mp3', 3833752, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:52'),
(71, 'PB17', 'pb', 'pb', 1, 17, 1, 'PB U2 L7 p17: Listen again', 'listen_and_match', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p17.mp3', NULL, 'mp3', 2353579, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:55'),
(72, 'PB17_2', 'pb', 'pb', 1, 17, 2, 'PB U2 L7 p17: Listen and match', 'listen_and_match', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p17.2.mp3', NULL, 'mp3', 682468, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:55'),
(73, 'PB17_3', 'pb', 'pb', 1, 17, 3, 'PB U2 L7 p17: Listen and sing', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p17.3.mp3', NULL, 'mp3', 725662, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:55'),
(74, 'PB17_4', 'pb', 'pb', 1, 17, 4, 'PB U2 L7 p17: Song karaoke', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p17.4.mp3', NULL, 'mp3', 2772374, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:56'),
(75, 'PB18', 'pb', 'pb', 1, 18, 1, 'PB U2 L9 p18: Phonics Pp, Rr — Listen, point and say', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p18.mp3', NULL, 'mp3', 474010, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:57'),
(76, 'PB18_2', 'pb', 'pb', 1, 18, 2, 'PB U2 L9 p18: Listen and circle', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p18.2.mp3', NULL, 'mp3', 1408002, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:09:57'),
(77, 'PB19', 'pb', 'pb', 1, 19, 1, 'PB U2 L10 p19: Phonics Ee, Bb — Listen, point and say', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p19.mp3', NULL, 'mp3', 496546, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:00'),
(78, 'PB19_2', 'pb', 'pb', 1, 19, 2, 'PB U2 L10 p19: Listen and circle', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p19.2.mp3', NULL, 'mp3', 1372946, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:00'),
(79, 'PB20_2', 'pb', 'pb', 1, 20, 2, 'PB U2 L11 p20: School bag project — Sing and play', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p20.2.mp3', NULL, 'mp3', 2778957, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:02'),
(80, 'PB20V', 'pb', 'pb', 1, 20, 1, 'PB U2 L11 p20: Project video', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p20.mp4', NULL, 'mp4', 25876403, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:04'),
(81, 'PB21', 'pb', 'pb', 1, 21, 1, 'PB U2 Picture dictionary p21: Listen and trace', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p21.mp3', NULL, 'mp3', 834586, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:04'),
(82, 'PB21_2', 'pb', 'pb', 1, 21, 2, 'PB U2 Picture dictionary p21 (alt)', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p21.2.mp3', NULL, 'mp3', 841472, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:05'),
(83, 'PB22', 'pb', 'pb', 1, 22, 1, 'PB U3 L1 p22: Listen and follow (classroom)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p22.mp3', NULL, 'mp3', 1200170, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:07'),
(84, 'PB22_2', 'pb', 'pb', 1, 22, 2, 'PB U3 L1 p22: Listen, point and say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p22.2.mp3', NULL, 'mp3', 663688, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:07'),
(85, 'PB23', 'pb', 'pb', 1, 23, 1, 'PB U3 L3 p23: Listen and number', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p23.mp3', NULL, 'mp3', 648664, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:09'),
(86, 'PB23_2', 'pb', 'pb', 1, 23, 2, 'PB U3 L3 p23: Listen and tick', 'listen_and_circle', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p23.2.mp3', NULL, 'mp3', 1049930, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:10'),
(87, 'PB23_3', 'pb', 'pb', 1, 23, 3, 'PB U3 L3 p23: Listen. Then say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p23.3.mp3', NULL, 'mp3', 411410, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:10'),
(88, 'PB24', 'pb', 'pb', 1, 24, 1, 'PB U3 L5 p24: Story Find the pens — Listen and read (value: be tidy)', 'story', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p24.mp3', NULL, 'mp3', 2525412, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:11'),
(89, 'PB25', 'pb', 'pb', 1, 25, 1, 'PB U3 L7 p25: Listen again', 'listen_and_match', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p25.mp3', NULL, 'mp3', 1557053, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:14'),
(90, 'PB25_2', 'pb', 'pb', 1, 25, 2, 'PB U3 L7 p25: Listen and match', 'listen_and_match', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p25.2.mp3', NULL, 'mp3', 661810, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:14'),
(91, 'PB25_3', 'pb', 'pb', 1, 25, 3, 'PB U3 L7 p25: Listen and sing', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p25.3.mp3', NULL, 'mp3', 858374, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:15'),
(92, 'PB25_4', 'pb', 'pb', 1, 25, 4, 'PB U3 L7 p25: Song karaoke', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p25.4.mp3', NULL, 'mp3', 2304677, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:15'),
(93, 'PB26', 'pb', 'pb', 1, 26, 1, 'PB U3 L9 p26: Phonics Tt, Mm — Listen, point and say', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p26.mp3', NULL, 'mp3', 477766, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:16'),
(94, 'PB26_2', 'pb', 'pb', 1, 26, 2, 'PB U3 L9 p26: Listen and circle', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p26.2.mp3', NULL, 'mp3', 1280298, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:17'),
(95, 'PB27', 'pb', 'pb', 1, 27, 1, 'PB U3 L10 p27: Phonics Ww, Ii — Listen, point and say', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p27.mp3', NULL, 'mp3', 510944, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:19'),
(96, 'PB27_2', 'pb', 'pb', 1, 27, 2, 'PB U3 L10 p27: Listen and circle', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p27.2.mp3', NULL, 'mp3', 1468098, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:19'),
(97, 'PB28_2', 'pb', 'pb', 1, 28, 2, 'PB U3 L11 p28: Pen pot — Listen and play', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p28.2.mp3', NULL, 'mp3', 518456, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:22'),
(98, 'PB28V', 'pb', 'pb', 1, 28, 1, 'PB U3 L11 p28: Pen pot video', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p28.mp4', NULL, 'mp4', 52510638, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:24'),
(99, 'PB29', 'pb', 'pb', 1, 29, 1, 'PB U3 Picture dictionary p29: Listen and trace', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p29.mp3', NULL, 'mp3', 767604, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:24'),
(100, 'PB29_2', 'pb', 'pb', 1, 29, 2, 'PB U3 Picture dictionary p29 (alt)', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p29.2.mp3', NULL, 'mp3', 498424, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:26'),
(101, 'PB30', 'pb', 'pb', 1, 30, 1, 'PB U4 L1 p30: Listen and follow (toys)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p30.mp3', NULL, 'mp3', 1528820, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:28'),
(102, 'PB30_2', 'pb', 'pb', 1, 30, 2, 'PB U4 L1 p30: Listen, point and say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p30.2.mp3', NULL, 'mp3', 676208, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:28'),
(103, 'PB31', 'pb', 'pb', 1, 31, 1, 'PB U4 L3 p31: Listen and circle', 'listen_and_circle', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p31.mp3', NULL, 'mp3', 631762, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:30'),
(104, 'PB31_2', 'pb', 'pb', 1, 31, 2, 'PB U4 L3 p31: Listen and number', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p31.2.mp3', NULL, 'mp3', 1014248, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:30'),
(105, 'PB31_3', 'pb', 'pb', 1, 31, 3, 'PB U4 L3 p31: Listen. Then say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p31.3.mp3', NULL, 'mp3', 393256, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:31'),
(106, 'PB32', 'pb', 'pb', 1, 32, 1, 'PB U4 L5 p32: Story Find Sue — Listen and read (value: share)', 'story', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p32.mp3', NULL, 'mp3', 2849054, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:33'),
(107, 'PB33', 'pb', 'pb', 1, 33, 1, 'PB U4 L7 p33: Listen again', 'listen_and_match', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p33.mp3', NULL, 'mp3', 1773660, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:35'),
(108, 'PB33_2', 'pb', 'pb', 1, 33, 2, 'PB U4 L7 p33: Listen and match', 'listen_and_match', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p33.2.mp3', NULL, 'mp3', 670574, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:35'),
(109, 'PB33_3', 'pb', 'pb', 1, 33, 3, 'PB U4 L7 p33: Listen and sing', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p33.3.mp3', NULL, 'mp3', 1204552, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:36'),
(110, 'PB33_4', 'pb', 'pb', 1, 33, 4, 'PB U4 L7 p33: Song karaoke', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p33.4.mp3', NULL, 'mp3', 2349190, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:36'),
(111, 'PB34', 'pb', 'pb', 1, 34, 1, 'PB U4 L9 p34: CVC words — sound blending (red, cat, mat, sit, bed, web)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p34.mp3', NULL, 'mp3', 512196, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:37'),
(112, 'PB34_2', 'pb', 'pb', 1, 34, 2, 'PB U4 L9 p34: Listen and circle', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p34.2.mp3', NULL, 'mp3', 1043044, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:38'),
(113, 'PB35', 'pb', 'pb', 1, 35, 1, 'PB U4 L10 p35: CVC words — Listen, order and write (sad, wet, map, bat, cap, tap)', 'phonics', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p35.mp3', NULL, 'mp3', 1116912, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:40'),
(114, 'PB36_2', 'pb', 'pb', 1, 36, 2, 'PB U4 L11 p36: A toy box — Sing and play', 'song', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p36.2.mp3', NULL, 'mp3', 2324740, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:42'),
(115, 'PB36V', 'pb', 'pb', 1, 36, 1, 'PB U4 L11 p36: Toy box video', 'dialogue', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p36.mp4', NULL, 'mp4', 44487947, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:44'),
(116, 'PB37', 'pb', 'pb', 1, 37, 1, 'PB U4 Picture dictionary p37: Listen and trace', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p37.mp3', NULL, 'mp3', 1188902, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:44'),
(117, 'PB37_2', 'pb', 'pb', 1, 37, 2, 'PB U4 Picture dictionary p37 (alt)', 'listen_and_trace', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p37.2.mp3', NULL, 'mp3', 447092, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:45'),
(118, 'PB38', 'pb', 'pb', 1, 38, 1, 'LC p38: Listen and follow (days of the week)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p38.mp3', NULL, 'mp3', 773864, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:47'),
(119, 'PB38_2', 'pb', 'pb', 1, 38, 2, 'LC p38: Listen, point and say (Sunday → Saturday)', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p38.2.mp3', NULL, 'mp3', 1072466, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:47'),
(120, 'PB39', 'pb', 'pb', 1, 39, 1, 'LC p39: Listen and circle', 'listen_and_circle', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p39.mp3', NULL, 'mp3', 1165740, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:49'),
(121, 'PB39_2', 'pb', 'pb', 1, 39, 2, 'LC p39: Look, order and say / Listen. Then say', 'listen_point_say', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p39.2.mp3', NULL, 'mp3', 756336, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:49'),
(122, 'PB40', 'pb', 'pb', 1, 40, 1, 'PB bonus p40', 'other', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p40.mp3', NULL, 'mp3', 784506, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:52'),
(123, 'PB41', 'pb', 'pb', 1, 41, 1, 'PB bonus p41', 'other', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p41.mp3', NULL, 'mp3', 785758, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:54'),
(124, 'PB42', 'pb', 'pb', 1, 42, 1, 'PB bonus p42', 'other', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p42.mp3', NULL, 'mp3', 794522, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:56'),
(125, 'PB43', 'pb', 'pb', 1, 43, 1, 'PB bonus p43', 'other', 'https://qr.nccd.gov.jo/QR/Eng/1/pb/p43.mp3', NULL, 'mp3', 855870, NULL, NULL, '2026-05-13 01:13:04', '2026-05-17 12:10:58');

-- --------------------------------------------------------

--
-- Table structure for table `game_results`
--

DROP TABLE IF EXISTS `game_results`;
CREATE TABLE IF NOT EXISTS `game_results` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `unit_id` bigint UNSIGNED NOT NULL,
  `lesson_id` bigint UNSIGNED DEFAULT NULL,
  `type` enum('lesson-game','unit-quiz') NOT NULL DEFAULT 'lesson-game',
  `correct_count` int UNSIGNED NOT NULL DEFAULT '0',
  `wrong_count` int UNSIGNED NOT NULL DEFAULT '0',
  `score` int UNSIGNED NOT NULL DEFAULT '0',
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `game_results_user_id_foreign` (`user_id`),
  KEY `game_results_unit_id_foreign` (`unit_id`),
  KEY `game_results_lesson_id_foreign` (`lesson_id`)
) ENGINE=MyISAM AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `game_results`
--

INSERT INTO `game_results` (`id`, `user_id`, `unit_id`, `lesson_id`, `type`, `correct_count`, `wrong_count`, `score`, `meta`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [], \"correct\": 0, \"durationMs\": 0}', '2026-05-15 05:53:17', '2026-05-15 05:53:17'),
(2, 2, 1, 2, 'lesson-game', 8, 0, 100, '{\"total\": 8, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r5\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r6\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r7\"}], \"correct\": 8, \"durationMs\": 0}', '2026-05-15 05:53:40', '2026-05-15 05:53:40'),
(3, 2, 1, 3, 'lesson-game', 4, 1, 80, '{\"total\": 5, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}], \"correct\": 4, \"durationMs\": 0}', '2026-05-15 05:53:54', '2026-05-15 05:53:54'),
(4, 2, 1, 4, 'lesson-game', 4, 0, 100, '{\"total\": 4, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}], \"correct\": 4, \"durationMs\": 0}', '2026-05-15 05:54:09', '2026-05-15 05:54:09'),
(5, 2, 1, NULL, 'unit-quiz', 8, 2, 80, '{\"total\": 10, \"passed\": true, \"correct\": 8}', '2026-05-15 05:58:14', '2026-05-15 05:58:14'),
(6, 2, 2, 5, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [], \"correct\": 0, \"durationMs\": 0}', '2026-05-15 05:58:23', '2026-05-15 05:58:23'),
(7, 2, 2, 6, 'lesson-game', 3, 3, 50, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r5\"}], \"correct\": 3, \"durationMs\": 0}', '2026-05-15 05:59:46', '2026-05-15 05:59:46'),
(8, 2, 2, 7, 'lesson-game', 5, 1, 83, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r5\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-15 06:00:02', '2026-05-15 06:00:02'),
(9, 2, 2, 8, 'lesson-game', 3, 1, 75, '{\"total\": 4, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}], \"correct\": 3, \"durationMs\": 0}', '2026-05-15 06:00:13', '2026-05-15 06:00:13'),
(10, 2, 2, 9, 'lesson-game', 5, 3, 63, '{\"total\": 8, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r5\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r6\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r7\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-15 06:00:35', '2026-05-15 06:00:35'),
(11, 2, 2, 10, 'lesson-game', 6, 2, 75, '{\"total\": 8, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r5\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r6\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r7\"}], \"correct\": 6, \"durationMs\": 0}', '2026-05-15 06:00:57', '2026-05-15 06:00:57'),
(12, 2, 2, 11, 'lesson-game', 3, 1, 75, '{\"total\": 4, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}], \"correct\": 3, \"durationMs\": 0}', '2026-05-15 06:01:11', '2026-05-15 06:01:11'),
(13, 2, 2, 12, 'lesson-game', 6, 0, 100, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r5\"}], \"correct\": 6, \"durationMs\": 0}', '2026-05-15 06:01:26', '2026-05-15 06:01:26'),
(14, 2, 2, NULL, 'unit-quiz', 10, 0, 100, '{\"total\": 10, \"passed\": true, \"correct\": 10}', '2026-05-15 06:01:58', '2026-05-15 06:01:58'),
(15, 1, 1, 1, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [], \"correct\": 0, \"durationMs\": 0}', '2026-05-15 10:39:10', '2026-05-15 10:39:10'),
(16, 1, 1, 2, 'lesson-game', 3, 5, 38, '{\"total\": 8, \"rounds\": [{\"timeMs\": 0, \"wordId\": 21, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"wordId\": 16, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"wordId\": 20, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"wordId\": 13, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"wordId\": 23, \"correct\": false, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"wordId\": 18, \"correct\": false, \"roundId\": \"r5\"}, {\"timeMs\": 0, \"wordId\": 15, \"correct\": false, \"roundId\": \"r6\"}, {\"timeMs\": 0, \"wordId\": 22, \"correct\": false, \"roundId\": \"r7\"}], \"correct\": 3, \"durationMs\": 0, \"word_errors\": [16, 23, 18, 15, 22]}', '2026-05-15 10:39:34', '2026-05-15 10:39:34'),
(17, 1, 1, 3, 'lesson-game', 2, 3, 40, '{\"total\": 5, \"rounds\": [{\"timeMs\": 0, \"wordId\": 10, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"wordId\": 12, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"wordId\": 11, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"wordId\": 14, \"correct\": false, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"wordId\": 15, \"correct\": true, \"roundId\": \"r4\"}], \"correct\": 2, \"durationMs\": 0, \"word_errors\": [12, 11, 14]}', '2026-05-15 10:40:03', '2026-05-15 10:40:03'),
(18, 1, 1, 4, 'lesson-game', 1, 3, 25, '{\"total\": 4, \"rounds\": [{\"timeMs\": 0, \"wordId\": 12, \"correct\": false, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"wordId\": 14, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"wordId\": 13, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"wordId\": 11, \"correct\": true, \"roundId\": \"r3\"}], \"correct\": 1, \"durationMs\": 0, \"word_errors\": [12, 14, 13]}', '2026-05-15 10:40:15', '2026-05-15 10:40:15'),
(19, 1, 1, NULL, 'unit-quiz', 4, 6, 40, '{\"total\": 10, \"passed\": false, \"correct\": 4}', '2026-05-15 10:40:42', '2026-05-15 10:40:42'),
(20, 2, 1, 1, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [], \"correct\": 0, \"durationMs\": 0}', '2026-05-15 14:30:47', '2026-05-15 14:30:47'),
(21, 2, 1, 2, 'lesson-game', 4, 4, 50, '{\"total\": 8, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r5\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r6\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r7\"}], \"correct\": 4, \"durationMs\": 0}', '2026-05-15 14:31:17', '2026-05-15 14:31:17'),
(22, 2, 1, 3, 'lesson-game', 5, 0, 100, '{\"total\": 5, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-15 14:31:35', '2026-05-15 14:31:35'),
(23, 2, 1, 4, 'lesson-game', 0, 4, 0, '{\"total\": 4, \"rounds\": [{\"timeMs\": 0, \"wordId\": 10, \"correct\": false, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"wordId\": 12, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"wordId\": 14, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"wordId\": 13, \"correct\": false, \"roundId\": \"r3\"}], \"correct\": 0, \"durationMs\": 0, \"word_errors\": [10, 12, 14, 13]}', '2026-05-15 14:31:54', '2026-05-15 14:31:54'),
(24, 2, 1, NULL, 'unit-quiz', 2, 8, 20, '{\"total\": 10, \"errors\": [{\"word\": \"Blue\", \"wrongChoice\": \"Red\"}, {\"word\": \"Blue\", \"wrongChoice\": \"Green\"}, {\"word\": \"Nine\", \"wrongChoice\": \"Eight\"}, {\"word\": \"Good morning\", \"wrongChoice\": \"Hi\"}, {\"word\": \"Good morning\", \"wrongChoice\": \"Hello\"}, {\"word\": \"Three\", \"wrongChoice\": \"Two\"}, {\"word\": \"Three\", \"wrongChoice\": \"Four\"}, {\"word\": \"Malek\", \"wrongChoice\": \"Bill\"}, {\"word\": \"Hello\", \"wrongChoice\": \"Good morning\"}, {\"word\": \"Hello\", \"wrongChoice\": \"Hi\"}, {\"word\": \"Six\", \"wrongChoice\": \"Five\"}, {\"word\": \"Six\", \"wrongChoice\": \"Seven\"}, {\"word\": \"Five\", \"wrongChoice\": \"Four\"}], \"passed\": false, \"correct\": 2}', '2026-05-15 14:32:50', '2026-05-15 14:32:50'),
(25, 2, 1, NULL, 'unit-quiz', 9, 1, 90, '{\"total\": 10, \"errors\": [{\"word\": \"Hello\", \"wrongChoice\": \"Good morning\"}], \"passed\": true, \"correct\": 9}', '2026-05-15 14:33:45', '2026-05-15 14:33:45'),
(26, 2, 2, 5, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [], \"correct\": 0, \"durationMs\": 0}', '2026-05-15 14:33:59', '2026-05-15 14:33:59'),
(27, 2, 2, 6, 'lesson-game', 2, 4, 33, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r5\"}], \"correct\": 2, \"durationMs\": 0}', '2026-05-15 14:34:32', '2026-05-15 14:34:32'),
(28, 2, 2, 7, 'lesson-game', 5, 4, 56, '{\"total\": 9, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-15 14:34:55', '2026-05-15 14:34:55'),
(29, 2, 2, 8, 'lesson-game', 1, 3, 25, '{\"total\": 4, \"rounds\": [{\"timeMs\": 0, \"wordId\": 26, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"wordId\": 33, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"wordId\": 27, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"wordId\": 29, \"correct\": false, \"roundId\": \"r3\"}], \"correct\": 1, \"durationMs\": 0, \"word_errors\": [33, 27, 29]}', '2026-05-15 14:35:10', '2026-05-15 14:35:10'),
(30, 2, 2, 9, 'lesson-game', 5, 4, 56, '{\"total\": 9, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-15 14:35:23', '2026-05-15 14:35:23'),
(31, 2, 2, 10, 'lesson-game', 5, 7, 42, '{\"total\": 12, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-15 14:36:19', '2026-05-15 14:36:19'),
(32, 2, 2, 11, 'lesson-game', 4, 3, 57, '{\"total\": 7, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}], \"correct\": 4, \"durationMs\": 0}', '2026-05-15 14:36:37', '2026-05-15 14:36:37'),
(33, 2, 2, 12, 'lesson-game', 6, 0, 100, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"wordId\": 30, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"wordId\": 32, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"wordId\": 27, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"wordId\": 29, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"wordId\": 28, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"wordId\": 33, \"correct\": true, \"roundId\": \"r5\"}], \"correct\": 6, \"durationMs\": 0}', '2026-05-15 14:36:53', '2026-05-15 14:36:53'),
(34, 2, 1, 1, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [], \"correct\": 0, \"durationMs\": 0}', '2026-05-15 15:24:55', '2026-05-15 15:24:55'),
(35, 2, 1, 2, 'lesson-game', 2, 6, 25, '{\"total\": 8, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r5\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r6\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r7\"}], \"correct\": 2, \"durationMs\": 0}', '2026-05-15 15:26:54', '2026-05-15 15:26:54'),
(36, 2, 1, 3, 'lesson-game', 5, 6, 45, '{\"total\": 11, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-15 15:27:09', '2026-05-15 15:27:09'),
(37, 2, 1, 4, 'lesson-game', 3, 1, 75, '{\"total\": 4, \"rounds\": [{\"timeMs\": 0, \"wordId\": 11, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"wordId\": 13, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"wordId\": 14, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"wordId\": 12, \"correct\": true, \"roundId\": \"r3\"}], \"correct\": 3, \"durationMs\": 0, \"word_errors\": [13]}', '2026-05-15 15:27:18', '2026-05-15 15:27:18'),
(38, 1, 1, NULL, 'unit-quiz', 9, 1, 90, '{\"total\": 10, \"errors\": [{\"word\": \"Two\", \"wrongChoice\": \"One\"}], \"passed\": true, \"correct\": 9}', '2026-05-16 12:34:47', '2026-05-16 12:34:47'),
(39, 1, 2, 5, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:35:26', '2026-05-16 12:35:26'),
(40, 1, 2, 6, 'lesson-game', 4, 2, 67, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r5\"}], \"correct\": 4, \"durationMs\": 0}', '2026-05-16 12:36:02', '2026-05-16 12:36:02'),
(41, 1, 2, 7, 'lesson-game', 5, 4, 56, '{\"total\": 9, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-16 12:36:31', '2026-05-16 12:36:31'),
(42, 1, 2, 8, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:36:52', '2026-05-16 12:36:52'),
(43, 1, 2, 8, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:36:53', '2026-05-16 12:36:53'),
(44, 1, 2, 8, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:36:53', '2026-05-16 12:36:53'),
(45, 1, 2, 8, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:36:55', '2026-05-16 12:36:55'),
(46, 1, 2, 8, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:36:55', '2026-05-16 12:36:55'),
(47, 1, 2, 8, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:36:55', '2026-05-16 12:36:55'),
(48, 1, 2, 8, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:36:55', '2026-05-16 12:36:55'),
(49, 1, 2, 9, 'lesson-game', 5, 5, 50, '{\"total\": 10, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-16 12:37:19', '2026-05-16 12:37:19'),
(50, 1, 2, 10, 'lesson-game', 5, 3, 63, '{\"total\": 8, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-16 12:37:38', '2026-05-16 12:37:38'),
(51, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:04', '2026-05-16 12:38:04'),
(52, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:05', '2026-05-16 12:38:05'),
(53, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:05', '2026-05-16 12:38:05'),
(54, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:06', '2026-05-16 12:38:06'),
(55, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:06', '2026-05-16 12:38:06'),
(56, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:06', '2026-05-16 12:38:06'),
(57, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:06', '2026-05-16 12:38:06'),
(58, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:06', '2026-05-16 12:38:06'),
(59, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:07', '2026-05-16 12:38:07'),
(60, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:07', '2026-05-16 12:38:07'),
(61, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:07', '2026-05-16 12:38:07'),
(62, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:07', '2026-05-16 12:38:07'),
(63, 1, 2, 11, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:38:07', '2026-05-16 12:38:07'),
(64, 1, 2, 12, 'lesson-game', 4, 2, 67, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r5\"}], \"correct\": 4, \"durationMs\": 0}', '2026-05-16 12:39:01', '2026-05-16 12:39:01'),
(65, 1, 2, NULL, 'unit-quiz', 9, 1, 90, '{\"total\": 10, \"errors\": [{\"word\": \"Apple (Aa)\", \"wrongChoice\": \"Cap\"}], \"passed\": true, \"correct\": 9}', '2026-05-16 12:40:27', '2026-05-16 12:40:27'),
(66, 1, 3, 13, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:41:30', '2026-05-16 12:41:30'),
(67, 1, 3, 14, 'lesson-game', 3, 3, 50, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r5\"}], \"correct\": 3, \"durationMs\": 0}', '2026-05-16 12:41:55', '2026-05-16 12:41:55'),
(68, 1, 3, 15, 'lesson-game', 5, 1, 83, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-16 12:42:29', '2026-05-16 12:42:29'),
(69, 1, 3, 16, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:42:47', '2026-05-16 12:42:47'),
(70, 1, 3, 16, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:42:49', '2026-05-16 12:42:49'),
(71, 1, 3, 16, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:42:49', '2026-05-16 12:42:49'),
(72, 1, 3, 16, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:42:50', '2026-05-16 12:42:50'),
(73, 1, 3, 16, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:42:50', '2026-05-16 12:42:50'),
(74, 1, 3, 16, 'lesson-game', 0, 1, 0, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": false, \"roundId\": \"picmatch\"}], \"correct\": 0, \"durationMs\": 0}', '2026-05-16 12:42:51', '2026-05-16 12:42:51'),
(75, 1, 3, 17, 'lesson-game', 5, 1, 83, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-16 12:43:16', '2026-05-16 12:43:16'),
(76, 1, 3, 18, 'lesson-game', 5, 2, 71, '{\"total\": 7, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-1\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-0\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"item-4\"}], \"correct\": 5, \"durationMs\": 0}', '2026-05-16 12:43:45', '2026-05-16 12:43:45'),
(77, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:28', '2026-05-16 12:44:28'),
(78, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:29', '2026-05-16 12:44:29'),
(79, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:29', '2026-05-16 12:44:29'),
(80, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:30', '2026-05-16 12:44:30'),
(81, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:30', '2026-05-16 12:44:30'),
(82, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:30', '2026-05-16 12:44:30'),
(83, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:30', '2026-05-16 12:44:30'),
(84, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:31', '2026-05-16 12:44:31'),
(85, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:31', '2026-05-16 12:44:31'),
(86, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:31', '2026-05-16 12:44:31'),
(87, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:31', '2026-05-16 12:44:31'),
(88, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:31', '2026-05-16 12:44:31'),
(89, 1, 3, 19, 'lesson-game', 1, 0, 100, '{\"total\": 1, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"memory\"}], \"correct\": 1, \"durationMs\": 0}', '2026-05-16 12:44:31', '2026-05-16 12:44:31'),
(90, 1, 3, 20, 'lesson-game', 4, 2, 67, '{\"total\": 6, \"rounds\": [{\"timeMs\": 0, \"correct\": true, \"roundId\": \"r0\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r1\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r2\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r3\"}, {\"timeMs\": 0, \"correct\": true, \"roundId\": \"r4\"}, {\"timeMs\": 0, \"correct\": false, \"roundId\": \"r5\"}], \"correct\": 4, \"durationMs\": 0}', '2026-05-16 12:45:39', '2026-05-16 12:45:39'),
(91, 1, 3, NULL, 'unit-quiz', 10, 0, 100, '{\"total\": 10, \"errors\": [], \"passed\": true, \"correct\": 10}', '2026-05-16 12:46:28', '2026-05-16 12:46:28'),
(92, 1, 2, NULL, 'unit-quiz', 9, 1, 90, '{\"total\": 10, \"errors\": [{\"word\": \"Sun (Ss)\", \"wrongChoice\": \"Doll\"}, {\"word\": \"Sun (Ss)\", \"wrongChoice\": \"Dig\"}], \"passed\": true, \"correct\": 9}', '2026-05-16 16:25:34', '2026-05-16 16:25:34'),
(93, 1, 3, NULL, 'unit-quiz', 10, 0, 100, '{\"total\": 10, \"errors\": [], \"passed\": true, \"correct\": 10}', '2026-05-16 16:27:08', '2026-05-16 16:27:08'),
(94, 1, 1, NULL, 'unit-quiz', 10, 0, 100, '{\"total\": 10, \"errors\": [], \"passed\": true, \"correct\": 10}', '2026-05-16 16:27:53', '2026-05-16 16:27:53'),
(95, 1, 2, NULL, 'unit-quiz', 9, 1, 90, '{\"total\": 10, \"errors\": [{\"word\": \"Two\", \"wrongChoice\": \"One\"}], \"passed\": true, \"correct\": 9}', '2026-05-17 12:37:41', '2026-05-17 12:37:41'),
(96, 1, 2, NULL, 'unit-quiz', 7, 3, 70, '{\"total\": 10, \"errors\": [{\"word\": \"Sun (Ss)\", \"wrongChoice\": \"Dig\"}, {\"word\": \"Son\", \"wrongChoice\": \"Thank\"}, {\"word\": \"Sing (Ss)\", \"wrongChoice\": \"Doll\"}, {\"word\": \"Sing (Ss)\", \"wrongChoice\": \"Dig\"}], \"passed\": true, \"correct\": 7}', '2026-05-17 14:25:25', '2026-05-17 14:25:25'),
(97, 1, 3, NULL, 'unit-quiz', 10, 0, 100, '{\"total\": 10, \"errors\": [], \"passed\": true, \"correct\": 10}', '2026-05-17 15:47:29', '2026-05-17 15:47:29'),
(98, 1, 1, 21, 'lesson-game', 4, 4, 50, '{\"total\": 8, \"errors\": [{\"word\": \"Orange\", \"wordId\": 12, \"wrongChoice\": \"Yellow\"}, {\"word\": \"Yellow\", \"wordId\": 14, \"wrongChoice\": \"Orange\"}, {\"word\": \"Yellow\", \"wordId\": 14, \"wrongChoice\": \"Red\"}, {\"word\": \"Red\", \"wordId\": 13, \"wrongChoice\": \"Orange\"}], \"rounds\": [{\"word\": \"Orange\", \"wordId\": 12, \"correct\": false, \"roundId\": \"pair-1\", \"wrongChoice\": \"Yellow\", \"wrongChoiceId\": 14}, {\"word\": \"Green\", \"wordId\": 11, \"correct\": true, \"roundId\": \"pair-0\", \"wrongChoice\": null, \"wrongChoiceId\": null}, {\"word\": \"Yellow\", \"wordId\": 14, \"correct\": false, \"roundId\": \"pair-3\", \"wrongChoice\": \"Orange\", \"wrongChoiceId\": 12}, {\"word\": \"Yellow\", \"wordId\": 14, \"correct\": false, \"roundId\": \"pair-2\", \"wrongChoice\": \"Red\", \"wrongChoiceId\": 13}, {\"word\": \"Yellow\", \"wordId\": 14, \"correct\": true, \"roundId\": \"pair-1\", \"wrongChoice\": null, \"wrongChoiceId\": null}, {\"word\": \"Red\", \"wordId\": 13, \"correct\": false, \"roundId\": \"pair-3\", \"wrongChoice\": \"Orange\", \"wrongChoiceId\": 12}, {\"word\": \"Red\", \"wordId\": 13, \"correct\": true, \"roundId\": \"pair-2\", \"wrongChoice\": null, \"wrongChoiceId\": null}, {\"word\": \"Orange\", \"wordId\": 12, \"correct\": true, \"roundId\": \"pair-3\", \"wrongChoice\": null, \"wrongChoiceId\": null}], \"correct\": 4, \"durationMs\": 0, \"word_errors\": [12, 14, 13]}', '2026-05-17 16:12:20', '2026-05-17 16:12:20'),
(99, 1, 3, 23, 'lesson-game', 3, 1, 75, '{\"total\": 4, \"errors\": [{\"word\": \"Ball (Bb)\", \"wordId\": 68, \"wrongChoice\": \"Crayon\"}], \"rounds\": [{\"word\": \"Ball (Bb)\", \"wordId\": 68, \"correct\": false, \"roundId\": \"item-2\", \"wrongChoice\": \"Crayon\", \"wrongChoiceId\": 52}, {\"word\": \"Ball (Bb)\", \"wordId\": 68, \"correct\": true, \"roundId\": \"item-2\", \"wrongChoice\": null, \"wrongChoiceId\": null}, {\"word\": \"Egg (Ee)\", \"wordId\": 66, \"correct\": true, \"roundId\": \"item-1\", \"wrongChoice\": null, \"wrongChoiceId\": null}, {\"word\": \"Crayon\", \"wordId\": 52, \"correct\": true, \"roundId\": \"item-0\", \"wrongChoice\": null, \"wrongChoiceId\": null}], \"correct\": 3, \"durationMs\": 0, \"word_errors\": [68]}', '2026-05-17 16:14:02', '2026-05-17 16:14:02'),
(100, 1, 1, NULL, 'unit-quiz', 9, 1, 90, '{\"total\": 10, \"errors\": [{\"word\": \"Four\", \"wrongChoice\": \"Five\"}], \"passed\": true, \"correct\": 9}', '2026-05-17 16:22:59', '2026-05-17 16:22:59');

-- --------------------------------------------------------

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS `lessons`;
CREATE TABLE IF NOT EXISTS `lessons` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `unit_id` bigint UNSIGNED NOT NULL,
  `lesson_number` int UNSIGNED NOT NULL,
  `page_number` smallint UNSIGNED DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'vocab-game',
  `config` json DEFAULT NULL,
  `audio_track_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lessons_unit_id_lesson_number_unique` (`unit_id`,`lesson_number`),
  KEY `lessons_audio_track_id_foreign` (`audio_track_id`)
) ENGINE=MyISAM AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lessons`
--

INSERT INTO `lessons` (`id`, `unit_id`, `lesson_number`, `page_number`, `title`, `type`, `config`, `audio_track_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 4, 'Greetings & characters', 'intro', '{\"mode\": \"intro\", \"prompt\": \"Listen, point and say.\", \"book_lesson\": \"Lesson 1\", \"word_filter\": [\"Hello\", \"Hi\", \"Good morning\", \"Hala\", \"Bill\", \"Lama\", \"Malek\"], \"audio_tracks\": [\"PB4\", \"PB4_2\", \"AB4\", \"AB4_2\"], \"instruction_key\": \"listen_point_say\"}', 45, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(2, 1, 2, 5, 'Colours & Numbers 1-10', 'vocab-game', '{\"mode\": \"vocab-game\", \"prompt\": \"Find the colour or number!\", \"rounds\": 8, \"categories\": [\"colour\", \"number\"], \"decoy_pool\": \"same_category\", \"book_lesson\": \"Lesson 2\", \"audio_tracks\": [\"PB5\", \"AB5\"], \"question_style\": \"word-to-image\", \"options_per_round\": 3}', 46, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(3, 1, 3, 5, 'Circle the colour!', 'draw-circle', '{\"mode\": \"draw-circle\", \"prompt\": \"Circle the correct colour!\", \"rounds\": 5, \"category\": \"colour\", \"book_lesson\": \"Bonus 1\", \"options_per_round\": 3}', 46, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(4, 1, 4, 5, 'Match the words', 'match-connect', '{\"mode\": \"match-connect\", \"prompt\": \"Match the word to the picture!\", \"rounds\": 4, \"category\": \"colour\", \"book_lesson\": \"Bonus 2\", \"options_per_round\": 4}', 46, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(5, 2, 1, 6, 'Meet my family', 'intro', '{\"mode\": \"intro\", \"prompt\": \"Listen, point and say.\", \"book_lesson\": \"Lesson 1\", \"word_filter\": [\"Boy\", \"Brother\", \"Cat\", \"Dad\", \"Friend\", \"Girl\", \"Mum\", \"Sister\"], \"audio_tracks\": [\"PB6\", \"PB6_2\", \"AB6\", \"AB6_2\"], \"instruction_key\": \"listen_follow_point_say\"}', 47, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(6, 2, 2, 7, 'Language practice', 'vocab-game', '{\"mode\": \"vocab-game\", \"prompt\": \"Listen and circle.\", \"rounds\": 6, \"category\": \"family\", \"decoy_pool\": \"same_category\", \"book_lesson\": \"Lesson 3\", \"audio_tracks\": [\"PB7\", \"PB7_2\", \"PB7_3\", \"AB7\", \"AB7_2\"], \"question_style\": \"audio-to-image\", \"options_per_round\": 3}', 49, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(7, 2, 3, 8, 'Story: Find Ann', 'story', '{\"mode\": \"story\", \"value\": \"Be helpful.\", \"characters\": [\"Hala\", \"Bill\", \"Ann\"], \"book_lesson\": \"Lesson 5\", \"story_title\": \"Find Ann\", \"audio_tracks\": [\"PB8\"]}', 52, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(8, 2, 4, 9, 'Listen, match & sing', 'song', '{\"mode\": \"song\", \"prompt\": \"Listen, match and sing!\", \"rounds\": 4, \"categories\": [\"family\"], \"song_title\": \"The family song\", \"book_lesson\": \"Lesson 7\", \"audio_tracks\": [\"PB9\", \"PB9_2\", \"PB9_3\"], \"question_style\": \"audio-to-image\", \"options_per_round\": 3}', 55, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(9, 2, 5, 10, 'Phonics: Ss and Dd', 'phonics-game', '{\"mode\": \"phonics-game\", \"prompt\": \"Listen and circle the sound.\", \"rounds\": 8, \"book_lesson\": \"Lesson 9\", \"audio_tracks\": [\"PB10\", \"PB10_2\", \"AB10\", \"AB10_2\"], \"phonics_sets\": [\"s\", \"d\"], \"question_style\": \"sound-to-word\", \"options_per_round\": 3}', 57, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(10, 2, 6, 11, 'Phonics: Cc and Aa', 'phonics-game', '{\"mode\": \"phonics-game\", \"prompt\": \"Listen and circle the sound.\", \"rounds\": 8, \"book_lesson\": \"Lesson 10\", \"audio_tracks\": [\"PB11\", \"PB11_2\", \"AB11\", \"AB11_2\"], \"phonics_sets\": [\"c\", \"a\"], \"question_style\": \"sound-to-word\", \"options_per_round\": 3}', 59, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(11, 2, 7, 12, 'Project: Finger puppets', 'project', '{\"mode\": \"project\", \"steps\": [\"Colour the four family puppets.\", \"Cut them out carefully.\", \"Tape each one into a small ring.\", \"Put them on your fingers and sing!\"], \"book_lesson\": \"Lesson 11\", \"video_track\": \"PB12V\", \"word_filter\": [\"Mum\", \"Dad\", \"Brother\", \"Sister\"], \"audio_tracks\": [\"PB12_2\", \"AB12\", \"AB12_2\"], \"project_title\": \"Finger puppets\"}', 61, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(12, 2, 8, 13, 'Picture dictionary', 'picture-dict', '{\"mode\": \"picture-dict\", \"prompt\": \"Listen and trace.\", \"book_lesson\": \"Picture dict.\", \"word_filter\": [\"Boy\", \"Brother\", \"Cat\", \"Dad\", \"Friend\", \"Girl\", \"Mum\", \"Sister\"], \"audio_tracks\": [\"PB13\", \"PB13_2\", \"AB13\"]}', 63, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(13, 3, 1, 14, 'What\'s in my bag?', 'intro', '{\"mode\": \"intro\", \"prompt\": \"Listen, point and say.\", \"book_lesson\": \"Lesson 1\", \"word_filter\": [\"Pen\", \"Eraser\", \"Ruler\", \"Bag\", \"Book\", \"Pencil\", \"Crayon\", \"Pencil case\"], \"audio_tracks\": [\"PB14\", \"PB14_2\", \"AB14\", \"AB14_2\"]}', 65, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(14, 3, 2, 15, 'I\'ve got / I haven\'t got', 'vocab-game', '{\"mode\": \"vocab-game\", \"prompt\": \"Listen and circle — I\'ve got / I haven\'t got.\", \"rounds\": 6, \"category\": \"object\", \"decoy_pool\": \"same_category\", \"book_lesson\": \"Lesson 3\", \"audio_tracks\": [\"PB15\", \"PB15_2\", \"PB15_3\", \"AB15\", \"AB15_2\"], \"question_style\": \"audio-to-image\", \"options_per_round\": 3}', 67, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(15, 3, 3, 16, 'Story: Find Lama', 'story', '{\"mode\": \"story\", \"value\": \"Look after your things.\", \"characters\": [\"Lama\", \"Malek\", \"Hala\"], \"book_lesson\": \"Lesson 5\", \"story_title\": \"Find Lama\", \"audio_tracks\": [\"PB16\", \"AB16\"]}', 70, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(16, 3, 4, 17, 'Listen, match & sing', 'song', '{\"mode\": \"song\", \"prompt\": \"Listen, match and sing!\", \"rounds\": 4, \"categories\": [\"object\"], \"song_title\": \"My school bag song\", \"book_lesson\": \"Lesson 7\", \"audio_tracks\": [\"PB17\", \"PB17_2\", \"PB17_3\", \"PB17_4\"], \"question_style\": \"audio-to-image\", \"options_per_round\": 3}', 73, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(17, 3, 5, 18, 'Phonics: Pp and Rr', 'phonics-game', '{\"mode\": \"phonics-game\", \"prompt\": \"Listen and circle the sound.\", \"rounds\": 8, \"book_lesson\": \"Lesson 9\", \"audio_tracks\": [\"PB18\", \"PB18_2\", \"AB18\", \"AB18_2\"], \"phonics_sets\": [\"p\", \"r\"], \"question_style\": \"sound-to-word\", \"options_per_round\": 3}', 75, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(18, 3, 6, 19, 'Phonics: Ee and Bb', 'phonics-game', '{\"mode\": \"phonics-game\", \"prompt\": \"Listen and circle the sound.\", \"rounds\": 8, \"book_lesson\": \"Lesson 10\", \"audio_tracks\": [\"PB19\", \"PB19_2\", \"AB19\", \"AB19_2\"], \"phonics_sets\": [\"e\", \"b\"], \"question_style\": \"sound-to-word\", \"options_per_round\": 3}', 77, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(19, 3, 7, 20, 'Project: A school bag', 'project', '{\"mode\": \"project\", \"steps\": [\"Draw and colour a big school bag.\", \"Draw the items you have inside.\", \"Show your bag and sing the song!\"], \"book_lesson\": \"Lesson 11\", \"video_track\": \"PB20V\", \"word_filter\": [\"Bag\", \"Book\", \"Pen\", \"Pencil\", \"Ruler\", \"Crayon\"], \"audio_tracks\": [\"PB20_2\", \"AB20\", \"AB20_2\"], \"project_title\": \"A school bag\"}', 79, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(20, 3, 8, 21, 'Picture dictionary', 'picture-dict', '{\"mode\": \"picture-dict\", \"prompt\": \"Listen and trace.\", \"book_lesson\": \"Picture dict.\", \"word_filter\": [\"Bag\", \"Book\", \"Crayon\", \"Eraser\", \"Pen\", \"Pencil\", \"Pencil case\", \"Ruler\"], \"audio_tracks\": [\"PB21\", \"PB21_2\", \"AB21\"]}', 81, '2026-05-13 01:13:05', '2026-05-17 15:59:14'),
(22, 2, 9, 13, 'Bubble pop — family', 'bubble-pop', '{\"mode\": \"bubble-pop\", \"prompt\": \"Listen and pop the right word!\", \"rounds\": 5, \"category\": \"family\", \"book_lesson\": \"Bonus\", \"options_per_round\": 5}', 47, '2026-05-17 15:59:13', '2026-05-17 15:59:13'),
(23, 3, 9, 21, 'Build the sentence', 'sequence-build', '{\"mode\": \"sequence-build\", \"prompt\": \"Drag the words in order: I have a ___.\", \"rounds\": 3, \"sentences\": [[\"I\", \"have\", \"a\", \"pen\"], [\"I\", \"have\", \"a\", \"book\"], [\"I\", \"have\", \"a\", \"bag\"]], \"book_lesson\": \"Bonus\"}', 65, '2026-05-17 15:59:14', '2026-05-17 15:59:14'),
(21, 1, 5, 5, 'Memory flip — colours', 'memory-flip', '{\"mode\": \"memory-flip\", \"prompt\": \"Find the matching pairs!\", \"rounds\": 4, \"category\": \"colour\", \"book_lesson\": \"Bonus 3\"}', 46, '2026-05-17 15:59:13', '2026-05-17 15:59:13');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_05_09_193236_create_units_table', 1),
(2, '2026_05_09_193239_create_words_table', 1),
(3, '2026_05_09_193240_create_lessons_table', 1),
(4, '2026_05_09_193240_create_user_progress_table', 1),
(5, '2026_05_09_193241_create_ai_interactions_table', 1),
(6, '2026_05_09_193241_create_game_results_table', 1),
(7, '2026_05_09_193421_create_users_table', 1),
(8, '2026_05_09_193540_create_sessions_table', 1),
(9, '2026_05_11_100000_create_audio_tracks_table', 1),
(10, '2026_05_11_120000_add_audio_segments_to_words', 1);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(191) NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `payload` longtext NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('J8ynPXuopiN7ZuMpEbmLQJCNOaTQVWVDxitG96Qv', 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'YTo1OntzOjY6Il90b2tlbiI7czo0MDoiY21kOWZMdENBdE0yQ2N6cnJkdklNclRMczVvZXhWVGl3bkxxUVN4QyI7czozOiJ1cmwiO2E6MDp7fXM6OToiX3ByZXZpb3VzIjthOjE6e3M6MzoidXJsIjtzOjIxOiJodHRwOi8vMTI3LjAuMC4xOjgwMDAiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX1zOjUwOiJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI7aToxO30=', 1779052313);

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
CREATE TABLE IF NOT EXISTS `units` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `unit_number` int UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `description` text,
  `image_path` varchar(191) DEFAULT NULL,
  `color_key` varchar(191) DEFAULT NULL,
  `lessons_count` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `units_unit_number_unique` (`unit_number`),
  UNIQUE KEY `units_code_unique` (`code`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `unit_number`, `title`, `code`, `description`, `image_path`, `color_key`, `lessons_count`, `created_at`, `updated_at`) VALUES
(1, 0, 'Welcome: Hello!', 'U0', 'Characters, greetings, colours and numbers 1-10.', 'assets/lessons/welcome/hut.png', 'purple', 5, '2026-05-13 01:13:04', '2026-05-17 15:59:13'),
(2, 1, 'Family and friends', 'U1', 'Family members, pets, phonics Ss Dd Cc Aa.', 'assets/lessons/family/treehouse.png', 'green', 9, '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(3, 2, 'My school bag', 'U2', 'School items, I\'ve got / I haven\'t got, phonics Pp Rr Ee Bb.', 'assets/lessons/schoolbag/bag.png', 'blue', 9, '2026-05-13 01:13:05', '2026-05-17 15:59:14');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) NOT NULL,
  `role` enum('student','parent','admin') NOT NULL DEFAULT 'student',
  `level` int UNSIGNED NOT NULL DEFAULT '1',
  `xp` int UNSIGNED NOT NULL DEFAULT '0',
  `total_stars` int UNSIGNED NOT NULL DEFAULT '0',
  `badges` json DEFAULT NULL,
  `avatar` varchar(191) DEFAULT NULL,
  `locale` varchar(191) NOT NULL DEFAULT 'en',
  `sound_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `level`, `xp`, `total_stars`, `badges`, `avatar`, `locale`, `sound_enabled`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Kiddo Admin', 'admin@kiddo.test', NULL, '$2y$12$nrFYKVQID34vGRBrLOH6zuQ5uPN3CnUNd3TX7.dCGmAt9v8AlJBde', 'admin', 10, 1105, 142, NULL, NULL, 'en', 1, NULL, '2026-05-13 01:13:04', '2026-05-17 16:22:59'),
(2, 'hamza', 'hamza@gmail.com', NULL, '$2y$12$r7VA0rHus/9LXCci5VaFie1wrJhcnota2mK0PhgeNQP8J1AsuDfTO', 'student', 0, 235, 24, NULL, NULL, 'en', 1, NULL, '2026-05-15 05:52:50', '2026-05-15 15:27:18');

-- --------------------------------------------------------

--
-- Table structure for table `user_progress`
--

DROP TABLE IF EXISTS `user_progress`;
CREATE TABLE IF NOT EXISTS `user_progress` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `unit_id` bigint UNSIGNED NOT NULL,
  `status` enum('locked','active','done') NOT NULL DEFAULT 'locked',
  `current_lesson` int UNSIGNED NOT NULL DEFAULT '1',
  `stars_earned` int UNSIGNED NOT NULL DEFAULT '0',
  `last_activity_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_progress_user_id_unit_id_unique` (`user_id`,`unit_id`),
  KEY `user_progress_unit_id_foreign` (`unit_id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_progress`
--

INSERT INTO `user_progress` (`id`, `user_id`, `unit_id`, `status`, `current_lesson`, `stars_earned`, `last_activity_at`, `created_at`, `updated_at`) VALUES
(9, 1, 3, 'done', 10, 65, '2026-05-17 16:14:02', '2026-05-16 12:40:27', '2026-05-17 16:14:02'),
(7, 2, 1, 'active', 5, 5, '2026-05-15 15:27:18', '2026-05-15 15:24:37', '2026-05-15 15:27:18'),
(8, 1, 2, 'done', 9, 63, '2026-05-17 14:25:25', '2026-05-16 12:34:47', '2026-05-17 14:25:25'),
(4, 1, 1, 'done', 6, 14, '2026-05-17 16:22:59', '2026-05-15 10:38:43', '2026-05-17 16:22:59');

-- --------------------------------------------------------

--
-- Table structure for table `words`
--

DROP TABLE IF EXISTS `words`;
CREATE TABLE IF NOT EXISTS `words` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `unit_id` bigint UNSIGNED NOT NULL,
  `word` varchar(191) NOT NULL,
  `type` enum('vocab','phonics','cvc','sentence') NOT NULL DEFAULT 'vocab',
  `audio_path` varchar(191) DEFAULT NULL,
  `audio_track_id` bigint UNSIGNED DEFAULT NULL,
  `segment_start_ms` int UNSIGNED DEFAULT NULL,
  `segment_end_ms` int UNSIGNED DEFAULT NULL,
  `image_path` varchar(191) DEFAULT NULL,
  `wrong_options` json DEFAULT NULL,
  `category` varchar(191) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `words_unit_id_foreign` (`unit_id`),
  KEY `words_audio_track_id_foreign` (`audio_track_id`)
) ENGINE=MyISAM AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `words`
--

INSERT INTO `words` (`id`, `unit_id`, `word`, `type`, `audio_path`, `audio_track_id`, `segment_start_ms`, `segment_end_ms`, `image_path`, `wrong_options`, `category`, `created_at`, `updated_at`) VALUES
(1, 1, 'Hello', 'vocab', NULL, 45, NULL, NULL, 'assets/lessons/welcome/hello.png', '[{\"word\": \"Hi\", \"image_path\": \"assets/lessons/welcome/hi.png\"}, {\"word\": \"Good morning\", \"image_path\": \"assets/lessons/welcome/goodmorning.png\"}]', 'greeting', '2026-05-13 01:13:04', '2026-05-17 15:59:13'),
(2, 1, 'Hi', 'vocab', NULL, 45, NULL, NULL, 'assets/lessons/welcome/hi.png', '[{\"word\": \"Hello\", \"image_path\": \"assets/lessons/welcome/hello.png\"}, {\"word\": \"Good morning\", \"image_path\": \"assets/lessons/welcome/goodmorning.png\"}]', 'greeting', '2026-05-13 01:13:04', '2026-05-17 15:59:13'),
(3, 1, 'Good morning', 'vocab', NULL, 45, NULL, NULL, 'assets/lessons/welcome/goodmorning.png', '[{\"word\": \"Hello\", \"image_path\": \"assets/lessons/welcome/hello.png\"}, {\"word\": \"Hi\", \"image_path\": \"assets/lessons/welcome/hi.png\"}]', 'greeting', '2026-05-13 01:13:04', '2026-05-17 15:59:13'),
(4, 1, 'Hala', 'vocab', NULL, 45, NULL, NULL, 'assets/lessons/welcome/hala.png', '[{\"word\": \"Bill\", \"image_path\": \"assets/lessons/welcome/bill.png\"}, {\"word\": \"Lama\", \"image_path\": \"assets/lessons/welcome/lama.png\"}]', 'character', '2026-05-13 01:13:04', '2026-05-17 15:59:13'),
(5, 1, 'Meg', 'vocab', 'assets/audio/tts/word_5.mp3', NULL, NULL, NULL, 'assets/uploads/words/word_5_1778959038.jpg', '[{\"word\": \"Lama\", \"image_path\": \"assets/lessons/welcome/lama.png\"}, {\"word\": \"Hala\", \"image_path\": \"assets/lessons/welcome/hala.png\"}]', 'character', '2026-05-13 01:13:05', '2026-05-17 12:19:35'),
(6, 1, 'Lama', 'vocab', NULL, 45, NULL, NULL, 'assets/lessons/welcome/lama.png', '[{\"word\": \"Hala\", \"image_path\": \"assets/lessons/welcome/hala.png\"}, {\"word\": \"Malek\", \"image_path\": \"assets/lessons/welcome/malek.png\"}]', 'character', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(7, 1, 'Tom', 'vocab', 'assets/audio/tts/word_7.mp3', NULL, NULL, NULL, 'assets/uploads/words/word_7_1778958885.jpg', '[{\"word\": \"Bill\", \"image_path\": \"assets/lessons/welcome/bill.png\"}, {\"word\": \"Malek\", \"image_path\": \"assets/lessons/welcome/malek.png\"}]', 'character', '2026-05-13 01:13:05', '2026-05-17 12:19:41'),
(8, 1, 'Bill', 'vocab', NULL, 45, NULL, NULL, 'assets/lessons/welcome/bill.png', '[{\"word\": \"Malek\", \"image_path\": \"assets/lessons/welcome/malek.png\"}, {\"word\": \"Lama\", \"image_path\": \"assets/lessons/welcome/lama.png\"}]', 'character', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(9, 1, 'Malek', 'vocab', NULL, 45, NULL, NULL, 'assets/lessons/welcome/malek.png', '[{\"word\": \"Bill\", \"image_path\": \"assets/lessons/welcome/bill.png\"}, {\"word\": \"Hala\", \"image_path\": \"assets/lessons/welcome/hala.png\"}]', 'character', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(10, 1, 'Blue', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/blue.png', '[{\"word\": \"Red\", \"image_path\": \"assets/lessons/welcome/red.png\"}, {\"word\": \"Green\", \"image_path\": \"assets/lessons/welcome/green.png\"}]', 'colour', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(11, 1, 'Green', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/green.png', '[{\"word\": \"Blue\", \"image_path\": \"assets/lessons/welcome/blue.png\"}, {\"word\": \"Orange\", \"image_path\": \"assets/lessons/welcome/orange.png\"}]', 'colour', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(12, 1, 'Orange', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/orange.png', '[{\"word\": \"Red\", \"image_path\": \"assets/lessons/welcome/red.png\"}, {\"word\": \"Brown\", \"image_path\": \"assets/lessons/welcome/brown.png\"}]', 'colour', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(13, 1, 'Red', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/red.png', '[{\"word\": \"Blue\", \"image_path\": \"assets/lessons/welcome/blue.png\"}, {\"word\": \"Yellow\", \"image_path\": \"assets/lessons/welcome/yellow.png\"}]', 'colour', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(14, 1, 'Yellow', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/yellow.png', '[{\"word\": \"Green\", \"image_path\": \"assets/lessons/welcome/green.png\"}, {\"word\": \"Orange\", \"image_path\": \"assets/lessons/welcome/orange.png\"}]', 'colour', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(15, 1, 'Brown', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/brown.png', '[{\"word\": \"Red\", \"image_path\": \"assets/lessons/welcome/red.png\"}, {\"word\": \"Blue\", \"image_path\": \"assets/lessons/welcome/blue.png\"}]', 'colour', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(16, 1, 'One', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/one.png', '[{\"word\": \"Two\", \"image_path\": \"assets/lessons/welcome/two.png\"}, {\"word\": \"Two\", \"image_path\": \"assets/lessons/welcome/two.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(17, 1, 'Two', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/two.png', '[{\"word\": \"Three\", \"image_path\": \"assets/lessons/welcome/three.png\"}, {\"word\": \"One\", \"image_path\": \"assets/lessons/welcome/one.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(18, 1, 'Three', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/three.png', '[{\"word\": \"Four\", \"image_path\": \"assets/lessons/welcome/four.png\"}, {\"word\": \"Two\", \"image_path\": \"assets/lessons/welcome/two.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(19, 1, 'Four', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/four.png', '[{\"word\": \"Five\", \"image_path\": \"assets/lessons/welcome/five.png\"}, {\"word\": \"Three\", \"image_path\": \"assets/lessons/welcome/three.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(20, 1, 'Five', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/five.png', '[{\"word\": \"Six\", \"image_path\": \"assets/lessons/welcome/six.png\"}, {\"word\": \"Four\", \"image_path\": \"assets/lessons/welcome/four.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(21, 1, 'Six', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/six.png', '[{\"word\": \"Seven\", \"image_path\": \"assets/lessons/welcome/seven.png\"}, {\"word\": \"Five\", \"image_path\": \"assets/lessons/welcome/five.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(22, 1, 'Seven', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/seven.png', '[{\"word\": \"Eight\", \"image_path\": \"assets/lessons/welcome/eight.png\"}, {\"word\": \"Six\", \"image_path\": \"assets/lessons/welcome/six.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(23, 1, 'Eight', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/eight.png', '[{\"word\": \"Nine\", \"image_path\": \"assets/lessons/welcome/nine.png\"}, {\"word\": \"Seven\", \"image_path\": \"assets/lessons/welcome/seven.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(24, 1, 'Nine', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/nine.png', '[{\"word\": \"Ten\", \"image_path\": \"assets/lessons/welcome/ten.png\"}, {\"word\": \"Eight\", \"image_path\": \"assets/lessons/welcome/eight.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(25, 1, 'Ten', 'vocab', NULL, 46, NULL, NULL, 'assets/lessons/welcome/ten.png', '[{\"word\": \"Nine\", \"image_path\": \"assets/lessons/welcome/nine.png\"}, {\"word\": \"Nine\", \"image_path\": \"assets/lessons/welcome/nine.png\"}]', 'number', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(26, 2, 'Boy', 'vocab', NULL, 47, NULL, NULL, 'assets/lessons/family/boy.png', '[{\"word\": \"Brother\", \"image_path\": \"assets/lessons/family/brother.png\"}, {\"word\": \"Cat\", \"image_path\": \"assets/lessons/family/cat.png\"}]', 'family', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(27, 2, 'Brother', 'vocab', NULL, 47, NULL, NULL, 'assets/lessons/family/brother.png', '[{\"word\": \"Boy\", \"image_path\": \"assets/lessons/family/boy.png\"}, {\"word\": \"Cat\", \"image_path\": \"assets/lessons/family/cat.png\"}]', 'family', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(28, 2, 'Cat', 'vocab', NULL, 47, NULL, NULL, 'assets/lessons/family/cat.png', '[{\"word\": \"Boy\", \"image_path\": \"assets/lessons/family/boy.png\"}, {\"word\": \"Brother\", \"image_path\": \"assets/lessons/family/brother.png\"}]', 'family', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(29, 2, 'dad', 'vocab', NULL, 47, NULL, NULL, 'assets/lessons/family/dad.png', '[{\"word\": \"Boy\", \"image_path\": \"assets/lessons/family/boy.png\"}, {\"word\": \"Brother\", \"image_path\": \"assets/lessons/family/brother.png\"}]', 'family', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(30, 2, 'Friend', 'vocab', NULL, 47, NULL, NULL, 'assets/lessons/family/friend.png', '[{\"word\": \"Boy\", \"image_path\": \"assets/lessons/family/boy.png\"}, {\"word\": \"Brother\", \"image_path\": \"assets/lessons/family/brother.png\"}]', 'family', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(31, 2, 'Girl', 'vocab', NULL, 47, NULL, NULL, 'assets/lessons/family/girl.png', '[{\"word\": \"Boy\", \"image_path\": \"assets/lessons/family/boy.png\"}, {\"word\": \"Brother\", \"image_path\": \"assets/lessons/family/brother.png\"}]', 'family', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(32, 2, 'Mum', 'vocab', NULL, 47, NULL, NULL, 'assets/lessons/family/mum.png', '[{\"word\": \"Boy\", \"image_path\": \"assets/lessons/family/boy.png\"}, {\"word\": \"Brother\", \"image_path\": \"assets/lessons/family/brother.png\"}]', 'family', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(33, 2, 'Sister', 'vocab', NULL, 47, NULL, NULL, 'assets/lessons/family/sister.png', '[{\"word\": \"Boy\", \"image_path\": \"assets/lessons/family/boy.png\"}, {\"word\": \"Brother\", \"image_path\": \"assets/lessons/family/brother.png\"}]', 'family', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(34, 2, 'Sing (Ss)', 'phonics', NULL, 57, NULL, NULL, 'assets/lessons/family/sing.png', '[{\"word\": \"Dig\", \"image_path\": \"assets/lessons/family/dig.png\"}, {\"word\": \"Doll\", \"image_path\": \"assets/lessons/family/doll.png\"}]', 's', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(35, 2, 'Sun (Ss)', 'phonics', NULL, 57, NULL, NULL, 'assets/lessons/family/sun.png', '[{\"word\": \"Dig\", \"image_path\": \"assets/lessons/family/dig.png\"}, {\"word\": \"Doll\", \"image_path\": \"assets/lessons/family/doll.png\"}]', 's', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(36, 2, 'Six (Ss)', 'phonics', NULL, 57, NULL, NULL, 'assets/lessons/family/six.png', '[{\"word\": \"Dig\", \"image_path\": \"assets/lessons/family/dig.png\"}, {\"word\": \"Doll\", \"image_path\": \"assets/lessons/family/doll.png\"}]', 's', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(37, 2, 'Sister (Ss)', 'phonics', NULL, 57, NULL, NULL, 'assets/lessons/family/sister.png', '[{\"word\": \"Dig\", \"image_path\": \"assets/lessons/family/dig.png\"}, {\"word\": \"Doll\", \"image_path\": \"assets/lessons/family/doll.png\"}]', 's', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(38, 2, 'Dig (Dd)', 'phonics', NULL, 57, NULL, NULL, 'assets/lessons/family/dig.png', '[{\"word\": \"Sing\", \"image_path\": \"assets/lessons/family/sing.png\"}, {\"word\": \"Sun\", \"image_path\": \"assets/lessons/family/sun.png\"}]', 'd', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(39, 2, 'Duck (Dd)', 'phonics', NULL, 57, NULL, NULL, 'assets/lessons/family/duck.png', '[{\"word\": \"Sing\", \"image_path\": \"assets/lessons/family/sing.png\"}, {\"word\": \"Sun\", \"image_path\": \"assets/lessons/family/sun.png\"}]', 'd', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(40, 2, 'Doll (Dd)', 'phonics', NULL, 57, NULL, NULL, 'assets/lessons/family/doll.png', '[{\"word\": \"Sing\", \"image_path\": \"assets/lessons/family/sing.png\"}, {\"word\": \"Sun\", \"image_path\": \"assets/lessons/family/sun.png\"}]', 'd', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(41, 2, 'Dad (Dd)', 'phonics', NULL, 57, NULL, NULL, 'assets/lessons/family/dad.png', '[{\"word\": \"Sing\", \"image_path\": \"assets/lessons/family/sing.png\"}, {\"word\": \"Sun\", \"image_path\": \"assets/lessons/family/sun.png\"}]', 'd', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(42, 2, 'Cut (Cc)', 'phonics', NULL, 59, NULL, NULL, 'assets/lessons/family/cut.png', '[{\"word\": \"Apple\", \"image_path\": \"assets/lessons/family/apple.png\"}, {\"word\": \"Ant\", \"image_path\": \"assets/lessons/family/ant.png\"}]', 'c', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(43, 2, 'Cup (Cc)', 'phonics', NULL, 59, NULL, NULL, 'assets/lessons/family/cup.png', '[{\"word\": \"Apple\", \"image_path\": \"assets/lessons/family/apple.png\"}, {\"word\": \"Ant\", \"image_path\": \"assets/lessons/family/ant.png\"}]', 'c', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(44, 2, 'Cap (Cc)', 'phonics', NULL, 59, NULL, NULL, 'assets/lessons/family/cap.png', '[{\"word\": \"Apple\", \"image_path\": \"assets/lessons/family/apple.png\"}, {\"word\": \"Ant\", \"image_path\": \"assets/lessons/family/ant.png\"}]', 'c', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(45, 2, 'Cat (Cc)', 'phonics', NULL, 59, NULL, NULL, 'assets/lessons/family/cat.png', '[{\"word\": \"Apple\", \"image_path\": \"assets/lessons/family/apple.png\"}, {\"word\": \"Ant\", \"image_path\": \"assets/lessons/family/ant.png\"}]', 'c', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(46, 2, 'Apple (Aa)', 'phonics', NULL, 59, NULL, NULL, 'assets/lessons/family/apple.png', '[{\"word\": \"Cup\", \"image_path\": \"assets/lessons/family/cup.png\"}, {\"word\": \"Cap\", \"image_path\": \"assets/lessons/family/cap.png\"}]', 'a', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(47, 2, 'Ant (Aa)', 'phonics', NULL, 59, NULL, NULL, 'assets/lessons/family/ant.png', '[{\"word\": \"Cup\", \"image_path\": \"assets/lessons/family/cup.png\"}, {\"word\": \"Cap\", \"image_path\": \"assets/lessons/family/cap.png\"}]', 'a', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(48, 2, 'Alligator (Aa)', 'phonics', NULL, 59, NULL, NULL, 'assets/lessons/family/alligator.png', '[{\"word\": \"Cup\", \"image_path\": \"assets/lessons/family/cup.png\"}, {\"word\": \"Cap\", \"image_path\": \"assets/lessons/family/cap.png\"}]', 'a', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(49, 2, 'Ann (Aa)', 'phonics', NULL, 59, NULL, NULL, 'assets/lessons/family/ann.png', '[{\"word\": \"Cup\", \"image_path\": \"assets/lessons/family/cup.png\"}, {\"word\": \"Cap\", \"image_path\": \"assets/lessons/family/cap.png\"}]', 'a', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(50, 3, 'Bag', 'vocab', NULL, 65, NULL, NULL, 'assets/lessons/schoolbag/bag.png', '[{\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}, {\"word\": \"Crayon\", \"image_path\": \"assets/lessons/schoolbag/crayon.png\"}]', 'object', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(51, 3, 'Book', 'vocab', NULL, 65, NULL, NULL, 'assets/lessons/schoolbag/book.png', '[{\"word\": \"Bag\", \"image_path\": \"assets/lessons/schoolbag/bag.png\"}, {\"word\": \"Crayon\", \"image_path\": \"assets/lessons/schoolbag/crayon.png\"}]', 'object', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(52, 3, 'Crayon', 'vocab', NULL, 65, NULL, NULL, 'assets/lessons/schoolbag/crayon.png', '[{\"word\": \"Bag\", \"image_path\": \"assets/lessons/schoolbag/bag.png\"}, {\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}]', 'object', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(53, 3, 'Eraser', 'vocab', NULL, 65, NULL, NULL, 'assets/lessons/schoolbag/eraser.png', '[{\"word\": \"Bag\", \"image_path\": \"assets/lessons/schoolbag/bag.png\"}, {\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}]', 'object', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(54, 3, 'Pen', 'vocab', NULL, 65, NULL, NULL, 'assets/lessons/schoolbag/pen.png', '[{\"word\": \"Bag\", \"image_path\": \"assets/lessons/schoolbag/bag.png\"}, {\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}]', 'object', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(55, 3, 'Pen', 'vocab', NULL, 65, 21490, 21640, 'assets/lessons/schoolbag/pencil.png', '[{\"word\": \"Bag\", \"image_path\": \"assets/lessons/schoolbag/bag.png\"}, {\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}]', 'object', '2026-05-13 01:13:05', '2026-05-16 06:14:30'),
(56, 3, 'Pencil case', 'vocab', NULL, 65, NULL, NULL, 'assets/lessons/schoolbag/pencilcase.png', '[{\"word\": \"Bag\", \"image_path\": \"assets/lessons/schoolbag/bag.png\"}, {\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}]', 'object', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(57, 3, 'Ruler', 'vocab', NULL, 65, NULL, NULL, 'assets/lessons/schoolbag/ruler.png', '[{\"word\": \"Bag\", \"image_path\": \"assets/lessons/schoolbag/bag.png\"}, {\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}]', 'object', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(58, 3, 'Pen (Pp)', 'phonics', NULL, 75, NULL, NULL, 'assets/lessons/schoolbag/pen.png', '[{\"word\": \"Rabbit\", \"image_path\": \"assets/lessons/schoolbag/rabbit.png\"}, {\"word\": \"Red\", \"image_path\": \"assets/lessons/schoolbag/red.png\"}]', 'p', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(59, 3, 'Pen (Pp)', 'phonics', NULL, 75, 9066, 11453, 'assets/lessons/schoolbag/pencil.png', '[{\"word\": \"Rabbit\", \"image_path\": \"assets/lessons/schoolbag/rabbit.png\"}, {\"word\": \"Red\", \"image_path\": \"assets/lessons/schoolbag/red.png\"}]', 'p', '2026-05-13 01:13:05', '2026-05-16 06:05:33'),
(60, 3, 'Pink (Pp)', 'phonics', NULL, 75, NULL, NULL, 'assets/lessons/schoolbag/pink.png', '[{\"word\": \"Rabbit\", \"image_path\": \"assets/lessons/schoolbag/rabbit.png\"}, {\"word\": \"Red\", \"image_path\": \"assets/lessons/schoolbag/red.png\"}]', 'p', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(61, 3, 'Rabbit (Rr)', 'phonics', NULL, 75, NULL, NULL, 'assets/lessons/schoolbag/rabbit.png', '[{\"word\": \"Pen\", \"image_path\": \"assets/lessons/schoolbag/pen.png\"}, {\"word\": \"Pink\", \"image_path\": \"assets/lessons/schoolbag/pink.png\"}]', 'r', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(62, 3, 'Red (Rr)', 'phonics', NULL, 75, NULL, NULL, 'assets/lessons/schoolbag/red.png', '[{\"word\": \"Pen\", \"image_path\": \"assets/lessons/schoolbag/pen.png\"}, {\"word\": \"Pink\", \"image_path\": \"assets/lessons/schoolbag/pink.png\"}]', 'r', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(63, 3, 'Run (Rr)', 'phonics', NULL, 75, NULL, NULL, 'assets/lessons/schoolbag/run.png', '[{\"word\": \"Pen\", \"image_path\": \"assets/lessons/schoolbag/pen.png\"}, {\"word\": \"Pink\", \"image_path\": \"assets/lessons/schoolbag/pink.png\"}]', 'r', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(64, 3, 'Ruler (Rr)', 'phonics', NULL, 75, NULL, NULL, 'assets/lessons/schoolbag/ruler.png', '[{\"word\": \"Pen\", \"image_path\": \"assets/lessons/schoolbag/pen.png\"}, {\"word\": \"Pink\", \"image_path\": \"assets/lessons/schoolbag/pink.png\"}]', 'r', '2026-05-13 01:13:05', '2026-05-13 01:13:05'),
(65, 3, 'Elephant (Ee)', 'phonics', NULL, 77, NULL, NULL, 'assets/lessons/schoolbag/elephant.png', '[{\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}, {\"word\": \"Ball\", \"image_path\": \"assets/lessons/schoolbag/ball.png\"}]', 'e', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(66, 3, 'Egg (Ee)', 'phonics', NULL, 77, NULL, NULL, 'assets/lessons/schoolbag/egg.png', '[{\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}, {\"word\": \"Ball\", \"image_path\": \"assets/lessons/schoolbag/ball.png\"}]', 'e', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(67, 3, 'Book (Bb)', 'phonics', NULL, 77, NULL, NULL, 'assets/lessons/schoolbag/book.png', '[{\"word\": \"Elephant\", \"image_path\": \"assets/lessons/schoolbag/elephant.png\"}, {\"word\": \"Egg\", \"image_path\": \"assets/lessons/schoolbag/egg.png\"}]', 'b', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(68, 3, 'Ball (Bb)', 'phonics', NULL, 77, NULL, NULL, 'assets/lessons/schoolbag/ball.png', '[{\"word\": \"Elephant\", \"image_path\": \"assets/lessons/schoolbag/elephant.png\"}, {\"word\": \"Egg\", \"image_path\": \"assets/lessons/schoolbag/egg.png\"}]', 'b', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(69, 3, 'Bag (Bb)', 'phonics', NULL, 77, NULL, NULL, 'assets/lessons/schoolbag/bag.png', '[{\"word\": \"Elephant\", \"image_path\": \"assets/lessons/schoolbag/elephant.png\"}, {\"word\": \"Egg\", \"image_path\": \"assets/lessons/schoolbag/egg.png\"}]', 'b', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(70, 3, 'Boy (Bb)', 'phonics', NULL, 77, NULL, NULL, 'assets/lessons/schoolbag/boy.png', '[{\"word\": \"Elephant\", \"image_path\": \"assets/lessons/schoolbag/elephant.png\"}, {\"word\": \"Egg\", \"image_path\": \"assets/lessons/schoolbag/egg.png\"}]', 'b', '2026-05-13 01:13:05', '2026-05-17 15:59:13'),
(96, 3, 'Pencil', 'vocab', NULL, 65, NULL, NULL, 'assets/lessons/schoolbag/pencil.png', '[{\"word\": \"Bag\", \"image_path\": \"assets/lessons/schoolbag/bag.png\"}, {\"word\": \"Book\", \"image_path\": \"assets/lessons/schoolbag/book.png\"}]', 'object', '2026-05-17 15:59:13', '2026-05-17 15:59:13'),
(97, 3, 'Pencil (Pp)', 'phonics', NULL, 75, NULL, NULL, 'assets/lessons/schoolbag/pencil.png', '[{\"word\": \"Rabbit\", \"image_path\": \"assets/lessons/schoolbag/rabbit.png\"}, {\"word\": \"Red\", \"image_path\": \"assets/lessons/schoolbag/red.png\"}]', 'p', '2026-05-17 15:59:13', '2026-05-17 15:59:13'),
(71, 2, 'Hello', 'vocab', NULL, 47, 9830, 10560, NULL, NULL, 'ai-ingest', '2026-05-17 12:11:26', '2026-05-17 12:11:26'),
(72, 2, 'Morning', 'vocab', NULL, 47, 12070, 13060, NULL, NULL, 'ai-ingest', '2026-05-17 12:11:26', '2026-05-17 12:11:26'),
(75, 2, 'Friends', 'vocab', NULL, 47, 2810, 3540, NULL, NULL, 'ai-ingest', '2026-05-17 12:11:26', '2026-05-17 12:11:26'),
(76, 2, 'One', 'vocab', NULL, 47, 63471, 64200, NULL, NULL, 'ai-ingest', '2026-05-17 12:11:26', '2026-05-17 12:31:48'),
(77, 2, 'Two', 'vocab', NULL, 47, 66210, 66780, NULL, NULL, 'ai-ingest', '2026-05-17 12:11:26', '2026-05-17 12:11:26'),
(78, 2, 'Five', 'vocab', NULL, 50, 21230, 22220, NULL, NULL, 'ai-ingest', '2026-05-17 12:12:14', '2026-05-17 12:12:14'),
(79, 2, 'Six', 'vocab', NULL, 50, 37790, 38460, NULL, NULL, 'ai-ingest', '2026-05-17 12:12:14', '2026-05-17 12:12:14'),
(80, 2, 'Dahlia', 'vocab', NULL, 51, 10259, 12100, NULL, NULL, 'ai-ingest', '2026-05-17 12:12:23', '2026-05-17 12:29:42'),
(81, 2, 'Leila', 'vocab', NULL, 51, 20650, 21380, NULL, NULL, 'ai-ingest', '2026-05-17 12:12:23', '2026-05-17 12:12:23'),
(82, 2, 'Family', 'vocab', NULL, 52, 11830, 12520, NULL, NULL, 'ai-ingest', '2026-05-17 12:12:48', '2026-05-17 12:12:48'),
(83, 2, 'Thank', 'vocab', NULL, 52, 58530, 59860, NULL, NULL, 'ai-ingest', '2026-05-17 12:12:48', '2026-05-17 12:12:48'),
(84, 2, 'Bill', 'vocab', NULL, 56, 36938, 41238, 'assets/uploads/words/word_84_1779031549.jpg', NULL, 'ai-ingest', '2026-05-17 12:13:56', '2026-05-17 12:25:50'),
(85, 2, 'Anne', 'vocab', NULL, 56, 46439, 49506, NULL, NULL, 'ai-ingest', '2026-05-17 12:13:56', '2026-05-17 12:23:57'),
(86, 2, 'Hala', 'vocab', NULL, 56, 81190, 81500, NULL, NULL, 'ai-ingest', '2026-05-17 12:13:56', '2026-05-17 12:13:56'),
(87, 2, 'Malik', 'vocab', NULL, 56, 88370, 89120, NULL, NULL, 'ai-ingest', '2026-05-17 12:13:56', '2026-05-17 12:13:56'),
(88, 2, 'Mom', 'vocab', NULL, 57, NULL, NULL, NULL, NULL, 'ai-ingest', '2026-05-17 12:14:02', '2026-05-17 12:14:02'),
(89, 2, 'Duck', 'vocab', NULL, 58, 17970, 18120, NULL, NULL, 'ai-ingest', '2026-05-17 12:14:10', '2026-05-17 12:14:10'),
(90, 2, 'Doll', 'vocab', NULL, 58, 17970, 18120, NULL, NULL, 'ai-ingest', '2026-05-17 12:14:10', '2026-05-17 12:14:10'),
(91, 2, 'Son', 'vocab', NULL, 58, 11150, 11300, NULL, NULL, 'ai-ingest', '2026-05-17 12:14:10', '2026-05-17 12:14:10'),
(92, 2, 'Apple', 'vocab', NULL, 59, 12439, 17122, 'assets/uploads/words/word_92_1779031455.jpg', NULL, 'ai-ingest', '2026-05-17 12:14:16', '2026-05-17 12:24:37'),
(93, 2, 'Car', 'vocab', NULL, 59, NULL, NULL, NULL, NULL, 'ai-ingest', '2026-05-17 12:14:16', '2026-05-17 12:14:16'),
(94, 2, 'Alligator Aa', 'vocab', NULL, 60, 30570, 35631, 'assets/uploads/words/word_94_1779031324.jpg', NULL, 'ai-ingest', '2026-05-17 12:14:25', '2026-05-17 12:22:36'),
(95, 2, 'Cap', 'vocab', NULL, 60, 41350, 41980, NULL, NULL, 'ai-ingest', '2026-05-17 12:14:25', '2026-05-17 12:14:25');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
