<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Survey proof image storage.
 *
 * ✅ Requirements implemented:
 * - Do NOT store `survey_proof_image_path` in the database.
 * - Store uploads in a folder inside the codebase (Laravel storage).
 * - If Amazon S3 is configured/available, also upload the same image to S3.
 *
 * Storage layout (deterministic):
 * - Local (always): storage/app/private/booking-survey-proofs/booking-{booking_id}.{ext}
 * - S3 (optional):  booking-survey-proofs/booking-{booking_id}.{ext}
 *
 * Because the filename is deterministic, we can locate the file later WITHOUT
 * saving a path in the DB.
 */
class SurveyProofStorageService
{
    /** Disk used for local storage (configured to storage/app/private). */
    public const LOCAL_DISK = 'local';

    /** Optional cloud disk. */
    public const S3_DISK = 's3';

    /** Legacy public disk used by the old implementation. */
    public const LEGACY_PUBLIC_DISK = 'public';

    /** Base directory within each disk. */
    public const BASE_DIR = 'booking-survey-proofs';

    /** Allowed proof image extensions. */
    public const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    /**
     * Store/replace a booking proof image.
     *
     * Local is always written. If S3 is configured, we also write to S3.
     *
     * @return array{relative_path:string,filename:string,extension:string,uploaded_to_s3:bool}
     */
    public function storeUploaded(Booking $booking, UploadedFile $file): array
    {
        $ext = $this->normalizeExtension(
            $file->getClientOriginalExtension(),
            $file->getMimeType() ?: $file->getClientMimeType()
        );

        $filename = $this->filenameFor($booking->id, $ext);
        $relativePath = self::BASE_DIR.'/'. $filename;

        // 1) Store locally (overwrite if same filename).
        $stored = Storage::disk(self::LOCAL_DISK)->putFileAs(self::BASE_DIR, $file, $filename);
        if (! $stored) {
            throw new \RuntimeException('Unable to store proof image locally.');
        }

        // 2) Optionally store on S3.
        $uploadedToS3 = false;
        if ($this->s3IsConfigured()) {
            try {
                $mime = $file->getMimeType() ?: $file->getClientMimeType() ?: 'application/octet-stream';

                Storage::disk(self::S3_DISK)->putFileAs(self::BASE_DIR, $file, $filename, [
                    'visibility' => 'private',
                    'ContentType' => $mime,
                ]);

                $uploadedToS3 = true;
            } catch (\Throwable $e) {
                // Don't fail the request if S3 is unavailable; local copy is the source of truth.
                Log::warning('Survey proof S3 upload failed; stored locally only.', [
                    'booking_id' => $booking->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // 3) Clean up other extensions (so only 1 file remains per booking).
        $this->deleteOtherExtensions($booking->id, $ext);

        return [
            'relative_path' => $relativePath,
            'filename' => $filename,
            'extension' => $ext,
            'uploaded_to_s3' => $uploadedToS3,
        ];
    }

    /**
     * Backfill helper: store raw bytes (e.g., from legacy DB blob) as a proof image.
     */
    public function storeBytes(Booking $booking, string $bytes, ?string $mime = null, ?string $originalName = null): array
    {
        $ext = $this->normalizeExtension(
            $originalName ? pathinfo($originalName, PATHINFO_EXTENSION) : null,
            $mime
        );

        $filename = $this->filenameFor($booking->id, $ext);
        $relativePath = self::BASE_DIR.'/'. $filename;

        $ok = Storage::disk(self::LOCAL_DISK)->put($relativePath, $bytes);
        if (! $ok) {
            throw new \RuntimeException('Unable to store proof image bytes locally.');
        }

        $uploadedToS3 = false;
        if ($this->s3IsConfigured()) {
            try {
                Storage::disk(self::S3_DISK)->put($relativePath, $bytes, [
                    'visibility' => 'private',
                    'ContentType' => $mime ?: 'application/octet-stream',
                ]);
                $uploadedToS3 = true;
            } catch (\Throwable $e) {
                Log::warning('Survey proof S3 upload failed during backfill; stored locally only.', [
                    'booking_id' => $booking->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->deleteOtherExtensions($booking->id, $ext);

        return [
            'relative_path' => $relativePath,
            'filename' => $filename,
            'extension' => $ext,
            'uploaded_to_s3' => $uploadedToS3,
        ];
    }

    /**
     * Locate the proof image on the LOCAL disk.
     */
    public function locateLocal(Booking $booking): ?string
    {
        foreach ($this->candidateRelativePaths($booking->id) as $path) {
            if (Storage::disk(self::LOCAL_DISK)->exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Locate the proof image on the legacy PUBLIC disk (old system that stored a path in DB).
     */
    public function locateLegacyPublicFromPath(?string $legacyPath): ?string
    {
        if (! $legacyPath) {
            return null;
        }

        if (Storage::disk(self::LEGACY_PUBLIC_DISK)->exists($legacyPath)) {
            return $legacyPath;
        }

        return null;
    }

    /**
     * Locate the proof image on S3.
     * Note: this does a network call (exists()). Only use in endpoints, not lists.
     */
    public function locateS3(Booking $booking): ?string
    {
        if (! $this->s3IsConfigured()) {
            return null;
        }

        foreach ($this->candidateRelativePaths($booking->id) as $path) {
            if (Storage::disk(self::S3_DISK)->exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Delete all possible proof image candidates for a booking (local + S3).
     */
    public function deleteAllCandidates(Booking $booking): void
    {
        foreach ($this->candidateRelativePaths($booking->id) as $path) {
            Storage::disk(self::LOCAL_DISK)->delete($path);
        }

        if ($this->s3IsConfigured()) {
            foreach ($this->candidateRelativePaths($booking->id) as $path) {
                Storage::disk(self::S3_DISK)->delete($path);
            }
        }
    }

    /**
     * Candidate relative paths for a booking id across allowed extensions.
     *
     * @return array<int,string>
     */
    public function candidateRelativePaths(int $bookingId): array
    {
        $paths = [];
        foreach (self::ALLOWED_EXTENSIONS as $ext) {
            $paths[] = self::BASE_DIR.'/'. $this->filenameFor($bookingId, $ext);
        }
        return $paths;
    }

    /**
     * Consider S3 "available" if a bucket is configured.
     * Credentials may be provided by IAM role, so we don't require key/secret.
     */
    public function s3IsConfigured(): bool
    {
        $disk = config('filesystems.disks.' . self::S3_DISK);
        if (! is_array($disk)) {
            return false;
        }

        $bucket = (string) ($disk['bucket'] ?? '');
        return $bucket !== '';
    }

    private function deleteOtherExtensions(int $bookingId, string $keepExt): void
    {
        $keepExt = strtolower(trim($keepExt));
        foreach (self::ALLOWED_EXTENSIONS as $ext) {
            $ext = strtolower(trim($ext));
            if ($ext === $keepExt) {
                continue;
            }

            $path = self::BASE_DIR.'/'. $this->filenameFor($bookingId, $ext);
            Storage::disk(self::LOCAL_DISK)->delete($path);

            if ($this->s3IsConfigured()) {
                Storage::disk(self::S3_DISK)->delete($path);
            }
        }
    }

    private function filenameFor(int $bookingId, string $ext): string
    {
        $ext = strtolower(trim($ext));
        return 'booking-'.$bookingId.'.'.$ext;
    }

    /**
     * Normalize to a safe extension based on mime and/or original extension.
     */
    private function normalizeExtension(?string $originalExtension, ?string $mime): string
    {
        $ext = strtolower(trim((string) $originalExtension));
        $mime = strtolower(trim((string) $mime));

        // Prefer mime.
        if ($mime === 'image/jpeg' || $mime === 'image/jpg') {
            return 'jpg';
        }
        if ($mime === 'image/png') {
            return 'png';
        }
        if ($mime === 'image/webp') {
            return 'webp';
        }

        if (in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
            return $ext === 'jpeg' ? 'jpg' : $ext;
        }

        return 'jpg';
    }
}
