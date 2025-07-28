import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { axiosClient } from "./Api/axios";
import { 
  FaUser, 
  FaIdCard, 
  FaSpinner,
  FaSave,
  FaBox,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

export default function AddFonctionnaire() {
    const [formData, setFormData] = useState({
        // Fonctionnaire Information
        nom_fr: '',
        nom_ar: '',
        prenom_fr: '',
        prenom_ar: '',
        email: '',
        telephone: '',
        date_de_naissance: '',
        adresse: '',
        statut_id: '',
        date_affectation: '',
        
        // Caractéristiques Physiques
        dossier: '',
        matricule: '',
        couleur: '',
        tiroir: '',
        armoire: '',
        
        corps_id: '',
        grade_id: '',
        unite_organi_id: '',
        entite_id: '',
        affectation_id: ''
    });
    
    const [errors, setErrors] = useState({
        nom_fr: '',
        nom_ar: '',
        prenom_fr: '',
        prenom_ar: '',
        email: '',
        telephone: '',
        date_de_naissance: '',
        adresse: '',
        statut_id: '',
        couleur: '',
        tiroir: '',
        armoire: '',
        matricule: '',
        corps_id: '',
        grade_id: '',
        unite_organi_id: '',
        entite_id: '',
        affectation_id: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dataOptions, setDataOptions] = useState({
        statut: [],
        corps: [],
        grades: [],
        unite_organi: [],
        entites: [],
        affectation: [],
        allEntites: [] 
    });
    const navigate = useNavigate();
    const [allGrades, setAllGrades] = useState([]);
    const admin = JSON.parse(localStorage.getItem("ADMIN_INFO"))
    const [theNumber,setTheNumber] = useState()


    const isArabic = (text) => {
        const arabicRegex = /^[\u0600-\u06FF\s]+$/;
        return arabicRegex.test(text);
    };


    const validateField = (field, value) => {
        let error = '';
        
        switch(field) {
            case 'nom_fr':
            case 'prenom_fr':
                if (value.length < 3) error = 'Doit contenir au moins 3 caractères';
                break;
            case 'nom_ar':
            case 'prenom_ar':
                if (value.length < 3) error = 'يجب أن يحتوي على الأقل 3 أحرف';
                else if (!isArabic(value)) error = 'يجب أن يحتوي على أحرف عربية فقط';
                break;
            case 'telephone':
                if (!/^(05|06|07)\d{8}$/.test(value)) error = 'Doit commencer par 05, 06 ou 07 et avoir 10 chiffres';
                break;
            case 'date_de_naissance':
                const birthDate = new Date(value);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                if (age < 20) error = 'L\'âge doit être d\'au moins 20 ans';
                break;
            case 'adresse':
                if (value.length < 5) error = 'Doit contenir au moins 5 caractères';
                break;
            case 'statut_id':
            case 'corps_id':
            case 'unite_organi_id':
            case 'entite_id':
            case 'affectation_id':
                if (!value) error = 'Ce champ est obligatoire';
                break;
            case 'couleur':
                if (!value) error = 'Ce champ est obligatoire';
                else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) error = 'Format couleur invalide (ex: #FF0000)';
                break;
            case 'tiroir':
                if (!/^\d+$/.test(value)) error = 'Doit être un nombre';
                break;
            case 'armoire':
                if (!/^[A-Za-z]+$/.test(value)) error = 'Doit contenir seulement des lettres';
                break;
            case 'matricule':
                if (!value) error = 'Le matricule est obligatoire';
                break;
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email invalide';
                break;
        }
        
        return error;
    };

    // Handle input change with validation
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Validate the field
        const error = validateField(field, value);
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));
        
        if (field === 'corps_id') {
            const filteredGrades = allGrades.filter(grade => grade.corp_id == value);
            setDataOptions(prev => ({
                ...prev,
                grades: filteredGrades
            }));

            setFormData(prev => ({
                ...prev,
                grade_id: ''
            }));
        }
        
        if (field === 'unite_organi_id') {
            const filteredEntites = dataOptions.allEntites.filter(entite => entite.unite_organi_id == value);
            setDataOptions(prev => ({
                ...prev,
                entites: filteredEntites
            }));

            setFormData(prev => ({
                ...prev,
                entite_id: ''
            }));
        }
    };

    // Validate the entire form before submission
    const validateForm = () => {
        let isValid = true;
        const newErrors = {};
        
        // Validate all fields
        Object.keys(formData).forEach(field => {
            if (field !== 'dossier' && field !== 'matricule' && field !== 'date_affectation') {
                const error = validateField(field, formData[field]);
                newErrors[field] = error;
                if (error) isValid = false;
            }
        });
        
        setErrors(newErrors);
        return isValid;
    };

    // Fetch initial data options and latest dossier
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            
            const response = await axiosClient.get('/api/data-for-new-fonctionnaire');
            setDataOptions({
                statut: response.data.statut || [],
                corps: response.data.corps || [],
                grades: response.data.grade || [],
                unite_organi: response.data.unite_organi || [],
                entites: [],
                affectation: response.data.affectation || [],
                allEntites: response.data.entite || [] // Store all entites
            });
            setAllGrades(response.data.grade || []);
            
            const latestDossier = response.data.dossier;
            const nextDossierNumber = generateNextDossierNumber(latestDossier?.dossier);
            
            setFormData(prev => ({
                ...prev,
                dossier: nextDossierNumber,
                matricule: '' 
            }));
            
        } catch (err) {
            setError(err.message || "Failed to fetch initial data");
        } finally {
            setLoading(false);
        }
    };

    const generateNextDossierNumber = (lastDossier) => {
        if (!lastDossier) return 'Dossier-001';
        
        const match = lastDossier.match(/-(\d+)$/);
        if (match && match[1]) {
            const lastNumber = parseInt(match[1], 10);
            const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
            setTheNumber(nextNumber)
            return `Dossier-${nextNumber}`;
        }
        
        return 'Dossier-001';
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate the form before submission
        if (!validateForm()) {
            return;
        }
        
        const apiData = {
            // Fonctionnaire Information
            nom_fr: formData.nom_fr,
            nom_ar: formData.nom_ar,
            prenom_fr: formData.prenom_fr,
            prenom_ar: formData.prenom_ar,
            email: formData.email,
            telephone: formData.telephone,
            date_de_naissance: formData.date_de_naissance,
            adresse: formData.adresse,
            statut_id: formData.statut_id,
            date_affectation: formData.date_affectation,
            
            // Caractéristiques Physiques
            dossier: formData.dossier,
            matricule: formData.matricule,
            couleur: formData.couleur,
            tiroir: formData.tiroir,
            armoire: formData.armoire,
            
            // Grade & Entité (using IDs)
            corps_id: formData.corps_id,
            grade_id: formData.grade_id,
            unite_organi_id: formData.unite_organi_id,
            entite_id: formData.entite_id,
            affectation_id: formData.affectation_id
        };
    
        try {
            setLoading(true);
            // Save the fonctionnaire data and get the response
            const response = await axiosClient.post('/api/create-fonctionnaire', apiData);
            
            // Now send the transaction trace with the correct dossier_id
            await axiosClient.post("/api/tracer-action-table", {
                admin_id: admin?.admin?.id,
                dossier_id: response.data.dossier_id, // Use the ID from the response
                type_de_transaction: 5,
                details_de_transaction: "l'enregistrement du dossier actif"
            });
            
            alert('Fonctionnaire créé avec succès!');
            navigate("/add-documents");
    
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to create fonctionnaire");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !dataOptions.statut.length) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }

    // Helper component for error display
    const ErrorMessage = ({ error }) => (
        error && (
            <div className="flex items-center text-red-500 text-sm mt-1">
                <FaExclamationTriangle className="mr-1" />
                {error}
            </div>
        )
    );

    return (
        <div className="container mx-auto p-4">
            <div className="relative">
                <div
                    className="w-[25%] h-10 bg-blue-600 relative z-10"
                    style={{
                        clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0% 100%)',
                        borderTopLeftRadius: '1.25rem',
                    }}
                >
                    <div
                        className="absolute top-full left-0 w-6 h-6 bg-blue-600"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                    ></div>
                </div>

                <div className="bg-blue-600 text-white rounded-t-lg p-6 shadow-lg -mt-2 pt-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Nouveau Fonctionnaire : {formData.dossier}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-b-lg shadow-md p-6 space-y-6 border border-gray-200">
                {/* Fonctionnaire Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex items-center mb-4">
                        <FaUser className="text-blue-500 mr-2 text-xl" />
                        <h2 className="text-xl font-semibold">Information du Fonctionnaire</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Nom (FR) *</label>
                            <input
                                type="text"
                                value={formData.nom_fr}
                                onChange={(e) => handleInputChange('nom_fr', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.nom_fr ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            />
                            <ErrorMessage error={errors.nom_fr} />
                        </div>

                        <div>
                            <label className="block text-gray-600 mb-1 text-right">النسب (بالعربية) *</label>
                            <input
                                type="text"
                                value={formData.nom_ar}
                                onChange={(e) => handleInputChange('nom_ar', e.target.value)}
                                required
                                className={`w-full p-2 border rounded text-right ${errors.nom_ar ? 'border-red-500' : 'border-blue-300'} bg-white`}
                                dir="rtl"
                            />
                            <ErrorMessage error={errors.nom_ar} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Prénom (FR) *</label>
                            <input
                                type="text"
                                value={formData.prenom_fr}
                                onChange={(e) => handleInputChange('prenom_fr', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.prenom_fr ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            />
                            <ErrorMessage error={errors.prenom_fr} />
                        </div>

                        <div>
                            <label className="block text-gray-600 mb-1 text-right">الاسم (بالعربية) *</label>
                            <input
                                type="text"
                                value={formData.prenom_ar}
                                onChange={(e) => handleInputChange('prenom_ar', e.target.value)}
                                required
                                className={`w-full p-2 border rounded text-right ${errors.prenom_ar ? 'border-red-500' : 'border-blue-300'} bg-white`}
                                dir="rtl"
                            />
                            <ErrorMessage error={errors.prenom_ar} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            />
                            <ErrorMessage error={errors.email} />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Téléphone *</label>
                            <input
                                type="tel"
                                value={formData.telephone}
                                onChange={(e) => handleInputChange('telephone', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.telephone ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            />
                            <ErrorMessage error={errors.telephone} />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Date de Naissance *</label>
                            <input
                                type="date"
                                value={formData.date_de_naissance}
                                onChange={(e) => handleInputChange('date_de_naissance', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.date_de_naissance ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            />
                            <ErrorMessage error={errors.date_de_naissance} />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Adresse</label>
                            <input
                                type="text"
                                value={formData.adresse}
                                onChange={(e) => handleInputChange('adresse', e.target.value)}
                                className={`w-full p-2 border rounded ${errors.adresse ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            />
                            <ErrorMessage error={errors.adresse} />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Statut *</label>
                            <select
                                value={formData.statut_id}
                                onChange={(e) => handleInputChange('statut_id', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.statut_id ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            >
                                <option value="">Sélectionner un statut</option>
                                {dataOptions.statut.map((statut) => (
                                    <option key={statut.id} value={statut.id}>{statut.nom_statut}</option>
                                ))}
                            </select>
                            <ErrorMessage error={errors.statut_id} />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Date d'Affectation</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={formData.date_affectation}
                                    onChange={(e) => handleInputChange('date_affectation', e.target.value)}
                                    className="w-full p-2 border rounded border-blue-300 bg-white pl-8"
                                />
                                <FaCalendarAlt className="absolute left-2 top-3 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Affectation Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex items-center mb-4">
                        <FaMapMarkerAlt className="text-blue-500 mr-2 text-xl" />
                        <h2 className="text-xl font-semibold">Affectation</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Lieu d'affectation *</label>
                            <select
                                value={formData.affectation_id}
                                onChange={(e) => handleInputChange('affectation_id', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.affectation_id ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            >
                                <option value="">Sélectionner une affectation</option>
                                {dataOptions.affectation.map((aff) => (
                                    <option key={aff.id} value={aff.id}>{aff.nom_d_affectation}</option>
                                ))}
                            </select>
                            <ErrorMessage error={errors.affectation_id} />
                        </div>
                    </div>
                </div>

                {/* Caractéristiques Physiques Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex items-center mb-4">
                        <FaBox className="text-blue-500 mr-2 text-xl" />
                        <h2 className="text-xl font-semibold">Caractéristiques Physiques</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Matricule *</label>
                            <input
                                type="text"
                                value={formData.matricule}
                                onChange={(e) => handleInputChange('matricule', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.matricule ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            />
                            <ErrorMessage error={errors.matricule} />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Couleur *</label>
                            <div className="flex items-center">
                                <input
                                    type="color"
                                    value={formData.couleur || '#000000'}
                                    onChange={(e) => handleInputChange('couleur', e.target.value)}
                                    className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.couleur || ''}
                                    onChange={(e) => handleInputChange('couleur', e.target.value)}
                                    placeholder="#RRGGBB"
                                    required
                                    className={`ml-2 p-2 border rounded ${errors.couleur ? 'border-red-500' : 'border-blue-300'} bg-white flex-1`}
                                />
                            </div>
                            <ErrorMessage error={errors.couleur} />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Tiroir *</label>
                            <input
                                type="text"
                                value={formData.tiroir}
                                onChange={(e) => handleInputChange('tiroir', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.tiroir ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            />
                            <ErrorMessage error={errors.tiroir} />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Armoire *</label>
                            <input
                                type="text"
                                value={formData.armoire}
                                onChange={(e) => handleInputChange('armoire', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.armoire ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            />
                            <ErrorMessage error={errors.armoire} />
                        </div>
                    </div>
                </div>

                {/* Grade and Entité Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex items-center mb-4">
                        <FaIdCard className="text-blue-500 mr-2 text-xl" />
                        <h2 className="text-xl font-semibold">Grade & Entité</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Corps *</label>
                            <select
                                value={formData.corps_id}
                                onChange={(e) => handleInputChange('corps_id', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.corps_id ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            >
                                <option value="">Sélectionner un corps</option>
                                {dataOptions.corps.map((corp) => (
                                    <option key={corp.id} value={corp.id}>{corp.nom_de_corps}</option>
                                ))}
                            </select>
                            <ErrorMessage error={errors.corps_id} />
                        </div>
                        
                        <div>
                            <label className="block text-gray-600 mb-1">Grade *</label>
                            <select
                                value={formData.grade_id}
                                onChange={(e) => handleInputChange('grade_id', e.target.value)}
                                required
                                disabled={!formData.corps_id}
                                className={`w-full p-2 border rounded ${formData.corps_id ? errors.grade_id ? 'border-red-500' : 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            >
                                <option value="">{formData.corps_id ? 'Sélectionner un grade' : 'Sélectionnez d\'abord un corps'}</option>
                                {dataOptions.grades.map((grade) => (
                                    <option key={grade.id} value={grade.id}>{grade.nom_grade}</option>
                                ))}
                            </select>
                            <ErrorMessage error={errors.grade_id} />
                        </div>
                        
                        <div>
                            <label className="block text-gray-600 mb-1">Unité Organisationnelle *</label>
                            <select
                                value={formData.unite_organi_id}
                                onChange={(e) => handleInputChange('unite_organi_id', e.target.value)}
                                required
                                className={`w-full p-2 border rounded ${errors.unite_organi_id ? 'border-red-500' : 'border-blue-300'} bg-white`}
                            >
                                <option value="">Sélectionner une unité</option>
                                {dataOptions.unite_organi.map((unit) => (
                                    <option key={unit.id} value={unit.id}>{unit.nomUnite}</option>
                                ))}
                            </select>
                            <ErrorMessage error={errors.unite_organi_id} />
                        </div>
                        
                        <div>
                            <label className="block text-gray-600 mb-1">Entité *</label>
                            <select
                                value={formData.entite_id}
                                onChange={(e) => handleInputChange('entite_id', e.target.value)}
                                required
                                disabled={!formData.unite_organi_id}
                                className={`w-full p-2 border rounded ${formData.unite_organi_id ? errors.entite_id ? 'border-red-500' : 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            >
                                <option value="">{formData.unite_organi_id ? 'Sélectionner une entité' : 'Sélectionnez d\'abord une unité'}</option>
                                {dataOptions.entites.map((entite) => (
                                    <option key={entite.id} value={entite.id}>{entite.nom_entite}</option>
                                ))}
                            </select>
                            <ErrorMessage error={errors.entite_id} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mt-6">
                <button
    type="submit"
    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-10 py-3 rounded-lg transition-colors w-full md:w-1/2"
    disabled={loading}
>
    {loading ? (
        <>
            <FaSpinner className="animate-spin mr-2" />
            Enregistrement...
        </>
    ) : (
        <>
            <FaSave className="mr-2" />
            Enregistrer
        </>
    )}
</button>
                </div>
            </form>
        </div>
    );
}