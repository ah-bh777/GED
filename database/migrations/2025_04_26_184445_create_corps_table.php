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
        Schema::create('corps', function (Blueprint $table) {
            $table->id();
            $table->string('nom_de_corps');
            $table->timestamps();
            $table->engine('InnoDB');
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('corps');
    }
};
