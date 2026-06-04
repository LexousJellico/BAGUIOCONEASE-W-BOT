BCCC EASE Final QA Checklist
Use this after applying Batches 1 to 8.
Required commands
```bash
php artisan optimize:clear
php artisan migrate
npm run wayfinder:generate
npm run types
npm run build
php artisan bccc:audit-workspaces --cleanup-report
php artisan bccc:production-check
```
Admin account checks
Open `/admin/users`.
Search a user by name and email.
Click Add User and confirm the Mark email as verified now checkbox appears.
Save the user.
Confirm the account can log in without being blocked by email verification when the checkbox was enabled.
On `/admin/users`, click the email verify icon for an unverified user.
Confirm the status changes to Email verified.
Click edit and confirm the checkbox can also verify or unverify the account.
User/client calendar checks
Log in as a client/user.
Open `/my-dashboard`.
Confirm My Calendar appears as an action.
Open `/my-calendar`.
Confirm the calendar is the role calendar page, not the public `/calendar` marketing page.
Open the sidebar/navigation if visible and confirm My Calendar points to `/my-calendar`.
Runtime blocker checks
`/admin/rental-options`
`/admin/rental-options/create`
`/admin/venue-areas`
`/admin/venue-areas/create`
`/admin/inquiries`
`/manager/inquiries`
`/staff/inquiries`
`/admin/calendar`
`/manager/calendar`
`/staff/calendar`
`/my-calendar`
None of these pages should show undefined variable, missing class, or missing controller method errors.
Availability checks
Add a calendar block with no selected venue; it should block all venues.
Book or block LED Wall; Full Hall should reflect the conflict.
Book Main Hall; LED Wall should still be available unless Full Hall or LED Wall is affected.
Create a pencil-booked booking; it should block availability until declined, cancelled, expired, or completed.
UI checks
Public header remains sticky.
Public footer has no large blank space below.
Backend sidebar stays fixed.
Backend topbar stays sticky.
Booking create confirm bar is shorter and stays at the bottom.
Summary button floats at the right-middle on desktop and above the confirm bar on mobile.
