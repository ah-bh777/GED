<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Corps extends Model
{
    use HasFactory , SoftDeletes;

    protected $fillable = ['nom_de_corps'];
    

    public function grades()
    {
        return $this->hasMany(Grade::class ,"corp_id")->withTrashed();
    }

    
}
