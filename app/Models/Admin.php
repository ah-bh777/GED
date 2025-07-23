<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    protected $fillable = ['user_id'];

    public function user()
    {
        return $this->belongsTo(User::class); 
    }

    public function dossiers()
    {
        return $this->belongsToMany(Dossier::class, 'admin_dossier')
                    ->withPivot(['type_de_transaction', 'date_de_transaction']) 
                    ->withTimestamps(); 
    }
}
