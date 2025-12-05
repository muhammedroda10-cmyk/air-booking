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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // booking_confirmed, booking_cancelled, payment_received, flight_delayed, etc.
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Additional data (booking_id, flight_id, etc.)
            $table->boolean('is_read')->default(false);
            $table->enum('sent_via', ['in_app', 'email', 'sms', 'push'])->default('in_app');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
