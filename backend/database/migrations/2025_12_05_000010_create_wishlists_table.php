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
        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->morphs('wishlistable'); // wishlistable_type, wishlistable_id (for flights, hotels)
            $table->boolean('price_alert_enabled')->default(false);
            $table->decimal('target_price', 10, 2)->nullable(); // Alert when price drops below this
            $table->timestamps();

            $table->unique(['user_id', 'wishlistable_type', 'wishlistable_id'], 'unique_wishlist_item');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishlists');
    }
};
