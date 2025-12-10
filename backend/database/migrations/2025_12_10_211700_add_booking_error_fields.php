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
            $table->string('error_code')->nullable()->after('source');
            $table->text('error_message')->nullable()->after('error_code');
            $table->text('failure_reason')->nullable()->after('error_message');
            $table->timestamp('failed_at')->nullable()->after('failure_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['error_code', 'error_message', 'failure_reason', 'failed_at']);
        });
    }
};
