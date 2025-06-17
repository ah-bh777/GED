<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class statut extends Model
{
    protected $fillable =["nom_statut"];

    public function fonctionnaires()
    {
        return $this->hasMany(Fonctionnaire::class);
    }

}
