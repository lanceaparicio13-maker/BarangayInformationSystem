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
    Schema::create('document_requests', function (Blueprint $table) {
        $table->id();

        $table->foreignId('resident_id')
            ->constrained('residents')
            ->cascadeOnDelete();

        $table->foreignId('document_type_id')
            ->constrained('document_types')
            ->restrictOnDelete();

        $table->string('purpose');
        $table->string('status')->default('pending');
        $table->text('staff_remarks')->nullable();
        $table->foreignId('processed_by')
            ->nullable()
            ->constrained('users')
            ->nullOnDelete();

        $table->timestamp('released_at')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_requests');
    }
};
