<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Corps extends Model
{
    use HasFactory;

    protected $fillable = ['nom_corps'];
    

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    
}
