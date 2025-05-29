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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->date('date_de_soumission');
            $table->string('note_d_observation');
            $table->date('date_d_expiration');
            $table->binary('contenu_document');
            $table->unsignedBigInteger('type_de_document_id');   
            $table->unsignedBigInteger('dossier_id');   
            
            $table->foreign('dossier_id')->references('id')->on('dossiers')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('type_de_document_id')->references('id')->on('type_de_documents')->onDelete('cascade')->onUpdate('cascade');
            $table->timestamps();
            $table->engine('InnoDB');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
