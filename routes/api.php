<?php

use App\Models\Corps;
use App\Models\Dossier;
use App\Models\Document;
use App\Models\UniteOrgani;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Carbon\Carbon ;


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
        "affectation"
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
        'affectation')->where('id' , $id)->firstOrFail();

        $unit = UniteOrgani::all();

        $corps = Corps::all();
  

        return response()->json([
            "message" => "dossier " . $dossier->id,
            "dossier" => $dossier,
            "unit" => $unit,
            "corps" => $corps
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
            $target->fonctionnaire->statut = $request->fonctionnaire_statut ?? $target->fonctionnaire->statut;  
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

    $request->validate([
        'photo'=>'required|image|max:2048'
    ]); 

    // $path = $request->file('photo')->store('photos','public');
    
    $naming = 'profil_photo_'. 5 . '.' . $request->file(key: 'photo')->getClientOriginalExtension() ;

    $path = Storage::disk('public')->putFileAs('photos',$request->file('photo'),$naming);

    $document = Document::findOrFail(1);

    $document->chemin_contenu_document = $path ;

    $document->save();

    return response()->json(['message'=>'uploaded successfully','url'=> asset('storage/' . $path )]);
});


Route::get('/get-public-img',function(Request $request){
    
    $url = asset('storage/photos/profil_photo_5.png');

    return response()->json(['message'=>'get your photo' , 'url' =>$url]);


});