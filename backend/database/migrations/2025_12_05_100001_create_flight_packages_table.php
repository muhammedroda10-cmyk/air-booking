<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flight_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained()->onDelete('cascade');
            $table->string('name'); // economy, premium_economy, business, first_class
            $table->string('display_name'); // Economy, Premium Economy, Business Class, First Class
            $table->integer('baggage_allowance')->default(23); // kg
            $table->integer('cabin_baggage')->default(7); // kg
            $table->boolean('meals_included')->default(false);
            $table->boolean('extra_legroom')->default(false);
            $table->boolean('priority_boarding')->default(false);
            $table->boolean('lounge_access')->default(false);
            $table->boolean('flexible_rebooking')->default(false);
            $table->decimal('price_modifier', 10, 2)->default(0); // Additional cost on top of base_price
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Add default baggage to flights table
        Schema::table('flights', function (Blueprint $table) {
            $table->integer('default_baggage')->default(23)->after('base_price');
            $table->integer('default_cabin_baggage')->default(7)->after('default_baggage');
        });

        // Add package_id to bookings table
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('flight_package_id')->nullable()->after('flight_id')->constrained('flight_packages')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['flight_package_id']);
            $table->dropColumn('flight_package_id');
        });

        Schema::table('flights', function (Blueprint $table) {
            $table->dropColumn(['default_baggage', 'default_cabin_baggage']);
        });

        Schema::dropIfExists('flight_packages');
    }
};
