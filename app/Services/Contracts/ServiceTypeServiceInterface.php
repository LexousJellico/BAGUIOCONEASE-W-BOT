<?php

namespace App\Services\Contracts;

use App\Models\ServiceType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ServiceTypeServiceInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    /** @param array{name:string} $data */
    public function create(array $data): ServiceType;

    /** @param array{name:string} $data */
    public function update(ServiceType $serviceType, array $data): ServiceType;

    public function delete(ServiceType $serviceType): void;
}
