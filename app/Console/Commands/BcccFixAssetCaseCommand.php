<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class BcccFixAssetCaseCommand extends Command
{
    protected $signature = 'bccc:fix-asset-case
        {--write : Rewrite code references to match the exact public asset filename case}
        {--show-missing : Print missing asset references}';

    protected $description = 'Find and optionally fix case-sensitive /marketing/images asset references for Linux/Hostinger deployment.';

    /** @var array<string, string> */
    private array $publicAssetLowerMap = [];

    public function handle(): int
    {
        $this->publicAssetLowerMap = $this->buildPublicAssetLowerMap();
        $files = $this->collectCodeFiles();
        $write = (bool) $this->option('write');

        $caseFixes = [];
        $missing = [];
        $changedFiles = 0;

        foreach ($files as $file) {
            $path = $file->getPathname();
            $relative = str_replace(base_path().DIRECTORY_SEPARATOR, '', $path);
            $contents = File::get($path);
            $updated = $contents;

            if (! preg_match_all('#/marketing/images/[^\'"\)\]\s]+#', $contents, $matches)) {
                continue;
            }

            foreach (array_unique($matches[0]) as $reference) {
                if (File::exists(public_path(ltrim($reference, '/')))) {
                    continue;
                }

                $correct = $this->publicAssetLowerMap[strtolower($reference)] ?? null;

                if ($correct) {
                    $caseFixes[] = [$relative, $reference, $correct];
                    $updated = str_replace($reference, $correct, $updated);
                } else {
                    $missing[] = [$relative, $reference];
                }
            }

            if ($write && $updated !== $contents) {
                File::put($path, $updated);
                $changedFiles++;
            }
        }

        $this->newLine();
        $this->info('BCCC EASE Marketing Asset Case Report');

        if ($caseFixes === []) {
            $this->line('No case-only marketing asset mismatches detected.');
        } else {
            $rows = array_map(fn (array $row): array => [$row[0], $row[1], $row[2]], $caseFixes);
            $this->table(['File', 'Current reference', 'Correct reference'], $rows);
        }

        if ($write) {
            $this->info('Files updated: '.$changedFiles);
        } elseif ($caseFixes !== []) {
            $this->warn('Dry run only. Run php artisan bccc:fix-asset-case --write to apply these replacements.');
        }

        if ($this->option('show-missing') && $missing !== []) {
            $this->newLine();
            $this->warn('Missing asset references. Upload real images or keep Batch 9 placeholders for these paths.');
            $this->table(['File', 'Missing reference'], array_slice($missing, 0, 80));
        } elseif ($missing !== []) {
            $this->warn(count($missing).' missing marketing asset reference(s) detected. Add --show-missing to list them.');
        }

        if ($write && $caseFixes !== []) {
            $this->newLine();
            $this->line('Next: run npm run build so Vite compiles the corrected references.');
        }

        return self::SUCCESS;
    }

    /** @return array<string, string> */
    private function buildPublicAssetLowerMap(): array
    {
        $map = [];
        $root = public_path('marketing/images');

        if (! File::isDirectory($root)) {
            return $map;
        }

        foreach (File::allFiles($root) as $file) {
            $relative = str_replace(public_path().DIRECTORY_SEPARATOR, '', $file->getPathname());
            $reference = '/'.str_replace(DIRECTORY_SEPARATOR, '/', $relative);
            $map[strtolower($reference)] = $reference;
        }

        return $map;
    }

    /** @return array<int, \Symfony\Component\Finder\SplFileInfo> */
    private function collectCodeFiles(): array
    {
        $roots = ['app', 'database', 'resources', 'routes', 'config'];
        $extensions = ['php', 'ts', 'tsx', 'js', 'jsx', 'css', 'json'];
        $files = [];

        foreach ($roots as $root) {
            $path = base_path($root);

            if (! File::isDirectory($path)) {
                continue;
            }

            foreach (File::allFiles($path) as $file) {
                if (in_array($file->getExtension(), $extensions, true)) {
                    $files[] = $file;
                }
            }
        }

        return $files;
    }
}
