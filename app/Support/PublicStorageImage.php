<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PublicStorageImage
{
    public const TOURISM_MEMBERS = 'tourism-members';
    public const VENUE_SPACES = 'venue-spaces';

    public static function store(?UploadedFile $file, string $directory): ?string
    {
        if (! $file) {
            return null;
        }

        $directory = trim($directory, '/');
        $storedPath = $file->store($directory, 'public');

        return $storedPath ? self::url($storedPath) : null;
    }

    public static function url(?string $path, string $fallback = ''): string
    {
        $raw = trim((string) $path);

        if ($raw === '') {
            return $fallback;
        }

        if (preg_match('/^(https?:)?\/\//i', $raw) || str_starts_with($raw, 'data:')) {
            return $raw;
        }

        $clean = str_replace('\\', '/', $raw);
        $clean = preg_replace('/\?.*$/', '', $clean) ?: $clean;

        if (str_contains($clean, '/storage/app/public/')) {
            $clean = preg_replace('#^.*?/storage/app/public/#', '', $clean) ?: $clean;
        }

        $clean = preg_replace('#^/?storage/app/public/#', '', $clean) ?: $clean;
        $clean = preg_replace('#^/?app/public/#', '', $clean) ?: $clean;
        $clean = preg_replace('#^/?public/storage/#', '', $clean) ?: $clean;
        $clean = preg_replace('#^/?storage/#', '', $clean) ?: $clean;
        $clean = preg_replace('#^/?public/#', '', $clean) ?: $clean;

        if (str_starts_with($clean, '/marketing/') || str_starts_with($clean, '/images/')) {
            return $clean;
        }

        if (str_starts_with($clean, 'marketing/') || str_starts_with($clean, 'images/')) {
            return '/' . $clean;
        }

        if (str_starts_with($clean, '/')) {
            return $clean;
        }

        return '/storage/' . ltrim($clean, '/');
    }

    public static function relative(?string $path): string
    {
        $raw = trim((string) $path);

        if ($raw === '' || preg_match('/^(https?:)?\/\//i', $raw) || str_starts_with($raw, 'data:')) {
            return '';
        }

        $clean = str_replace('\\', '/', $raw);
        $clean = preg_replace('/\?.*$/', '', $clean) ?: $clean;

        if (str_contains($clean, '/storage/app/public/')) {
            $clean = preg_replace('#^.*?/storage/app/public/#', '', $clean) ?: $clean;
        }

        $clean = preg_replace('#^/?storage/app/public/#', '', $clean) ?: $clean;
        $clean = preg_replace('#^/?app/public/#', '', $clean) ?: $clean;
        $clean = preg_replace('#^/?public/storage/#', '', $clean) ?: $clean;
        $clean = preg_replace('#^/?storage/#', '', $clean) ?: $clean;
        $clean = preg_replace('#^/?public/#', '', $clean) ?: $clean;

        return ltrim($clean, '/');
    }

    public static function delete(?string $path): void
    {
        $relative = self::relative($path);

        if ($relative !== '') {
            Storage::disk('public')->delete($relative);
        }
    }
}