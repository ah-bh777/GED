<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'date_de_soumission',
        'note_d_observation',
        'date_d_expiration',
        'contenu_document',
        'dossier_id',
        'type_de_document_id'
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
