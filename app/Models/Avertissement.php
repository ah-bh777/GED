<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Avertissement extends Model
{
    use HasFactory;

     protected $fillable = ['note_de_avertissement', 'conseil_de_discipline','dossier_id'];


     public function dossier(){
        return $this->belongsTo(Dossier::class);
     }
}
