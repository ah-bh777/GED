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
        Schema::create('sub_docs', function (Blueprint $table) {
            
            $table->id();
            $table->string('nom_document');
            $table->binary('chemin_contenu_sous_document');
            $table->date('date_ajout');

            $table->unsignedBigInteger('type_de_document_id');
            $table->unsignedBigInteger('document_id');
            $table->foreign('document_id')->references('id')->on('documents')->onDelete('cascade')->onUpdate('cascade');
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
        Schema::dropIfExists('sub_docs');
    }
};
