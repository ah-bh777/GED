<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): Response
    {
        
        $request->validate([
            'nomFr' => 'required|string|max:255',
            'prenomFr' => 'required|string|max:255',
            'nomAr' => 'required|string|max:255',
            'prenomAr' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'telephone' => 'nullable|string|max:20',
            'date_de_naissance' => 'nullable|date',
            'adresse' => 'nullable|string|max:255',
            'role' => 'required|in:admin,fonctionnaire',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],

            // Fonctionnaire-specific
            'poste' => 'required_if:role,fonctionnaire|string|max:100',
            'statut' => 'required_if:role,fonctionnaire|string|max:100',
        ]);

        $user = User::create([
            'nom_fr' => $request->nomFr,
            'prenom_fr' => $request->prenomFr,
            'nom_ar' => $request->nomAr,
            'prenom_ar' => $request->prenomAr,
            'email' => $request->email,
            'telephone' => $request->telephone,
            'date_de_naissance' => $request->date_de_naissance,
            'adresse' => $request->adresse,
            'role' => $request->role,
            'password' => Hash::make($request->password),
        ]);

        if ($user->role == 'fonctionnaire') {
            $user->fonctionnaire()->create([
                'poste' => $request->poste,
                'statut' => $request->statut ,
            ]);
        } elseif ($user->role == 'admin') {
            $user->admin()->create(); 
        }

        event(new Registered($user));

        Auth::login($user);

        return response()->noContent();
    }
}


