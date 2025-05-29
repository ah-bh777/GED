<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fonctionnaire extends Model
{
    protected $fillable =  ['user_id', 'poste', 'statut'];

    public function user(){
        return $this->belongsTo(User::class);
    }

    public function dossier(){
        return $this->hasOne(Dossier::class);
    }

}
