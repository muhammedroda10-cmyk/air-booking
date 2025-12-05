<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('airlines', function (Blueprint $table) {
            $table->string('country')->nullable()->after('logo_url');
            
            // Cancellation policy fields (per airline)
            $table->integer('cancel_full_refund_hours')->default(168)->after('country'); // 7 days = 168 hours
            $table->integer('cancel_75_refund_hours')->default(72)->after('cancel_full_refund_hours'); // 3 days
            $table->integer('cancel_50_refund_hours')->default(24)->after('cancel_75_refund_hours'); // 1 day
            $table->decimal('cancellation_fee', 10, 2)->default(25.00)->after('cancel_50_refund_hours');
        });

        Schema::table('airports', function (Blueprint $table) {
            $table->string('timezone')->nullable()->after('country');
            $table->decimal('latitude', 10, 7)->nullable()->after('timezone');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('airlines', function (Blueprint $table) {
            $table->dropColumn(['country', 'cancel_full_refund_hours', 'cancel_75_refund_hours', 'cancel_50_refund_hours', 'cancellation_fee']);
        });

        Schema::table('airports', function (Blueprint $table) {
            $table->dropColumn(['timezone', 'latitude', 'longitude']);
        });
    }
};
