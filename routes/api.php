<?php

use App\Models\Admin;
use App\Models\Affectation;
use App\Models\ArchDossier;
use App\Models\Avertissement;
use App\Models\ConseilDeDiscipline;
use App\Models\Corps;
use App\Models\Dossier;
use App\Models\Document;
use App\Models\Entite;
use App\Models\Fonctionnaire;
use App\Models\Grade;
use App\Models\statut;
use App\Models\SubDoc;
use App\Models\UniteOrgani;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\TypeDeDocument;
use function PHPUnit\Framework\returnArgument;


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
        'documents.sub_docs.type_de_document',
        'grade' => function ($query) {
            $query->withTrashed()->with([
                'corp' => function ($q){
                    $q->withTrashed();
                },
                'type_de_documents'
            ]);
        },
        'fonctionnaire.user',
        'fonctionnaire.statut',
        'avertissements',
        'conseil_de_disciplines',
        'entite' => function ($query) {
            $query->withTrashed()->with('unite_organi');
        },
        'affectation',
        'archDossier'
    ])->get();
    
return response($dossiers);
    
});


Route::post("test-details", function (Request $request) {
    $id = (int) $request->input('id');

    $dossier = Dossier::with([
        'documents.type_de_document',
        'grade' => function ($query) {
            $query->withTrashed()->with('corp'); // include trashed grade + nested corp
        }
    ])->where('id', $id)->firstOrFail();

    return response()->json(["data" => $dossier]);
});

Route::post("/details", function(Request $request) {

    $id = (int) $request->input('id');
    

    try {

        $dossier = Dossier::with([
            'documents.type_de_document',
            'documents.sub_docs.type_de_document',
            'grade' => function ($query) {
                $query->withTrashed()->with([
                    'corp' => function ($q) {
                        $q->withTrashed();
                    },
                    'type_de_documents'
                ]);
            },
            'fonctionnaire.user',
            'fonctionnaire.statut',
            'avertissements',
            'conseil_de_disciplines',
            'entite' => function ($query) {
                $query->withTrashed()->with('unite_organi');
            },
            'affectation',
            'archDossier'
        ])->where('id', $id)->firstOrFail();

        $unit = UniteOrgani::all();

        $corps = Corps::all();  

        $grade = Grade::withTrashed()->get();

        $entite = Entite::withTrashed()->get();

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
            'documents.sub_docs.type_de_document',
            'fonctionnaire.user',
            'fonctionnaire.statut',
            'avertissements',
            'conseil_de_disciplines',
            'entite' => function($query) {
                $query->withTrashed()->with([
                    'unite_organi'
                ]);
            },
            'affectation' => function($query) {
                $query->withTrashed();
            },
            'archDossier',
            'grade' => function ($query) {
                $query->withTrashed()->with([
                    'corp' => function ($q) {
                        $q->withTrashed();
                    },
                    'type_de_documents'
                ]);
            },
        ])->where('id', $id)->firstOrFail();
        

        $unit = UniteOrgani::all();
        $corps = Corps::withTrashed()->get();  
        $entite = Entite::withTrashed()->get();

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

    if (!$target) {
        return response()->json(["error" => "Dossier not found"], 404);
    }

    try {
        $section = $request->input('section');
        
        if (!$section) {
            return response()->json(["error" => "Section not specified"], 400);
        }

        DB::beginTransaction();

        switch ($section) {
            case 'fonctionnaire':
                $userFields = [
                    'nom_fr', 'nom_ar', 'prenom_fr', 'prenom_ar', 
                    'email', 'telephone', 'adresse', 'date_de_naissance'
                ];
                
                foreach ($userFields as $field) {
                    if ($request->has($field)) {
                        $target->fonctionnaire->user->$field = $request->$field;
                    }
                }
                
                if ($request->has('statut_id')) {
                    $target->fonctionnaire->statut_id = $request->statut_id;
                }
                
                $target->fonctionnaire->user->save();
                $target->fonctionnaire->save();
                break;

            case 'caracteristiques':
                if ($request->has('couleur')) {
                    $target->couleur = ucfirst(strtolower($request->couleur));
                }
                if ($request->has('matricule')) {
                    $target->matricule = $request->matricule;
                }
                if ($request->has('tiroir')) {
                    $target->tiroir = $request->tiroir;
                }
                if ($request->has('armoire')) {
                    $target->armoire = strtoupper($request->armoire);
                }
                break;

            case 'affectation':
                if ($request->has('affectation_id')) {
                    $target->affectation()->associate($request->affectation_id);
                }
                break;

            case 'gradeEntite':
                if ($request->has('corps_id')) {
                    // Find first grade with this corps or create new one
                    $grade = Grade::where('corp_id', $request->corps_id)
                                ->firstOrFail();
                    $target->grade()->associate($grade);
                }
                
                if ($request->has('grade_id')) {
                    $target->grade_id = $request->grade_id;
                }
                
                if ($request->has('entite_id')) {
                    $target->entite_id = $request->entite_id;
                }
                break;

            default:
                DB::rollBack();
                return response()->json(["error" => "Invalid section: $section"], 400);
        }

        $target->save();
        DB::commit();

        return response()->json([
            "success" => true,
            "section" => $section,
            "message" => "$section updated successfully",
            "dossier" => $target->fresh()->load('fonctionnaire.user', 'grade.corp', 'entite.unite_organi', 'affectation')
        ]);

    } catch(Exception $e) {
        DB::rollBack();
        return response()->json([
            "error" => "Update failed",
            "message" => $e->getMessage(),
            "trace" => $e->getTraceAsString()
        ], 500);
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
            'date_d_expiration' => $request->date_d_expiration ?? now()->addYears(10)->toDateString(),
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


Route::post("/post-sous-doc-public-img", function(Request $request) {
    try {
        // Validate required fields
        $request->validate([
            'document_id' => 'required|exists:documents,id',
            'selectedFile' => 'required|file|max:10240', // 10MB max
        ]);

        $targetDoc = Document::with('type_de_document')->findOrFail($request->document_id);
        
        if (!$targetDoc->type_de_document) {
            throw new \Exception('Type de document non trouvé pour ce document');
        }

        $directory = $targetDoc->type_de_document->nom_de_type . '/sous_docs';
        

        if (!Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->makeDirectory($directory, 0755, true);
        }

        $file = $request->file('selectedFile');
        $timestamp = now()->format('Ymd_His');
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();
        
        $naming = $originalName . '_sous-document_de_' . 
                 $targetDoc->type_de_document->nom_de_type . '_' . $timestamp . '.' . $extension;

      
        $path = $file->storeAs(
            $directory,
            $naming,
            'public'
        );

        $sous_doc = SubDoc::create([
            'nom_document' => $originalName,
            'chemin_contenu_sous_document' => $path,
            'date_ajout' => now(),
            'document_id' => $targetDoc->id 
        ]);

        return response()->json([
            'success' => true,
            'data' => $sous_doc,
            'message' => 'Sous-document ajouté avec succès'
        ]);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'errors' => $e->errors(),
            'message' => 'Validation error'
        ], 422);
    } catch (\Exception $e) {
        \Log::error('Error in post-sous-doc-public-img: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Une erreur est survenue lors de l\'ajout du sous-document',
            'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
        ], 500);
    }
});



Route::post('/get-public-img',function(Request $request){

    $dossier = Document::findOrFail($request->id);
    
    $url = asset('storage/'. $dossier->chemin_contenu_document);

    return response()->json(['message'=>'get your photo' , 'url' =>$url]);


});


Route::post('/download-sous-doc-public-img', function(Request $request) {
    $subDoc = SubDoc::findOrFail($request->id);
    
    $filePath = storage_path('app/public/' . $subDoc->chemin_contenu_sous_document);
    
    if (!file_exists($filePath)) {
        return response()->json(['message' => 'File not found'], 404);
    }

    $mimeType = mime_content_type($filePath);
    
    $headers = [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'attachment; filename="' . basename($filePath) . '"'
    ];

    return response()->file($filePath, $headers);
});

    Route::post('/delete-public-img', function(Request $request) {

          $document = Document::with('sub_docs')->findOrFail($request->id);

        try {
            $document = Document::with('sub_docs')->findOrFail($request->id);

        
            foreach ($document->sub_docs as $subDoc) {
                if (Storage::disk('public')->exists($subDoc->chemin_contenu_sous_document)) {
                    Storage::disk('public')->delete($subDoc->chemin_contenu_sous_document);
                }
            }

            if (Storage::disk('public')->exists($document->chemin_contenu_document)) {
                Storage::disk('public')->delete($document->chemin_contenu_document);
            }

            SubDoc::where('document_id', $document->id)->delete();

            $document->delete();
           

            return response()->json([
                'message' => 'Main document and sub-documents deleted successfully',
                'deleted_main_file' => $document->chemin_contenu_document,
                'deleted_sub_docs_count' => $document->sub_docs->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Deletion failed',
                'error' => $e->getMessage()
            ], 500);
        }
             
           // response()->json(["document" => $document , "id" => $request->all()]);
    });


    Route::post('/delete-sous-doc', function(Request $request) {
        try {
         
            $subDoc = SubDoc::findOrFail($request->id);
    
            if (Storage::disk('public')->exists($subDoc->chemin_contenu_sous_document)) {
                Storage::disk('public')->delete($subDoc->chemin_contenu_sous_document);
            }
    
            $subDoc->delete();
    
            return response()->json([
                'message' => 'Sous-document deleted successfully',
                'deleted_file' => $subDoc->chemin_contenu_sous_document
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Deletion failed',
                'error' => $e->getMessage()
            ], 500);
        }
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
    try {
        $archDossier = DB::table("arch_dossiers")
            ->join("dossiers", "dossiers.id", "=", "arch_dossiers.dossier_id")
            ->join("users as archivist", "archivist.id", "=", "arch_dossiers.archive_par")
            ->join("fonctionnaires", "fonctionnaires.id", "=", "dossiers.fonctionnaire_id")
            ->join("users as owner", "owner.id", "=", "fonctionnaires.user_id")
            ->join("affectations", "affectations.id", "=", "dossiers.affectation_id") 

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
                "owner.prenom_ar as fonctionnaire_prenom_ar",

                "affectations.nom_d_affectation" 
            )
            ->get();

        return response()->json(["data" => $archDossier], 200);
    } catch (\Exception $e) {
        return response()->json([
            "error" => $e->getMessage()
        ], 500);
    }
});


Route::post("/unarchive-me",function(Request $request){

    $archDossier = ArchDossier::where("dossier_id" ,$request->id)->firstOrFail();

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


Route::post("/create-fonctionnaire", function(Request $request) {
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
        "user_id"=> $user->id,
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

    return response()->json([
        "success" => true,
        "dossier_id" => $dossier->id,  // Return the created dossier ID
        "fonctionnaire_id" => $fonctionnaire->id,
        "user_id" => $user->id,
        "message" => "Fonctionnaire créé avec succès"
    ], 200);
});

Route::get("/latest-fonctionnaire",function(){

    $dossier = Dossier::with("grade.type_de_documents","fonctionnaire.user",
    "grade.corp","documents.type_de_document" , "documents.sub_docs")->orderBy("id","desc")->first();

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

    }else if($request->operation == "suppression"){

        $targetEntite = Entite::findOrFail($request->entite_id);
        
        $targetEntite->delete();

        return response()->json(["message"=> $targetEntite],200);

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
  
        $grade = Grade::findOrFail($request->id);
    
        $grade->delete();
        
        return response()->json(["message"=>"La suppression été bien affectée"   ]);        
  
    }else if($request->operation == "modification"){
  
        $grade =  Grade::findOrFail($request->id);
        
        $grade->nom_grade = $request->nom_grade;
        
        $grade->save();

        return response()->json(["message"=>"La modification été bien affectée"],200);
        
    }else{
  
        $grade = new Grade([
        "corp_id"=> $request->corp_id , 
        "nom_grade" => ucfirst($request->nom_grade),
        ]);

        $grade->save();

        return response()->json(["message"=>"L'ajout été bien affecté"]);
    }
  });

  
  Route::get("/get-doc-corp",function(Request $request){

    $corps = Corps::all();

    return response()->json(["corp"=>$corps],200);
    
  });

  Route::post("/get-doc-grade",function(Request $request){

    $id = $request->id;

    $grades = Grade::with(["type_de_documents","corp"])->where("corp_id",$id)->get();

    $docs_types = TypeDeDocument::all();

    return response()->json(["type_docs"=>$docs_types ,"grades"=>$grades],200);
    
  });


  Route::post("/handle-doc-type", function(Request $request) {
    // Validate the operation type
    $validOperations = ['ajout', 'modification', 'suppression'];
    if (!in_array($request->operation, $validOperations)) {
        return response()->json([
            'message' => 'Opération invalide',
            'errors' => ['operation' => 'L\'opération doit être ajout, modification ou suppression']
        ], 400);
    }

    DB::beginTransaction();
    try {
        if ($request->operation == "suppression") {

            $validator = Validator::make($request->all(), [
                'id' => 'required|exists:type_de_documents,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 400);
            }

            $docType = TypeDeDocument::findOrFail($request->id);
            
            if ($docType->parent_general_id === null) {
                $childCount = TypeDeDocument::where('parent_general_id', $docType->id)->count();
                if ($childCount > 0) {
                    return response()->json([
                        "message" => "Impossible de supprimer un type général qui a des types de documents enfants"
                    ], 400);
                }
            }

            $docType->delete();
            
            DB::commit();
            return response()->json([
                "message" => "La suppression a été bien effectuée"
            ], 200);

        } else if ($request->operation == "modification") {
            // Validate update request
            $validator = Validator::make($request->all(), [
                'id' => 'required|exists:type_de_documents,id',
                'doc.nom_de_type' => 'required|string|max:255',
                'doc.type_general' => 'required|string|max:255',
                'doc.categorie' => 'required|in:primaire,sous-document',
                'doc.parent_general_id' => 'nullable|exists:type_de_documents,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 400);
            }

            $docType = TypeDeDocument::findOrFail($request->id);
            $docType->nom_de_type = $request->input('doc.nom_de_type');
            $docType->type_general = $request->input('doc.type_general');
            $docType->categorie = $request->input('doc.categorie');
            $docType->parent_general_id = $request->input('doc.parent_general_id');
            $docType->save();

            DB::commit();
            return response()->json([
                "message" => "La modification a été bien effectuée"
            ], 200);

        } else { 
            $validator = Validator::make($request->all(), [
                'doc.nom_de_type' => 'required|string|max:255',
                'doc.type_general' => 'required|string|max:255',
                'doc.categorie' => 'required|in:primaire,sous-document',
                'doc.parent_general_id' => 'nullable|exists:type_de_documents,id',
                'doc.obligatoire' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 400);
            }

            $docType = new TypeDeDocument([
                'nom_de_type' => $request->input('doc.nom_de_type'),
                'type_general' => $request->input('doc.type_general'),
                'categorie' => $request->input('doc.categorie'),
                'parent_general_id' => $request->input('doc.parent_general_id'),
                'obligatoire' => $request->input("doc.obligatoire")
            ]);
            $docType->save();

            DB::commit();
            return response()->json([
                "message" => "L'ajout a été bien effectué",
                "data" => $docType
            ], 201);
        }
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            "message" => "Une erreur est survenue",
            "error" => $e->getMessage()
        ], 500);
    }
});

Route::post("/handle-attachement", function (Request $request) {
    $gradeId = $request->id;
    $docIds = $request->type_docs;
    
    
    $grade = Grade::find($gradeId);
    $grade->type_de_documents()->sync($docIds);
    
    return response()->json([
        "status" => "success",
        "message" => "Documents updated successfully",
        "grade_id" => $gradeId,
        "attached_documents" => $docIds
    ], 200);
});

Route::get("/get-corps", function () {
    $corps = Corps::with(["grades.dossiers.fonctionnaire.user" , "grades.dossiers.archDossier"])->get();

    $corps->each(function ($corp) {
        $total = 0;
        foreach ($corp->grades as $grade) {
            $total += count($grade->dossiers);
        }
        $corp->total_dossiers = $total;
    });

    return response()->json(["corp_grades" => $corps]);
});


Route::post("/handle-corps", function(Request $request) {
   
    $validator = Validator::make($request->all(), [
        'operation' => 'required|in:ajout,modification,suppression',
        'valuer' => 'required_if:operation,ajout,modification',
        'id' => 'required_if:operation,modification,suppression'
    ]);

    if ($validator->fails()) {
        return response()->json(["error" => $validator->errors()], 400);
    }

    try {
        if ($request->operation == "suppression") {

            $corps = Corps::findOrFail($request->id);

            Grade::where('corp_id', $request->id)->delete();

            $corps->delete();

            return response()->json(["message" => "La suppression a été bien effectuée"]);

        } else if ($request->operation == "modification") {
            $corps = Corps::findOrFail($request->id);
            
            $existingCorps = Corps::where('nom_de_corps', $request->valuer)
                                ->where('id', '!=', $request->id)
                                ->first();
            
            if ($existingCorps) {
                return response()->json([
                    "error" => "Un corps avec ce nom existe déjà."
                ], 400);
            }
            
            $corps->nom_de_corps = ucfirst(trim($request->valuer));
            $corps->save();

            return response()->json(["message" => "La modification a été bien effectuée"]);

        } else { 

            $corps = Corps::create([
                "nom_de_corps" => ucfirst(trim($request->valuer)),
            ]);

            return response()->json(["message" => "L'ajout a été bien effectué"]);
        }
    } catch (\Exception $e) {
        \Log::error('Corps operation error: '.$e->getMessage());
        return response()->json([
            "error" => "Une erreur est survenue lors de l'opération."
        ], 500);
    }
});


Route::post("/tracer-action-table", function(Request $request) {
    try {
        $validated = $request->validate([
            'admin_id' => 'required|exists:admins,id',
            'dossier_id' => 'required|exists:dossiers,id',
            'type_de_transaction' => "required|integer",
            'details_de_transaction' => 'required|string'
        ]);

        $admin = Admin::findOrFail($validated['admin_id']);

        $dossierTarget = Dossier::findOrFail($validated["dossier_id"]);

    
        $admin->dossiers()->attach($validated['dossier_id'], [
            'details_de_transaction' => $validated['details_de_transaction'] ,
            'type_de_transaction' => $validated['type_de_transaction'], 
            'date_de_transaction' => now()->toDateTimeString()
        ]);

        Log::info('Action enregistrée', $validated);

        return response()->json(['message' => 'Action enregistrée']);
    } catch (\Throwable $e) {
        Log::error('Erreur lors de l’attachement:', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Échec de l’enregistrement'], 500);
    }
});

Route::post("/histoire", function(Request $request) {
    $request->validate(['admin_id' => 'required|integer']);
    
    $admin = Admin::with(['dossiers.fonctionnaire.user'])->findOrFail($request->admin_id);

    $uniqueDossiers = $admin->dossiers
        ->unique('id') 
        ->map(function ($dossier) {
            return [
                "dossier" => $dossier->dossier,
                "dossier_id" => $dossier->id,
                "nom_complet" => optional($dossier->fonctionnaire->user)->nom_fr . ' ' . 
                               optional($dossier->fonctionnaire->user)->prenom_fr
            ];
        })
        ->values(); 

    return response()->json(["data" => $uniqueDossiers]);
});


Route::post("/chercher-histoire", function(Request $request) {
    $request->validate([
        'admin_id' => 'required|integer',
        'dossier_id' => 'required|integer',
        'type_de_transaction' => 'sometimes|integer',
        'page' => 'sometimes|integer'
    ]);

    $query = DB::table('admin_dossier')
        ->where('admin_id', $request->admin_id)
        ->where('dossier_id', $request->dossier_id);

    if ($request->has('type_de_transaction')) {
        $query->where('type_de_transaction', $request->type_de_transaction);
    }

    $perPage = 15; 
    $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

    return response()->json([
        'data' => $transactions->items(),
        'current_page' => $transactions->currentPage(),
        'last_page' => $transactions->lastPage(),
        'total' => $transactions->total(),
        'per_page' => $transactions->perPage(),
    ]);
});


Route::get("/list-averts-consiels", function(){
    $dossiers = Dossier::all();

    $dossierInfos = $dossiers->map(function($dI) {
        return [
            "id" => $dI->id,
            "dossier" => $dI->dossier, 
            "date_d_affectation" => $dI->date_d_affectation,
            "nom_de_fonctionnaire" => $dI->fonctionnaire->user->nom_fr . " " . $dI->fonctionnaire->user->prenom_fr,
            "corps" => $dI->grade->corp->nom_de_corps,
            "grade" => $dI->grade->nom_grade,
            "count_avert" => $dI->avertissements->count(),
            "count_disipline" => $dI->conseil_de_disciplines->count()
        ];
    });

    return response()->json($dossierInfos);
});


Route::post("/avertissements", function(Request $request) {
    

    try {
        $avert = new Avertissement([
            "dossier_id" => $request->dossier_id, 
            "titre_d_avertissement" => $request->titre_d_avertissement, 
            "note_d_avertissement" => $request->note_d_avertissement,
        ]);

        $avert->save();

        return response()->json([
            'success' => true,
            'message' => 'L\'avertissement a été enregistré avec succès',
            'data' => $avert
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Une erreur est survenue lors de l\'enregistrement',
            'error' => $e->getMessage()
        ], 500);
    }
});

Route::post("/conseil-de-disciplines", function(Request $request) {
    // Validate the request
    $validator = Validator::make($request->all(), [
        'id_dossier' => 'required|integer|exists:dossiers,id',
        'date_conseil' => [
            'required',
            'date',
            'after:today',
            'date_format:Y-m-d'
        ],
        'motif' => 'required|string|max:500',
        'decision' => 'required|string|max:500'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation error',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        $conseil = new ConseilDeDiscipline([
            "dossier_id" => $request->id_dossier,
            "date_conseil" => $request->date_conseil,
            "motif" => $request->motif,
            "decision" => $request->decision
        ]);

        $conseil->save();

        return response()->json([
            'success' => true,
            'message' => 'Le conseil de discipline a été enregistré avec succès',
            'data' => $conseil
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Une erreur est survenue lors de l\'enregistrement',
            'error' => $e->getMessage()
        ], 500);
    }
});


Route::post("/delete-avert", function(Request $request){
    $request->validate(['id' => 'required|integer|exists:avertissements,id']);
    try {
        $avert = Avertissement::findOrFail($request->id);
        $avert->delete();
        return response()->json(['success' => true, 'message' => 'Avertissement supprimé avec succès.']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Erreur lors de la suppression.', 'error' => $e->getMessage()], 500);
    }
});

Route::post("/delete-conseil", function(Request $request){
    $request->validate(['id' => 'required|integer|exists:conseil_de_disciplines,id']);
    try {
        $con = ConseilDeDiscipline::findOrFail($request->id);
        $con->delete();
        return response()->json(['success' => true, 'message' => 'Conseil de discipline supprimé avec succès.']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Erreur lors de la suppression.', 'error' => $e->getMessage()], 500);
    }
});