<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->uuid('uuid')->after('id')->nullable();
            $table->unique('uuid');
        });

        // Generate UUIDs for existing bookings
        DB::table('bookings')->whereNull('uuid')->cursor()->each(function ($booking) {
            DB::table('bookings')
                ->where('id', $booking->id)
                ->update(['uuid' => Str::uuid()]);
        });

        // Make uuid not nullable after populating
        Schema::table('bookings', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};
