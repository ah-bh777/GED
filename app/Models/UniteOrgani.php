<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class UniteOrgani extends Model
{
    use HasFactory;

    public function entites(){
        return $this->hasMany(Entite::class);
    }

    protected $fillable = ['nomUnite'];

    protected $casts = ['nomUnite'=>'string'];

}
