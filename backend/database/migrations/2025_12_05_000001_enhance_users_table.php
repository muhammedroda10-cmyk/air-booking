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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->date('date_of_birth')->nullable()->after('phone');
            $table->string('passport_number')->nullable()->after('date_of_birth');
            $table->date('passport_expiry')->nullable()->after('passport_number');
            $table->string('nationality')->nullable()->after('passport_expiry');
            $table->text('address')->nullable()->after('nationality');
            $table->enum('status', ['active', 'suspended', 'deleted'])->default('active')->after('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'date_of_birth', 'passport_number', 'passport_expiry', 'nationality', 'address', 'status']);
        });
    }
};
