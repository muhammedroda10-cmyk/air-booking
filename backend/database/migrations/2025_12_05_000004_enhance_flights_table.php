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
        Schema::table('flights', function (Blueprint $table) {
            $table->integer('total_seats')->default(180)->after('aircraft_type');
            $table->enum('status', ['scheduled', 'delayed', 'cancelled', 'completed'])->default('scheduled')->after('total_seats');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            $table->dropColumn(['total_seats', 'status']);
        });
    }
};
