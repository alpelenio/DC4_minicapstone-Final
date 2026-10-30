# BarangayBook API

This Laravel 12 application provides the REST API for the BarangayBook React client. For database setup, environment variables, demo accounts, and endpoint documentation, see the repository root [README](../README.md).

Run from this directory:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Run the backend feature suite with `php artisan test`. Tests use in-memory SQLite; local development is configured through the MySQL settings in `.env.example`.
