<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Throwable;

class BcccProductionCheckCommand extends Command
{
    protected $signature = 'bccc:production-check
        {--json : Output machine-readable JSON instead of tables}
        {--strict : Treat warnings as failures}';

    protected $description = 'Run deployment-readiness checks for BCCC EASE before pushing to production hosting.';

    /** @var array<int, array{level: string, check: string, detail: string}> */
    private array $results = [];

    public function handle(): int
    {
        $this->results = [];

        $this->checkEnvironment();
        $this->checkStorage();
        $this->checkBuildAssets();
        $this->checkRoutes();
        $this->checkDatabase();
        $this->checkCommandIntegrity();
        $this->checkModelFileIntegrity();
        $this->checkDuplicateRouteNames();
        $this->checkGeneratedAndIgnoredArtifacts();

        if ($this->option('json')) {
            $this->line(json_encode([
                'status' => $this->hasFailures() ? 'failed' : 'passed',
                'strict' => (bool) $this->option('strict'),
                'checked_at' => now()->toIso8601String(),
                'results' => $this->results,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->newLine();
            $this->info('BCCC EASE Production Check');
            $this->table(['Level', 'Check', 'Detail'], $this->results);
            $this->printDeploymentReminder();
        }

        if ($this->hasFailures()) {
            $this->error('Production check failed. Resolve ERROR items before deployment.');

            return self::FAILURE;
        }

        if ($this->hasWarnings()) {
            $this->warn('Production check completed with warnings. Review warnings before deployment.');
        } else {
            $this->info('Production check passed.');
        }

        return self::SUCCESS;
    }

    private function checkEnvironment(): void
    {
        $this->add(
            config('app.key') ? 'ok' : 'error',
            'APP_KEY',
            config('app.key') ? 'Application key is configured.' : 'APP_KEY is missing. Run php artisan key:generate.',
        );

        $appUrl = trim((string) config('app.url'));
        $this->add(
            $appUrl !== '' ? 'ok' : 'warning',
            'APP_URL',
            $appUrl !== '' ? 'APP_URL is configured as '.$appUrl.'.' : 'APP_URL is empty. Set the final domain URL before deployment.',
        );

        $timezone = (string) config('app.timezone');
        $this->add(
            $timezone === 'Asia/Manila' ? 'ok' : 'warning',
            'APP_TIMEZONE',
            $timezone === 'Asia/Manila'
                ? 'Timezone is Asia/Manila.'
                : 'Current timezone is '.$timezone.'. Use APP_TIMEZONE=Asia/Manila for BCCC deadline and calendar accuracy.',
        );

        if (app()->environment('production')) {
            $this->add(
                config('app.debug') ? 'error' : 'ok',
                'APP_DEBUG',
                config('app.debug') ? 'APP_DEBUG must be false in production.' : 'APP_DEBUG is false.',
            );
        } else {
            $this->add('warning', 'APP_ENV', 'Current APP_ENV is '.app()->environment().'. This is acceptable locally; production should use APP_ENV=production.');
        }

        $this->checkGoogleOAuthEnvironment();
        $this->checkSurveyEnvironment();
        $this->checkMailEnvironment();
        $this->checkTelescopeEnvironment();
    }

    private function checkGoogleOAuthEnvironment(): void
    {
        $clientId = trim((string) config('services.google.client_id'));
        $clientSecret = trim((string) config('services.google.client_secret'));
        $redirect = trim((string) config('services.google.redirect'));
        $configured = [$clientId !== '', $clientSecret !== '', $redirect !== ''];

        if (! in_array(true, $configured, true)) {
            $this->add('warning', 'Google OAuth', 'Google sign-in is not configured. This is acceptable only if Google login is intentionally disabled.');

            return;
        }

        $this->add(
            ! in_array(false, $configured, true) ? 'ok' : 'error',
            'Google OAuth',
            ! in_array(false, $configured, true)
                ? 'Google OAuth client id, secret, and redirect URI are configured.'
                : 'Google OAuth is partially configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI together.',
        );
    }

    private function checkSurveyEnvironment(): void
    {
        $surveyUrl = trim((string) config('survey.url'));
        $qrUrl = trim((string) config('survey.qr_image_url'));

        $this->add(
            $surveyUrl !== '' ? 'ok' : 'warning',
            'Survey URL',
            $surveyUrl !== '' ? 'SURVEY_URL is configured.' : 'SURVEY_URL is empty. Set it when MICE/survey proof flow is enabled.',
        );

        $this->add(
            $qrUrl !== '' || File::exists(public_path('qr.png')) ? 'ok' : 'warning',
            'Survey QR image',
            $qrUrl !== ''
                ? 'SURVEY_QR_IMAGE_URL is configured.'
                : (File::exists(public_path('qr.png')) ? 'public/qr.png fallback exists.' : 'No SURVEY_QR_IMAGE_URL or public/qr.png fallback detected.'),
        );
    }

    private function checkMailEnvironment(): void
    {
        $mailer = (string) config('mail.default');
        $from = trim((string) config('mail.from.address'));

        if (app()->environment('production') && $mailer === 'log') {
            $this->add('warning', 'MAIL_MAILER', 'Production mailer is log. Email verification and notices will not be delivered to users.');
        } else {
            $this->add('ok', 'MAIL_MAILER', 'Mailer is configured as '.$mailer.'.');
        }

        $this->add(
            $from !== '' && ! str_contains($from, 'example.com') ? 'ok' : 'warning',
            'MAIL_FROM_ADDRESS',
            $from !== '' && ! str_contains($from, 'example.com')
                ? 'MAIL_FROM_ADDRESS is configured as '.$from.'.'
                : 'MAIL_FROM_ADDRESS still looks generic. Set an official sender address before live use.',
        );
    }

    private function checkTelescopeEnvironment(): void
    {
        $enabled = (bool) config('telescope.enabled');

        $this->add(
            app()->environment('production') && $enabled ? 'warning' : 'ok',
            'Telescope',
            app()->environment('production') && $enabled
                ? 'Telescope is enabled in production. Set TELESCOPE_ENABLED=false unless you intentionally need it.'
                : 'Telescope production exposure check passed.',
        );
    }

    private function checkStorage(): void
    {
        $storagePaths = [
            storage_path('logs'),
            storage_path('framework/cache'),
            storage_path('framework/sessions'),
            storage_path('framework/views'),
            storage_path('app/private'),
            storage_path('app/public'),
        ];

        foreach ($storagePaths as $path) {
            $this->add(
                File::isDirectory($path) && is_writable($path) ? 'ok' : 'error',
                'Writable storage',
                $path.(File::isDirectory($path) && is_writable($path) ? ' is writable.' : ' is missing or not writable.'),
            );
        }

        $publicStorage = public_path('storage');
        $this->add(
            File::exists($publicStorage) ? 'ok' : 'warning',
            'Public storage link',
            File::exists($publicStorage) ? 'public/storage exists.' : 'public/storage is missing. Run php artisan storage:link if uploads must be public.',
        );
    }

    private function checkBuildAssets(): void
    {
        $manifest = public_path('build/manifest.json');
        $this->add(
            File::exists($manifest) ? 'ok' : 'warning',
            'Vite manifest',
            File::exists($manifest) ? 'public/build/manifest.json exists.' : 'Vite manifest is missing. Run npm run build before production deployment.',
        );

        $hot = public_path('hot');
        $this->add(
            File::exists($hot) && app()->environment('production') ? 'error' : (File::exists($hot) ? 'warning' : 'ok'),
            'Vite hot file',
            File::exists($hot) ? 'public/hot exists. Remove it before production deployment.' : 'No public/hot dev file detected.',
        );
    }

    private function checkRoutes(): void
    {
        $required = [
            'home',
            'public.facilities',
            'public.events',
            'public.calendar',
            'public.contact',
            'public.availability.check',
            'public.calendar.month',
            'admin.dashboard',
            'admin.content',
            'admin.bookings.index',
            'admin.venue-areas.index',
            'admin.rental-options.index',
            'admin.users.index',
            'admin.users.verify-email',
            'manager.dashboard',
            'staff.dashboard',
            'user.dashboard',
            'user.calendar',
            'user.bookings.index',
            'user.bookings.create',
            'verification.notice',
            'verification.verify',
            'verification.send',
            'login',
            'login.store',
            'logout',
        ];

        foreach ($required as $name) {
            $this->requireRoute($name);
        }

        $this->requireAnyRoute('Password confirmation GET route', [
            'password.confirm',
            'auth.password.confirm',
        ]);

        $this->requireAnyRoute('Password confirmation POST route', [
            'password.confirm.store',
            'password.confirmation',
            'auth.password.confirm.store',
        ]);

        if (Features::enabled(Features::twoFactorAuthentication())) {
            $this->requireRoute('two-factor.login');
            $this->requireRoute('two-factor.show');
        }
    }

    private function requireRoute(string $name): void
    {
        $this->add(
            Route::has($name) ? 'ok' : 'error',
            'Route '.$name,
            Route::has($name) ? 'Route is registered.' : 'Route is missing.',
        );
    }

    /**
     * @param  array<int, string>  $names
     */
    private function requireAnyRoute(string $label, array $names): void
    {
        $existing = array_values(array_filter($names, fn (string $name): bool => Route::has($name)));

        $this->add(
            $existing !== [] ? 'ok' : 'error',
            $label,
            $existing !== []
                ? 'Registered alias: '.implode(', ', $existing).'.'
                : 'Missing all acceptable aliases: '.implode(', ', $names).'.',
        );
    }

    private function checkDatabase(): void
    {
        try {
            DB::connection()->getPdo();
            $this->add('ok', 'Database connection', 'Database connection succeeded.');
        } catch (Throwable $exception) {
            $this->add('error', 'Database connection', $exception->getMessage());

            return;
        }

        $tables = [
            'users',
            'roles',
            'permissions',
            'model_has_roles',
            'service_types',
            'services',
            'bookings',
            'booking_services',
            'booking_payments',
            'booking_lifecycle_events',
            'calendar_blocks',
            'inquiries',
            'public_events',
            'venue_spaces',
            'site_settings',
            'mice_records',
        ];

        foreach ($tables as $table) {
            $exists = DB::getSchemaBuilder()->hasTable($table);
            $this->add($exists ? 'ok' : 'error', 'Database table '.$table, $exists ? 'Table exists.' : 'Table is missing. Run php artisan migrate.');
        }

        $this->checkColumns('users', ['email_verified_at', 'last_login_at', 'google_id', 'role_name']);
        $this->checkColumns('bookings', ['booking_status', 'payment_status', 'expired_at', 'archived_at', 'created_by_user_id', 'is_public_calendar_visible', 'public_calendar_title']);
        $this->checkColumns('booking_payments', ['status', 'proof_image_path', 'proof_file_name', 'proof_mime_type', 'proof_file_size']);
        $this->checkColumns('calendar_blocks', ['date_from', 'date_to', 'block', 'public_status']);
        $this->checkColumns('mice_records', ['booking_id', 'status', 'event_name', 'total_participants']);
    }

    /**
     * @param  array<int, string>  $columns
     */
    private function checkColumns(string $table, array $columns): void
    {
        if (! DB::getSchemaBuilder()->hasTable($table)) {
            return;
        }

        foreach ($columns as $column) {
            $exists = DB::getSchemaBuilder()->hasColumn($table, $column);
            $this->add($exists ? 'ok' : 'error', $table.'.'.$column, $exists ? 'Column exists.' : 'Column is missing. Run php artisan migrate.');
        }
    }

    private function checkCommandIntegrity(): void
    {
        $files = File::glob(app_path('Console/Commands/*.php'));
        $signatures = [];
        $classes = [];
        $mismatches = [];

        foreach ($files as $file) {
            $contents = File::get($file);
            $relative = str_replace(base_path().DIRECTORY_SEPARATOR, '', $file);
            $filenameClass = pathinfo($file, PATHINFO_FILENAME);

            if (preg_match('/protected\s+\$signature\s*=\s*[\'\"]([^\'\"]+)/', $contents, $match)) {
                $signature = trim(preg_split('/\s+/', $match[1])[0] ?? $match[1]);
                $signatures[$signature][] = $relative;
            }

            if (preg_match('/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends\s+Command/', $contents, $match)) {
                $class = $match[1];
                $classes[$class][] = $relative;

                if ($class !== $filenameClass) {
                    $mismatches[] = $relative.' declares '.$class;
                }
            }
        }

        $duplicateSignatures = array_filter($signatures, fn (array $paths): bool => count($paths) > 1);
        $duplicateClasses = array_filter($classes, fn (array $paths): bool => count($paths) > 1);

        $this->add(
            $duplicateSignatures === [] ? 'ok' : 'error',
            'Console command signatures',
            $duplicateSignatures === [] ? 'No duplicate console command signatures detected.' : 'Duplicate signatures: '.implode(', ', array_keys($duplicateSignatures)),
        );

        $this->add(
            $duplicateClasses === [] ? 'ok' : 'error',
            'Console command classes',
            $duplicateClasses === [] ? 'No duplicate console command classes detected.' : 'Duplicate classes: '.implode(', ', array_keys($duplicateClasses)),
        );

        $this->add(
            $mismatches === [] ? 'ok' : 'error',
            'Console command filenames',
            $mismatches === [] ? 'Command filenames match declared classes.' : 'Filename/class mismatch: '.implode('; ', $mismatches),
        );
    }

    private function checkModelFileIntegrity(): void
    {
        $files = File::glob(app_path('Models/*.php'));
        $mismatches = [];
        $duplicates = [];
        $classes = [];

        foreach ($files as $file) {
            $contents = File::get($file);
            $relative = str_replace(base_path().DIRECTORY_SEPARATOR, '', $file);
            $filenameClass = pathinfo($file, PATHINFO_FILENAME);

            if (! preg_match('/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends\s+/', $contents, $match)) {
                continue;
            }

            $class = $match[1];
            $classes[$class][] = $relative;

            if ($class !== $filenameClass) {
                $mismatches[] = $relative.' declares '.$class;
            }
        }

        foreach ($classes as $class => $paths) {
            if (count($paths) > 1) {
                $duplicates[] = $class.' in '.implode(', ', $paths);
            }
        }

        $this->add(
            $mismatches === [] ? 'ok' : 'error',
            'Model filenames',
            $mismatches === [] ? 'Model filenames match declared classes.' : 'Model filename/class mismatch: '.implode('; ', $mismatches),
        );

        $this->add(
            $duplicates === [] ? 'ok' : 'error',
            'Model duplicate classes',
            $duplicates === [] ? 'No duplicate model classes detected.' : 'Duplicate model classes: '.implode('; ', $duplicates),
        );
    }

    private function checkDuplicateRouteNames(): void
    {
        $counts = [];

        foreach (Route::getRoutes() as $route) {
            $name = $route->getName();

            if (! $name) {
                continue;
            }

            $counts[$name] = ($counts[$name] ?? 0) + 1;
        }

        $duplicates = array_filter($counts, fn (int $count): bool => $count > 1);

        $this->add(
            $duplicates === [] ? 'ok' : 'error',
            'Duplicate route names',
            $duplicates === [] ? 'No duplicate route names detected.' : 'Duplicate route names: '.implode(', ', array_keys($duplicates)),
        );
    }

    private function checkGeneratedAndIgnoredArtifacts(): void
    {
        $gitignore = File::exists(base_path('.gitignore')) ? File::get(base_path('.gitignore')) : '';
        $expectedIgnored = [
            '/vendor',
            '/node_modules',
            '/public/build',
            '/public/hot',
            '/resources/js/actions',
            '/resources/js/routes',
            '/resources/js/wayfinder',
            '.env',
        ];

        foreach ($expectedIgnored as $pattern) {
            $this->add(
                str_contains($gitignore, $pattern) ? 'ok' : 'warning',
                '.gitignore '.$pattern,
                str_contains($gitignore, $pattern) ? $pattern.' is ignored.' : $pattern.' is not listed in .gitignore.',
            );
        }
    }

    private function printDeploymentReminder(): void
    {
        $this->newLine();
        $this->line('Recommended final command order:');
        $this->line('1. composer install --no-dev --optimize-autoloader');
        $this->line('2. npm install');
        $this->line('3. npm run build');
        $this->line('4. php artisan key:generate --force   # only if APP_KEY is empty');
        $this->line('5. php artisan migrate --force');
        $this->line('6. php artisan storage:link');
        $this->line('7. php artisan optimize:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache');
        $this->line('8. php artisan bccc:production-check');
    }

    private function add(string $level, string $check, string $detail): void
    {
        if ($this->option('strict') && $level === 'warning') {
            $level = 'error';
        }

        $this->results[] = [
            'level' => strtoupper($level),
            'check' => $check,
            'detail' => $detail,
        ];
    }

    private function hasFailures(): bool
    {
        return collect($this->results)->contains(fn (array $row): bool => $row['level'] === 'ERROR');
    }

    private function hasWarnings(): bool
    {
        return collect($this->results)->contains(fn (array $row): bool => $row['level'] === 'WARNING');
    }
}
