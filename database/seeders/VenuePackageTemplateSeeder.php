<?php

namespace Database\Seeders;

use App\Models\VenuePackageTemplate;
use App\Support\VenuePackageCatalog;
use Illuminate\Database\Seeder;

class VenuePackageTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $officialCodes = VenuePackageCatalog::officialCodes();

        VenuePackageTemplate::query()
            ->whereNotIn('code', $officialCodes)
            ->update([
                'is_public' => false,
                'is_featured' => false,
            ]);

        foreach (VenuePackageCatalog::defaults() as $package) {
            VenuePackageTemplate::query()->updateOrCreate(
                ['code' => $package['code']],
                [
                    'name' => $package['name'],
                    'subtitle' => $package['subtitle'] ?? null,
                    'description' => $package['description'] ?? null,
                    'area_keys' => $package['area_keys'],
                    'image_path' => $package['image_path'] ?? null,
                    'is_public' => (bool) ($package['is_public'] ?? true),
                    'is_featured' => (bool) ($package['is_featured'] ?? false),
                    'sort_order' => (int) ($package['sort_order'] ?? 0),
                ]
            );
        }
    }
}
