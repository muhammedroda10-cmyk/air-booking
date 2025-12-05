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
        Schema::table('seats', function (Blueprint $table) {
            $table->decimal('price_multiplier', 3, 2)->default(1.00)->after('class');
            $table->enum('seat_type', ['window', 'middle', 'aisle'])->default('middle')->after('price_multiplier');
            $table->boolean('extra_legroom')->default(false)->after('seat_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seats', function (Blueprint $table) {
            $table->dropColumn(['price_multiplier', 'seat_type', 'extra_legroom']);
        });
    }
};
