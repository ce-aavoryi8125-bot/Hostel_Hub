# Hostel Hub

Hostel Hub is a student accommodation discovery platform designed for students of the University of Mines and Technology (UMaT) in Tarkwa, Ghana. The platform helps students find nearby hostels, compare room types and prices, view photos, contact agents, and request hostel tours more easily.

## Overview

Hostel Hub is built as a lightweight MVP with a Node.js/Express backend and a React-via-CDN frontend. It is tailored for the Tarkwa student housing market, where students need a faster and more reliable way to discover safe and affordable hostels close to campus.

## Features

- Student signup and login
- Hostel search with filters
- Room type-based browsing (1-in-a-room, 2-in-a-room, 3-in-a-room, 4-in-a-room)
- Hostel photos, kitchen photos, and facility views
- Google Maps integration
- Tour request and agent contact flow
- Visit tracking for hostel analytics
- Admin dashboard with summary stats
- Hostel listing creation from the admin interface

## Tech Stack

- Backend: Node.js, Express.js
- Authentication: JWT, bcryptjs
- File uploads: multer
- Frontend: React via CDN, HTML, CSS
- Database: JSON file-based storage for the MVP

## Project Structure

- `server.js` — Express API and static file serving
- `public/` — Student and admin web interfaces
- `data/db.json` — JSON-based data store for the MVP

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   node server.js
   ```

3. Open the app in your browser:

   - Student UI: `http://localhost:3000/index.html`
   - Admin UI: `http://localhost:3000/admin.html`

## Demo Admin Access

- Email: `admin@hostelhub.dev`
- Password: `admin123`

## Planned Upgrades

- PostgreSQL migration
- Cloudinary or AWS S3 for media storage
- Paystack or MoMo payment integration for listing fees

## License

This project is licensed under the MIT License.
