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
        Schema::create('grade_type_de_document', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('grade_id');
        $table->unsignedBigInteger('type_de_document_id');
        $table->timestamps();

        $table->foreign('grade_id')->references('id')->on('grades')->onDelete('cascade');
        $table->foreign('type_de_document_id')->references('id')->on('type_de_documents')->onDelete('cascade');
        $table->engine('InnoDB');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grade_type_de_document');
    }
};
