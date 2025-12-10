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
        Schema::table('passengers', function (Blueprint $table) {
            $table->json('original_data')->nullable()->after('phone_number');
            $table->foreignId('corrected_by')->nullable()->after('original_data')->constrained('users')->onDelete('set null');
            $table->timestamp('corrected_at')->nullable()->after('corrected_by');
            $table->text('correction_reason')->nullable()->after('corrected_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('passengers', function (Blueprint $table) {
            $table->dropForeign(['corrected_by']);
            $table->dropColumn(['original_data', 'corrected_by', 'corrected_at', 'correction_reason']);
        });
    }
};
