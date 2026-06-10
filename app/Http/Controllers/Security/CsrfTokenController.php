<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class CsrfTokenController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()
            ->json([
                'csrf_token' => csrf_token(),
            ])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
            ->header('Pragma', 'no-cache');
    }
}
