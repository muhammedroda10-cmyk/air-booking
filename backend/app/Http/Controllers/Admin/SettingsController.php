<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    /**
     * Get system settings
     */
    public function index()
    {
        $settings = Cache::get('system_settings', [
            'siteName' => config('app.name', 'Voyager'),
            'siteUrl' => config('app.url', 'https://voyager.com'),
            'supportEmail' => config('mail.from.address', 'support@voyager.com'),
            'timezone' => config('app.timezone', 'UTC'),
            'currency' => 'USD',
            'enableHotelBookings' => true,
            'enableFlightBookings' => true,
            'enableWallet' => true,
            'enableRefunds' => true,
            'enableNotifications' => true,
            'maintenanceMode' => app()->isDownForMaintenance(),
            'smtpHost' => config('mail.mailers.smtp.host', ''),
            'smtpPort' => config('mail.mailers.smtp.port', '587'),
            'smtpUser' => config('mail.mailers.smtp.username', ''),
            'stripeEnabled' => !empty(config('services.stripe.key')),
            'paypalEnabled' => false,
        ]);

        return response()->json($settings);
    }

    /**
     * Update system settings
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'siteName' => 'sometimes|string|max:255',
            'siteUrl' => 'sometimes|url',
            'supportEmail' => 'sometimes|email',
            'timezone' => 'sometimes|string',
            'currency' => 'sometimes|string|size:3',
            'enableHotelBookings' => 'sometimes|boolean',
            'enableFlightBookings' => 'sometimes|boolean',
            'enableWallet' => 'sometimes|boolean',
            'enableRefunds' => 'sometimes|boolean',
            'enableNotifications' => 'sometimes|boolean',
            'maintenanceMode' => 'sometimes|boolean',
            'smtpHost' => 'sometimes|string',
            'smtpPort' => 'sometimes|string',
            'smtpUser' => 'sometimes|string',
            'stripeEnabled' => 'sometimes|boolean',
            'paypalEnabled' => 'sometimes|boolean',
        ]);

        // Get current settings and merge with new values
        $currentSettings = Cache::get('system_settings', []);
        $newSettings = array_merge($currentSettings, $validated);

        // Store settings in cache (could also store in database)
        Cache::forever('system_settings', $newSettings);

        // Handle maintenance mode
        if (isset($validated['maintenanceMode'])) {
            if ($validated['maintenanceMode']) {
                // Enable maintenance mode
                file_put_contents(storage_path('framework/down'), json_encode([
                    'time' => time(),
                    'message' => 'The site is currently down for maintenance.',
                ]));
            } else {
                // Disable maintenance mode
                @unlink(storage_path('framework/down'));
            }
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $newSettings,
        ]);
    }
}
