<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeDeDocument extends Model
{
    use HasFactory;

    protected $fillable = ['nom_de_type','type_general','parent_general_id'];

    public function documents(){
        return $this->hasMany(Document::class);
    }

        public function grades()
    {
        return $this->belongsToMany(Grade::class, 'grade_type_de_document');
    }

    public function sub_docs(){
        return $this->hasMany(SubDoc::class);
    }   

    public function type_specifique(){
         return $this->hasMany(TypeDeDocument::class, 'parent_general_id');
    }

    // Self-reference: a specific document type belongs to one general document type
    public function type_parent()
    {
        return $this->belongsTo(TypeDeDocument::class, 'parent_general_id');
    }

}
