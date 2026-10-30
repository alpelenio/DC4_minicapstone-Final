# BarangayBook

**Developer:** <YOUR NAME>  
**Client:** Barangay Hall administration and residents

BarangayBook replaces walk-in and social-media facility requests plus a paper logbook with a shared reservation and equipment inventory system. Residents submit requests and follow their status; barangay staff review the schedule, approve or decline requests, and monitor resource use.

## Features

- Sanctum bearer-token registration, login, current-user lookup, and logout
- Resident and administrator roles enforced by React routes and Laravel middleware/policies
- Reservation requests with schedule, capacity, facility, and shared-equipment validation
- Pending, approved, rejected, completed, and cancelled workflow with staff remarks
- Approved-schedule conflict and equipment-stock checks at submission and approval time
- Search, status/facility/date filters, and API pagination for reservation lists
- Facilities, equipment, and equipment-category CRUD for administrators; residents can browse
- Role-specific dashboards, low-stock indicators, and upcoming approved events
- Responsive layout, validation feedback, loading states, and confirmation dialogs

## Technology

- React 19, Vite, React Router, Axios, Tailwind CSS v4
- Laravel 12, PHP 8.2+, Laravel Sanctum API tokens
- MySQL or MariaDB, Laravel migrations, factories, and seeders
- PHPUnit feature tests

## Setup

### Requirements

PHP 8.2+, Composer, Node.js 20.19+ (or a Vite-compatible current release), npm, and MySQL/MariaDB.

### Backend

From the repository root:

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Create a MySQL database named `barangaybook`, then set `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in `backend/.env`. Apply schema and demo data, then start the API:

```powershell
php artisan migrate --seed
php artisan serve
```

The API listens at `http://127.0.0.1:8000`. Configure CORS for `http://localhost:5173` in `backend/config/cors.php` if the frontend uses a different origin.

### Frontend

In a second terminal from the repository root:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The frontend listens at `http://localhost:5173`. Set `VITE_API_URL` in `frontend/.env` if the API URL differs from `http://127.0.0.1:8000/api`.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@barangaybook.test` | `password` |
| Resident | `resident@barangaybook.test` | `password` |

Seeded resident accounts also use the password `password`. Change demo credentials before exposing a deployment publicly.

## API Endpoints

All paths are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/register` | Public | Create resident account and token |
| POST | `/login` | Public | Authenticate and return token/user |
| POST | `/logout` | Authenticated | Revoke current token |
| GET | `/user` | Authenticated | Current user |
| GET | `/dashboard` | Authenticated | Role-specific summary |
| GET, POST | `/reservations` | Authenticated | List/search/filter/paginate; submit request |
| GET, PUT, DELETE | `/reservations/{id}` | Owner/admin | View, edit pending request, cancel pending request (admin may remove pending record) |
| PATCH | `/reservations/{id}/status` | Admin | Approve, reject, or complete valid workflow transition |
| GET, POST | `/facilities` | Authenticated/admin | Browse or create facility |
| GET, PUT, DELETE | `/facilities/{id}` | Authenticated/admin | View or manage facility |
| GET | `/facilities/options` | Authenticated | Active facility dropdown options |
| GET, POST | `/equipment` | Authenticated/admin | Search/filter/paginate or create equipment |
| GET, PUT, DELETE | `/equipment/{id}` | Authenticated/admin | View or manage equipment |
| GET | `/equipment/options` | Authenticated | Equipment options; accepts event schedule for available quantities |
| GET, POST | `/equipment-categories` | Authenticated/admin | Browse/paginate or create category |
| GET, PUT, DELETE | `/equipment-categories/{id}` | Authenticated/admin | View or manage category |
| GET | `/equipment-categories/options` | Authenticated | Dropdown options |

Reservation list query parameters: `search`, `status`, `facility_id`, `date_from`, `date_to`, and `page`. Equipment list parameters: `search`, `category_id`, and `page`. Paginated lists return Laravel `data`, `links`, and `meta` fields. Validation errors use HTTP 422 with field-keyed messages.

For full request examples, see [`docs/postman_collection.json`](docs/postman_collection.json).

## Tests and Build

From the repository root:

```powershell
Set-Location backend
php artisan test
```

The feature suite uses in-memory SQLite so it does not need a running MySQL service. To check the frontend production bundle:

```powershell
Set-Location frontend
npm run build
```

## Data Model

The entity relationship diagram is in [`docs/erd.md`](docs/erd.md). Demo seed data includes three facilities, four equipment categories, nine inventory items, ten resident profiles, and 30 reservations across workflow states.

## Presentation

The eight-slide outline and resident-to-admin demo script are in [`docs/slides-outline.md`](docs/slides-outline.md). Screenshots belong in `docs/screenshots/`.

## References

- Laravel 12 and Laravel Sanctum documentation: https://laravel.com/docs/12.x and https://laravel.com/docs/12.x/sanctum
- React, React Router, Vite, Axios, and Tailwind CSS documentation: https://react.dev, https://reactrouter.com, https://vite.dev, https://axios-http.com, https://tailwindcss.com
- AI assistance was used to scaffold, implement, and review this project. The project-specific code and behavior should be understood and demonstrated by the student.

## Known Limitations

- Approval notices are shown in the application; email or SMS notifications are not configured.
- Equipment availability is calculated from approved reservations; pending requests do not reserve inventory until staff approval.
- Payments and facility fee collection are not part of this version.
- The demo credentials and seeded contacts are for local assessment only.
- The MySQL setup is documented; local automated tests use SQLite for isolation.

## Phase 2 Ideas

- Email/SMS updates when reservation status changes
- Calendar view with printable schedules and CSV export
- Audit history for edits and status decisions
- Upload event permits and facility-use agreements
- Dashboard charts and barangay-wide usage reports
- Deployment with production secrets, HTTPS, and database backups
