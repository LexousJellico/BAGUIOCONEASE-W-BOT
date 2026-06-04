BCCC EASE Safe Cleanup Guide
This guide is intentionally conservative. Do not delete files until the checks pass.
Before cleanup
Run:
```bash
php artisan optimize:clear
npm run wayfinder:generate
npm run types
npm run build
php artisan bccc:audit-workspaces --cleanup-report
```
Safe to keep gitignored/generated
These should not be committed:
```text
resources/js/actions
resources/js/routes
resources/js/wayfinder
public/build
public/hot
node_modules
vendor
storage/logs
```
Safe archive candidates
These are candidates to move outside active source after build confirmation:
```text
resources/js/components/admin-resource/_archive_old
resources/css/_archive_backend_old
```
Recommended archive destination:
```text
_archive/resources-js-admin-resource-old
_archive/resources-css-backend-old
```
Do not delete yet without search confirmation
These old-looking root folders may still be imported by active role pages:
```text
resources/js/pages/bookings
resources/js/pages/calendar
resources/js/pages/payments
resources/js/pages/reports
resources/js/pages/services
resources/js/pages/service-types
resources/js/pages/users
```
Before moving any of them, search imports:
```bash
rg "@/pages/(bookings|calendar|payments|reports|services|service-types|users)" resources/js
rg "\.\./\.\./(bookings|calendar|payments|reports|services|service-types|users)" resources/js
npm run build
```
CSS cleanup rule
Do not delete older backend CSS while `resources/css/bccc-system.css` still imports it.
Current cascade is intentionally centralized through:
```text
resources/css/bccc-system.css
```
Remove one imported CSS file at a time only after checking these pages:
```text
/admin/dashboard
/admin/calendar
/admin/bookings/create
/bookings/create
/my-calendar
/
/facilities
/events
```
