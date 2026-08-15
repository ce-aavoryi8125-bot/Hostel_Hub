-- ============================================================
-- HOSTEL HUB — RESTORE ORIGINAL HOSTEL PHOTOS ONLY
-- Target: CEISCY Shared MySQL Database (phpMyAdmin)
-- SAFE TO RUN: DOES NOT DROP TABLES, DOES NOT DELETE BOOKINGS,
-- DOES NOT TOUCH STUDENTS, PAYMENTS, OR NOTIFICATIONS.
-- ============================================================

UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80,https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80' WHERE `id` = 1;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80,https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80' WHERE `id` = 2;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80,https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80' WHERE `id` = 3;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80' WHERE `id` = 4;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80' WHERE `id` = 5;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80' WHERE `id` = 6;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80' WHERE `id` = 7;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80' WHERE `id` = 8;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80' WHERE `id` = 9;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80' WHERE `id` = 10;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80' WHERE `id` = 11;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80' WHERE `id` = 12;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80' WHERE `id` = 13;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80' WHERE `id` = 14;
UPDATE `hostels` SET `photos` = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80' WHERE `id` = 15;
