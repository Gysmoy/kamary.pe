<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('client_notifications')) {
            return;
        }

        Schema::create('client_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('notification_key')->nullable();
            $table->char('mailing_template_id', 36)->nullable();
            $table->string('notification_name');
            $table->text('to_emails');
            $table->text('cc_emails')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['client_id', 'status']);
            $table->index('mailing_template_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_notifications');
    }
};
