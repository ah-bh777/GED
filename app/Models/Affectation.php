<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Affectation extends Model
{
    use HasFactory;

    protected $fillable = ['nom_d_affectation'];

    public function dossiers(){
        return $this->hasMany(Dossier::class);
    }
}
