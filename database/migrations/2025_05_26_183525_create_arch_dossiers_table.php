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
        Schema::create('arch_dossiers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('dossier_id')->unique(); // unique for 1-to-1 relation
            $table->date('date_d_archivage');
            $table->string('archive_par');
            $table->timestamps();

            $table->foreign('dossier_id')->references('id')->on('dossiers')->onDelete('cascade')->onUpdate('cascade');
            $table->engine('InnoDB');
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arch_dossiers');
    }
};
