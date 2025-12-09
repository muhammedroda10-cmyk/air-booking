<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Homepage Deal Prices
    |--------------------------------------------------------------------------
    |
    | These prices are displayed on the homepage as featured deals.
    | In production, these would typically come from a database or
    | real-time pricing API.
    |
    */

    'dubai_price' => (float) env('DEAL_DUBAI_PRICE', 589),
    'tokyo_price' => (float) env('DEAL_TOKYO_PRICE', 749),
    'paris_price' => (float) env('DEAL_PARIS_PRICE', 429),

];
