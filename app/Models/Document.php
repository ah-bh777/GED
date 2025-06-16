<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'chemin_contenu_document',
        'dossier_id',
        'type_de_document_id',
        'date_de_soumission',
        'date_d_expiration',
        'note_d_observation'
    ];

    public function dossier()
    {
        return $this->belongsTo(Dossier::class);    
    }

    public function type_de_document()
    {
        return $this->belongsTo(typeDeDocument::class);
    }

    public function sub_docs()
    {
        return $this->hasMany(SubDoc::class);
    }


}
