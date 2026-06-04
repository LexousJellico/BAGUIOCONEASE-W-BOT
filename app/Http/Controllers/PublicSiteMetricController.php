<?php

namespace App\Http\Controllers;

use App\Services\SiteViewMetricService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicSiteMetricController extends Controller
{
    public function store(Request $request, SiteViewMetricService $metrics): JsonResponse
    {
        $data = $request->validate([
            'page_key' => ['nullable', 'string', 'max:80'],
        ]);

        return response()->json([
            'metric' => $metrics->record($request, (string) ($data['page_key'] ?? 'home')),
        ]);
    }
}
