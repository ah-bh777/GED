<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory ;
    protected $fillable = ['nom_grade','corp_id'];

        public function corp()
    {
        return $this->belongsTo(Corps::class,'corp_id','id');
    }

        public function type_de_documents()
    {
        return $this->belongsToMany(TypeDeDocument::class, 'grade_type_de_document');
    }

        public function dossiers()
    {
        return $this->hasMany(Dossier::class);
    }

}
