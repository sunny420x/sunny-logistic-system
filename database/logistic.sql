CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(11) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_id` varchar(50) NOT NULL,
  `location` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `group_id` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `customer_groups` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `color` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `location_records` (
  `id` int(11) NOT NULL,
  `truck_id` int(11) NOT NULL,
  `position_latitude` varchar(50) NOT NULL,
  `position_longitude` varchar(50) NOT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `logs` (
  `id` int(11) NOT NULL,
  `action` varchar(50) DEFAULT NULL,
  `details` varchar(300) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `maintenance_type` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `round` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `company_name` varchar(100) DEFAULT NULL,
  `company_logo` varchar(200) DEFAULT NULL,
  `company_banner` varchar(200) DEFAULT NULL,
  `zone` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `transition_records` (
  `id` int(11) NOT NULL,
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

CREATE TABLE IF NOT EXISTS `trucks` (
  `id` int(11) NOT NULL,
  `license_plate` varchar(50) NOT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `model` varchar(50) DEFAULT NULL,
  `cost_per_km` float DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `truck_maintenance` (
  `id` int(11) NOT NULL,
  `truck_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `maintenance_type` int(11) NOT NULL,
  `note` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(200) NOT NULL,
  `full_name` varchar(200) DEFAULT NULL,
  `phone_number` varchar(200) DEFAULT NULL,
  `type_id` int(11) NOT NULL DEFAULT 2,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `phone_number`, `type_id`, `created_at`, `created_by`) VALUES
(1, 'administrator', '4194d1706ed1f408d5e02d672777019f4d5385c766a8c6ca8acba3167d36a7b9', 'ผู้ดูแลเริ่มต้น', '-', 1, NULL, NULL);

CREATE TABLE IF NOT EXISTS `user_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `permission` text NOT NULL,
  `color` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `user_types` (`id`, `name`, `permission`, `color`, `created_at`, `created_by`) VALUES
(1, 'ผู้ดูแลระบบ', 'dashboard,routes,users,trucks,drivers,customers,settings', 'primary', NULL, NULL),
(2, 'พนักงานขับรถ', 'drivers', 'secondary', NULL, NULL);

ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `customer_groups`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `location_records`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `maintenance_type`
  ADD PRIMARY KEY (`id`) USING BTREE;

ALTER TABLE `transition_records`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `trucks`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `truck_maintenance`
  ADD PRIMARY KEY (`id`) USING BTREE;

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `user_types`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `customer_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `location_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `maintenance_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `transition_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `trucks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `truck_maintenance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

ALTER TABLE `user_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;