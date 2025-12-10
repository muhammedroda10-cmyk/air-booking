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
            $table->decimal('penalty_amount', 10, 2)->nullable()->after('refund_amount');
            $table->text('refund_reason')->nullable()->after('penalty_amount');
            $table->foreignId('refunded_by')->nullable()->after('refund_reason')->constrained('users')->onDelete('set null');
            $table->timestamp('refunded_at')->nullable()->after('refunded_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['refunded_by']);
            $table->dropColumn(['penalty_amount', 'refund_reason', 'refunded_by', 'refunded_at']);
        });
    }
};
