<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dossier extends Model
{
    use HasFactory;

    protected $fillable = ['dossier', 'matricule', 'couleur', 'tiroir','date_d_affectation','armoire', 'entite_id','affectation_id',
    'fonctionnaire_id','grade_id'];

    public function entite()
    {
        return $this->belongsTo(Entite::class);
    }

    public function fonctionnaire()
    {
        return $this->belongsTo(Fonctionnaire::class);
    }

    public function admins()
    {
        return $this->belongsToMany(Admin::class,'admin_dossier');
    }

    public function avertissements()
    {
        return $this->hasMany(Avertissement::class);
    }

    public function conseil_de_disciplines()
    {
        return $this->hasMany(ConseilDeDiscipline::class);
    }

    public function affectation(){
        return $this->belongsTo(Affectation::class);
    }

    public function archDossier()
    {
        return $this->hasOne(ArchDossier::class);
    }

    public function documents(){
        return $this->hasMany(Document::class);
    }

    public function grade(){    
        return $this->belongsTo(Grade::class);
    }

        public function corps()
    {
        return $this->grade->corps;
    }

}
