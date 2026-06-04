<?php

namespace App\Http\Middleware;

use App\Services\LoginDeviceService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackLoginDevice
{
    public function __construct(private readonly LoginDeviceService $devices)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->user()) {
            $this->devices->touchCurrentDevice($request);
        }

        return $response;
    }
}
