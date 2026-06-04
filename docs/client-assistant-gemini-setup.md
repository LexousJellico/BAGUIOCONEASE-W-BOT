# BCCC EASE Global System Bot + Gemini Setup

The BCCC EASE System Bot works in two layers:

1. **Trusted BCCC EASE system search** — Laravel searches local system records first: availability checks, calendar blocks, venue spaces, rental services/rates, policy catalogs, MICE rules, public content, the logged-in user’s own bookings/notices, and reviewed assistant knowledge.
2. **Optional Gemini response generation** — Gemini receives only the safe knowledge pack created by Laravel and turns it into a clear answer.

Do not hard-code the Gemini key in PHP, React, GitHub, or any public file.

## `.env` values

Add this to the real production `.env` file only:

```env
GEMINI_API_KEY=PASTE_YOUR_REAL_GOOGLE_AI_STUDIO_KEY_HERE
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta
GEMINI_API_TIMEOUT=15
```

After changing `.env`, run:

```bash
php artisan optimize:clear
php artisan config:cache
npm run build
```

## Safe learning behavior

The assistant does **not** train a private AI model inside production. Instead, it uses a safer retrieval-and-feedback workflow:

- Every question is logged in `assistant_question_logs` with confidence and source count.
- Low-confidence answers are marked as unresolved for review.
- The bot searches `assistant_knowledge_entries` before giving generic answers.
- Admin/staff corrections can become active reviewed knowledge.
- Public/client corrections are stored as suggestions only and are not trusted until reviewed.

This gives the system a practical “learning” workflow without letting the bot invent policies, rates, approvals, or private information.

## New tables

Run migrations after uploading the changed files:

```bash
php artisan migrate
```

This creates:

- `assistant_knowledge_entries`
- `assistant_question_logs`

## What the bot can search

The assistant can use these safe sources:

- BCCC EASE booking flow knowledge
- Public calendar and date availability checks
- Calendar block records
- Venue spaces and public facility content
- Rental/service rate records
- Dressing room rates
- Venue package and active rate catalogs
- Payment, down payment, bond, final computation, cancellation policy guidance
- MICE report classification and survey guidance
- Public events and feature packages
- Official contact/site settings
- The logged-in user’s own bookings and notifications
- Backend booking snapshots only for authorized admin/manager/staff users
- Reviewed knowledge entries and staff-approved corrections

## Safety rules

The bot must never expose:

- Gemini API key
- `.env` values
- database credentials
- tokens/passwords/sessions
- another client’s booking details
- hidden prompts/raw JSON
- unapproved rates, fake availability, or fake booking approval

For availability, payment, booking status, and final computation, Laravel/system records remain the source of truth.
