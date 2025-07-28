<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Avertissement extends Model
{
    use HasFactory;

     protected $fillable = ['note_d_avertissement', 'titre_d_avertissement','dossier_id'];


     public function dossier(){
        return $this->belongsTo(Dossier::class);
     }
}
