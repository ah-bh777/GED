<?php

use App\Models\Affectation;
use App\Models\ArchDossier;
use App\Models\Corps;
use App\Models\Dossier;
use App\Models\Document;
use App\Models\Entite;
use App\Models\Fonctionnaire;
use App\Models\Grade;
use App\Models\statut;
use App\Models\UniteOrgani;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Carbon\Carbon ;
use App\Models\TypeDeDocument;
use Illuminate\Support\Facades\File;
use NunoMaduro\Collision\Adapters\Phpunit\State;
use App\Models\UniteOrgan;



Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
     $user = $request->user();

    if ($user->role === 'fonctionnaire') {
        $user->load('fonctionnaire');
    } elseif ($user->role === 'admin') {
        $user->load('admin');
    }

    return response()->json($user);
});

Route::get('/public-data', function () {
    $dossiers = Dossier::with([
        'documents.type_de_document',
        'grade.corp',
        'grade.type_de_documents',
        'fonctionnaire.user',
        'documents.sub_docs.type_de_document',
        'avertissements',
        'conseil_de_disciplines',
        'entite.unite_organi',
        "affectation",
        "archDossier",
        "fonctionnaire.statut"
    ])->get();

return response($dossiers);
    
});


Route::post("/details", function(Request $request) {

    $id = (int) $request->input('id');

    try {

        $dossier = Dossier::with('documents.type_de_document',
        'grade.corp',
        'grade.type_de_documents',
        'fonctionnaire.user',
        'documents.sub_docs.type_de_document',
        'avertissements',
        'conseil_de_disciplines',
        'entite.unite_organi',
        "fonctionnaire.statut",
        'affectation',"archDossier")->where('id' , $id)->firstOrFail();

        $unit = UniteOrgani::all();

        $corps = Corps::all();  

        $grade = Grade::all();

        $entite = Entite::all();

        $statut = statut::all();

        $affectation = Affectation::all();
  

        return response()->json([
            "message" => "dossier " . $dossier->id,
            "dossier" => $dossier,
            "unit" => $unit,
            "corps" => $corps , 
            "entite" => $entite ,
            "grade"=> $grade ,
            "statut"=> $statut  ,
        "affectation"=>$affectation    ]);
    } catch (Exception $e) {
        return response()->json([
            "message" => $e->getMessage(),
            "id" => $id 
        ]);
    }

});


Route::post("/details-arch", function(Request $request) {
    $id = (int) $request->input('id');

    try {
        $dossier = Dossier::with([
            'documents.type_de_document',
            'grade.corp',
            'grade.type_de_documents',
            'fonctionnaire.user','fonctionnaire.statut',
            'documents.sub_docs.type_de_document',
            'avertissements',
            'conseil_de_disciplines',
            'entite.unite_organi',
            'affectation',
            'archDossier'
        ])->where('id', $id)->firstOrFail();

        $unit = UniteOrgani::all();
        $corps = Corps::all();  
        $entite = Entite::all();

        // ⚠️ Vérifie d'abord que archDossier existe
        $admin = null;
        if ($dossier->archDossier && $dossier->archDossier->archive_par) {
            $admin = User::find($dossier->archDossier->archive_par);
        }

        return response()->json([
            "message" => "dossier " . $dossier->id,
            "dossier" => $dossier,
            "unit" => $unit,
            "corps" => $corps, 
            "entite" => $entite,
            "admin" => $admin
        ]);
    } catch (Exception $e) {
        return response()->json([
            "message" => $e->getMessage(),
            "id" => $id 
        ]);
    }
});


Route::post("/delete/{id}", function($id) {
    $dossier = Dossier::findOrFail($id);

    $dossier->delete();

    return response()->json(["message"=> $dossier]);
});



Route::put("/update_details/{id}", function(Request $request, $id) {
    $target = Dossier::with('fonctionnaire.user', 'grade.corp', 'entite.unite_organi', 'affectation')->find($id);

    try {
        // Handle different update cases based on the fields present
        if ($request->has('fonctionnaire_nom_fr')) {
            // Update fonctionnaire information
            $target->fonctionnaire->user->nom_fr = $request->fonctionnaire_nom_fr ?? $target->fonctionnaire->user->nom_fr;
            $target->fonctionnaire->user->nom_ar = $request->fonctionnaire_nom_ar ?? $target->fonctionnaire->user->nom_ar;
            $target->fonctionnaire->user->prenom_ar = $request->fonctionnaire_prenom_ar ?? $target->fonctionnaire->user->prenom_ar;
            $target->fonctionnaire->user->prenom_fr = $request->fonctionnaire_prenom_fr ?? $target->fonctionnaire->user->prenom_fr;
            $target->fonctionnaire->user->email = $request->fonctionnaire_email ?? $target->fonctionnaire->user->email;
            $target->fonctionnaire->user->telephone = $request->fonctionnaire_telephone ?? $target->fonctionnaire->user->telephone;
            $target->fonctionnaire->user->adresse = $request->fonctionnaire_adresse ?? $target->fonctionnaire->user->adresse;
            $target->fonctionnaire->user->date_de_naissance = $request->fonctionnaire_date_de_naissance ?? $target->fonctionnaire->user->date_de_naissance;
            $target->fonctionnaire->statut_id = $request->fonctionnaire_statut_id ?? $target->fonctionnaire->statut_id;
            $target->fonctionnaire->user->save();
            $target->fonctionnaire->save();
            
            return response()->json([
                "section" => "fonctionnaire",
                "target" => $id,
                "userTarget" => $target
            ]);
        }
        elseif ($request->has('caracteristiques_couleur') || 
                $request->has('caracteristiques_matricule') || 
                $request->has('caracteristiques_tiroir') || 
                $request->has('caracteristiques_armoire')) {
       
            if ($request->has('caracteristiques_couleur')) {
                $target->couleur = ucfirst(strtolower($request->caracteristiques_couleur));
            }
            if ($request->has('caracteristiques_matricule')) { 
                $target->matricule = $request->caracteristiques_matricule; 
            }
            if ($request->has('caracteristiques_tiroir')) {
                $target->tiroir = $request->caracteristiques_tiroir;
            }
            if ($request->has('caracteristiques_armoire')) {
                $target->armoire = strtoupper($request->caracteristiques_armoire);
            }
            $target->save();
            
            return response()->json([
                "section" => "caracteristiques",
                "target" => $id,
                "dossier" => $target
            ]);
        }
        elseif ($request->has('affectation_id')) {
           
            $target->affectation_id = $request->affectation_id;
            $target->save();
            
            return response()->json([
                "section" => "affectation",
                "target" => $id,
                "dossier" => $target
            ]);
        }
        elseif ($request->has('grade_id') || $request->has('entite_id')) {
          
            if ($request->has('grade_id')) {
                $target->grade_id = $request->grade_id;
            }
            if ($request->has('entite_id')) {
                $target->entite_id = $request->entite_id;
            }
            $target->save();
            
            return response()->json([
                "section" => "gradeEntite",
                "target" => $id,
                "dossier" => $target
            ]);
        }
        else {
            return response()->json(["error" => "Aucun champ valide fourni pour la mise à jour"]);
        }
    } catch(Exception $e) {
        return response()->json(["error" => $e->getMessage()]);
    }
});


Route::post('/post-public-img',function(Request $request){
  
    try {

        $documentType = TypeDeDocument::findOrFail($request->type_de_document_id);
        
        $timestamp = now()->format('Ymd_His');
        $naming = $documentType->nom_de_type . '_' . $request->dossier_id . '_' . $timestamp . '.' . $request->file('file_uploaded')->getClientOriginalExtension();

        $path = Storage::disk('public')->putFileAs($documentType->nom_de_type, $request->file("file_uploaded"), $naming);

        $document = new Document([
            'chemin_contenu_document' => $path,
            'dossier_id' => $request->dossier_id,
            'type_de_document_id' => $request->type_de_document_id,
            'date_de_soumission' => now()->toDateString(),
            'date_d_expiration' => $request->date_d_expiration ?? now()->addMonths(3)->toDateString(),
            'note_d_observation' => $request->note_d_observation ?? '',
        ]);

        $document->save();

        return response()->json([
            'message' => 'uploaded successfully',
            'url' => asset('storage/' . $path),
            'document_id' => $document->id
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Upload failed',
            'error' => $e->getMessage()
        ], 500);
    }     
});


Route::post('/get-public-img',function(Request $request){

    $dossier = Document::findOrFail($request->id);
    
    $url = asset('storage/'. $dossier->chemin_contenu_document);

    return response()->json(['message'=>'get your photo' , 'url' =>$url]);


});


Route::post('/delete-public-img', function(Request $request) {


    $document = Document::findOrFail($request->id);

    $relativePath = $document->chemin_contenu_document ;

    Storage::disk('public')->delete($relativePath);

    $document->delete();
    
    return response()->json(['url' => $relativePath]);

});


Route::post('/download-public-img',function(Request $request){

    $document = Document::findOrFail($request->id);

    $prefix = "storage/".$document->chemin_contenu_document ;
    
    return response()->download(public_path($prefix));  

});


Route::post("/archive-me",function(Request $request){

    $archivedDossier = new ArchDossier([
        "dossier_id"=> $request->id , 
        "date_d_archivage"=> now()->toDateString(),
        "archive_par"=>1,
        "created_at"=> now()->toDateString()
    ]);    

   if( $archivedDossier->save()){
    return response()->json(["message"=>"bien archivé"],201);
   }

   return response()->json(["message"=>"impossible de valider"],500);
});



Route::get("/archived-list", function () {
    $archDossier = DB::table("arch_dossiers")
        ->join("dossiers", "dossiers.id", "=", "arch_dossiers.dossier_id")
        ->join("users as archivist", "archivist.id", "=", "arch_dossiers.archive_par")
        ->join("fonctionnaires", "fonctionnaires.id", "=", "dossiers.fonctionnaire_id")
        ->join("users as owner", "owner.id", "=", "fonctionnaires.user_id")

        ->select(
            "arch_dossiers.id",
            "arch_dossiers.dossier_id",
            "arch_dossiers.date_d_archivage",

            "dossiers.dossier as nom_dossier",
            "dossiers.matricule",
            "dossiers.couleur",
            "dossiers.tiroir",
            "dossiers.armoire",

            DB::raw("CONCAT(archivist.nom_fr, ' ', archivist.prenom_fr) as archive_par_nom_complet"),

            "owner.nom_fr as fonctionnaire_nom_fr",
            "owner.prenom_fr as fonctionnaire_prenom_fr",
            "owner.nom_ar as fonctionnaire_nom_ar",
            "owner.prenom_ar as fonctionnaire_prenom_ar"
        )
        ->get();

    return response()->json(["data" => $archDossier], 200);
});

    
Route::post("/unarchive-me",function(Request $request){

    $archDossier = ArchDossier::where("id" ,$request->id)->firstOrFail();

    $archDossier->delete();

    return response()->json(["message"=> "Désarchivé"],200);
    
});


Route::get("/data-for-new-fonctionnaire",function(){
    $unite_organi = UniteOrgani::all();
    $statut = Statut::all();
    $grade = Grade::all();
    $corps = Corps::all();
    $entite = Entite::all();
    $dossier = Dossier::orderBy("id","desc")->first();
    $affectation = Affectation::all();
    return response()->json(["unite_organi" => $unite_organi ,
    "statut"=> $statut , 
    "grade" => $grade ,
    "corps"=> $corps ,
    "dossier"=> $dossier ,
    "affectation"=> $affectation ,
    "entite" => $entite
    ],200);
});


Route::post("/create-fonctionnaire",function(Request $request){

    $user = new User([
        "nom_fr"=>  $request->nom_fr,
        "prenom_fr"=>  $request->prenom_fr,
        "nom_ar"=>  $request->nom_ar,
        "prenom_ar"=>  $request->prenom_ar,
        "email"=>  $request->email,
        "telephone" => $request->telephone,
        "date_de_naissance" => $request->date_de_naissance,
        "adresse" => $request->adresse,
        "role"=>"fonctionnaire",
        "password"=> Hash::make("123")
    ]);
    
    $user->save();

    $fonctionnaire = new Fonctionnaire([
        "user_id"=> $user->id ,
        "statut_id"=> $request->statut_id
    ]);
    
    $fonctionnaire->save();

    $dossier = new Dossier([
        "dossier" => $request->dossier,
        "matricule" => $request->matricule,
        "couleur" => $request->couleur,
        "tiroir" => 'Tiroir-'.$request->tiroir,
        "armoire" => 'Armoire-' . strtoupper($request->armoire),
        "date_d_affectation"=> $request->date_affectation,
        "entite_id"=>$request->entite_id,
        "fonctionnaire_id"=>$fonctionnaire->id,
        "grade_id"=>$request->grade_id,
        "affectation_id"=> $request->affectation_id,
    ]);

    $dossier->save();

    return response()->json(["data"=>$request->statut_id],200);
});


Route::get("/latest-fonctionnaire",function(){

    $dossier = Dossier::with("grade.type_de_documents","fonctionnaire.user",
    "grade.corp","documents.type_de_document")->orderBy("id","desc")->first();

    return response()->json(["data"=>$dossier],200);

});

Route::get("/get-affectation",function(){
  $affectation = Affectation::all();
  return response()->json(["data"=>$affectation],200);
});


Route::post("/handle-affectation",function(Request $request){
    
  if($request->operation == "suppression"){

    $affectation = Affectation::findOrFail($request->id);

    $affectation->delete();
    
    return response()->json(["message"=>"suppression est bien affectué" ]);        

  }else if($request->operation == "modification"){

      $targetAffecation =  Affectation::findOrFail($request->id);
      
      $targetAffecation->nom_d_affectation = $request->valuer;
      $targetAffecation->save();

      return response()->json(["message"=>"La modification été bien affectée"],200);
      
  }else{

      $targetAffecation = new Affectation([
        "nom_d_affectation" => ucfirst($request->valuer),
      ]);

      $targetAffecation->save();

      return response()->json(["message"=>"L'ajout été bien affecté"]);
  }
});


Route::get("/get-entite",function(){
    $entite = Entite::all();
    $unite = UniteOrgani::all();
    return response()->json(["entite"=>$entite , "units"=>$unite],200);
  });


Route::post("/handle-entite-unite",function(Request $request){
    if($request->operation == "ajout"){

    $newEntite = new Entite(["nom_entite" => $request->entite , "unite_organi_id"=> $request->unit ]);

    $newEntite->save();

    return response()->json(["message"=> $newEntite],200);

    }else if($request->operation == "supression"){

        $targetEntite = Entite::findOrFail($request->entite_id);
        
        $targetEntite->delete();

        return response()->json(["message"=> "supression est bien affectueé"],200);

    }else{

        $targetEntite = Entite::findOrFail($request->entite_id);

        $targetEntite->unite_organi_id = $request->unit ?? $targetEntite->unite_organi_id ;

        $targetEntite->nom_entite = $request->entite ?? $targetEntite->nom_entite ;

        $targetEntite->save();

        return response()->json(["message"=> $targetEntite ],200);
    }
});


Route::post("/check-assocaition-affectation",function(Request $request){

    $dossierAssociéCount = Dossier::where("affectation_id",$request->id)->get()->count();

    $theDossiers = Dossier::with("fonctionnaire.user" , "archDossier")
    ->where("affectation_id",$request->id)->get();

    return response()->json(["count"=>$dossierAssociéCount , "theDossiers"=>$theDossiers ],200);

});


Route::post("/check-assocaition-entite",function(Request $request){

    $dossierAssociéCount = Dossier::where("entite_id",$request->id)->get()->count();

    $theDossiers = Dossier::with("fonctionnaire.user" , "archDossier")
    ->where("entite_id",$request->id)->get();

    return response()->json(["count"=>$dossierAssociéCount , "theDossiers"=>$theDossiers ],200);

});


Route::get("/get-corps-grade",function(){

    $corps = Corps::all();

    $grade = grade::all();

    return response()->json(["grade"=> $grade , "corps" => $corps ],200);
});




Route::post("/check-association-grade",function(Request $request){

    $dossierAssociéCount = Dossier::where("grade_id",$request->id)->get()->count();

    $theDossiers = Dossier::with("fonctionnaire.user" , "archDossier")
    ->where("grade_id",$request->id)->get();

    return response()->json(["count"=>$dossierAssociéCount , "theDossiers"=>$theDossiers ],200);
});



Route::post("/handle-grade",function(Request $request){
    
    if($request->operation == "suppression"){
  
        $affectation = Grade::findOrFail($request->id);
    
        $affectation->delete();
        
        return response()->json(["message"=>"suppression est bien affectué" ]);        
  
    }else if($request->operation == "modification"){
  
        $targetAffecation =  Affectation::findOrFail($request->id);
        
        $targetAffecation->nom_d_affectation = $request->valuer;
        
        $targetAffecation->save();

        return response()->json(["message"=>"La modification été bien affectée"],200);
        
    }else{
  
        $targetAffecation = new Affectation([
        "nom_d_affectation" => ucfirst($request->valuer),
        ]);

        $targetAffecation->save();

        return response()->json(["message"=>"L'ajout été bien affecté"]);
    }
  });


