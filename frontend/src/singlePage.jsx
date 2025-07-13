import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { axiosClient } from "./Api/axios";
import axios from "axios";
import { 
  FaFileAlt, 
  FaCheckCircle ,
  FaBox, 
  FaFile, 
  FaFolder, 
  FaUser, 
  FaMapMarkerAlt ,
  FaIdCard, 
  FaBriefcase, 
  FaBuilding, 
  FaSpinner,
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
  FaPlus ,
  FaUpload
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
    const [uploadStates, setUploadStates] = useState({});
    const [selectedFiles, setSelectedFiles] = useState({});
    const [documentNotes, setDocumentNotes] = useState({});
    const [documentExpirations, setDocumentExpirations] = useState({});
    const [errors, setErrors] = useState({
        fonctionnaire_nom_fr: '',
        fonctionnaire_nom_ar: '',
        fonctionnaire_prenom_fr: '',
        fonctionnaire_prenom_ar: '',
        fonctionnaire_email: '',
        fonctionnaire_telephone: '',
        fonctionnaire_date_de_naissance: '',
        fonctionnaire_adresse: '',
        fonctionnaire_statut_id: '',
        caracteristiques_couleur: '',
        caracteristiques_tiroir: '',
        caracteristiques_armoire: '',
        gradeEntite_corps_id: '',
        gradeEntite_grade_id: '',
        gradeEntite_unite_organi_id: '',
        gradeEntite_entite_id: '',
        affectation_affectation_id: ''
    });

    const {id} = useParams();
    const obj = {"id": id};

    // Validate Arabic text (only Arabic characters and spaces)
    const isArabic = (text) => {
        const arabicRegex = /^[\u0600-\u06FF\s]+$/;
        return arabicRegex.test(text);
    };

    // Validate form fields
    const validateField = (field, value) => {
        let error = '';
        
        switch(field) {
            case 'fonctionnaire_nom_fr':
            case 'fonctionnaire_prenom_fr':
                if (value.length < 3) error = 'Doit contenir au moins 3 caractères';
                break;
            case 'fonctionnaire_nom_ar':
            case 'fonctionnaire_prenom_ar':
                if (value.length < 3) error = 'يجب أن يحتوي على الأقل 3 أحرف';
                else if (!isArabic(value)) error = 'يجب أن يحتوي على أحرف عربية فقط';
                break;
            case 'fonctionnaire_telephone':
                if (!/^(05|06|07)\d{8}$/.test(value)) error = 'Doit commencer par 05, 06 ou 07 et avoir 10 chiffres';
                break;
            case 'fonctionnaire_date_de_naissance':
                const birthDate = new Date(value);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                if (age < 20) error = 'L\'âge doit être d\'au moins 20 ans';
                break;
            case 'fonctionnaire_adresse':
                if (value.length < 5) error = 'Doit contenir au moins 5 caractères';
                break;
            case 'fonctionnaire_statut_id':
            case 'gradeEntite_corps_id':
            case 'gradeEntite_unite_organi_id':
            case 'gradeEntite_entite_id':
            case 'affectation_affectation_id':
                if (!value) error = 'Ce champ est obligatoire';
                break;
            case 'caracteristiques_couleur':
                if (!value) error = 'Ce champ est obligatoire';
                break;
            case 'caracteristiques_tiroir':
                if (!/^\d+$/.test(value)) error = 'Doit être un nombre';
                break;
            case 'caracteristiques_armoire':
                if (!/^[A-Za-z]+$/.test(value)) error = 'Doit contenir seulement des lettres';
                break;
            case 'fonctionnaire_email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email invalide';
                break;
        }
        
        return error;
    };

    // Function to get grades by corps ID
    const getGradesByCorpsId = (corpsId) => {
        if (!dossierData?.grade) return [];
        return dossierData.grade.filter(grade => grade.corp_id == corpsId);
    };

    // Function to get entites by unite ID
    const getEntitesByUniteId = (uniteId) => {
        if (!dossierData?.entite) return [];
        return dossierData.entite.filter(entite => entite.unite_organi_id == uniteId);
    };

    const handleUpload = async (docTypeId) => {
      if (!selectedFiles[docTypeId]) return;

      setUploadStates(prev => ({
        ...prev,
        [docTypeId]: { status: 'uploading' }
      }));

      try {
        const expirationDate = documentExpirations[docTypeId] || 
          new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const formData = new FormData();
        formData.append('file_uploaded', selectedFiles[docTypeId]);
        formData.append('type_de_document_id', docTypeId);
        formData.append('dossier_id', id);
        formData.append('date_d_expiration', expirationDate);
        formData.append('note_d_observation', documentNotes[docTypeId] || '');

        const response = await axiosClient.post('/api/post-public-img', formData, {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

        setUploadStates(prev => ({
          ...prev,
          [docTypeId]: { 
            status: 'success', 
            message: response.data.message || 'Upload successful!',
            url: response.data.url 
          }
        }));

        fetchDossierData();
      
        setSelectedFiles(prev => {
          const newState = {...prev};
          delete newState[docTypeId];
          return newState;
        });

      } catch (error) {
        let errorMessage = 'Upload failed';
        let errorDetails = {};

        if (error.response) {
          errorMessage = error.response.data?.message || errorMessage;
          if (error.response.data?.errors) {
            errorDetails = error.response.data.errors;
          } else if (error.response.data?.error) {
            errorDetails = { error: error.response.data.error };
          }
        } else if (error.request) {
          errorMessage = 'No response from server';
        } else {
          errorMessage = error.message;
        }

        setUploadStates(prev => ({
          ...prev,
          [docTypeId]: { 
            status: 'error', 
            message: errorMessage,
            errors: errorDetails
          }
        }));
      }
    }

    const handleFileChange = (docTypeId, e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFiles(prev => ({
            ...prev,
            [docTypeId]: file
            }));
        }
    };

    const handleNoteChange = (docTypeId, value) => {
        setDocumentNotes(prev => ({
            ...prev,
            [docTypeId]: value
        }));
    };

    const handleExpirationChange = (docTypeId, value) => {
        setDocumentExpirations(prev => ({
            ...prev,
            [docTypeId]: value
        }));
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
        
        // Validate the field
        const error = validateField(fieldName, value);
        setErrors(prev => ({
            ...prev,
            [fieldName]: error
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

    // Validate the entire form before submission
    const validateForm = (section) => {
        let isValid = true;
        const newErrors = {};
        
        // Validate all fields in this section
        Object.keys(modifiedFields).forEach(field => {
            if (field.startsWith(section + '_')) {
                const error = validateField(field, modifiedFields[field]);
                newErrors[field] = error;
                if (error) isValid = false;
            }
        });
        
        setErrors(prev => ({
            ...prev,
            ...newErrors
        }));
        
        return isValid;
    };

    const saveSectionChanges = async (section) => {
      // Validate the form before submission
      if (!validateForm(section)) {
          return;
      }
      
      try {
          const changesToSave = {};
          const changesList = [];
          
          // Collect all changes for this section
          Object.keys(modifiedFields).forEach(key => {
              if (key.startsWith(section + '_')) {
                  // Map frontend field names to backend field names
                  const backendFieldName = key
                      .replace('affectation_affectation_id', 'affectation_id')
                      .replace('gradeEntite_grade_id', 'grade_id')
                      .replace('gradeEntite_entite_id', 'entite_id');
                  
                  changesToSave[backendFieldName] = modifiedFields[key];
                  
                  changesList.push({
                      field: key.replace(section + '_', ''),
                      oldValue: dossierData.dossier[key.split('_').slice(1).join('_')] || 
                               (dossierData.dossier.fonctionnaire && dossierData.dossier.fonctionnaire[key.split('_').slice(1).join('_')]) || 
                               (dossierData.dossier.fonctionnaire?.user && dossierData.dossier.fonctionnaire.user[key.split('_').slice(1).join('_')]) || 
                               (dossierData.dossier.grade && dossierData.dossier.grade[key.split('_').slice(1).join('_')]) || 
                               (dossierData.dossier.grade?.corp && dossierData.dossier.grade.corp[key.split('_').slice(1).join('_')]) || 
                               (dossierData.dossier.entite && dossierData.dossier.entite[key.split('_').slice(1).join('_')]) || 
                               (dossierData.dossier.entite?.unite_organi && dossierData.dossier.entite.unite_organi[key.split('_').slice(1).join('_')]) ||
                               (dossierData.dossier.affectation && dossierData.dossier.affectation[key.split('_').slice(1).join('_')]),
                      newValue: modifiedFields[key]
                  });
              }
          });
  
          // Create alert message showing changes
          const alertMessage = changesList.map(change => 
              `Champ: ${change.field}\nAncienne valeur: ${change.oldValue || 'Non défini'}\nNouvelle valeur: ${change.newValue}`
          ).join('\n\n');
  
          // Show confirmation dialog
          const userConfirmed = window.confirm(
              `Vous êtes sur le point de modifier la section "${section}":\n\n${alertMessage}\n\nConfirmer les modifications?`
          );
  
          if (!userConfirmed) {
              return; // User canceled the operation
          }
  
          // For caractéristiques, ensure Tiroir is uppercase and Armoire is letters only
          if (section === 'caracteristiques') {
              if (changesToSave.caracteristiques_tiroir) {
                  changesToSave.caracteristiques_tiroir = changesToSave.caracteristiques_tiroir.toUpperCase();
              }
              if (changesToSave.caracteristiques_armoire) {
                  changesToSave.caracteristiques_armoire = changesToSave.caracteristiques_armoire.replace(/[^A-Za-z]/g, '');
              }
          }


          const updateData = await axiosClient.put(`/api/update_details/${id}`, changesToSave);
              
          await fetchDossierData();
          
          setSectionChanges(prev => ({
              ...prev,
              [section]: false
          }));
          setEditMode(prev => ({
              ...prev,
              [section]: false
          }));
      
          const newModifiedFields = {...modifiedFields};
          Object.keys(newModifiedFields).forEach(key => {
              if (key.startsWith(section + '_')) {
                  delete newModifiedFields[key];
              }
          });
          setModifiedFields(newModifiedFields);
          
          alert('Modifications enregistrées avec succès!');
          
      } catch (err) {
          console.error("Failed to save changes:", err);
          alert(`Échec de l'enregistrement: ${err.message || "Veuillez réessayer"}`);
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
        
        // Clear errors for this section
        const newErrors = {...errors};
        Object.keys(newErrors).forEach(key => {
            if (key.startsWith(section + '_')) {
                delete newErrors[key];
            }
        });
        setErrors(newErrors);
        
        // Mark section as having no changes
        setSectionChanges(prev => ({
            ...prev,
            [section]: false
        }));
    };

    const addSubDoc = (id) => {
        alert(id)
    }

    const handleDownload = async (id) => {
      try {
        const response = await axiosClient.post(
          "/api/download-public-img",
          { id },
          { responseType: "blob" }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));

        const link = document.createElement("a");
        link.href = url;

        let fileName = dossierData.dossier.fonctionnaire.user.nom_fr + "_" + dossierData.dossier.fonctionnaire.user.prenom_fr + "_download.pdf"; 

        link.setAttribute("download", fileName);

        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
      }
    };

    // Helper component for error display
    const ErrorMessage = ({ error }) => (
        error && (
            <div className="flex items-center text-red-500 text-sm mt-1">
                <FaExclamationTriangle className="mr-1" />
                {error}
            </div>
        )
    );

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
    const currentCorpsId = modifiedFields['gradeEntite_corps'] !== undefined ? 
        dossierData.corps.find(c => c.nom_de_corps === modifiedFields['gradeEntite_corps'])?.id : 
        dossier.grade.corp.id;
    const currentUniteId = modifiedFields['gradeEntite_unite_organi'] !== undefined ? 
        dossierData.unit.find(u => u.nomUnite === modifiedFields['gradeEntite_unite_organi'])?.id : 
        dossier.entite.unite_organi.id;
    
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
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.fonctionnaire_nom_fr ? 'border-red-500' : ''}`}
                            />
                            <ErrorMessage error={errors.fonctionnaire_nom_fr} />
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
                                className={`w-full p-2 border rounded text-right ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.fonctionnaire_nom_ar ? 'border-red-500' : ''}`}
                                dir="rtl"
                            />
                            <ErrorMessage error={errors.fonctionnaire_nom_ar} />
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
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.fonctionnaire_prenom_fr ? 'border-red-500' : ''}`}
                            />
                            <ErrorMessage error={errors.fonctionnaire_prenom_fr} />
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
                                className={`w-full p-2 border rounded text-right ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.fonctionnaire_prenom_ar ? 'border-red-500' : ''}`}
                                dir="rtl"
                            />
                            <ErrorMessage error={errors.fonctionnaire_prenom_ar} />
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
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.fonctionnaire_email ? 'border-red-500' : ''}`}
                            />
                            <ErrorMessage error={errors.fonctionnaire_email} />
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
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.fonctionnaire_telephone ? 'border-red-500' : ''}`}
                            />
                            <ErrorMessage error={errors.fonctionnaire_telephone} />
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
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.fonctionnaire_date_de_naissance ? 'border-red-500' : ''}`}
                            />
                            <ErrorMessage error={errors.fonctionnaire_date_de_naissance} />
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
                                className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.fonctionnaire_adresse ? 'border-red-500' : ''}`}
                            />
                            <ErrorMessage error={errors.fonctionnaire_adresse} />
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">Statut</label>
                          <select
                            value={modifiedFields['fonctionnaire_statut_id'] ?? dossier.fonctionnaire?.statut?.id ?? ''}
                            onChange={(e) => {
                              const selectedStatus = dossierData?.statut?.find(s => s.id.toString() === e.target.value);
                              handleInputChange('fonctionnaire_statut_id', e.target.value, 'fonctionnaire');
                              if (selectedStatus) {
                                handleInputChange('fonctionnaire_statut', selectedStatus.nom_statut, 'fonctionnaire');
                              }
                            }}
                            disabled={!editMode.fonctionnaire}
                            className={`w-full p-2 border rounded ${editMode.fonctionnaire ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.fonctionnaire_statut_id ? 'border-red-500' : ''}`}
                          >
                            <option value="">Sélectionner un statut</option>
                            {dossierData?.statut?.map((statutItem) => (
                              <option key={statutItem.id} value={statutItem.id}>
                                {statutItem.nom_statut || `Statut ${statutItem.id}`}
                              </option>
                            ))}
                          </select>
                          <ErrorMessage error={errors.fonctionnaire_statut_id} />
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

                {/* Affectation Section */}
{/* Affectation Section */}
<div className="bg-white rounded-lg p-6 border border-gray-200 relative">
    <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
            <FaMapMarkerAlt className="text-blue-500 mr-2 text-xl" />
            <h2 className="text-xl font-semibold">Affectation</h2>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={() => toggleEditMode('affectation')}
                className={`flex items-center px-3 py-1 rounded transition ${editMode.affectation ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
                {editMode.affectation ? <FaUnlock className="mr-1" /> : <FaEdit className="mr-1" />}
                {editMode.affectation ? 'Verrouiller' : 'Modifier'}
            </button>
            {sectionChanges.affectation && (
                <>
                    <button 
                        onClick={() => resetSectionChanges('affectation')}
                        className="flex items-center bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                    >
                        <FaUndo className="mr-1" /> Annuler
                    </button>
                    <button 
                        onClick={() => saveSectionChanges('affectation')}
                        className="flex items-center bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                    >
                        <FaSave className="mr-1" /> Enregistrer
                    </button>
                </>
            )}
        </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div>
            <label className="block text-gray-600 mb-1">Lieu d'affectation</label>
            {!editMode.affectation ? (
                <input
                    type="text"
                    value={dossier.affectation.nom_d_affectation + 
                          (dossier.affectation.deleted_at ? " (Supprimé)" : "")}
                    readOnly
                    className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                />
            ) : (
                <>
                    <select
                        value={modifiedFields['affectation_affectation_id'] !== undefined ? 
                            modifiedFields['affectation_affectation_id'] : 
                            dossier.affectation.id}
                        onChange={(e) => handleInputChange('affectation_affectation_id', e.target.value, 'affectation')}
                        className={`w-full p-2 border rounded ${editMode.affectation ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.affectation_affectation_id ? 'border-red-500' : ''}`}
                    >
                        <option value="">Sélectionner une affectation</option>
                        {/* Show current affectation even if deleted */}
                        <option 
                            value={dossier.affectation.id}
                            disabled={dossier.affectation.deleted_at}
                        >
                            {dossier.affectation.nom_d_affectation}
                            {dossier.affectation.deleted_at && " (Supprimé)"}
                        </option>
                     
                        {dossierData.affectation
                            .filter(aff => !aff.deleted_at && aff.id !== dossier.affectation.id)
                            .map((aff) => (
                                <option key={aff.id} value={aff.id}>{aff.nom_d_affectation}</option>
                            ))}
                    </select>
                    {dossier.affectation.deleted_at && (
                        <div className="text-yellow-600 text-sm mt-1">
                            Cette affectation a été supprimée. Veuillez en sélectionner une autre.
                        </div>
                    )}
                    <ErrorMessage error={errors.affectation_affectation_id} />
                </>
            )}
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

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
            <label className="block text-gray-600 mb-1">Matricule</label>
            <input
                type="text"
                value={modifiedFields['caracteristiques_matricule'] !== undefined ? 
                    modifiedFields['caracteristiques_matricule'] : 
                    dossier.matricule}
                onChange={(e) => handleInputChange('caracteristiques_matricule', e.target.value, 'caracteristiques')}
                readOnly={!editMode.caracteristiques}
                className={`w-full p-2 border rounded ${editMode.caracteristiques ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.caracteristiques_matricule ? 'border-red-500' : ''}`}
            />
            <ErrorMessage error={errors.caracteristiques_matricule} />
        </div>
        <div>
            <label className="block text-gray-600 mb-1">Couleur</label>
            <div className="flex items-center">
                <input
                    type="color"
                    value={modifiedFields['caracteristiques_couleur']?.startsWith('#') ? 
                        modifiedFields['caracteristiques_couleur'] : 
                        (dossier.couleur?.startsWith('#') ? dossier.couleur : '#000000')}
                    onChange={(e) => handleInputChange('caracteristiques_couleur', e.target.value, 'caracteristiques')}
                    readOnly={!editMode.caracteristiques}
                    className={`h-10 w-10 p-1 border rounded ${editMode.caracteristiques ? 'cursor-pointer border-blue-300' : 'border-gray-300'}`}
                />
                <span className="ml-2 text-sm text-gray-600">
                    {modifiedFields['caracteristiques_couleur'] !== undefined ? 
                        modifiedFields['caracteristiques_couleur'] : 
                        (dossier.couleur || 'Non défini')}
                </span>
            </div>
            <ErrorMessage error={errors.caracteristiques_couleur} />
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
                className={`w-full p-2 border rounded ${editMode.caracteristiques ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.caracteristiques_tiroir ? 'border-red-500' : ''}`}
            />
            <ErrorMessage error={errors.caracteristiques_tiroir} />
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
                className={`w-full p-2 border rounded ${editMode.caracteristiques ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.caracteristiques_armoire ? 'border-red-500' : ''}`}
            />
            <ErrorMessage error={errors.caracteristiques_armoire} />
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
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Corps Field */}
        <div>
            <label className="block text-gray-600 mb-1">Corps</label>
            <select
                value={modifiedFields['gradeEntite_corps_id'] ?? dossier.grade.corp.id}
                onChange={(e) => {
                    handleInputChange('gradeEntite_corps_id', e.target.value, 'gradeEntite');
                    handleInputChange('gradeEntite_grade_id', '', 'gradeEntite');
                }}
                disabled={!editMode.gradeEntite}
                className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.gradeEntite_corps_id ? 'border-red-500' : ''}`}
            >
                <option value="">Sélectionner un corps</option>
                {dossierData.corps.map((corp) => (
                    <option key={corp.id} value={corp.id}>{corp.nom_de_corps}</option>
                ))}
            </select>
            <ErrorMessage error={errors.gradeEntite_corps_id} />
        </div>

        {/* Grade Field */}
        <div>
            <label className="block text-gray-600 mb-1">Grade</label>
            <select
                value={modifiedFields['gradeEntite_grade_id'] ?? dossier.grade.id}
                onChange={(e) => handleInputChange('gradeEntite_grade_id', e.target.value, 'gradeEntite')}
                disabled={!editMode.gradeEntite || !(modifiedFields['gradeEntite_corps_id'] ?? dossier.grade.corp.id)}
                className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.gradeEntite_grade_id ? 'border-red-500' : ''}`}
            >
                <option value="">Sélectionner un grade</option>
                {/* Show current grade even if deleted */}
                {dossier.grade.deleted_at && (
                    <option 
                        value={dossier.grade.id}
                        disabled
                        className="text-gray-400"
                    >
                        {dossier.grade.nom_grade} (Supprimé - Non sélectionnable)
                    </option>
                )}
                
                {/* Show other grades for the selected corps */}
                {getGradesByCorpsId(
                    modifiedFields['gradeEntite_corps_id'] ?? dossier.grade.corp.id
                )
                .filter(grade => !grade.deleted_at) // Only show non-deleted grades
                .map((grade) => (
                    <option 
                        key={grade.id} 
                        value={grade.id}
                        disabled={grade.deleted_at}
                    >
                        {grade.nom_grade}
                    </option>
                ))}
            </select>
            {dossier.grade.deleted_at && (
                <div className="text-yellow-600 text-sm mt-1">
                    Le grade actuel a été supprimé. Veuillez sélectionner un nouveau grade valide.
                </div>
            )}
            <ErrorMessage error={errors.gradeEntite_grade_id} />
        </div>

        {/* Unité Organisationnelle Field */}
        <div>
            <label className="block text-gray-600 mb-1">Unité Organisationnelle</label>
            <select
                value={modifiedFields['gradeEntite_unite_organi_id'] ?? dossier.entite.unite_organi.id}
                onChange={(e) => {
                    handleInputChange('gradeEntite_unite_organi_id', e.target.value, 'gradeEntite');
                    handleInputChange('gradeEntite_entite_id', '', 'gradeEntite');
                }}
                disabled={!editMode.gradeEntite}
                className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.gradeEntite_unite_organi_id ? 'border-red-500' : ''}`}
            >
                <option value="">Sélectionner une unité</option>
                {dossierData.unit.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.nomUnite}</option>
                ))}
            </select>
            <ErrorMessage error={errors.gradeEntite_unite_organi_id} />
        </div>

        {/* Entité Field */}
        <div>
            <label className="block text-gray-600 mb-1">Entité</label>
            {!editMode.gradeEntite ? (
                <div>
                    <input
                        type="text"
                        value={dossier.entite.nom_entite + 
                              (dossier.entite.deleted_at ? " (Supprimé)" : "")}
                        readOnly
                        className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                    />
                    {dossier.entite.deleted_at && (
                        <div className="text-yellow-600 text-sm mt-1">
                            Cette entité a été supprimée. Veuillez en sélectionner une autre.
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <select
                        value={modifiedFields['gradeEntite_entite_id'] ?? dossier.entite.id}
                        onChange={(e) => handleInputChange('gradeEntite_entite_id', e.target.value, 'gradeEntite')}
                        disabled={!editMode.gradeEntite || !(modifiedFields['gradeEntite_unite_organi_id'] ?? dossier.entite.unite_organi.id)}
                        className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.gradeEntite_entite_id ? 'border-red-500' : ''}`}
                    >
                        {/* Current entité (always shown but disabled if deleted) */}
                        <option 
                            value={dossier.entite.id}
                            disabled={dossier.entite.deleted_at}
                            className={dossier.entite.deleted_at ? 'text-gray-400' : ''}
                        >
                            {dossier.entite.nom_entite}
                            {dossier.entite.deleted_at && " (Supprimé - Non sélectionnable)"}
                        </option>
                        
                        {getEntitesByUniteId(
                            modifiedFields['gradeEntite_unite_organi_id'] ?? dossier.entite.unite_organi.id
                        )
                        .filter(entite => !entite.deleted_at && entite.id !== dossier.entite.id)
                        .map((entite) => (
                            <option key={entite.id} value={entite.id}>{entite.nom_entite}</option>
                        ))}
                    </select>
                    {dossier.entite.deleted_at && (
                        <div className="text-yellow-600 text-sm mt-1">
                            L'entité actuelle a été supprimée. Veuillez sélectionner une nouvelle entité valide.
                        </div>
                    )}
                    <ErrorMessage error={errors.gradeEntite_entite_id} />
                </>
            )}
        </div>
    </div>
</div>

{/* Documents Section */}
<div className="bg-white rounded-lg p-6 border border-gray-200">
    <div className="flex items-center mb-4">
        <FaFile className="text-blue-500 mr-2 text-xl" />
        <h2 className="text-xl font-semibold">Documents</h2>
    </div>
    
    {/* Documents List - Filtered to show only documents from grade's type_de_documents */}
    {dossier.documents
        .filter(document => 
            dossier.grade.type_de_documents?.some(
                docType => docType.id === document.type_de_document_id
            )
        )
        .length > 0 && (
        <div className="space-y-4 mb-8">
            {dossier.documents
                .filter(document => 
                    dossier.grade.type_de_documents?.some(
                        docType => docType.id === document.type_de_document_id
                    )
                )
                .map((document) => (
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
                                <button onClick={() => addSubDoc(document.id)}>
                                    <FaPlus />
                                </button>
                                <button 
                                    onClick={() => window.open(`http://localhost:8000/storage/${document.chemin_contenu_document}`, '_blank')}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Voir"
                                >
                                    <FaEye />
                                </button>
                                <button 
                                    onClick={() => handleDownload(document.id)}
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                    title="Télécharger"
                                >
                                    <FaDownload />
                                </button>
                                <button 
                                    onClick={async () => {
                                        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document?")) {
                                            await axiosClient.post('/api/delete-public-img', {"id": document.id})
                                            fetchDossierData();
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
            ))}
        </div>
    )}
 {/* Required Documents Section */}
 <div className="mt-4">
        <div className="flex items-center mb-4">
            <FaFileAlt className="text-blue-500 mr-2 text-xl" />
            <h2 className="text-xl font-semibold">Documents Requis</h2>
        </div>
        
        {/* Case 1: No documents defined for this grade */}
        {(!dossier.grade.type_de_documents || dossier.grade.type_de_documents.length === 0) && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-600">Aucun document requis défini pour ce grade</p>
            </div>
        )}

        {/* Case 3: Show missing documents */}
        {dossier.grade.type_de_documents && dossier.grade.type_de_documents.length > 0 && (
            <div className="space-y-4">
                {dossier.grade.type_de_documents
                    .filter(docType => docType.obligatoire && 
                        !dossier.documents.some(doc => doc.type_de_document_id === docType.id))
                    .map(docType => {
                        const uploadState = uploadStates[docType.id] || {};
                        const selectedFile = selectedFiles[docType.id];
                        
                        return (
                            <div key={docType.id} className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <div className="flex items-center text-red-600 mb-2">
                                    <FaExclamationTriangle className="mr-2" />
                                    <span className="font-medium">{docType.nom_de_type}</span>
                                    <span className="text-sm text-red-500 ml-2">({docType.type_general})</span>
                                </div>

                                {uploadState.status === 'error' && (
                                    <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                                        {uploadState.message}
                                    </div>
                                )}
                                
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <label 
                                            htmlFor={`upload-${docType.id}`}
                                            className="flex-1 bg-white border border-blue-300 rounded-lg p-2 hover:bg-blue-50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500 truncate">
                                                    {selectedFile ? selectedFile.name : "Sélectionner un fichier..."}
                                                </span>
                                                <span className="text-blue-600 text-sm font-medium">
                                                    Parcourir
                                                </span>
                                            </div>
                                        </label>
                                        
                                        <input
                                            id={`upload-${docType.id}`}
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(docType.id, e)}
                                        />
                                        
                                        <button 
                                            className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                                ${!selectedFile ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 
                                                uploadState.status === 'uploading' ? 'bg-blue-400 text-white' : 
                                                'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                            onClick={() => handleUpload(docType.id)}
                                            disabled={!selectedFile || uploadState.status === 'uploading'}
                                        >
                                            {uploadState.status === 'uploading' ? (
                                                <>
                                                    <FaSpinner className="animate-spin inline mr-1" />
                                                    Envoi...
                                                </>
                                            ) : (
                                                <>
                                                    <FaUpload className="inline mr-1" />
                                                    Envoyer
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Note d'observation</label>
                                            <textarea
                                                value={documentNotes[docType.id] || ''}
                                                onChange={(e) => handleNoteChange(docType.id, e.target.value)}
                                                className="w-full p-2 border rounded border-gray-300"
                                                placeholder="Ajouter une note..."
                                                rows="2"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Date d'expiration</label>
                                            <input
                                                type="date"
                                                value={documentExpirations[docType.id] || ''}
                                                onChange={(e) => handleExpirationChange(docType.id, e.target.value)}
                                                className="w-full p-2 border rounded border-gray-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }


{dossier.grade.type_de_documents.filter(docType => docType.obligatoire).length > 0 &&
                    dossier.grade.type_de_documents.filter(docType => docType.obligatoire && 
                        !dossier.documents.some(doc => doc.type_de_document_id === docType.id))
                    .length === 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-green-600 flex items-center">
                                <FaCheckCircle className="mr-2" />
                                Tous les documents obligatoires sont présents
                            </p>
                        </div>
                    )
                }
            </div>
        )}
    </div>
</div>

                {/* Avertissements Section */}
                {dossier.avertissements && dossier.avertissements.length > 0 ? (
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
                ) : (
                    <div className="bg-white rounded-lg p-6 border border-gray-200 mt-6">
                        <div className="flex items-center mb-4">
                            <FaExclamationTriangle className="text-gray-400 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold text-gray-600">Avertissements</h2>
                        </div>
                        <p className="text-gray-500">Aucun avertissement trouvé</p>
                    </div>
                )}

                {/* Conseil de Disciplines Section */}
                {dossier.conseil_de_disciplines && dossier.conseil_de_disciplines.length > 0 ? (
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
                ) : (
                    <div className="bg-white rounded-lg p-6 border border-gray-200 mt-6">
                        <div className="flex items-center mb-4">
                            <FaGavel className="text-gray-400 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold text-gray-600">Conseil de Disciplines</h2>
                        </div>
                        <p className="text-gray-500">Aucun conseil de discipline trouvé</p>
                    </div>
                )}
            </div>
        </div>
    );
}


