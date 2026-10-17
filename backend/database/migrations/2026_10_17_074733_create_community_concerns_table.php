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
    Schema::create('community_concerns', function (Blueprint $table) {
        $table->id();

        $table->foreignId('resident_id')
            ->constrained('residents')
            ->cascadeOnDelete();

        $table->string('title');
        $table->text('description');
        $table->string('category')->nullable();
        $table->string('status')->default('open');
        $table->text('staff_remarks')->nullable();

        $table->foreignId('assigned_to')
            ->nullable()
            ->constrained('users')
            ->nullOnDelete();

        $table->timestamp('resolved_at')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('community_concerns');
    }
};
