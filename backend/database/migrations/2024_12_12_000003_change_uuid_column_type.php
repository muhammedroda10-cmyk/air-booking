<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change uuid column type from uuid to varchar for bookings
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
        });
        
        DB::statement('ALTER TABLE bookings ALTER COLUMN uuid TYPE VARCHAR(50) USING uuid::text');
        
        Schema::table('bookings', function (Blueprint $table) {
            $table->unique('uuid');
        });

        // Update existing values to be sequential
        DB::table('bookings')->orderBy('id')->cursor()->each(function ($booking) {
            DB::table('bookings')
                ->where('id', $booking->id)
                ->update(['uuid' => 'BK-' . str_pad($booking->id, 6, '0', STR_PAD_LEFT)]);
        });

        // Change uuid column type from uuid to varchar for hotel_bookings
        Schema::table('hotel_bookings', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
        });
        
        DB::statement('ALTER TABLE hotel_bookings ALTER COLUMN uuid TYPE VARCHAR(50) USING uuid::text');
        
        Schema::table('hotel_bookings', function (Blueprint $table) {
            $table->unique('uuid');
        });

        // Update existing values to be sequential
        DB::table('hotel_bookings')->orderBy('id')->cursor()->each(function ($booking) {
            DB::table('hotel_bookings')
                ->where('id', $booking->id)
                ->update(['uuid' => 'HB-' . str_pad($booking->id, 6, '0', STR_PAD_LEFT)]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to UUID type
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
        });
        DB::statement('ALTER TABLE bookings ALTER COLUMN uuid TYPE UUID USING uuid::uuid');
        Schema::table('bookings', function (Blueprint $table) {
            $table->unique('uuid');
        });

        Schema::table('hotel_bookings', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
        });
        DB::statement('ALTER TABLE hotel_bookings ALTER COLUMN uuid TYPE UUID USING uuid::uuid');
        Schema::table('hotel_bookings', function (Blueprint $table) {
            $table->unique('uuid');
        });
    }
};
