<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Entite extends Model
{
    use HasFactory , SoftDeletes;

    protected $fillable = ['nom_entite','unite_organi_id'];

    public function unite_organi(){
     return $this->belongsTo(UniteOrgani::class, 'unite_organi_id');

    }
    public function dossiers(){
        return $this->hasMany(Dossier::class);
    }
}
