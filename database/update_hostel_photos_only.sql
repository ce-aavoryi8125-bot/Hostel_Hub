-- ============================================================
-- HOSTEL HUB — SAFE HOSTEL PHOTOS UPDATE ONLY
-- Target: CEISCY Shared MySQL Database
-- SAFE TO RUN: DOES NOT DROP TABLES, DOES NOT DELETE BOOKINGS,
-- DOES NOT TOUCH STUDENTS, PAYMENTS, OR NOTIFICATIONS.
-- ============================================================

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Ghana_Hostels_Limited_%28UEW%29.jpg,https://upload.wikimedia.org/wikipedia/commons/e/eb/University_of_Ghana_-_Legon_Hall_2.jpg' WHERE `id` = 1;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/d/d7/SRC_hostel_-_KNUST.jpg,https://upload.wikimedia.org/wikipedia/commons/0/05/Legon_hall_main_entrance_-_panoramio.jpg' WHERE `id` = 2;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/c/c5/CHANCELLOR%27S_HALL_%28GUSSS_HOSTELS%29%2C_KNUST.jpg,https://upload.wikimedia.org/wikipedia/commons/5/5a/S-Block_%28Legon_hall%29_-_panoramio.jpg' WHERE `id` = 3;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/b/b3/SPRING_HOSTEL_IN_KNUST.jpg,https://upload.wikimedia.org/wikipedia/commons/d/d6/YMCA_ACCRA_CENTRAL_GHANA.jpg' WHERE `id` = 4;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/e/e6/A_University_Hostel_in_Tamale.jpg,https://upload.wikimedia.org/wikipedia/commons/d/db/Kotei_house12.jpg' WHERE `id` = 5;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/8/86/UHAS_SOKODE_HOSTEL.jpg,https://upload.wikimedia.org/wikipedia/commons/4/4b/Ghana_Hostels_Limited_%28UEW%29.jpg' WHERE `id` = 6;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/d/d6/YMCA_ACCRA_CENTRAL_GHANA.jpg,https://upload.wikimedia.org/wikipedia/commons/d/d7/SRC_hostel_-_KNUST.jpg' WHERE `id` = 7;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/d/db/Kotei_house12.jpg,https://upload.wikimedia.org/wikipedia/commons/c/c5/CHANCELLOR%27S_HALL_%28GUSSS_HOSTELS%29%2C_KNUST.jpg' WHERE `id` = 8;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/e/eb/University_of_Ghana_-_Legon_Hall_2.jpg,https://upload.wikimedia.org/wikipedia/commons/b/b3/SPRING_HOSTEL_IN_KNUST.jpg' WHERE `id` = 9;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/0/05/Legon_hall_main_entrance_-_panoramio.jpg,https://upload.wikimedia.org/wikipedia/commons/e/e6/A_University_Hostel_in_Tamale.jpg' WHERE `id` = 10;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/5/5a/S-Block_%28Legon_hall%29_-_panoramio.jpg,https://upload.wikimedia.org/wikipedia/commons/8/86/UHAS_SOKODE_HOSTEL.jpg' WHERE `id` = 11;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Ghana_Hostels_Limited_%28UEW%29.jpg,https://upload.wikimedia.org/wikipedia/commons/d/d6/YMCA_ACCRA_CENTRAL_GHANA.jpg' WHERE `id` = 12;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/d/d7/SRC_hostel_-_KNUST.jpg,https://upload.wikimedia.org/wikipedia/commons/d/db/Kotei_house12.jpg' WHERE `id` = 13;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/c/c5/CHANCELLOR%27S_HALL_%28GUSSS_HOSTELS%29%2C_KNUST.jpg,https://upload.wikimedia.org/wikipedia/commons/e/eb/University_of_Ghana_-_Legon_Hall_2.jpg' WHERE `id` = 14;

UPDATE `hostels` SET `photos` = 'https://upload.wikimedia.org/wikipedia/commons/b/b3/SPRING_HOSTEL_IN_KNUST.jpg,https://upload.wikimedia.org/wikipedia/commons/0/05/Legon_hall_main_entrance_-_panoramio.jpg' WHERE `id` = 15;
