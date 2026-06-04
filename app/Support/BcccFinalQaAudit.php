<?php

namespace App\Support;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Throwable;

final class BcccFinalQaAudit
{
    private const EXPECTED_ACTIVE_KEYS = [
        'full_hall',
        'main_hall',
        'led_wall',
        'vip_lounge',
        'board_room',
    ];

    private const USER_EXCLUDED_LABELS = [
        'Lobby Receiving Room',
        'Basement Function Room',
        'Basement Hall',
        'Whole Basement',
        'Shop Rental',
        'SHOP Rentals',
        'Catering Maintenance',
        'Air Conditioning',
        'Stationery Kit',
        'Special Package',
    ];

    private const REQUIRED_FILES = [
        'app/Support/ActiveVenueCatalog.php',
        'app/Support/VenueRateCatalog.php',
        'app/Support/VenuePackageCatalog.php',
        'app/Support/BcccBookingPolicyCatalog.php',
        'app/Support/MiceReportCatalog.php',
        'app/Services/BookingPricingService.php',
        'app/Services/BookingFinalComputationService.php',
        'app/Services/BookingApprovalWorkflowService.php',
        'app/Services/BookingBillingService.php',
        'app/Http/Controllers/BookingPrintableController.php',
        'resources/js/components/bookings/booking-form-page.tsx',
        'resources/js/components/bookings/booking-survey-page.tsx',
        'resources/js/components/bookings/booking-approval-panel.tsx',
        'resources/js/components/bookings/booking-print-document.tsx',
    ];

    /**
     * @return array{checks: array<int, array{status: string, title: string, details: array<int, string>}>, passed_count:int, warning_count:int, failed_count:int, ok:bool}
     */
    public static function run(?string $basePath = null): array
    {
        $basePath = $basePath ?: dirname(__DIR__, 2);
        $checks = [];

        $checks[] = self::requiredFilesExist($basePath);
        $checks[] = self::activeCatalogIsScoped();
        $checks[] = self::packagesUseOnlyActiveKeys();
        $checks[] = self::miceCatalogIsReady();
        $checks[] = self::routeFileLooksClean($basePath);
        $checks[] = self::noLegacySurveyEmailRequirement($basePath);
        $checks[] = self::frontendDoesNotExposeExcludedCharges($basePath);
        $checks[] = self::modelCasingIsSafe($basePath);
        $checks[] = self::wayfinderHasBeenGenerated($basePath);
        $checks[] = self::buildManifestOrDevModeReady($basePath);

        $passed = count(array_filter($checks, fn (array $check): bool => $check['status'] === 'pass'));
        $warnings = count(array_filter($checks, fn (array $check): bool => $check['status'] === 'warning'));
        $failed = count(array_filter($checks, fn (array $check): bool => $check['status'] === 'fail'));

        return [
            'checks' => $checks,
            'passed_count' => $passed,
            'warning_count' => $warnings,
            'failed_count' => $failed,
            'ok' => $failed === 0,
        ];
    }

    private static function pass(string $title, array $details = []): array
    {
        return ['status' => 'pass', 'title' => $title, 'details' => $details];
    }

    private static function warning(string $title, array $details = []): array
    {
        return ['status' => 'warning', 'title' => $title, 'details' => $details];
    }

    private static function fail(string $title, array $details = []): array
    {
        return ['status' => 'fail', 'title' => $title, 'details' => $details];
    }

    private static function requiredFilesExist(string $basePath): array
    {
        $missing = [];

        foreach (self::REQUIRED_FILES as $relativePath) {
            if (! is_file($basePath . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath))) {
                $missing[] = $relativePath;
            }
        }

        return empty($missing)
            ? self::pass('Required corrected-batch files are present.')
            : self::fail('Missing corrected-batch files.', $missing);
    }

    private static function activeCatalogIsScoped(): array
    {
        if (! class_exists(ActiveVenueCatalog::class)) {
            return self::fail('ActiveVenueCatalog is not autoloadable.', ['Run composer dump-autoload after copying the patch.']);
        }

        try {
            $keys = array_values(ActiveVenueCatalog::activeKeys());
            sort($keys);
            $expected = self::EXPECTED_ACTIVE_KEYS;
            sort($expected);

            if ($keys !== $expected) {
                return self::fail('Active venue catalog is not limited to the five approved choices.', [
                    'Expected: ' . implode(', ', $expected),
                    'Actual: ' . implode(', ', $keys),
                ]);
            }

            foreach (['basement', 'whole_basement', 'lobby_receiving_room', 'shop_rental', 'catering_maintenance_fee', 'air_conditioning', 'stationery_kit'] as $excluded) {
                if (ActiveVenueCatalog::isSelectableKey($excluded)) {
                    return self::fail('Excluded charge is still selectable.', [$excluded]);
                }
            }

            return self::pass('Active venue catalog is correctly limited to Full Hall, Main Hall, LED Wall, Lounge, and Boardroom.');
        } catch (Throwable $exception) {
            return self::fail('Active venue catalog check failed.', [$exception->getMessage()]);
        }
    }

    private static function packagesUseOnlyActiveKeys(): array
    {
        if (! class_exists(VenuePackageCatalog::class) || ! class_exists(ActiveVenueCatalog::class)) {
            return self::warning('Package catalog could not be checked.', ['VenuePackageCatalog or ActiveVenueCatalog is not autoloadable yet.']);
        }

        try {
            $active = ActiveVenueCatalog::activeKeys();
            $invalid = [];

            foreach (VenuePackageCatalog::defaults() as $package) {
                foreach ((array) ($package['area_keys'] ?? []) as $key) {
                    if (! in_array($key, $active, true)) {
                        $invalid[] = ($package['code'] ?? 'UNKNOWN') . ': ' . $key;
                    }
                }
            }

            return empty($invalid)
                ? self::pass('Package combinations use only the five approved active choices.')
                : self::fail('Package combinations contain unavailable choices.', $invalid);
        } catch (Throwable $exception) {
            return self::fail('Package catalog check failed.', [$exception->getMessage()]);
        }
    }

    private static function miceCatalogIsReady(): array
    {
        if (! class_exists(MiceReportCatalog::class)) {
            return self::warning('MICE catalog is not autoloadable yet.', ['Run composer dump-autoload and php artisan optimize:clear.']);
        }

        try {
            $details = [];
            $ok = true;

            if (MiceReportCatalog::EVENT_CENTER_NAME !== 'BAGUIO CONVENTION AND CULTURAL CENTER') {
                $ok = false;
                $details[] = 'Event center constant is incorrect.';
            }

            if (MiceReportCatalog::FUNCTION_HALLS_COUNT !== 1) {
                $ok = false;
                $details[] = 'Function halls count must be 1.';
            }

            if (MiceReportCatalog::FUNCTION_HALL_CAPACITY !== 2000) {
                $ok = false;
                $details[] = 'Function hall capacity must be 2000.';
            }

            $countries = MiceReportCatalog::countries();
            if (! in_array('Philippines', $countries, true) || count($countries) < 150) {
                $ok = false;
                $details[] = 'Country catalog looks incomplete.';
            }

            return $ok
                ? self::pass('MICE catalog fixed fields and country list are ready.')
                : self::fail('MICE catalog needs correction.', $details);
        } catch (Throwable $exception) {
            return self::fail('MICE catalog check failed.', [$exception->getMessage()]);
        }
    }

    private static function routeFileLooksClean(string $basePath): array
    {
        $path = $basePath . DIRECTORY_SEPARATOR . 'routes' . DIRECTORY_SEPARATOR . 'web.php';

        if (! is_file($path)) {
            return self::fail('routes/web.php is missing.');
        }

        $contents = (string) file_get_contents($path);
        $required = [
            "BookingApprovalController",
            "BookingBillingController",
            "BookingPrintableController",
            "bookings.approval.for-review",
            "bookings.billing.update",
            "bookings.print.reservation",
            "user.bookings.print.reservation",
        ];

        $missing = array_values(array_filter($required, fn (string $needle): bool => ! str_contains($contents, $needle)));

        if (! empty($missing)) {
            return self::fail('Route file is missing finalization/printable routes.', $missing);
        }

        $duplicates = [];
        foreach (['admin.bookings.print.reservation', 'manager.bookings.print.reservation', 'staff.bookings.print.reservation', 'user.bookings.print.reservation'] as $name) {
            $count = substr_count($contents, "->name('" . str_replace(['admin.', 'manager.', 'staff.'], '', $name) . "')");
            if ($name === 'user.bookings.print.reservation') {
                $count = substr_count($contents, "->name('user.bookings.print.reservation')");
            }

            if ($count > 6) {
                $duplicates[] = $name . ' appears unusually often; run php artisan route:list to confirm no duplicate routes.';
            }
        }

        return empty($duplicates)
            ? self::pass('Route file includes finalization and printable routes without obvious duplicated route blocks.')
            : self::warning('Route file may contain duplicate route blocks.', $duplicates);
    }

    private static function noLegacySurveyEmailRequirement(string $basePath): array
    {
        $hits = self::grep($basePath, ['app', 'routes', 'resources/js'], ['emailsurvey', 'email_survey', 'survey_email']);
        $hits = array_filter($hits, fn (string $hit): bool => ! str_contains($hit, 'BcccFinalQaAudit.php'));

        return empty($hits)
            ? self::pass('No legacy emailsurvey/email_survey requirement found in app/routes/frontend code.')
            : self::fail('Legacy survey email requirement still appears in code.', array_values($hits));
    }

    private static function frontendDoesNotExposeExcludedCharges(string $basePath): array
    {
        $hits = [];
        $frontendPath = $basePath . DIRECTORY_SEPARATOR . 'resources' . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'components' . DIRECTORY_SEPARATOR . 'bookings';

        if (! is_dir($frontendPath)) {
            return self::warning('Booking frontend components folder is missing.', ['resources/js/components/bookings']);
        }

        foreach (self::files($frontendPath, ['tsx', 'ts', 'jsx', 'js']) as $file) {
            $contents = (string) file_get_contents($file);
            foreach (self::USER_EXCLUDED_LABELS as $label) {
                if (stripos($contents, $label) !== false) {
                    $relative = str_replace($basePath . DIRECTORY_SEPARATOR, '', $file);
                    $hits[] = $relative . ': ' . $label;
                }
            }
        }

        return empty($hits)
            ? self::pass('Booking frontend does not expose unavailable charges as selectable labels.')
            : self::warning('Unavailable charge labels appear in booking frontend. Confirm these are not selectable.', $hits);
    }

    private static function modelCasingIsSafe(string $basePath): array
    {
        $correct = $basePath . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'Models' . DIRECTORY_SEPARATOR . 'BookingLifecycleEvent.php';
        $legacy = $basePath . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'Models' . DIRECTORY_SEPARATOR . 'BookingLifeCycleEvent.php';

        if (is_file($correct) && is_file($legacy)) {
            return self::warning('Both lifecycle model casing variants exist.', [
                'Keep BookingLifecycleEvent.php and remove/stop using BookingLifeCycleEvent.php on Linux/Hostinger after confirming imports.',
            ]);
        }

        if (! is_file($correct)) {
            return self::warning('BookingLifecycleEvent.php is missing.', ['Batch 5 should add this correctly cased model.']);
        }

        return self::pass('BookingLifecycleEvent model casing is Hostinger/Linux-safe.');
    }

    private static function wayfinderHasBeenGenerated(string $basePath): array
    {
        $routesPath = $basePath . DIRECTORY_SEPARATOR . 'resources' . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'routes';
        $actionsPath = $basePath . DIRECTORY_SEPARATOR . 'resources' . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'actions';

        if (is_dir($routesPath) && is_dir($actionsPath)) {
            return self::pass('Wayfinder generated routes/actions folders are present.');
        }

        return self::warning('Wayfinder output folders are missing.', [
            'Run: php artisan wayfinder:generate --with-form',
            'Then run: npm run build',
        ]);
    }

    private static function buildManifestOrDevModeReady(string $basePath): array
    {
        $manifest = $basePath . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'build' . DIRECTORY_SEPARATOR . 'manifest.json';
        $viteConfig = $basePath . DIRECTORY_SEPARATOR . 'vite.config.ts';

        if (is_file($manifest)) {
            return self::pass('Production Vite manifest exists.');
        }

        if (is_file($viteConfig)) {
            return self::warning('Production Vite manifest is not present yet.', ['Run npm run build before Hostinger deployment or when not using npm run dev.']);
        }

        return self::warning('Vite config/manifest check could not be completed.');
    }

    /** @return array<int, string> */
    private static function grep(string $basePath, array $folders, array $needles): array
    {
        $hits = [];

        foreach ($folders as $folder) {
            $root = $basePath . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $folder);
            if (! is_dir($root)) {
                continue;
            }

            foreach (self::files($root, ['php', 'tsx', 'ts', 'jsx', 'js', 'css']) as $file) {
                $contents = (string) file_get_contents($file);
                foreach ($needles as $needle) {
                    if (stripos($contents, $needle) !== false) {
                        $hits[] = str_replace($basePath . DIRECTORY_SEPARATOR, '', $file) . ': ' . $needle;
                    }
                }
            }
        }

        return array_values(array_unique($hits));
    }

    /** @return array<int, string> */
    private static function files(string $root, array $extensions): array
    {
        $result = [];
        $extensions = array_map('strtolower', $extensions);

        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
        foreach ($iterator as $fileInfo) {
            if (! $fileInfo->isFile()) {
                continue;
            }

            $path = $fileInfo->getPathname();
            $normalized = str_replace('\\', '/', $path);
            if (str_contains($normalized, '/vendor/') || str_contains($normalized, '/node_modules/') || str_contains($normalized, '/storage/') || str_contains($normalized, '/bootstrap/cache/')) {
                continue;
            }

            if (in_array(strtolower($fileInfo->getExtension()), $extensions, true)) {
                $result[] = $path;
            }
        }

        sort($result);

        return $result;
    }
}
