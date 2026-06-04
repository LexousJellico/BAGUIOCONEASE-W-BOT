<?php

namespace App\Services;

use App\Models\Service;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use App\Services\Contracts\ServiceServiceInterface;

class ServiceService implements ServiceServiceInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Service::query()->latest('id')->paginate($perPage)->withQueryString();
    }

    public function create(array $data): Service
    {
        return DB::transaction(function () use ($data) {
            $data['quantity'] = 1;
            $data['capacity_note'] = isset($data['capacity_note']) && trim((string) $data['capacity_note']) !== ''
                ? trim((string) $data['capacity_note'])
                : null;

            return Service::create($data);
        });
    }

    public function update(Service $service, array $data): Service
    {
        return DB::transaction(function () use ($service, $data) {
            $data['quantity'] = 1;
            $data['capacity_note'] = isset($data['capacity_note']) && trim((string) $data['capacity_note']) !== ''
                ? trim((string) $data['capacity_note'])
                : null;

            $service->update($data);

            return $service->refresh();
        });
    }

    public function delete(Service $service): void
    {
        DB::transaction(function () use ($service) {
            $service->delete();
        });
    }
}
