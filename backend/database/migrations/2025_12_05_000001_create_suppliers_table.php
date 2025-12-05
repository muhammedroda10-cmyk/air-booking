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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Display name
            $table->string('code')->unique(); // Unique identifier (e.g., 'flightbuffer', 'amadeus')
            $table->string('driver'); // Which adapter class to use
            $table->string('api_base_url')->nullable();
            $table->text('api_key')->nullable(); // Encrypted
            $table->text('api_secret')->nullable(); // Encrypted
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0); // Higher = checked first
            $table->json('config')->nullable(); // Additional configuration
            $table->integer('timeout')->default(30); // seconds
            $table->integer('retry_times')->default(3);
            $table->timestamp('last_health_check')->nullable();
            $table->boolean('is_healthy')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
