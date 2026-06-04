<!DOCTYPE html>
<html
    lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    @class(['dark' => ($appearance ?? 'system') === 'dark'])
>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'BCCC EASE') }}</title>

        <link rel="icon" type="image/png" href="{{ asset('marketing/images/logo/bccc-seal.png') }}">
        <link rel="shortcut icon" type="image/png" href="{{ asset('marketing/images/logo/bccc-seal.png') }}">
        <link rel="apple-touch-icon" href="{{ asset('marketing/images/logo/bccc-seal.png') }}">
        <meta name="theme-color" content="#14100a">

        <script>
            window.BCCC_EASE = {
                appName: @json(config('app.name', 'BCCC EASE')),
                appUrl: @json(config('app.url')),
                csrfToken: @json(csrf_token()),
            };
        </script>

        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>

    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
