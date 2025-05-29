<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArchDossier extends Model
{
    use HasFactory;

    protected $fillable = [
        'date_d_archivage',
        'archive_par',
        'motif_d_archivage',
        'dossier_id',  
    ];

    
    public function dossier()
    {
        return $this->belongsTo(Dossier::class);
    }
}
