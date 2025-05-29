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
        Schema::create('type_de_documents', function (Blueprint $table) {
            $table->id();
            $table->string('nom_de_type');
            $table->string('type_general');
            $table->boolean('obligatoire')->default(false);
            $table->unsignedBigInteger('parent_general_id')->nullable();
            $table->foreign('parent_general_id')->references('id')->on('type_de_documents')->onDelete('cascade')->onUpdate('cascade');
            $table->timestamps();
            $table->engine('InnoDB');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('type_de_documents');
    }
};
