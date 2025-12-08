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
        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('balance')->default(0); // Current points balance
            $table->integer('lifetime_points')->default(0); // Total points ever earned
            $table->string('tier', 20)->default('bronze'); // bronze, silver, gold, platinum
            $table->timestamp('tier_evaluated_at')->nullable();
            $table->timestamps();

            $table->unique('user_id');
        });

        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('booking_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('points'); // Positive for earn, negative for redeem
            $table->string('type', 20); // earn, redeem, bonus, expire, adjustment
            $table->string('description');
            $table->string('reference')->nullable(); // Reference ID (e.g., booking PNR)
            $table->json('metadata')->nullable(); // Additional data
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_transactions');
        Schema::dropIfExists('loyalty_points');
    }
};
