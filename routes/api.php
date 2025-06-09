<?php

use App\Models\Corps;
use App\Models\Dossier;
use App\Models\Document;
use App\Models\UniteOrgani;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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