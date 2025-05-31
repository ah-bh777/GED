<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubDoc extends Model
{
    use HasFactory;

    protected $fillable = ['nom_sub_document', 'note_d_observation', 'contenu_document', 'date_ajout', 'document_id','type_de_document_id'];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function type_de_document(){
        return $this->belongsTo(TypeDeDocument::class);
    }

    


}
