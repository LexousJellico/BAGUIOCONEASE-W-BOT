<?php

namespace App\Services;

use App\Models\ServiceType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use App\Services\Contracts\ServiceTypeServiceInterface;

class ServiceTypeService implements ServiceTypeServiceInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return ServiceType::query()->latest('id')->paginate($perPage)->withQueryString();
    }

    /** @param array{name:string} $data */
    public function create(array $data): ServiceType
    {
        return DB::transaction(function () use ($data) {
            return ServiceType::create($data);
        });
    }

    /** @param array{name:string} $data */
    public function update(ServiceType $serviceType, array $data): ServiceType
    {
        return DB::transaction(function () use ($serviceType, $data) {
            $serviceType->update($data);
            return $serviceType->refresh();
        });
    }

    public function delete(ServiceType $serviceType): void
    {
        DB::transaction(function () use ($serviceType) {
            $serviceType->delete();
        });
    }
}
