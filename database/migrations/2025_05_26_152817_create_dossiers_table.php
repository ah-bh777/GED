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
        Schema::create('dossiers', function (Blueprint $table) {
        $table->id('id');
        $table->string('dossier');
        $table->string('matricule');
        $table->string('couleur');
        $table->string('tiroir');
        $table->string('armoire');
        $table->date('date_d_affectation');
        $table->unsignedBigInteger('entite_id');
        $table->unsignedBigInteger('fonctionnaire_id');
        $table->unsignedBigInteger('affectation_id');
        $table->unsignedBigInteger('grade_id');
 

        $table->timestamps();

        $table->foreign('entite_id')->references('id')->on('entites')->onDelete('cascade')->onUpdate('cascade');
        $table->foreign('affectation_id')->references('id')->on('affectations')->onDelete('cascade')->onUpdate('cascade');
        $table->foreign('fonctionnaire_id')->references('id')->on('fonctionnaires')->onDelete('cascade')->onUpdate('cascade');
        $table->foreign('grade_id')->references('id')->on('grades')->onDelete('cascade')->onUpdate('cascade');


        $table->engine = 'InnoDB';
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dossiers');
    }
};
