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
        Schema::table('passengers', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('name');
            $table->string('last_name')->nullable()->after('first_name');
            $table->date('date_of_birth')->nullable()->after('last_name');
            $table->date('passport_expiry')->nullable()->after('passport_number');
            $table->string('nationality')->nullable()->after('passport_expiry');
            $table->enum('passenger_type', ['adult', 'child', 'infant'])->default('adult')->after('nationality');
            $table->string('meal_preference')->nullable()->after('passenger_type');
            $table->text('special_requests')->nullable()->after('meal_preference');
            $table->string('ticket_number')->nullable()->after('special_requests');
        });

        // Make seat_number nullable
        Schema::table('passengers', function (Blueprint $table) {
            $table->string('seat_number')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('passengers', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'date_of_birth', 'passport_expiry', 'nationality', 'passenger_type', 'meal_preference', 'special_requests', 'ticket_number']);
        });
    }
};
