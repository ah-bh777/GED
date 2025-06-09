    import { useState, useEffect } from "react"
    import { useParams } from "react-router-dom"
    import { axiosClient } from "./Api/axios";
    import { FaFileAlt, FaBox, FaFile, FaFolder, FaUser, FaIdCard, FaBriefcase, FaBuilding, FaExclamationTriangle, FaGavel, FaEdit, FaSave } from 'react-icons/fa';

    export default function SinglePage() {
        const [dossierData, setDossierData] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [editableField, setEditableField] = useState(null);
        const [modifiedFields, setModifiedFields] = useState({});
        const [sectionChanges, setSectionChanges] = useState({
            fonctionnaire: false,
            caracteristiques: false,
            gradeEntite: false
        });
        const [showChanges, setShowChanges] = useState(null);

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
                    return ["Adjoint technique 2ème grade", "Adjoint technique 1er grade"];
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

        const handleDoubleClick = (fieldName) => {
            setEditableField(fieldName);
        };

        const handleInputBlur = () => {
            setEditableField(null);
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
                
                // Show changes before saving
                setShowChanges({
                    section,
                    changes: changesList
                });
                
                // Send changes to the server
                await axiosClient.put(`/api/update-dossier/${id}`, changesToSave);
                
                // Refresh data
                await fetchDossierData();
                
                // Reset section changes
                setSectionChanges(prev => ({
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
                
            } catch (err) {
                console.error("Failed to save changes:", err);
                alert("Failed to save changes. Please try again.");
            }
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
                            {sectionChanges.fonctionnaire && (
                                <button 
                                    onClick={() => saveSectionChanges('fonctionnaire')}
                                    className="flex items-center bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                >
                                    <FaSave className="mr-1" /> Enregistrer
                                </button>
                            )}
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
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Nom (FR)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['fonctionnaire_nom_fr'] !== undefined ? 
                                            modifiedFields['fonctionnaire_nom_fr'] : 
                                            dossier.fonctionnaire.user.nom_fr}
                                        readOnly={editableField !== 'fonctionnaire_nom_fr'}
                                        onDoubleClick={() => handleDoubleClick('fonctionnaire_nom_fr')}
                                        onChange={(e) => handleInputChange('fonctionnaire_nom_fr', e.target.value, 'fonctionnaire')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'fonctionnaire_nom_fr' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'fonctionnaire_nom_fr' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="block text-gray-600 mb-1 text-right">النسب (بالعربية)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['fonctionnaire_nom_ar'] !== undefined ? 
                                            modifiedFields['fonctionnaire_nom_ar'] : 
                                            dossier.fonctionnaire.user.nom_ar}
                                        readOnly={editableField !== 'fonctionnaire_nom_ar'}
                                        onDoubleClick={() => handleDoubleClick('fonctionnaire_nom_ar')}
                                        onChange={(e) => handleInputChange('fonctionnaire_nom_ar', e.target.value, 'fonctionnaire')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'fonctionnaire_nom_ar' ? 'border-blue-500' : 'border-gray-300'} text-right group-hover:bg-gray-50`}
                                        dir="rtl"
                                    />
                                    {editableField !== 'fonctionnaire_nom_ar' && (
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Prénom (FR)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['fonctionnaire_prenom_fr'] !== undefined ? 
                                            modifiedFields['fonctionnaire_prenom_fr'] : 
                                            dossier.fonctionnaire.user.prenom_fr}
                                        readOnly={editableField !== 'fonctionnaire_prenom_fr'}
                                        onDoubleClick={() => handleDoubleClick('fonctionnaire_prenom_fr')}
                                        onChange={(e) => handleInputChange('fonctionnaire_prenom_fr', e.target.value, 'fonctionnaire')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'fonctionnaire_prenom_fr' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'fonctionnaire_prenom_fr' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="block text-gray-600 mb-1 text-right">الاسم (بالعربية)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['fonctionnaire_prenom_ar'] !== undefined ? 
                                            modifiedFields['fonctionnaire_prenom_ar'] : 
                                            dossier.fonctionnaire.user.prenom_ar}
                                        readOnly={editableField !== 'fonctionnaire_prenom_ar'}
                                        onDoubleClick={() => handleDoubleClick('fonctionnaire_prenom_ar')}
                                        onChange={(e) => handleInputChange('fonctionnaire_prenom_ar', e.target.value, 'fonctionnaire')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'fonctionnaire_prenom_ar' ? 'border-blue-500' : 'border-gray-300'} text-right group-hover:bg-gray-50`}
                                        dir="rtl"
                                    />
                                    {editableField !== 'fonctionnaire_prenom_ar' && (
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Other Fonctionnaire Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Email</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['fonctionnaire_email'] !== undefined ? 
                                            modifiedFields['fonctionnaire_email'] : 
                                            dossier.fonctionnaire.user.email}
                                        readOnly={editableField !== 'fonctionnaire_email'}
                                        onDoubleClick={() => handleDoubleClick('fonctionnaire_email')}
                                        onChange={(e) => handleInputChange('fonctionnaire_email', e.target.value, 'fonctionnaire')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'fonctionnaire_email' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'fonctionnaire_email' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Téléphone</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['fonctionnaire_telephone'] !== undefined ? 
                                            modifiedFields['fonctionnaire_telephone'] : 
                                            dossier.fonctionnaire.user.telephone}
                                        readOnly={editableField !== 'fonctionnaire_telephone'}
                                        onDoubleClick={() => handleDoubleClick('fonctionnaire_telephone')}
                                        onChange={(e) => handleInputChange('fonctionnaire_telephone', e.target.value, 'fonctionnaire')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'fonctionnaire_telephone' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'fonctionnaire_telephone' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Date de Naissance</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['fonctionnaire_date_de_naissance'] !== undefined ? 
                                            modifiedFields['fonctionnaire_date_de_naissance'] : 
                                            dossier.fonctionnaire.user.date_de_naissance}
                                        readOnly={editableField !== 'fonctionnaire_date_de_naissance'}
                                        onDoubleClick={() => handleDoubleClick('fonctionnaire_date_de_naissance')}
                                        onChange={(e) => handleInputChange('fonctionnaire_date_de_naissance', e.target.value, 'fonctionnaire')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'fonctionnaire_date_de_naissance' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'fonctionnaire_date_de_naissance' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Adresse</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['fonctionnaire_adresse'] !== undefined ? 
                                            modifiedFields['fonctionnaire_adresse'] : 
                                            dossier.fonctionnaire.user.adresse}
                                        readOnly={editableField !== 'fonctionnaire_adresse'}
                                        onDoubleClick={() => handleDoubleClick('fonctionnaire_adresse')}
                                        onChange={(e) => handleInputChange('fonctionnaire_adresse', e.target.value, 'fonctionnaire')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'fonctionnaire_adresse' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'fonctionnaire_adresse' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Statut</label>
                                <div className="relative">
                                    <select
                                        value={modifiedFields['fonctionnaire_statut'] !== undefined ? 
                                            modifiedFields['fonctionnaire_statut'] : 
                                            dossier.fonctionnaire.statut}
                                        onChange={(e) => handleInputChange('fonctionnaire_statut', e.target.value, 'fonctionnaire')}
                                        className="w-full p-2 border rounded border-gray-300 group-hover:bg-gray-50"
                                    >
                                        {statuts.map((statut) => (
                                            <option key={statut} value={statut}>{statut}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Date d'affectation</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['fonctionnaire_date_d_affectation'] !== undefined ? 
                                            modifiedFields['fonctionnaire_date_d_affectation'] : 
                                            dossier.date_d_affectation}
                                        readOnly={editableField !== 'fonctionnaire_date_d_affectation'}
                                        onDoubleClick={() => handleDoubleClick('fonctionnaire_date_d_affectation')}
                                        onChange={(e) => handleInputChange('fonctionnaire_date_d_affectation', e.target.value, 'fonctionnaire')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'fonctionnaire_date_d_affectation' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'fonctionnaire_date_d_affectation' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
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
                            {sectionChanges.caracteristiques && (
                                <button 
                                    onClick={() => saveSectionChanges('caracteristiques')}
                                    className="flex items-center bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                >
                                    <FaSave className="mr-1" /> Enregistrer
                                </button>
                            )}
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
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Matricule</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['caracteristiques_matricule'] !== undefined ? 
                                            modifiedFields['caracteristiques_matricule'] : 
                                            dossier.matricule}
                                        readOnly={editableField !== 'caracteristiques_matricule'}
                                        onDoubleClick={() => handleDoubleClick('caracteristiques_matricule')}
                                        onChange={(e) => handleInputChange('caracteristiques_matricule', e.target.value, 'caracteristiques')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'caracteristiques_matricule' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'caracteristiques_matricule' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Couleur</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['caracteristiques_couleur'] !== undefined ? 
                                            modifiedFields['caracteristiques_couleur'] : 
                                            dossier.couleur}
                                        readOnly={editableField !== 'caracteristiques_couleur'}
                                        onDoubleClick={() => handleDoubleClick('caracteristiques_couleur')}
                                        onChange={(e) => handleInputChange('caracteristiques_couleur', e.target.value, 'caracteristiques')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'caracteristiques_couleur' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'caracteristiques_couleur' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Tiroir</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['caracteristiques_tiroir'] !== undefined ? 
                                            modifiedFields['caracteristiques_tiroir'] : 
                                            dossier.tiroir}
                                        readOnly={editableField !== 'caracteristiques_tiroir'}
                                        onDoubleClick={() => handleDoubleClick('caracteristiques_tiroir')}
                                        onChange={(e) => handleInputChange('caracteristiques_tiroir', e.target.value, 'caracteristiques')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'caracteristiques_tiroir' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'caracteristiques_tiroir' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Armoire</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={modifiedFields['caracteristiques_armoire'] !== undefined ? 
                                            modifiedFields['caracteristiques_armoire'] : 
                                            dossier.armoire}
                                        readOnly={editableField !== 'caracteristiques_armoire'}
                                        onDoubleClick={() => handleDoubleClick('caracteristiques_armoire')}
                                        onChange={(e) => handleInputChange('caracteristiques_armoire', e.target.value, 'caracteristiques')}
                                        onBlur={handleInputBlur}
                                        className={`w-full p-2 border rounded ${editableField === 'caracteristiques_armoire' ? 'border-blue-500' : 'border-gray-300'} group-hover:bg-gray-50`}
                                    />
                                    {editableField !== 'caracteristiques_armoire' && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            <FaEdit className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
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
                            {sectionChanges.gradeEntite && (
                                <button 
                                    onClick={() => saveSectionChanges('gradeEntite')}
                                    className="flex items-center bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                >
                                    <FaSave className="mr-1" /> Enregistrer
                                </button>
                            )}
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
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Corps</label>
                                <div className="relative">
                                    <select
                                        value={modifiedFields['gradeEntite_corps'] !== undefined ? 
                                            modifiedFields['gradeEntite_corps'] : 
                                            dossier.grade.corp.nom_de_corps}
                                        onChange={(e) => handleInputChange('gradeEntite_corps', e.target.value, 'gradeEntite')}
                                        className="w-full p-2 border rounded border-gray-300 group-hover:bg-gray-50"
                                    >
                                        {dossierData.corps.map((corp) => (
                                            <option key={corp.id} value={corp.nom_de_corps}>{corp.nom_de_corps}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Grade</label>
                                <div className="relative">
                                    <select
                                        value={modifiedFields['gradeEntite_grade'] !== undefined ? 
                                            modifiedFields['gradeEntite_grade'] : 
                                            dossier.grade.nom_grade}
                                        onChange={(e) => handleInputChange('gradeEntite_grade', e.target.value, 'gradeEntite')}
                                        className="w-full p-2 border rounded border-gray-300 group-hover:bg-gray-50"
                                    >
                                        {getGradesByCorps(currentCorps).map((grade, index) => (
                                            <option key={index} value={grade}>{grade}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Unité Organisationnelle</label>
                                <div className="relative">
                                    <select
                                        value={modifiedFields['gradeEntite_unite_organi'] !== undefined ? 
                                            modifiedFields['gradeEntite_unite_organi'] : 
                                            dossier.entite.unite_organi.nomUnite}
                                        onChange={(e) => handleInputChange('gradeEntite_unite_organi', e.target.value, 'gradeEntite')}
                                        className="w-full p-2 border rounded border-gray-300 group-hover:bg-gray-50"
                                    >
                                        {dossierData.unit.map((unit) => (
                                            <option key={unit.id} value={unit.nomUnite}>{unit.nomUnite}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="relative group">
                                <label className="block text-gray-600 mb-1">Entité</label>
                                <div className="relative">
                                    <select
                                        value={modifiedFields['gradeEntite_entite'] !== undefined ? 
                                            modifiedFields['gradeEntite_entite'] : 
                                            dossier.entite.nom_entite}
                                        onChange={(e) => handleInputChange('gradeEntite_entite', e.target.value, 'gradeEntite')}
                                        className="w-full p-2 border rounded border-gray-300 group-hover:bg-gray-50"
                                    >
                                        {getEntitesByUnite(currentUnite).map((entite, index) => (
                                            <option key={index} value={entite}>{entite}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Documents Section */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <FaFile className="text-blue-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Documents</h2>
                        </div>
                        <div className="space-y-6">
                            {dossier.documents.map((document) => (
                                <div key={document.id} className="border-b pb-4 last:border-b-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-lg">{document.type_de_document.nom_de_type}</h3>
                                            <p className="text-gray-600">Type: {document.type_de_document.type_general}</p>
                                            <p className="text-gray-600">Catégorie: {document.type_de_document.categorie}</p>
                                            <p className="text-gray-600">Obligatoire: {document.type_de_document.obligatoire ? 'Oui' : 'Non'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-600">Soumis le: {document.date_de_soumission}</p>
                                            <p className="text-gray-600">Expire le: {document.date_d_expiration}</p>
                                            <a 
                                                href={document.chemin_contenu_document} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline"
                                            >
                                                Voir le document
                                            </a>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-gray-700">Note: {document.note_d_observation}</p>

                                    {/* Sous-documents Section */}
                                    {document.sub_docs.length > 0 && (
                                        <div className="mt-4 pl-4 border-l-2 border-gray-200">
                                            <div className="flex items-center">
                                                <FaFolder className="text-blue-500 mr-2" />
                                                <h4 className="font-medium">Sous-documents</h4>
                                            </div>
                                            <div className="mt-2 space-y-2">
                                                {document.sub_docs.map((subDoc) => (
                                                    <div key={subDoc.id} className="bg-gray-50 p-3 rounded">
                                                        <p className="font-medium">{subDoc.nom_document}</p>
                                                        <p className="text-gray-600">Ajouté le: {subDoc.date_ajout}</p>
                                                        <a 
                                                            href={subDoc.chemin_contenu_sous_document} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:underline text-sm"
                                                        >
                                                            Voir le sous-document
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Required Documents Not Present */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <FaFileAlt className="text-blue-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Documents Manquants</h2>
                        </div>
                        <div className="space-y-2">
                            {dossier.grade.type_de_documents
                                .filter(docType => docType.obligatoire && 
                                    !dossier.documents.some(doc => doc.type_de_document_id === docType.id))
                                .map(docType => (
                                    <div key={docType.id} className="flex items-center text-red-500">
                                        <span className="mr-2">⚠</span>
                                        <span>{docType.nom_de_type} ({docType.type_general})</span>
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

                    {/* Avertissements Section */}
                    {dossier.avertissements.length > 0 && (
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
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
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
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