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
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('total_price');
            $table->string('source')->default('web')->after('payment_status');
            $table->timestamp('cancelled_at')->nullable()->after('source');
            $table->text('cancellation_reason')->nullable()->after('cancelled_at');
            $table->decimal('refund_amount', 10, 2)->nullable()->after('cancellation_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['currency', 'source', 'cancelled_at', 'cancellation_reason', 'refund_amount']);
        });
    }
};
