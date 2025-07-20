<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubDoc extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom_document', 
        'chemin_contenu_sous_document', 
        'date_ajout', 
        'document_id',
        
    ];
    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function type_de_document(){
        return $this->belongsTo(TypeDeDocument::class);
    }

    


}
