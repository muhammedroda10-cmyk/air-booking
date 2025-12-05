<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Flight Supplier
    |--------------------------------------------------------------------------
    |
    | This option controls the default flight supplier that will be used when
    | searching for flights. You may set this to any of the suppliers defined
    | in the "suppliers" array below.
    |
    */
    'default' => env('FLIGHT_SUPPLIER_DEFAULT', 'flightbuffer'),

    /*
    |--------------------------------------------------------------------------
    | Search Mode
    |--------------------------------------------------------------------------
    |
    | Determines how flight searches are handled:
    | - 'local': Search only local database (existing behavior)
    | - 'external': Search only external suppliers
    | - 'hybrid': Search both and merge results
    |
    */
    'search_mode' => env('FLIGHT_SEARCH_MODE', 'external'),

    /*
    |--------------------------------------------------------------------------
    | Flight Suppliers
    |--------------------------------------------------------------------------
    |
    | Here you may configure all of the flight suppliers used by your
    | application. Each supplier has its own configuration options.
    |
    */
    'suppliers' => [
        'flightbuffer' => [
            'driver' => 'flightbuffer',
            'base_url' => env('FLIGHTBUFFER_API_URL', 'https://api.flightbuffer.com'),
            'api_key' => env('FLIGHTBUFFER_API_KEY'),
            'api_secret' => env('FLIGHTBUFFER_API_SECRET'),
            'timeout' => 30,
            'retry_times' => 3,
            'retry_delay' => 100, // milliseconds
        ],

        // Future suppliers can be added here
        // 'amadeus' => [
        //     'driver' => 'amadeus',
        //     'base_url' => env('AMADEUS_API_URL', 'https://api.amadeus.com'),
        //     'client_id' => env('AMADEUS_CLIENT_ID'),
        //     'client_secret' => env('AMADEUS_CLIENT_SECRET'),
        //     'timeout' => 30,
        // ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Response Caching
    |--------------------------------------------------------------------------
    |
    | Enable caching of flight search results to reduce API calls.
    | Cache TTL is in minutes.
    |
    */
    'cache' => [
        'enabled' => env('FLIGHT_CACHE_ENABLED', true),
        'ttl' => env('FLIGHT_CACHE_TTL', 5), // minutes
        'prefix' => 'flight_search_',
    ],

    /*
    |--------------------------------------------------------------------------
    | Parallel Search
    |--------------------------------------------------------------------------
    |
    | When multiple suppliers are active, search them in parallel for
    | faster response times.
    |
    */
    'parallel_search' => env('FLIGHT_PARALLEL_SEARCH', true),

    /*
    |--------------------------------------------------------------------------
    | Result Merge Options
    |--------------------------------------------------------------------------
    |
    | Options for merging results from multiple suppliers.
    |
    */
    'merge' => [
        'deduplicate' => true,
        'sort_by' => 'price', // price, duration, departure
        'sort_direction' => 'asc',
        'max_results' => 100,
    ],
];
