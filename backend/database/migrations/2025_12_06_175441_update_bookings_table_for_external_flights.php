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
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('flight_id')->nullable()->change();
            $table->string('supplier_code')->nullable()->after('flight_id');
            $table->string('external_offer_id')->nullable()->after('supplier_code');
            $table->string('external_order_id')->nullable()->after('external_offer_id');
            $table->json('external_booking_data')->nullable()->after('external_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('flight_id')->nullable(false)->change();
            $table->dropColumn(['supplier_code', 'external_offer_id', 'external_order_id', 'external_booking_data']);
        });
    }
};
