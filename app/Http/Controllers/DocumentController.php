<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\TypeDeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function store(Request $request)
    {
        try {
            $request->validate([
                'file_uploaded' => 'required|image|max:2048',
                'type_de_document_id' => 'required|integer|exists:type_de_documents,id',
                'dossier_id' => 'required|integer|exists:dossiers,id'
            ]);

            $documentType = TypeDeDocument::findOrFail($request->type_de_document_id);
            
            // Create naming convention: TYPE_{dossier_id}_{timestamp}.{extension}
            $timestamp = now()->format('Ymd_His');
            $naming = $documentType->nom_de_type . '_' . $request->dossier_id . '_' . $timestamp . '.' . $request->file('file_uploaded')->getClientOriginalExtension();

            // Ensure the directory exists
            $directory = storage_path('app/public/' . $documentType->nom_de_type);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            $path = Storage::disk('public')->putFileAs($documentType->nom_de_type, $request->file("file_uploaded"), $naming);

            $document = new Document([
                'chemin_contenu_document' => $path,
                'dossier_id' => $request->dossier_id,
                'type_de_document_id' => $request->type_de_document_id,
                'date_de_soumission' => now()->toDateString(),
                'date_d_expiration' => $request->date_d_expiration,
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'Database error',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
