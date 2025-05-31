<?php

use App\Models\Dossier;
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
        'entite.unite_organi'
    ])->get();
    // return response()->json($dossiers);
   $json = json_encode($dossiers, JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_UNICODE);
if ($json === false) {
    dd(json_last_error_msg());
}
return response($json)->header('Content-Type', 'application/json');
    
});