BCCC EASE Deployment Checklist
Use this checklist after applying Batch 1 to Batch 7.
1. Local clean install check
Run these from the project root:
```bash
composer install
npm ci
cp .env.example .env
php artisan key:generate
php artisan optimize:clear
php artisan migrate
npm run wayfinder:generate
npm run types
npm run build
php artisan bccc:audit-workspaces
php artisan bccc:production-check
```
If you are on Windows PowerShell and dependencies look corrupted, reset them first:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force vendor
composer install
npm ci
```
2. Required PHP extensions
The app and CI expect these PHP extensions to be enabled:
```text
dom
fileinfo
mbstring
pdo
pdo_mysql or pdo_sqlite
xml
zip
```
If Artisan crashes with `Class "DOMDocument" not found`, enable the PHP XML/DOM extension in your active PHP installation.
3. Hostinger / hPanel production flow
Run or upload in this order:
```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan optimize:clear
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan bccc:production-check --strict
```
Do not upload or commit:
```text
node_modules/
vendor/
public/hot
.env
```
Usually upload or keep on the server after build:
```text
public/build/
```
4. Scheduler requirement
The scheduler must run for automatic expiry and lifecycle maintenance:
```bash
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```
The current scheduler runs:
```text
bookings:expire-deadlines every 15 minutes
bookings:sync-lifecycle --quiet-report every 30 minutes
```
5. Must-test pages after deployment
```text
/
/facilities
/events
/calendar
/contact
/bookings/create
/admin/dashboard
/admin/calendar
/admin/venue-areas
/admin/rental-options
/admin/users
/admin/payments/review
/my-dashboard
/my-calendar
/my-bookings
```
6. Availability test cases
```text
1. Create a global calendar block with no area.
   Expected: all venues are affected.

2. Create a Main Hall block.
   Expected: Main Hall and Full Hall are affected.

3. Create an LED Wall booking.
   Expected: LED Wall and Full Hall are affected; Main Hall alone is not automatically affected.

4. Create a pencil-booked client booking.
   Expected: public availability treats it as blocked until cancelled, declined, expired, or completed.

5. Submit payment proof.
   Expected: payment status becomes for_review; admin can approve or reject.
```
