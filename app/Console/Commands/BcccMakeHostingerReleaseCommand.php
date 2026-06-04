<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;
use ZipArchive;

class BcccMakeHostingerReleaseCommand extends Command
{
    protected $signature = 'bccc:make-hostinger-release
        {--output=storage/app/bccc-ease-hostinger-release.zip : Output zip path relative to project root}
        {--include-vendor : Include vendor/ when your Hostinger plan cannot run composer install}
        {--include-node-modules : Include node_modules/ only for emergency transfer; normally keep this off}';

    protected $description = 'Create a clean Hostinger upload ZIP excluding local cache, logs, git data, and development artifacts.';

    public function handle(): int
    {
        if (! class_exists(ZipArchive::class)) {
            $this->error('PHP ZipArchive extension is not enabled. Enable zip extension or create the ZIP manually.');

            return self::FAILURE;
        }

        $output = base_path((string) $this->option('output'));
        File::ensureDirectoryExists(dirname($output));

        if (File::exists($output)) {
            File::delete($output);
        }

        $zip = new ZipArchive();

        if ($zip->open($output, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            $this->error('Unable to create '.$output);

            return self::FAILURE;
        }

        $root = base_path();
        $added = 0;
        $skipped = 0;

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST,
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            $path = $file->getPathname();
            $relative = str_replace($root.DIRECTORY_SEPARATOR, '', $path);
            $relative = str_replace(DIRECTORY_SEPARATOR, '/', $relative);

            if ($this->shouldSkip($relative)) {
                $skipped++;
                continue;
            }

            if ($file->isDir()) {
                $zip->addEmptyDir($relative);
                continue;
            }

            $zip->addFile($path, $relative);
            $added++;
        }

        $zip->close();

        $this->info('Hostinger release ZIP created: '.$output);
        $this->line('Files added: '.$added);
        $this->line('Items skipped: '.$skipped);
        $this->warn('Before uploading, confirm .env contains production values and public/build exists from npm run build.');

        return self::SUCCESS;
    }

    private function shouldSkip(string $relative): bool
    {
        $normalized = ltrim($relative, '/');

        $alwaysSkipPrefixes = [
            '.git/',
            '.github/',
            '.idea/',
            '.vscode/',
            '.zed/',
            'storage/logs/',
            'storage/framework/cache/data/',
            'storage/framework/sessions/',
            'storage/framework/views/',
            'storage/app/bccc-ease-hostinger-release.zip',
            'tests/',
        ];

        foreach ($alwaysSkipPrefixes as $prefix) {
            if (str_starts_with($normalized, $prefix)) {
                return true;
            }
        }

        $alwaysSkipFiles = [
            '.env.backup',
            '.phpunit.cache',
            '.phpunit.result.cache',
            'npm-debug.log',
            'yarn-error.log',
            'public/hot',
        ];

        if (in_array($normalized, $alwaysSkipFiles, true)) {
            return true;
        }

        if (! $this->option('include-vendor') && ($normalized === 'vendor' || str_starts_with($normalized, 'vendor/'))) {
            return true;
        }

        if (! $this->option('include-node-modules') && ($normalized === 'node_modules' || str_starts_with($normalized, 'node_modules/'))) {
            return true;
        }

        return false;
    }
}
