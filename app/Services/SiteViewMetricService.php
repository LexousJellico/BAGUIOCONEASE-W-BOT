<?php

namespace App\Services;

use App\Models\SitePageView;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SiteViewMetricService
{
    public function record(Request $request, string $pageKey = 'home'): array
    {
        $pageKey = $this->normalizePageKey($pageKey);

        if (! $this->tableReady()) {
            return $this->payload($pageKey);
        }

        $visitorHash = $this->visitorHash($request);
        $sessionKey = hash('sha256', (string) $request->session()->getId());
        $userAgentHash = hash('sha256', (string) $request->userAgent());
        $oneHourAgo = now()->subHour();

        $alreadyRecorded = SitePageView::query()
            ->where('page_key', $pageKey)
            ->where('visitor_hash', $visitorHash)
            ->where('viewed_at', '>=', $oneHourAgo)
            ->exists();

        if (! $alreadyRecorded) {
            SitePageView::query()->create([
                'page_key' => $pageKey,
                'visitor_hash' => $visitorHash,
                'session_key' => $sessionKey,
                'user_agent_hash' => $userAgentHash,
                'ip_address' => $request->ip(),
                'viewed_at' => now(),
            ]);

            $this->forgetHourlyCache($pageKey);
        }

        return $this->payload($pageKey);
    }

    public function payload(string $pageKey = 'home'): array
    {
        $pageKey = $this->normalizePageKey($pageKey);
        $hour = CarbonImmutable::now()->startOfHour();
        $cacheKey = "site-view-metric:{$pageKey}:" . $hour->format('YmdH');

        $payload = Cache::remember($cacheKey, now()->addMinutes(65), function () use ($pageKey, $hour): array {
            $total = $this->tableReady()
                ? SitePageView::query()->where('page_key', $pageKey)->count()
                : 0;

            $last24Hours = $this->tableReady()
                ? SitePageView::query()
                    ->where('page_key', $pageKey)
                    ->where('viewed_at', '>=', now()->subDay())
                    ->count()
                : 0;

            return [
                'pageKey' => $pageKey,
                'label' => 'Website Visits',
                'value' => $total,
                'last24Hours' => $last24Hours,
                'updatedAt' => $hour->toIso8601String(),
                'updatedLabel' => 'Updated hourly',
            ];
        });

        return $payload;
    }

    protected function normalizePageKey(string $pageKey): string
    {
        $pageKey = Str::of($pageKey)->lower()->replaceMatches('/[^a-z0-9_\-]/', '-')->trim('-')->value();

        return $pageKey !== '' ? Str::limit($pageKey, 80, '') : 'home';
    }

    protected function visitorHash(Request $request): string
    {
        return hash('sha256', implode('|', [
            (string) $request->session()->getId(),
            (string) $request->ip(),
            Str::limit((string) $request->userAgent(), 220, ''),
        ]));
    }

    protected function tableReady(): bool
    {
        try {
            return Schema::hasTable('site_page_views');
        } catch (\Throwable) {
            return false;
        }
    }

    protected function forgetHourlyCache(string $pageKey): void
    {
        $hour = CarbonImmutable::now()->startOfHour();
        Cache::forget("site-view-metric:{$pageKey}:" . $hour->format('YmdH'));
    }
}
