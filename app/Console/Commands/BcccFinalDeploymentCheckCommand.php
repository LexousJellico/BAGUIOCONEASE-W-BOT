<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Throwable;

class BcccFinalDeploymentCheckCommand extends Command
{
    protected $signature = 'bccc:final-check
        {--strict : Treat warnings as deployment failures}
        {--json : Output JSON instead of a table}';

    protected $description = 'Run the final BCCC EASE Hostinger deployment hardening checks.';

    /** @var array<int, array{level: string, check: string, detail: string}> */
    private array $results = [];

    public function handle(): int
    {
        $this->results = [];

        $this->checkPhpRuntime();
        $this->checkEnvironmentFile();
        $this->checkLaravelEnvironment();
        $this->checkStorageAndCachePaths();
        $this->checkBuildFiles();
        $this->checkCaseSensitiveClassFiles();
        $this->checkDuplicateClassFiles();
        $this->checkRequiredRoutes();
        $this->checkDatabaseShape();
        $this->checkMarketingAssets();
        $this->checkHostingerHtaccess();

        if ($this->option('json')) {
            $this->line(json_encode([
                'status' => $this->hasErrors() ? 'failed' : ($this->hasWarnings() ? 'warning' : 'passed'),
                'strict' => (bool) $this->option('strict'),
                'checked_at' => now()->toIso8601String(),
                'results' => $this->results,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->newLine();
            $this->info('BCCC EASE Final Deployment Check');
            $this->table(['Level', 'Check', 'Detail'], $this->results);
            $this->printCommandOrder();
        }

        if ($this->hasErrors()) {
            $this->error('Final deployment check failed. Fix ERROR items before uploading or switching production traffic.');

            return self::FAILURE;
        }

        if ($this->hasWarnings()) {
            $this->warn('Final deployment check completed with warnings. Warnings are not blockers unless --strict is used.');
        } else {
            $this->info('Final deployment check passed.');
        }

        return self::SUCCESS;
    }

    private function checkPhpRuntime(): void
    {
        $versionOk = version_compare(PHP_VERSION, '8.2.0', '>=');

        $this->add(
            $versionOk ? 'ok' : 'error',
            'PHP version',
            $versionOk ? 'PHP '.PHP_VERSION.' is compatible with Laravel 12.' : 'PHP '.PHP_VERSION.' is too old. Use PHP 8.2 or newer in Hostinger.',
        );

        foreach (['pdo_mysql', 'openssl', 'mbstring', 'tokenizer', 'xml', 'ctype', 'json', 'fileinfo'] as $extension) {
            $this->add(
                extension_loaded($extension) ? 'ok' : 'error',
                'PHP extension '.$extension,
                extension_loaded($extension) ? $extension.' is loaded.' : $extension.' is missing. Enable it in Hostinger PHP settings.',
            );
        }
    }

    private function checkEnvironmentFile(): void
    {
        $envPath = base_path('.env');

        if (! File::exists($envPath)) {
            $this->add('error', '.env file', '.env is missing. Copy .env.hostinger.example to .env and fill the Hostinger database/mail values.');

            return;
        }

        $this->add('ok', '.env file', '.env exists.');

        $lines = preg_split('/\R/', File::get($envPath)) ?: [];
        $unquotedWhitespace = [];

        foreach ($lines as $lineNumber => $line) {
            $trimmed = trim($line);

            if ($trimmed === '' || str_starts_with($trimmed, '#') || ! str_contains($trimmed, '=')) {
                continue;
            }

            [$key, $value] = array_pad(explode('=', $trimmed, 2), 2, '');
            $value = trim($value);

            if ($value !== '' && preg_match('/\s/', $value) && ! str_starts_with($value, '"') && ! str_starts_with($value, "'")) {
                $unquotedWhitespace[] = 'line '.($lineNumber + 1).' '.$key.'='.$value;
            }
        }

        $this->add(
            $unquotedWhitespace === [] ? 'ok' : 'error',
            '.env whitespace',
            $unquotedWhitespace === []
                ? 'No unquoted whitespace values detected.'
                : 'Quote values that contain spaces, for example APP_NAME="BCCC EASE". Found: '.implode('; ', array_slice($unquotedWhitespace, 0, 5)),
        );
    }

    private function checkLaravelEnvironment(): void
    {
        $appUrl = (string) config('app.url');
        $isProduction = app()->environment('production');
        $debug = (bool) config('app.debug');
        $timezone = (string) config('app.timezone');

        $this->add(
            $isProduction ? 'ok' : 'warning',
            'APP_ENV',
            $isProduction ? 'APP_ENV is production.' : 'Current environment is '.app()->environment().'. Hostinger should use APP_ENV=production.',
        );

        $this->add(
            $debug && $isProduction ? 'error' : 'ok',
            'APP_DEBUG',
            $debug && $isProduction ? 'APP_DEBUG must be false in production.' : 'APP_DEBUG is acceptable for this environment.',
        );

        $this->add(
            str_starts_with($appUrl, 'https://') && ! str_contains($appUrl, 'your-domain.com') ? 'ok' : 'warning',
            'APP_URL',
            str_starts_with($appUrl, 'https://') && ! str_contains($appUrl, 'your-domain.com')
                ? 'APP_URL is '.$appUrl.'.'
                : 'Set APP_URL to https://baguioccc-ease.com before production.',
        );

        $this->add(
            config('app.key') ? 'ok' : 'error',
            'APP_KEY',
            config('app.key') ? 'APP_KEY exists.' : 'APP_KEY is missing. Run php artisan key:generate --force.',
        );

        $this->add(
            $timezone === 'Asia/Manila' ? 'ok' : 'warning',
            'APP_TIMEZONE',
            $timezone === 'Asia/Manila' ? 'Timezone is Asia/Manila.' : 'Current timezone is '.$timezone.'. Use APP_TIMEZONE=Asia/Manila for booking deadlines.',
        );
    }

    private function checkStorageAndCachePaths(): void
    {
        $paths = [
            'storage/logs' => storage_path('logs'),
            'storage/framework/cache' => storage_path('framework/cache'),
            'storage/framework/sessions' => storage_path('framework/sessions'),
            'storage/framework/views' => storage_path('framework/views'),
            'storage/app/public' => storage_path('app/public'),
            'bootstrap/cache' => base_path('bootstrap/cache'),
        ];

        foreach ($paths as $label => $path) {
            $this->add(
                File::isDirectory($path) && is_writable($path) ? 'ok' : 'error',
                'Writable '.$label,
                File::isDirectory($path) && is_writable($path) ? $label.' exists and is writable.' : $label.' is missing or not writable.',
            );
        }

        $this->add(
            File::exists(public_path('storage')) ? 'ok' : 'warning',
            'public/storage',
            File::exists(public_path('storage')) ? 'Storage link exists.' : 'Storage link missing. Run php artisan storage:link after deployment.',
        );
    }

    private function checkBuildFiles(): void
    {
        $manifest = public_path('build/manifest.json');
        $hot = public_path('hot');

        $this->add(
            File::exists($manifest) ? 'ok' : 'error',
            'Vite manifest',
            File::exists($manifest) ? 'public/build/manifest.json exists.' : 'Missing public/build/manifest.json. Run npm run build before upload.',
        );

        $this->add(
            File::exists($hot) ? 'error' : 'ok',
            'Vite hot file',
            File::exists($hot) ? 'public/hot exists. Delete it before production.' : 'No public/hot development marker found.',
        );
    }

    private function checkCaseSensitiveClassFiles(): void
    {
        $expected = [
            'app/Models/BookingLifecycleEvent.php' => 'BookingLifecycleEvent',
            'app/Console/Commands/ExportCurrentDataSnapshot.php' => 'ExportCurrentDataSnapshot',
        ];

        foreach ($expected as $relative => $class) {
            $path = base_path($relative);
            $oldPath = $relative === 'app/Models/BookingLifecycleEvent.php'
                ? base_path('app/Models/BookingLifeCycleEvent.php')
                : base_path('app/Console/Commands/ExportCurentDataSnapshot.php');

            if (File::exists($path)) {
                $contents = File::get($path);
                $this->add(
                    str_contains($contents, 'class '.$class) ? 'ok' : 'error',
                    'Class filename '.$class,
                    str_contains($contents, 'class '.$class) ? $relative.' matches the declared class.' : $relative.' exists but does not declare '.$class.'.',
                );
            } elseif (File::exists($oldPath)) {
                $this->add('error', 'Class filename '.$class, 'Old case/spelling file still exists. Rename it to '.$relative.' for Linux/Hostinger.');
            } else {
                $this->add('error', 'Class filename '.$class, $relative.' is missing.');
            }
        }
    }


    private function checkDuplicateClassFiles(): void
    {
        $legacyBookingResource = base_path('app/Http/Requests/BookingResource.php');

        $this->add(
            ! File::exists($legacyBookingResource) ? 'ok' : 'error',
            'Duplicate BookingResource class',
            ! File::exists($legacyBookingResource)
                ? 'Only app/Http/Resources/BookingResource.php exists.'
                : 'Remove app/Http/Requests/BookingResource.php because it declares App\\Http\\Resources\\BookingResource and breaks optimized autoloading.',
        );
    }

    private function checkRequiredRoutes(): void
    {
        $required = [
            'home',
            'public.facilities',
            'public.events',
            'public.calendar',
            'public.availability.check',
            'public.calendar.month',
            'public.site-views.store',
            'public.bookings.availability',
            'login',
            'logout',
            'admin.dashboard',
            'admin.bookings.index',
            'admin.calendar',
            'manager.dashboard',
            'staff.dashboard',
            'user.dashboard',
            'user.calendar',
            'user.bookings.create',
            'notifications.index',
        ];

        foreach ($required as $name) {
            $this->add(
                Route::has($name) ? 'ok' : 'error',
                'Route '.$name,
                Route::has($name) ? 'Route exists.' : 'Route is missing. Check routes/web.php and the latest batches.',
            );
        }

        $duplicates = [];
        $counts = [];

        foreach (Route::getRoutes() as $route) {
            $name = $route->getName();

            if ($name) {
                $counts[$name] = ($counts[$name] ?? 0) + 1;
            }
        }

        foreach ($counts as $name => $count) {
            if ($count > 1) {
                $duplicates[] = $name;
            }
        }

        $this->add(
            $duplicates === [] ? 'ok' : 'error',
            'Duplicate route names',
            $duplicates === [] ? 'No duplicate named routes detected.' : 'Duplicate route names: '.implode(', ', array_slice($duplicates, 0, 10)),
        );
    }

    private function checkDatabaseShape(): void
    {
        try {
            DB::connection()->getPdo();
            $this->add('ok', 'Database connection', 'Database connection succeeded.');
        } catch (Throwable $exception) {
            $this->add('error', 'Database connection', 'Database connection failed: '.$exception->getMessage());

            return;
        }

        $tables = [
            'users',
            'bookings',
            'booking_services',
            'booking_payments',
            'booking_schedule_segments',
            'mice_records',
            'venue_package_templates',
            'site_page_views',
            'calendar_blocks',
            'notifications',
        ];

        foreach ($tables as $table) {
            $this->add(
                DB::getSchemaBuilder()->hasTable($table) ? 'ok' : 'error',
                'Table '.$table,
                DB::getSchemaBuilder()->hasTable($table) ? 'Table exists.' : 'Table missing. Run php artisan migrate --force.',
            );
        }

        $columns = [
            'bookings' => ['selected_package_code', 'selected_area_keys', 'dressing_room_selection', 'dressing_room_charge', 'mice_required', 'schedule_version'],
            'booking_schedule_segments' => ['booking_id', 'date', 'segment_role', 'base_block', 'starts_at', 'ends_at', 'additional_hours', 'area_keys'],
            'mice_records' => ['event_center_name', 'covered_month', 'number_of_hours', 'classification_of_event', 'mice_type_of_event', 'foreign_attendees', 'domestic_attendees', 'has_exhibitions', 'comments_feedback'],
            'venue_package_templates' => ['code', 'name', 'area_keys', 'is_public', 'sort_order'],
            'site_page_views' => ['page_key', 'visitor_hash', 'viewed_at'],
        ];

        foreach ($columns as $table => $requiredColumns) {
            if (! DB::getSchemaBuilder()->hasTable($table)) {
                continue;
            }

            foreach ($requiredColumns as $column) {
                $this->add(
                    DB::getSchemaBuilder()->hasColumn($table, $column) ? 'ok' : 'error',
                    'Column '.$table.'.'.$column,
                    DB::getSchemaBuilder()->hasColumn($table, $column) ? 'Column exists.' : 'Column missing. Re-run the Batch 0-4 migrations.',
                );
            }
        }
    }

    private function checkMarketingAssets(): void
    {
        $report = $this->collectMarketingAssetReport();

        $this->add(
            $report['case_mismatches'] === [] ? 'ok' : 'warning',
            'Marketing asset case',
            $report['case_mismatches'] === []
                ? 'No case-sensitive marketing asset reference mismatch detected.'
                : count($report['case_mismatches']).' reference(s) differ by filename case. Run php artisan bccc:fix-asset-case --write.',
        );

        $this->add(
            $report['missing'] === [] ? 'ok' : 'warning',
            'Marketing asset missing files',
            $report['missing'] === []
                ? 'No missing marketing asset reference detected.'
                : count($report['missing']).' missing reference(s). Upload real images or keep the included placeholders until replacement.',
        );

        $drone = public_path('marketing/images/hero/bccc.png');
        $this->add(
            File::exists($drone) ? 'ok' : 'warning',
            'Cinematic hero image',
            File::exists($drone) ? 'Cinematic hero image image exists.' : 'Upload public/marketing/images/hero/bccc.png for the final cinematic hero.',
        );
    }

    /** @return array{case_mismatches: array<int, string>, missing: array<int, string>} */
    private function collectMarketingAssetReport(): array
    {
        $codeRoots = ['app', 'database', 'resources', 'routes', 'config'];
        $extensions = ['php', 'ts', 'tsx', 'js', 'jsx', 'css', 'json'];
        $references = [];

        foreach ($codeRoots as $root) {
            $path = base_path($root);

            if (! File::isDirectory($path)) {
                continue;
            }

            foreach (File::allFiles($path) as $file) {
                if (! in_array($file->getExtension(), $extensions, true)) {
                    continue;
                }

                $contents = File::get($file->getPathname());

                if (! preg_match_all('#/marketing/images/[^\'"\)\]\s]+#', $contents, $matches)) {
                    continue;
                }

                foreach ($matches[0] as $reference) {
                    $references[$reference][] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname());
                }
            }
        }

        $publicFiles = [];
        $publicRoot = public_path();

        if (File::isDirectory($publicRoot)) {
            foreach (File::allFiles($publicRoot) as $file) {
                $relative = str_replace($publicRoot.DIRECTORY_SEPARATOR, '', $file->getPathname());
                $publicFiles['/'.str_replace(DIRECTORY_SEPARATOR, '/', $relative)] = true;
            }
        }

        $lowerMap = [];

        foreach (array_keys($publicFiles) as $file) {
            $lowerMap[strtolower($file)] = $file;
        }

        $caseMismatches = [];
        $missing = [];

        foreach ($references as $reference => $sources) {
            if (isset($publicFiles[$reference])) {
                continue;
            }

            if (isset($lowerMap[strtolower($reference)])) {
                $caseMismatches[] = $reference.' => '.$lowerMap[strtolower($reference)].' in '.implode(', ', array_slice($sources, 0, 3));
            } else {
                $missing[] = $reference.' in '.implode(', ', array_slice($sources, 0, 3));
            }
        }

        return [
            'case_mismatches' => $caseMismatches,
            'missing' => $missing,
        ];
    }

    private function checkHostingerHtaccess(): void
    {
        $rootHtaccess = base_path('.htaccess');
        $publicHtaccess = public_path('.htaccess');

        $this->add(
            File::exists($rootHtaccess) ? 'ok' : 'warning',
            'Root .htaccess',
            File::exists($rootHtaccess) ? 'Root .htaccess exists for Hostinger whole-project uploads.' : 'Root .htaccess is missing. Add the Batch 9 .htaccess if the whole project is uploaded into public_html.',
        );

        $this->add(
            File::exists($publicHtaccess) ? 'ok' : 'error',
            'Public .htaccess',
            File::exists($publicHtaccess) ? 'public/.htaccess exists.' : 'public/.htaccess is missing. Laravel routing will fail on Apache.',
        );
    }

    private function printCommandOrder(): void
    {
        $this->newLine();
        $this->line('Recommended final order before upload/production switch:');
        $this->line('1. composer install --no-dev --optimize-autoloader');
        $this->line('2. npm install');
        $this->line('3. php artisan bccc:fix-asset-case --write');
        $this->line('4. npm run build');
        $this->line('5. php artisan optimize:clear');
        $this->line('6. php artisan migrate --force');
        $this->line('7. php artisan db:seed --class=VenuePackageTemplateSeeder --force');
        $this->line('8. php artisan storage:link');
        $this->line('9. php artisan config:cache && php artisan route:cache && php artisan view:cache');
        $this->line('10. php artisan bccc:final-check');
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

    private function hasErrors(): bool
    {
        return collect($this->results)->contains(fn (array $row): bool => $row['level'] === 'ERROR');
    }

    private function hasWarnings(): bool
    {
        return collect($this->results)->contains(fn (array $row): bool => $row['level'] === 'WARNING');
    }
}
