-- ============================================================
-- HOSTEL HUB — COMMERCIAL BUSINESS PLATFORM EXTENSION SCHEMA
-- Target: Commercial Database Upgrade for Landlord & Property Portal
-- Safe Incremental Update (preserves existing student/booking data)
-- ============================================================

-- 1. Table: landlords (Hostel Owners & Property Managers)
CREATE TABLE IF NOT EXISTS `landlords` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `business_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `ghana_card_number` VARCHAR(50) DEFAULT '',
  `kyc_status` ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  `payout_method` VARCHAR(50) DEFAULT 'MTN Mobile Money',
  `payout_account_number` VARCHAR(50) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Add landlord_id column to hostels table if not exists
SET @dropdown = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'hostels' 
       AND COLUMN_NAME = 'landlord_id') > 0,
    'SELECT 1',
    'ALTER TABLE `hostels` ADD COLUMN `landlord_id` INT DEFAULT NULL AFTER `location_id`'
));
PREPARE stmt FROM @dropdown;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Table: reviews (Verified Student Hostel Ratings & Feedback)
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hostel_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `review_text` TEXT NOT NULL,
  `is_verified_tenant` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`hostel_id`) REFERENCES `hostels`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Seed Demo Landlord Account for Commercial Testing
-- Demo Landlord Password: Landlord@Hub2024!
INSERT IGNORE INTO `landlords` (`id`, `full_name`, `business_name`, `email`, `password_hash`, `phone`, `ghana_card_number`, `kyc_status`, `payout_method`, `payout_account_number`) VALUES
(1, 'Kwame Mensah', 'Banso Royal Housing Ltd', 'landlord@hostelhub.dev', '$2y$10$wE4qL7J1A2B3C4D5E6F7G.8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W', '0244123456', 'GHA-729183921-4', 'verified', 'MTN Mobile Money', '0244123456');

-- Link Hostel ID 1 (Banso Royal Student Lodge) to Demo Landlord ID 1
UPDATE `hostels` SET `landlord_id` = 1 WHERE `id` = 1;
