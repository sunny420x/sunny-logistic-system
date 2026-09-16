CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_name` varchar(100) NOT NULL,
  `customer_id` varchar(50) NOT NULL,
  `location` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `group_id` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `customers`
  ADD COLUMN IF NOT EXISTS `customer_name` varchar(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `customer_id` varchar(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `location` varchar(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `address` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `group_id` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `phone_number` varchar(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by` int(11) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `customer_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `color` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `customer_groups`
  ADD COLUMN IF NOT EXISTS `name` varchar(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `color` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by` int(11) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `location_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `truck_id` int(11) NOT NULL,
  `position_latitude` varchar(50) NOT NULL,
  `position_longitude` varchar(50) NOT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `location_records`
  ADD COLUMN IF NOT EXISTS `truck_id` int(11) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `position_latitude` varchar(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `position_longitude` varchar(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `driver_id` int(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `action` varchar(50) DEFAULT NULL,
  `details` varchar(300) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `logs`
  ADD COLUMN IF NOT EXISTS `action` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `details` varchar(300) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `maintenance_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(200) NOT NULL,
  `round` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `maintenance_type`
  ADD COLUMN IF NOT EXISTS `name` varchar(200) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `round` int(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `settings` (
  `company_name` varchar(100) DEFAULT NULL,
  `company_logo` varchar(200) DEFAULT NULL,
  `company_banner` varchar(200) DEFAULT NULL,
  `zone` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `settings`
  ADD COLUMN IF NOT EXISTS `company_name` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `company_logo` varchar(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `company_banner` varchar(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `zone` varchar(50) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `transition_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `billing_id` varchar(20) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `time` varchar(20) NOT NULL,
  `status` int(2) NOT NULL DEFAULT 0,
  `finish_at` datetime DEFAULT NULL,
  `truck_id` int(11) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `weight` int(11) DEFAULT 0,
  `arrivalImage` mediumtext DEFAULT NULL,
  `temporary_location` varchar(100) DEFAULT NULL,
  `driver_note` varchar(200) DEFAULT NULL,
  `location_note` varchar(200) DEFAULT NULL,
  `arrival_at_warehouse` datetime DEFAULT NULL,
  `round` int(11) DEFAULT 1,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `transition_records`
  ADD COLUMN IF NOT EXISTS `billing_id` varchar(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `customer_id` int(11) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `date` date NOT NULL DEFAULT '1970-01-01',
  ADD COLUMN IF NOT EXISTS `time` varchar(20) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `status` int(2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `finish_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `truck_id` int(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `driver_id` int(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `weight` int(11) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `arrivalImage` mediumtext DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `temporary_location` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `driver_note` varchar(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `location_note` varchar(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `arrival_at_warehouse` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `round` int(11) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by` int(11) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `trucks` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `license_plate` varchar(50) NOT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `model` varchar(50) DEFAULT NULL,
  `cost_per_km` float DEFAULT NULL,
  `round_cost` float DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `trucks`
  ADD COLUMN IF NOT EXISTS `license_plate` varchar(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `brand` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `model` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `cost_per_km` float DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `round_cost` float DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by` int(11) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `truck_maintenance` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `truck_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `maintenance_type` int(11) NOT NULL,
  `note` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `truck_maintenance`
  ADD COLUMN IF NOT EXISTS `truck_id` int(11) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `user_id` int(11) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `maintenance_type` int(11) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `note` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at` datetime DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `routine_checks` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`truck_id` INT(11) NULL DEFAULT NULL,
	`current_mileage` INT(11) NOT NULL DEFAULT '0',
	`note` TEXT NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	`created_by` INT(11) NULL DEFAULT NULL,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `routine_checks`
  ADD COLUMN IF NOT EXISTS `truck_id` INT(11) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `current_mileage` INT(11) NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS `note` TEXT NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` DATETIME NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by` INT(11) NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `repairs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `truck_id` INT(11) NULL DEFAULT NULL,
  `repair_type` INT(11) NOT NULL,
  `note` TEXT NULL DEFAULT NULL,
  `details` TEXT NULL DEFAULT NULL,
  `created_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `repairs`
  ADD COLUMN IF NOT EXISTS `truck_id` INT(11) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `repair_type` INT(11) NOT NULL,
  ADD COLUMN IF NOT EXISTS `note` TEXT NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `details` TEXT NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` DATETIME NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by` INT(11) NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `repair_types` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NULL DEFAULT NULL,
  `created_by` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `repair_types`
  ADD COLUMN IF NOT EXISTS `name` VARCHAR(100) NOT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` DATETIME NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by` INT(11) NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` varchar(50) NOT NULL,
  `password` varchar(200) NOT NULL,
  `full_name` varchar(200) DEFAULT NULL,
  `phone_number` varchar(200) DEFAULT NULL,
  `type_id` int(11) NOT NULL DEFAULT 2,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `username` varchar(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `password` varchar(200) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `full_name` varchar(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `phone_number` varchar(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `type_id` int(11) NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by` int(11) DEFAULT NULL;

INSERT IGNORE INTO `users` (`id`, `username`, `password`, `full_name`, `phone_number`, `type_id`, `created_at`, `created_by`) VALUES
(1, 'administrator', '4194d1706ed1f408d5e02d672777019f4d5385c766a8c6ca8acba3167d36a7b9', 'ผู้ดูแลเริ่มต้น', '-', 1, NULL, NULL);

CREATE TABLE IF NOT EXISTS `user_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `permission` text NOT NULL,
  `color` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `user_types`
  ADD COLUMN IF NOT EXISTS `name` varchar(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `permission` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `color` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_by` int(11) DEFAULT NULL;

INSERT IGNORE INTO `user_types` (`id`, `name`, `permission`, `color`, `created_at`, `created_by`) VALUES
(1, 'ผู้ดูแลระบบ', 'dashboard,routes,users,trucks,drivers,customers,settings', 'primary', NULL, NULL),
(2, 'พนักงานขับรถ', 'drivers', 'secondary', NULL, NULL);

COMMIT;