-- ============================================================
-- HOSTEL HUB — MYSQL DATABASE SCHEMA & SEED DATA
-- Database Name: hostelhub_db
-- Target Platform: Shared PHP/MySQL Hosting (cPanel / CEISCY)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `rooms`;
DROP TABLE IF EXISTS `hostels`;
DROP TABLE IF EXISTS `locations`;
DROP TABLE IF EXISTS `students`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. Table: students
-- ------------------------------------------------------------
CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `student_index` VARCHAR(50) DEFAULT '',
  `institution` VARCHAR(120) DEFAULT 'University of Mines and Technology (UMaT)',
  `faculty` VARCHAR(100) DEFAULT 'Faculty of Engineering',
  `department` VARCHAR(100) DEFAULT 'Mining Engineering',
  `level` VARCHAR(50) DEFAULT 'Level 300',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. Table: locations
-- ------------------------------------------------------------
CREATE TABLE `locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) DEFAULT 'Community',
  `latitude` DECIMAL(10,6) DEFAULT NULL,
  `longitude` DECIMAL(10,6) DEFAULT NULL,
  `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. Table: hostels
-- ------------------------------------------------------------
CREATE TABLE `hostels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `location_id` INT DEFAULT NULL,
  `name` VARCHAR(120) NOT NULL,
  `location_name` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `price_per_year` DECIMAL(10,2) NOT NULL,
  `distance_km` DECIMAL(4,2) DEFAULT 1.00,
  `maps_url` TEXT,
  `facilities` TEXT COMMENT 'Comma separated list of facilities',
  `description` TEXT,
  `photos` TEXT COMMENT 'Comma separated list of image URLs',
  `is_published` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. Table: rooms
-- ------------------------------------------------------------
CREATE TABLE `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hostel_id` INT NOT NULL,
  `room_type` VARCHAR(50) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 2,
  `available_count` INT NOT NULL DEFAULT 5,
  `price_per_year` DECIMAL(10,2) NOT NULL,
  `photos` TEXT,
  FOREIGN KEY (`hostel_id`) REFERENCES `hostels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. Table: bookings
-- ------------------------------------------------------------
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_reference` VARCHAR(50) NOT NULL UNIQUE,
  `student_id` INT NOT NULL,
  `hostel_id` INT NOT NULL,
  `room_id` INT DEFAULT NULL,
  `room_type` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` ENUM('unpaid', 'pending_verification', 'paid') NOT NULL DEFAULT 'unpaid',
  `payment_method` VARCHAR(50) DEFAULT 'MTN Mobile Money',
  `payment_proof` VARCHAR(255) DEFAULT NULL,
  `transaction_ref` VARCHAR(100) DEFAULT NULL,
  `check_in_period` VARCHAR(50) DEFAULT '2026/2027 Academic Year',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`hostel_id`) REFERENCES `hostels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. Table: payments
-- ------------------------------------------------------------
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_reference` VARCHAR(50) NOT NULL UNIQUE,
  `booking_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `proof_file` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'verified',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 7. Table: notifications
-- ------------------------------------------------------------
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'info',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA
-- ============================================================

-- 1. Locations
INSERT INTO `locations` (`id`, `name`, `category`, `latitude`, `longitude`, `description`) VALUES
(1, 'Banso (Main Gate), Tarkwa', 'Landmark', 5.297730, -2.000520, 'Adjacent to UMaT main gate and main administration buildings.'),
(2, 'Ayensu / East Gate, Tarkwa', 'Community', 5.298100, -1.995000, 'Opposite UMaT East Gate, popular student residential area.'),
(3, 'Akoon (Mines), Tarkwa', 'Community', 5.307400, -2.013900, 'Close to mining complex and engineering laboratories.'),
(4, 'Brahabebome, Tarkwa', 'Community', 5.290000, -1.985000, 'Residential district with PAVED road access and local markets.'),
(5, 'Yenkea, Tarkwa', 'Community', 5.301000, -2.005000, 'Elevated residential area with executive student hostels.'),
(6, 'Adidome Junction, Tarkwa', 'Community', 5.285000, -1.980000, 'Quiet student zone with direct shuttle access to campus.'),
(7, 'Paa Grant, Tarkwa', 'Community', 5.295000, -1.990000, 'Central location between campus gate and town market.');

-- 2. Demo Student Account
-- Email: student@hostelhub.dev
-- Password: Student@Hub2024! (hashed via password_hash)
INSERT INTO `students` (`id`, `name`, `email`, `password_hash`, `phone`, `student_index`, `institution`, `faculty`, `department`, `level`) VALUES
(1, 'Demo Student', 'student@hostelhub.dev', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1Vz1pB05n.3R43L/wZ4gP2R3Hk3Q5C6', '+233 24 000 1111', 'UMaT/2024/0001', 'University of Mines and Technology', 'Faculty of Engineering', 'Mining Engineering', 'Level 300');

-- 3. Hostels (15 Realistic Ghanaian Hostels)
INSERT INTO `hostels` (`id`, `location_id`, `name`, `location_name`, `address`, `price_per_year`, `distance_km`, `maps_url`, `facilities`, `description`, `photos`, `is_published`) VALUES
(1, 1, 'Banso Royal Student Lodge', 'Banso (Main Gate), Tarkwa', 'Plot 12, UMaT Main Road, Banso, Tarkwa', 4500.00, 0.50, 'https://maps.google.com/?q=Banso+Royal+Lodge+Tarkwa', 'Wi-Fi, Generator, Water, Security, Study Room, Kitchen', 'Premier student accommodation situated right near the UMaT Tarkwa main gate with 24/7 security & standby generator.', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80,https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80', 1),
(2, 2, 'Ayensu Plaza Hostel', 'Ayensu / East Gate, Tarkwa', 'Opposite UMaT East Gate, Ayensu, Tarkwa', 5200.00, 0.80, 'https://maps.google.com/?q=Ayensu+Plaza+Hostel+Tarkwa', 'Wi-Fi, Water, Security, Common Room, AC, CCTV', 'Modern multi-story student hostel near UMaT lecture halls with serene study ambiance and private room balconies.', 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80,https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80', 1),
(3, 3, 'Gaza Student Hall (Mines Section)', 'Akoon (Mines), Tarkwa', 'Mines Road, Akoon, Tarkwa', 3800.00, 1.50, 'https://maps.google.com/?q=Gaza+Hall+Akoon+Tarkwa', 'Borehole Water, Security, Kitchen, Study Room, Parking', 'Spacious hostel popular among mining & engineering undergraduates, equipped with dedicated study halls and continuous water supply.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80,https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80', 1),
(4, 4, 'Kingdom Hostel Tarkwa', 'Brahabebome, Tarkwa', 'Near Brahabebome Junction, Tarkwa', 4200.00, 2.00, '', 'Wi-Fi, CCTV, Water, Generator, Parking', 'Secure residential complex featuring gated perimeter, paved compound, and high-speed fibre internet for UMaT students.', 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80', 1),
(5, 5, 'Evandy Student Lodge', 'Yenkea, Tarkwa', 'Yenkea Hill Top, Tarkwa', 4800.00, 1.20, '', 'Wi-Fi, AC, Generator, Laundry, Kitchen', 'Executive self-contained rooms with ensuite washrooms, fitted kitchenettes, and high-speed internet near UMaT campus.', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80', 1),
(6, 6, 'Pentagon Villa Hostel', 'Adidome Junction, Tarkwa', 'Adidome Road, Tarkwa', 3500.00, 1.80, '', 'Water, Security, Common Room, Kitchen', 'Affordable student hostel offering comfortable rooms, friendly management, and easy proximity to campus transport stops.', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80', 1),
(7, 3, 'Akoon Engineering Lodge', 'Akoon (Mines), Tarkwa', 'Block C, Mines Road, Akoon, Tarkwa', 3900.00, 1.40, '', 'Wi-Fi, Borehole Water, Security Guard, Solar Backup, Study Desks', 'Purpose-built accommodation for mining engineering students with continuous solar power backup and quiet study environment.', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80', 1),
(8, 4, 'Brahabebome Heights Lodge', 'Brahabebome, Tarkwa', 'Paa Grant Link, Brahabebome, Tarkwa', 4100.00, 2.10, '', 'Water Tank, CCTV Security, Paved Compound, Laundry Area', 'Secure, modern student housing near Brahabebome Junction with spacious paved compound and continuous water storage.', 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80', 1),
(9, 5, 'Yenkea Executive Student Villa', 'Yenkea, Tarkwa', 'Hilltop Avenue, Yenkea, Tarkwa', 5500.00, 1.10, '', 'Wi-Fi, Air Conditioning, Standby Generator, Kitchenette', 'Executive student suites featuring private washrooms, fitted kitchenettes, and high-speed Wi-Fi internet.', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80', 1),
(10, 6, 'Adidome Sunset Lodge', 'Adidome Junction, Tarkwa', 'Plot 8, Adidome Bypass, Tarkwa', 3600.00, 1.90, '', 'Borehole Water, 24/7 Security, Shared Kitchen, Study Room', 'Serene student lodging near Adidome Junction with mechanised water supply and dedicated quiet study hall.', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80', 1),
(11, 1, 'Main Gate Scholars Residence', 'Banso (Main Gate), Tarkwa', 'Banso Gate Road, Tarkwa', 4800.00, 0.40, '', 'Wi-Fi, Generator, 24/7 Water Supply, Security Guard, Self-Contained', 'Located under 5 minutes walk from UMaT main auditorium with round-the-clock security and generator power.', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80', 1),
(12, 7, 'Paa Grant Court Hostel', 'Paa Grant, Tarkwa', 'Paa Grant Substation Road, Tarkwa', 4200.00, 0.90, '', 'CCTV Security, Mechanised Borehole, Study Hall, Laundry Service', 'Comfortable student residence with CCTV security monitoring, mechanised borehole, and weekly laundry service.', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80', 1),
(13, 2, 'Ayensu Ridge Student Hall', 'Ayensu / East Gate, Tarkwa', 'Ayensu Ridge, Tarkwa', 5000.00, 0.70, '', 'Wi-Fi, Standby Generator, Paved Compound, Balcony Rooms', 'Elevated student hall overlooking UMaT East Gate featuring private room balconies and fiber Wi-Fi.', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80', 1),
(14, 1, 'Tarkwa Golden Key Lodge', 'Banso (Main Gate), Tarkwa', 'Golden Key Street, Banso, Tarkwa', 4400.00, 0.60, '', 'Wi-Fi, Borehole Water, Security Guard, Study Room', 'Peaceful student lodge situated in Banso residential area, featuring 24/7 security and high-speed Wi-Fi.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', 1),
(15, 3, 'Mines Campus View Hostel', 'Akoon (Mines), Tarkwa', 'Mines View Road, Akoon, Tarkwa', 3700.00, 1.60, '', 'Borehole Water, Common Study Lounge, Security Guard', 'Well-maintained accommodation close to Akoon mining complex with dedicated study hall and security.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80', 1);

-- 4. Rooms Inventory
INSERT INTO `rooms` (`hostel_id`, `room_type`, `capacity`, `available_count`, `price_per_year`) VALUES
(1, '1-in-a-room', 1, 3, 8500.00),
(1, '2-in-a-room', 2, 8, 4500.00),
(1, '4-in-a-room', 4, 14, 3200.00),

(2, '1-in-a-room', 1, 2, 9200.00),
(2, '2-in-a-room', 2, 6, 7000.00),
(2, '3-in-a-room', 3, 10, 5200.00),

(3, '2-in-a-room', 2, 5, 6800.00),
(3, '4-in-a-room', 4, 12, 3800.00),

(4, '1-in-a-room', 1, 4, 7500.00),
(4, '2-in-a-room', 2, 9, 5800.00),
(4, '4-in-a-room', 4, 15, 4200.00),

(5, '1-in-a-room', 1, 2, 8800.00),
(5, '2-in-a-room', 2, 7, 6400.00),
(5, '3-in-a-room', 3, 11, 4800.00),

(6, '2-in-a-room', 2, 8, 6200.00),
(6, '4-in-a-room', 4, 16, 3500.00),

(7, '2-in-a-room', 2, 4, 5400.00),
(7, '4-in-a-room', 4, 10, 3900.00),

(8, '2-in-a-room', 2, 6, 5800.00),
(8, '3-in-a-room', 3, 9, 4100.00),

(9, '1-in-a-room', 1, 3, 8900.00),
(9, '2-in-a-room', 2, 5, 5500.00),

(10, '2-in-a-room', 2, 7, 5200.00),
(10, '4-in-a-room', 4, 12, 3600.00),

(11, '1-in-a-room', 1, 2, 8200.00),
(11, '2-in-a-room', 2, 6, 6200.00),
(11, '3-in-a-room', 3, 8, 4800.00),

(12, '2-in-a-room', 2, 5, 5900.00),
(12, '4-in-a-room', 4, 11, 4200.00),

(13, '1-in-a-room', 1, 4, 8600.00),
(13, '2-in-a-room', 2, 7, 6400.00),
(13, '3-in-a-room', 3, 10, 5000.00),

(14, '2-in-a-room', 2, 6, 6100.00),
(14, '4-in-a-room', 4, 14, 4400.00),

(15, '2-in-a-room', 2, 5, 5300.00),
(15, '4-in-a-room', 4, 13, 3700.00);

-- 5. Seeded Demo Student Bookings (Requirement 2: Confirmed & Paid Booking + Pending Booking)
INSERT INTO `bookings` (`id`, `booking_reference`, `student_id`, `hostel_id`, `room_id`, `room_type`, `amount`, `status`, `payment_status`, `payment_method`, `payment_proof`, `transaction_ref`, `check_in_period`, `created_at`) VALUES
(1, 'HH-2026-B892', 1, 1, 2, '2-in-a-room', 4500.00, 'confirmed', 'paid', 'MTN Mobile Money', 'proof_b892_sample.png', 'MM-89320194', '2026/2027 Academic Year', '2026-08-10 10:15:00'),
(2, 'HH-2026-P314', 1, 2, 6, '3-in-a-room', 5200.00, 'pending', 'pending_verification', 'Bank Direct Transfer', 'proof_p314_sample.png', 'TXN-9941820', '2026/2027 Academic Year', '2026-08-14 14:30:00');

-- 6. Seeded Demo Student Payment Records
INSERT INTO `payments` (`id`, `payment_reference`, `booking_id`, `student_id`, `amount`, `payment_method`, `proof_file`, `status`, `created_at`) VALUES
(1, 'PAY-2026-9812', 1, 1, 4500.00, 'MTN Mobile Money', 'proof_b892_sample.png', 'verified', '2026-08-10 10:20:00'),
(2, 'PAY-2026-4401', 2, 1, 5200.00, 'Bank Direct Transfer', 'proof_p314_sample.png', 'pending', '2026-08-14 14:35:00');

-- 7. Seeded Demo Student Notifications
INSERT INTO `notifications` (`id`, `student_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 1, 'Booking Confirmed & Payment Verified', 'Your room booking HH-2026-B892 for Banso Royal Student Lodge (2-in-a-room) has been fully verified and confirmed for the 2026/2027 Academic Year.', 'success', 0, '2026-08-10 10:25:00'),
(2, 1, 'Payment Proof Uploaded', 'Payment proof for booking HH-2026-P314 (Ayensu Plaza Hostel) was received and is currently under verification.', 'info', 0, '2026-08-14 14:36:00'),
(3, 1, 'Welcome to Hostel Hub UMaT', 'Explore 15+ verified student hostels in Tarkwa with zero agent middleman fees. Easily book rooms and view printable receipts.', 'info', 1, '2026-08-01 09:00:00');
