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

        $entite = Entite::all();

        $statut = statut::all();
  

        return response()->json([
            "message" => "dossier " . $dossier->id,
            "dossier" => $dossier,
            "unit" => $unit,
            "corps" => $corps , 
            "entite" => $entite ,
            "statut"=> $statut       ]);
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






Route::put("/update_details/{id}",function(Request $request ,  $id){

    $fieldName = array_key_first($request->all());

    $section = explode('_', $fieldName)[0];

    $target = Dossier::with('fonctionnaire.user' , 'grade.corp' , 'entite.unite_organi')->find($id);

    try{
 
    switch($section){
        case 'fonctionnaire':
            $target->fonctionnaire->user->nom_fr = $request->fonctionnaire_nom_fr ?? $target->fonctionnaire->user->nom_fr ;
            $target->fonctionnaire->user->nom_ar = $request->fonctionnaire_nom_ar ?? $target->fonctionnaire->user->nom_ar ;
            $target->fonctionnaire->user->prenom_ar = $request->fonctionnaire_prenom_ar ??  $target->fonctionnaire->user->prenom_ar;
            $target->fonctionnaire->user->prenom_fr = $request->fonctionnaire_prenom_fr ?? $target->fonctionnaire->user->prenom_fr ;
            $target->fonctionnaire->user->email = $request->fonctionnaire_email ?? $target->fonctionnaire->user->email ;
            $target->fonctionnaire->user->telephone = $request->fonctionnaire_telephone ?? $target->fonctionnaire->user->telephone ;    
            $target->fonctionnaire->user->adresse = $request->fonctionnaire_adresse ?? $target->fonctionnaire->user->adresse ;
            $target->fonctionnaire->user->date_de_naissance = $request->fonctionnaire_date_de_naissance ?? $target->fonctionnaire->user->date_de_naissance;  
            $target->fonctionnaire->user->adresse = $request->fonctionnaire_adresse ?? $target->fonctionnaire->user->adresse;  
            $target->fonctionnaire->statut_id = $request->fonctionnaire_statut_id ?? $target->fonctionnaire->fonctionnaire_statut_id;  
            $target->fonctionnaire->user->save();
            $target->fonctionnaire->save();
        break;
        case 'caracteristiques':
            $target->couleur = $request->caracteristiques_couleur ?? $target->couleur ;
            $target->tiroir = $request->caracteristiques_tiroir ?? $target->tiroir ;
            $target->armoire = $request->caracteristiques_armoire ?? $target->armoire ;
            $target->save();
        default :
        case 'gradeEntite':
            
           return ;
    }
           
    }catch(Exception $e){
        return response()->json(["error"=>$e->getMessage()]);
    }
  
        return response()->json(["section"=> $section , 'target'=> $id , 'userTarget'=>$target]);
});



Route::post('/post-public-img',function(Request $request){
  
    try {

        $documentType = TypeDeDocument::findOrFail($request->type_de_document_id);
        
        // Create naming convention: TYPE_{dossier_id}_{timestamp}.{extension}
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
    $dossier = Dossier::orderBy("id","desc")->first();
    $affectation = Affectation::all();
    return response()->json(["unite_organi" => $unite_organi ,
    "statut"=> $statut , 
    "grade" => $grade ,
    "corps"=> $corps ,
    "dossier"=> $dossier ,
    "affectation"=> $affectation
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


