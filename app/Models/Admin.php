<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    protected $fillable = ['user_id'];
    public function user(){
        return $this->belongsTo(related: User::class);
    }

    public function dossiers(){
        return $this->belongsToMany(Dossier::class,'admin_dossier');
    }
}
