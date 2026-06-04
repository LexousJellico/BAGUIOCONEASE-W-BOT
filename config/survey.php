<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Required Google Survey settings
    |--------------------------------------------------------------------------
    |
    | Used by the booking form UI (QR code + link)
    |
    */

    'url' => env('SURVEY_URL', ''),

    // Can be a public path like: /images/survey-qr.png
    // Or a full URL like: https://example.com/images/survey-qr.png
    'qr_image_url' => env('SURVEY_QR_IMAGE_URL', ''),
];
