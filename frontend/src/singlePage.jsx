import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { axiosClient } from "./Api/axios";
import { 
  FaFileAlt, 
  FaBox, 
  FaFile, 
  FaFolder, 
  FaUser, 
  FaIdCard, 
  FaBriefcase, 
  FaBuilding, 
  FaExclamationTriangle, 
  FaGavel, 
  FaEdit, 
  FaSave, 
  FaUndo, 
  FaLock, 
  FaUnlock,
  FaEye, 
  FaDownload, 
  FaTrash , 
  FaPlus 
} from 'react-icons/fa';

export default function SinglePage() {
    const [dossierData, setDossierData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modifiedFields, setModifiedFields] = useState({});
    const [sectionChanges, setSectionChanges] = useState({
        fonctionnaire: false,
        caracteristiques: false,
        gradeEntite: false
    });
    const [showChanges, setShowChanges] = useState(null);
    const [editMode, setEditMode] = useState({
        fonctionnaire: false,
        caracteristiques: false,
        gradeEntite: false
    });

    const {id} = useParams();
    const obj = {"id": id};

    // Statut options
    const statuts = ["En activité", "Retraité", "Détache entrant", "Détache sortant", "Mise en disponibilité", "Décès"];

    // Function to get grades by corps
    const getGradesByCorps = (corpsName) => {
        switch (corpsName) {
            case "Administrateurs":
                return ["Administrateur 2ème grade", "Administrateur 3ème grade", "Hors grade"];
            case "Ingénieurs d'État":
                return ["Ingénieur d'état 1er grade", "Principal", "Hors grade"];
            case "Techniciens":
                return ["Technicien 2ème grade", "Technicien 3ème grade", "Principal"];
            case "Inspecteurs":
                return ["Inspecteur", "Inspecteur principal"];
            case "Adjoints techniques":
                return ["Adjoint technique 2ème grade", "Adjoint technique 1ère grade"];
            default:
                return [];
        }
    };

    // Function to get entités by unité organisationnelle
    const getEntitesByUnite = (uniteName) => {
        switch (uniteName) {
            case "Direction Générale de la Transition Numérique":
                return [
                    "Direction des Ecosystèmes et Entrepreneuriat Digital",
                    "Direction des Infrastructures Cloud et de l'Offshoring"
                ];
            case "Département de la Réforme de l'Administration":
                return [
                    "Direction de la Fonction Publique",
                    "Direction de l'Organisation de l'Administration"
                ];
            default:
                return [];
        }
    };

    const fetchDossierData = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.post(`/api/details/`, obj);
            setDossierData(response.data);
        } catch (err) {
            setError(err.message || "Failed to fetch dossier data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDossierData();
    }, [id]);

    const handleInputChange = (fieldName, value, section) => {
        setModifiedFields(prev => ({
            ...prev,
            [fieldName]: value
        }));
        
        // Mark section as having changes
        setSectionChanges(prev => ({
            ...prev,
            [section]: true
        }));
    };

    const toggleEditMode = (section) => {
        setEditMode(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
        
        if (editMode[section] && sectionChanges[section]) {
            resetSectionChanges(section);
        }
    };

    const saveSectionChanges = async (section) => {
        try {
            const changesToSave = {};
            const changesList = [];
            
            // Collect all changes for this section
            Object.keys(modifiedFields).forEach(key => {
                if (key.startsWith(section + '_')) {
                    changesToSave[key] = modifiedFields[key];
                    changesList.push({
                        field: key.replace(section + '_', ''),
                        oldValue: dossierData.dossier[key.split('_').slice(1).join('_')] || 
                                 (dossierData.dossier.fonctionnaire && dossierData.dossier.fonctionnaire[key.split('_').slice(1).join('_')]) || 
                                 (dossierData.dossier.fonctionnaire?.user && dossierData.dossier.fonctionnaire.user[key.split('_').slice(1).join('_')]) || 
                                 (dossierData.dossier.grade && dossierData.dossier.grade[key.split('_').slice(1).join('_')]) || 
                                 (dossierData.dossier.grade?.corp && dossierData.dossier.grade.corp[key.split('_').slice(1).join('_')]) || 
                                 (dossierData.dossier.entite && dossierData.dossier.entite[key.split('_').slice(1).join('_')]) || 
                                 (dossierData.dossier.entite?.unite_organi && dossierData.dossier.entite.unite_organi[key.split('_').slice(1).join('_')]),
                        newValue: modifiedFields[key]
                    });
                }
            });

            alert(JSON.stringify(changesToSave))
          
            setShowChanges({
                section,
                changes: changesList
            });

            const updateData =  await axiosClient.put(`/api/update_details/${id}`, changesToSave);
                
            alert(JSON.stringify(updateData.data));
            
            await fetchDossierData();
            
      
            setSectionChanges(prev => ({
                ...prev,
                [section]: false
            }));
            setEditMode(prev => ({
                ...prev,
                [section]: false
            }));
            
            // Clear modified fields for this section
            const newModifiedFields = {...modifiedFields};
            Object.keys(newModifiedFields).forEach(key => {
                if (key.startsWith(section + '_')) {
                    delete newModifiedFields[key];
                }
            });
            setModifiedFields(newModifiedFields);
            alert(change)
            
        } catch (err) {
            console.error("Failed to save changes:", err);
            alert("Failed to save changes. Please try again.");
        }
    };

    const resetSectionChanges = (section) => {
        // Clear modified fields for this section
        const newModifiedFields = {...modifiedFields};
        Object.keys(newModifiedFields).forEach(key => {
            if (key.startsWith(section + '_')) {
                delete newModifiedFields[key];
            }
        });
        setModifiedFields(newModifiedFields);
        
        // Mark section as having no changes
        setSectionChanges(prev => ({
            ...prev,
            [section]: false
        }));
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }

    if (!dossierData) {
        return <div className="flex justify-center items-center h-screen">No dossier data found</div>;
    }

    const dossier = dossierData.dossier;
    const currentCorps = modifiedFields['gradeEntite_corps'] !== undefined ? 
        modifiedFields['gradeEntite_corps'] : 
        dossier.grade.corp.nom_de_corps;
    const currentUnite = modifiedFields['gradeEntite_unite_organi'] !== undefined ? 
        modifiedFields['gradeEntite_unite_organi'] : 
        dossier.entite.unite_organi.nomUnite;

    const addSubDoc = (id) =>{
        alert(id)
    }

    return (
        <div className="container mx-auto p-4">
            {/* Folder-like Header with Tab */}
            <div className="relative">
                {/* Folder Tab */}
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

                {/* Header Content */}
                <div className="bg-blue-600 text-white rounded-t-lg p-6 shadow-lg -mt-2 pt-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold ">{dossier.dossier}</h1>
                            <p className="text-blue-100 mt-1">
                                {/* Optional text */}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-b-lg shadow-md p-6 space-y-6 border border-gray-200">
                {/* Fonctionnaire Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <FaUser className="text-blue-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Fonctionnaire Information</h2>
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => toggleEditMode('fonctionnaire')}
                                className={`flex items-center px-3 py-1 rounded transition ${editMode.fonctionnaire ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                            >
                                {editMode.fonctionnaire ? <FaUnlock className="mr-1" /> : <FaEdit className="mr-1" />}
                                {editMode.fonctionnaire ? 'Verrouiller' : 'Modifier'}
                            </button>
                            {sectionChanges.fonctionnaire && (
                                <>
                                    <button 
                                        onClick={() => resetSectionChanges('fonctionnaire')}
                                        className="flex items-center bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                                    >
                                        <FaUndo className="mr-1" /> Annuler
                                    </button>
                                    <button 
                                        onClick={() => saveSectionChanges('fonctionnaire')}
                                        className="flex items-center bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                    >
                                        <FaSave className="mr-1" /> Enregistrer
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {showChanges?.section === 'fonctionnaire' && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <h3 className="font-medium text-blue-800">Modifications enregistrées:</h3>
                            <ul className="list-disc pl-5 mt-1 text-blue-700">
                                {showChanges.changes.map((change, index) => (
                                    <li key={index}>
                                        {change.field}: <span className="line-through">{change.oldValue}</span> → {change.newValue}
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => setShowChanges(null)}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Fermer
                            </button>
                        </div>
                    )}
                    
                    {/* Name Row - French and Arabic side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Nom (FR)</label>
                            <input
                                type="text"
                                value={modifiedFields['fonctionnaire_nom_fr'] !== undefined ? 
                                    modifiedFields['fonctionnaire_nom_fr'] : 
                                    dossier.fonctionnaire.user.nom_fr}
                                onChange={(e) => handleInputChange('fonctionnaire_nom_fr', e.target.value, 'fonctionnaire')}
                                readOnly={!editMode.fonctionnaire}
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 mb-1 text-right">النسب (بالعربية)</label>
                            <input
                                type="text"
                                value={modifiedFields['fonctionnaire_nom_ar'] !== undefined ? 
                                    modifiedFields['fonctionnaire_nom_ar'] : 
                                    dossier.fonctionnaire.user.nom_ar}
                                onChange={(e) => handleInputChange('fonctionnaire_nom_ar', e.target.value, 'fonctionnaire')}
                                readOnly={!editMode.fonctionnaire}
                                className={`w-full p-2 border rounded text-right ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                                dir="rtl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Prénom (FR)</label>
                            <input
                                type="text"
                                value={modifiedFields['fonctionnaire_prenom_fr'] !== undefined ? 
                                    modifiedFields['fonctionnaire_prenom_fr'] : 
                                    dossier.fonctionnaire.user.prenom_fr}
                                onChange={(e) => handleInputChange('fonctionnaire_prenom_fr', e.target.value, 'fonctionnaire')}
                                readOnly={!editMode.fonctionnaire}
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 mb-1 text-right">الاسم (بالعربية)</label>
                            <input
                                type="text"
                                value={modifiedFields['fonctionnaire_prenom_ar'] !== undefined ? 
                                    modifiedFields['fonctionnaire_prenom_ar'] : 
                                    dossier.fonctionnaire.user.prenom_ar}
                                onChange={(e) => handleInputChange('fonctionnaire_prenom_ar', e.target.value, 'fonctionnaire')}
                                readOnly={!editMode.fonctionnaire}
                                className={`w-full p-2 border rounded text-right ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                                dir="rtl"
                            />
                        </div>
                    </div>
                    
                    {/* Other Fonctionnaire Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Email</label>
                            <input
                                type="text"
                                value={modifiedFields['fonctionnaire_email'] !== undefined ? 
                                    modifiedFields['fonctionnaire_email'] : 
                                    dossier.fonctionnaire.user.email}
                                onChange={(e) => handleInputChange('fonctionnaire_email', e.target.value, 'fonctionnaire')}
                                readOnly={!editMode.fonctionnaire}
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Téléphone</label>
                            <input
                                type="text"
                                value={modifiedFields['fonctionnaire_telephone'] !== undefined ? 
                                    modifiedFields['fonctionnaire_telephone'] : 
                                    dossier.fonctionnaire.user.telephone}
                                onChange={(e) => handleInputChange('fonctionnaire_telephone', e.target.value, 'fonctionnaire')}
                                readOnly={!editMode.fonctionnaire}
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Date de Naissance</label>
                            <input
                                type="date"
                                value={modifiedFields['fonctionnaire_date_de_naissance'] !== undefined ? 
                                    modifiedFields['fonctionnaire_date_de_naissance'] : 
                                    dossier.fonctionnaire.user.date_de_naissance}
                                onChange={(e) => handleInputChange('fonctionnaire_date_de_naissance', e.target.value, 'fonctionnaire')}
                                readOnly={!editMode.fonctionnaire}
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Adresse</label>
                            <input
                                type="text"
                                value={modifiedFields['fonctionnaire_adresse'] !== undefined ? 
                                    modifiedFields['fonctionnaire_adresse'] : 
                                    dossier.fonctionnaire.user.adresse}
                                onChange={(e) => handleInputChange('fonctionnaire_adresse', e.target.value, 'fonctionnaire')}
                                readOnly={!editMode.fonctionnaire}
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            />
                        </div>
                       <div>
                    <label className="block text-gray-600 mb-1">Statut</label>
                    <select
                        value={modifiedFields['fonctionnaire_statut'] !== undefined ? 
                            modifiedFields['fonctionnaire_statut'] : 
                            (dossier.fonctionnaire.statut || '')}
                        onChange={(e) => handleInputChange('fonctionnaire_statut', e.target.value, 'fonctionnaire')}
                        disabled={!editMode.fonctionnaire}
                        className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                    >
                        {statuts.map((statut) => (
                            <option key={statut} value={statut}>{statut}</option>
                        ))}
                    </select>
                </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Date d'affectation</label>
                            <input
                                type="text"
                                value={modifiedFields['fonctionnaire_date_d_affectation'] !== undefined ? 
                                    modifiedFields['fonctionnaire_date_d_affectation'] : 
                                    dossier.date_d_affectation}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Caractéristiques Physiques Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <FaBox className="text-blue-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Caractéristiques Physiques</h2>
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => toggleEditMode('caracteristiques')}
                                className={`flex items-center px-3 py-1 rounded transition ${editMode.caracteristiques ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                            >
                                {editMode.caracteristiques ? <FaUnlock className="mr-1" /> : <FaEdit className="mr-1" />}
                                {editMode.caracteristiques ? 'Verrouiller' : 'Modifier'}
                            </button>
                            {sectionChanges.caracteristiques && (
                                <>
                                    <button 
                                        onClick={() => resetSectionChanges('caracteristiques')}
                                        className="flex items-center bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                                    >
                                        <FaUndo className="mr-1" /> Annuler
                                    </button>
                                    <button 
                                        onClick={() => saveSectionChanges('caracteristiques')}
                                        className="flex items-center bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                    >
                                        <FaSave className="mr-1" /> Enregistrer
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {showChanges?.section === 'caracteristiques' && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <h3 className="font-medium text-blue-800">Modifications enregistrées:</h3>
                            <ul className="list-disc pl-5 mt-1 text-blue-700">
                                {showChanges.changes.map((change, index) => (
                                    <li key={index}>
                                        {change.field}: <span className="line-through">{change.oldValue}</span> → {change.newValue}
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => setShowChanges(null)}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Fermer
                            </button>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Matricule</label>
                            <input
                                type="text"
                                value={modifiedFields['caracteristiques_matricule'] !== undefined ? 
                                    modifiedFields['caracteristiques_matricule'] : 
                                    dossier.matricule}
                                onChange={(e) => handleInputChange('caracteristiques_matricule', e.target.value, 'caracteristiques')}
                                readOnly
                                className={`w-full p-2 border rounded border-gray-300 bg-gray-50`}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Couleur</label>
                            <input
                                type="text"
                                value={modifiedFields['caracteristiques_couleur'] !== undefined ? 
                                    modifiedFields['caracteristiques_couleur'] : 
                                    dossier.couleur}
                                onChange={(e) => handleInputChange('caracteristiques_couleur', e.target.value, 'caracteristiques')}
                                readOnly={!editMode.caracteristiques}
                                className={`w-full p-2 border rounded ${editMode.caracteristiques ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Tiroir</label>
                            <input
                                type="text"
                                value={modifiedFields['caracteristiques_tiroir'] !== undefined ? 
                                    modifiedFields['caracteristiques_tiroir'] : 
                                    dossier.tiroir}
                                onChange={(e) => handleInputChange('caracteristiques_tiroir', e.target.value, 'caracteristiques')}
                                readOnly={!editMode.caracteristiques}
                                className={`w-full p-2 border rounded ${editMode.caracteristiques ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Armoire</label>
                            <input
                                type="text"
                                value={modifiedFields['caracteristiques_armoire'] !== undefined ? 
                                    modifiedFields['caracteristiques_armoire'] : 
                                    dossier.armoire}
                                onChange={(e) => handleInputChange('caracteristiques_armoire', e.target.value, 'caracteristiques')}
                                readOnly={!editMode.caracteristiques}
                                className={`w-full p-2 border rounded ${editMode.caracteristiques ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Grade and Entité Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <FaIdCard className="text-blue-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Grade & Entité</h2>
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => toggleEditMode('gradeEntite')}
                                className={`flex items-center px-3 py-1 rounded transition ${editMode.gradeEntite ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                            >
                                {editMode.gradeEntite ? <FaUnlock className="mr-1" /> : <FaEdit className="mr-1" />}
                                {editMode.gradeEntite ? 'Verrouiller' : 'Modifier'}
                            </button>
                            {sectionChanges.gradeEntite && (
                                <>
                                    <button 
                                        onClick={() => resetSectionChanges('gradeEntite')}
                                        className="flex items-center bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                                    >
                                        <FaUndo className="mr-1" /> Annuler
                                    </button>
                                    <button 
                                        onClick={() => saveSectionChanges('gradeEntite')}
                                        className="flex items-center bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                    >
                                        <FaSave className="mr-1" /> Enregistrer
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {showChanges?.section === 'gradeEntite' && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <h3 className="font-medium text-blue-800">Modifications enregistrées:</h3>
                            <ul className="list-disc pl-5 mt-1 text-blue-700">
                                {showChanges.changes.map((change, index) => (
                                    <li key={index}>
                                        {change.field}: <span className="line-through">{change.oldValue}</span> → {change.newValue}
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => setShowChanges(null)}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Fermer
                            </button>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Corps</label>
                            <select
                                value={modifiedFields['gradeEntite_corps'] !== undefined ? 
                                    modifiedFields['gradeEntite_corps'] : 
                                    dossier.grade.corp.nom_de_corps}
                                onChange={(e) => handleInputChange('gradeEntite_corps', e.target.value, 'gradeEntite')}
                                disabled={!editMode.gradeEntite}
                                className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            >
                                {dossierData.corps.map((corp) => (
                                    <option key={corp.id} value={corp.nom_de_corps}>{corp.nom_de_corps}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Grade</label>
                            <select
                                value={modifiedFields['gradeEntite_grade'] !== undefined ? 
                                    modifiedFields['gradeEntite_grade'] : 
                                    dossier.grade.nom_grade}
                                onChange={(e) => handleInputChange('gradeEntite_grade', e.target.value, 'gradeEntite')}
                                disabled={!editMode.gradeEntite}
                                className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            >
                                {getGradesByCorps(currentCorps).map((grade, index) => (
                                    <option key={index} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Unité Organisationnelle</label>
                            <select
                                value={modifiedFields['gradeEntite_unite_organi'] !== undefined ? 
                                    modifiedFields['gradeEntite_unite_organi'] : 
                                    dossier.entite.unite_organi.nomUnite}
                                onChange={(e) => handleInputChange('gradeEntite_unite_organi', e.target.value, 'gradeEntite')}
                                disabled={!editMode.gradeEntite}
                                className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            >
                                {dossierData.unit.map((unit) => (
                                    <option key={unit.id} value={unit.nomUnite}>{unit.nomUnite}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Entité</label>
                            <select
                                value={modifiedFields['gradeEntite_entite'] !== undefined ? 
                                    modifiedFields['gradeEntite_entite'] : 
                                    dossier.entite.nom_entite}
                                onChange={(e) => handleInputChange('gradeEntite_entite', e.target.value, 'gradeEntite')}
                                disabled={!editMode.gradeEntite}
                                className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'}`}
                            >
                                {getEntitesByUnite(currentUnite).map((entite, index) => (
                                    <option key={index} value={entite}>{entite}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

      
{/* Documents Section */}
<div className="bg-white rounded-lg p-6 border border-gray-200">
  <div className="flex items-center mb-4">
    <FaFile className="text-blue-500 mr-2 text-xl" />
    <h2 className="text-xl font-semibold">Documents</h2>
  </div>
  
  {/* Documents List */}
  <div className="space-y-4">
    {dossier.documents.length > 0 ? (
      dossier.documents.map((document) => (
<div key={document.id} className="space-y-4 mb-6">
  {/* Main Document Card */}
  <div className="flex items-center h-14 w-full bg-green-50 border border-green-200 rounded-lg px-4 hover:bg-green-100 transition-colors">
    <div className="flex flex-1 justify-between items-center">
      <div className="flex flex-col md:flex-row md:space-x-6 md:items-center">
        <span className="font-medium text-green-800">{document.type_de_document.nom_de_type}</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          <span>Obligatoire: {document.type_de_document.obligatoire ? 'Oui' : 'Non'}</span>
          <span>Soumis le: {document.date_de_soumission}</span>
          <span>Expire le: {document.date_d_expiration}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button onClick={()=>{addSubDoc(document.id)}} >
            <FaPlus />
        </button>
        <button 
          onClick={() => window.open(document.chemin_contenu_document, '_blank')}
          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
          title="Voir"
        >
          <FaEye />
        </button>
        <button 
          onClick={() => {
            const link = document.createElement('a');
            link.href = document.chemin_contenu_document;
            link.download = document.type_de_document.nom_de_type;
            link.click();
          }}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
          title="Télécharger"
        >
          <FaDownload />
        </button>
        <button 
          onClick={() => {
            if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document?")) {
              // Call API to delete document
            }
          }}
          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
          title="Supprimer"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  </div>


  {/* Sous-documents Section with divider */}
  {document.sub_docs.length > 0 && (
    <div className="ml-6 pl-4 border-l-2 border-green-200 space-y-3">
      <div className="flex items-center text-sm text-gray-500 mt-1">
        <FaFolder className="mr-2 text-green-400" />
        <span>Sous-documents ({document.sub_docs.length})</span>
      </div>
      
      {document.sub_docs.map((subDoc) => (
        <div key={subDoc.id} className="flex items-center h-12 w-full bg-gray-50 border border-gray-200 rounded-lg px-4 hover:bg-gray-100 transition-colors">
          <div className="flex flex-1 justify-between items-center">
            <div className="flex flex-col md:flex-row md:space-x-6 md:items-center">
              <span className="font-medium text-gray-700">{subDoc.nom_document}</span>
              <span className="text-sm text-gray-500">
                Ajouté le: {subDoc.date_ajout}
              </span>
            </div>
            <div className="flex items-center justify-between w-32">
              <button
                onClick={() => window.open(subDoc.chemin_contenu_sous_document, '_blank')}
                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                title="Voir"
              >
                <FaEye />
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = subDoc.chemin_contenu_sous_document;
                  link.download = subDoc.nom_document;
                  link.click();
                }}
                className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                title="Télécharger"
              >
                <FaDownload />
              </button>
  <button
                onClick={() => {
                  if (window.confirm("Êtes-vous sûr de vouloir supprimer ce sous-document?")) {
                    // Call API to delete sub-document
                  }
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                title="Supprimer"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
      ))
    ) : (
      <p className="text-gray-500">Aucun document trouvé</p>
    )}
  </div>

  {/* Required Documents Not Present */}
  <div className="mt-8">
    <div className="flex items-center mb-4">
      <FaFileAlt className="text-blue-500 mr-2 text-xl" />
      <h2 className="text-xl font-semibold">Documents Manquants</h2>
    </div>
    
    <div className="space-y-4">
      {dossier.grade.type_de_documents
        .filter(docType => docType.obligatoire && 
          !dossier.documents.some(doc => doc.type_de_document_id === docType.id))
        .map(docType => (
          <div key={docType.id} className="space-y-2">
            <div className="flex items-center text-red-500">
              <FaExclamationTriangle className="mr-2" />
              <span>{docType.nom_de_type} ({docType.type_general})</span>
            </div>
            <div className="grid w-full items-center gap-1.5 ml-6">
              <input
                className="flex w-full rounded-md border border-blue-300 bg-white text-sm text-gray-400 file:border-0 file:bg-blue-600 file:text-white file:text-sm file:font-medium"
                type="file"
                id={`upload-${docType.id}`}
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    const formData = new FormData();
                    formData.append('document', e.target.files[0]);
                    formData.append('type_de_document_id', docType.id);
                    // Call API to upload document
                  }
                }}
              />
            </div>
          </div>
        ))}
      
      {dossier.grade.type_de_documents
        .filter(docType => docType.obligatoire && 
          !dossier.documents.some(doc => doc.type_de_document_id === docType.id))
        .length === 0 && (
          <p className="text-green-500">Tous les documents obligatoires sont présents</p>
        )}
    </div>
  </div>
</div>

{/* Avertissements Section */}
{dossier.avertissements.length > 0 && (
  <div className="bg-white rounded-lg p-6 border border-gray-200 mt-6">
    <div className="flex items-center mb-4">
      <FaExclamationTriangle className="text-yellow-500 mr-2 text-xl" />
      <h2 className="text-xl font-semibold">Avertissements</h2>
    </div>
    <div className="space-y-3">
      {dossier.avertissements.map(avertissement => (
        <div key={avertissement.id} className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <p className="font-medium">{avertissement.note_de_avertissement}</p>
          <p className="text-gray-600">Conseil de discipline: {avertissement.conseil_de_discipline ? 'Oui' : 'Non'}</p>
        </div>
      ))}
    </div>
  </div>
)}

{/* Conseil de Disciplines Section */}
{dossier.conseil_de_disciplines.length > 0 && (
  <div className="bg-white rounded-lg p-6 border border-gray-200 mt-6">
    <div className="flex items-center mb-4">
      <FaGavel className="text-red-500 mr-2 text-xl" />
      <h2 className="text-xl font-semibold">Conseil de Disciplines</h2>
    </div>
    <div className="space-y-3">
      {dossier.conseil_de_disciplines.map(conseil => (
        <div key={conseil.id} className="bg-red-50 p-3 rounded border border-red-200">
          <p className="font-medium">{conseil.note_de_conseil}</p>
          <p className="text-gray-600">Date: {conseil.date_de_conseil}</p>
          <p className="text-gray-600">Sanction: {conseil.sanction}</p>
        </div>
      ))}
    </div>
  </div>
)}
            </div>
        </div>
    );
}