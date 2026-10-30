# BarangayBook Workspace Notes

- This is a React/Vite SPA backed by a Laravel 12 API and MySQL.
- Keep API paths under `/api`, protect private routes with Sanctum, and keep role checks on the server.
- Reservation availability and equipment stock rules belong in `ReservationAvailabilityService`.
- Run backend tests from `backend` with `php artisan test`; run the frontend build from `frontend` with `npm run build`.
- Do not commit `.env`, `vendor/`, `node_modules/`, local SQLite data, or build output.
