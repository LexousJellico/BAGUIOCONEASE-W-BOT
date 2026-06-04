<?php

namespace App\Services\Contracts;

use App\Models\Service;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ServiceServiceInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    /** @param array{name:string,description:string,uom:string,price:numeric,quantity:int} $data */
    public function create(array $data): Service;

    /** @param array{name:string,description:string,uom:string,price:numeric,quantity:int} $data */
    public function update(Service $service, array $data): Service;

    public function delete(Service $service): void;
}
