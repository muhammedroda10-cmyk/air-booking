<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Branding
    |--------------------------------------------------------------------------
    |
    | These values are used throughout the application for branding, including
    | emails, PDFs, and frontend displays. Change these to match your brand.
    |
    */

    'name' => env('APP_BRAND_NAME', 'Voyager'),

    'support_email' => env('SUPPORT_EMAIL', 'support@voyager.com'),

    'support_phone' => env('SUPPORT_PHONE', '+1 (555) 123-4567'),

    /*
    |--------------------------------------------------------------------------
    | Frontend URL
    |--------------------------------------------------------------------------
    |
    | The URL of the frontend application, used for generating links in emails
    | and other places where we need to redirect users to the frontend.
    |
    */

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    |
    | The default currency code used throughout the application when no
    | specific currency is provided by the user or booking.
    |
    */

    'default_currency' => env('DEFAULT_CURRENCY', 'USD'),

    /*
    |--------------------------------------------------------------------------
    | Loyalty Program Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for the loyalty points program.
    |
    */

    'loyalty' => [
        'points_per_dollar' => (int) env('LOYALTY_POINTS_PER_DOLLAR', 100),
    ],

];
