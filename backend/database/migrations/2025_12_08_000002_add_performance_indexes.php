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
        // Flights table indexes for search performance
        Schema::table('flights', function (Blueprint $table) {
            $table->index('departure_time', 'idx_flights_departure_time');
            $table->index(['origin_airport_id', 'destination_airport_id'], 'idx_flights_route');
            $table->index(['departure_time', 'origin_airport_id', 'destination_airport_id'], 'idx_flights_search');
        });

        // Bookings table indexes for user queries
        Schema::table('bookings', function (Blueprint $table) {
            $table->index('status', 'idx_bookings_status');
            $table->index('payment_status', 'idx_bookings_payment_status');
            $table->index(['user_id', 'status'], 'idx_bookings_user_status');
            $table->index('created_at', 'idx_bookings_created_at');
        });

        // Transactions table indexes for wallet queries
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('type', 'idx_transactions_type');
            $table->index(['wallet_id', 'type'], 'idx_transactions_wallet_type');
            $table->index('created_at', 'idx_transactions_created_at');
        });

        // Passengers table index
        Schema::table('passengers', function (Blueprint $table) {
            $table->index('booking_id', 'idx_passengers_booking_id');
        });

        // Notifications table indexes
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'read_at'], 'idx_notifications_user_read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            $table->dropIndex('idx_flights_departure_time');
            $table->dropIndex('idx_flights_route');
            $table->dropIndex('idx_flights_search');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex('idx_bookings_status');
            $table->dropIndex('idx_bookings_payment_status');
            $table->dropIndex('idx_bookings_user_status');
            $table->dropIndex('idx_bookings_created_at');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_type');
            $table->dropIndex('idx_transactions_wallet_type');
            $table->dropIndex('idx_transactions_created_at');
        });

        Schema::table('passengers', function (Blueprint $table) {
            $table->dropIndex('idx_passengers_booking_id');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_user_read');
        });
    }
};
