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
        Schema::create('price_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('origin_code', 10);
            $table->string('destination_code', 10);
            $table->date('departure_date');
            $table->date('return_date')->nullable();
            $table->string('trip_type', 20)->default('one_way'); // one_way, round_trip
            $table->decimal('target_price', 10, 2)->nullable(); // Alert when price drops below this
            $table->decimal('current_price', 10, 2)->nullable(); // Last checked price
            $table->decimal('lowest_price', 10, 2)->nullable(); // Lowest price seen
            $table->string('currency', 3)->default('USD');
            $table->integer('passengers')->default(1);
            $table->string('cabin_class', 20)->default('economy');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('last_notified_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'is_active']);
            $table->index(['origin_code', 'destination_code', 'departure_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_alerts');
    }
};
