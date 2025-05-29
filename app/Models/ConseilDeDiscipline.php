<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConseilDeDiscipline extends Model
{
    use HasFactory;

    protected $fillable = ['date_conseil','motif','decision','dossier_id'];

    protected $casts = ['date_conseil'=>'date'];

    public function dossier(){
        return $this->belongsTo(Dossier::class);
    }
}
