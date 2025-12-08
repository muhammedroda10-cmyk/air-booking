<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            // Add cabin_class column with enum values
            $table->enum('cabin_class', ['economy', 'premium_economy', 'business', 'first'])
                ->default('economy')
                ->after('aircraft_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            $table->dropColumn('cabin_class');
        });
    }
};
