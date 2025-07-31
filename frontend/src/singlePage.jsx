import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { axiosClient } from "./Api/axios";
import { 
  FaFileAlt, 
  FaCheckCircle ,
  FaBox, 
  FaFile, 
  FaFolder, 
  FaUser, 
  FaMapMarkerAlt ,
  FaIdCard, 
  FaSpinner,
  FaExclamationTriangle, 
  FaGavel, 
  FaEdit, 
  FaSave, 
  FaUndo, 
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
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedDocumentForModal, setSelectedDocumentForModal] = useState(null);
    const admin = JSON.parse(localStorage.getItem("ADMIN_INFO"))

    const {id} = useParams();
    const obj = {"id": id};

    const isArabic = (text) => {
        const arabicRegex = /^[\u0600-\u06FF\s]+$/;
        return arabicRegex.test(text);
    };

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
                // Allow any characters, not just Arabic
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

    const getGradesByCorpsId = (corpsId) => {
        if (!dossierData?.grade) return [];
        return dossierData.grade.filter(grade => grade.corp_id == corpsId);
    };

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
        const expirationDate = documentExpirations[docTypeId] || (() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 10);
  return date.toISOString().split('T')[0];
})();

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

    const handleSubDocDownload = async (subDocId) => {
        try {
          const response = await axiosClient.post(
            "/api/download-sous-doc-public-img",
            { id: subDocId },
            { responseType: "blob" }
          );
      
          const blob = new Blob([response.data]);
          const url = window.URL.createObjectURL(blob);
      
          const link = document.createElement("a");
          link.href = url;
          
          const subDoc = dossier.documents
            .flatMap(doc => doc.sub_docs)
            .find(sd => sd.id === subDocId);
          
          const fileName = subDoc 
            ? `${dossierData.dossier.fonctionnaire.user.nom_fr}_${dossierData.dossier.fonctionnaire.user.prenom_fr}_${subDoc.nom_document}.pdf` 
            : "sous_document.pdf";
          
          link.setAttribute("download", fileName);
      
          document.body.appendChild(link);
          link.click();
      
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Download failed:", error);
          alert("Échec du téléchargement: " + (error.response?.data?.message || error.message));
        }
      };


      const handleSubDocUpload = async (mainDocumentId) => {
        const fileKey = `subdoc-${mainDocumentId}`;
        const selectedFile = selectedFiles[fileKey];
        
        if (!selectedFile) {
          alert("Veuillez sélectionner un fichier");
          return;
        }
      
        setUploadStates(prev => ({
          ...prev,
          [fileKey]: { status: 'uploading' }
        }));
      
        try {
          const formData = new FormData();
          formData.append('selectedFile', selectedFile);
          formData.append('document_id', mainDocumentId);
    
          // Find the main document for its name
          const mainDocument = dossierData.dossier.documents.find(doc => doc.id === mainDocumentId);
          const mainDocumentName = mainDocument?.type_de_document?.nom_de_type || 'Document inconnu';
      
          const response = await axiosClient.post('/api/post-sous-doc-public-img', formData, {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
    
          // Get the sub-document name from the response
          const subDocName = response.data?.data?.nom_document || 
                            selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove file extension
    
          // Log the action to tracer
          await axiosClient.post("/api/tracer-action-table", {
            admin_id: admin?.admin?.id,
            dossier_id: id,
            type_de_transaction: 2,
            details_de_transaction: `l'ajout du sous-document "${subDocName}" pour le document "${mainDocumentName}" du dossier `
          });
          
          setUploadStates(prev => ({
            ...prev,
            [fileKey]: { 
              status: 'success', 
              message: response.data.message || 'Upload successful!',
              data: response.data
            }
          }));
      
          await fetchDossierData();
          setSelectedFiles(prev => {
            const newState = {...prev};
            delete newState[fileKey];
            return newState;
          });
      
        } catch (error) {
          let errorMessage = 'Échec du téléchargement';
          let errorData = null;
          
          if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
            errorData = error.response.data;
          } else if (error.request) {
            errorMessage = 'Pas de réponse du serveur';
          } else {
            errorMessage = error.message;
          }
      
          setUploadStates(prev => ({
            ...prev,
            [fileKey]: { 
              status: 'error', 
              message: errorMessage,
              data: errorData
            }
          }));
        }
    };

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
        if (!validateForm(section)) {
          return;
        }
      
        try {
          // Prepare the request data with explicit section
          const requestData = {
            section: section,
            ...Object.keys(modifiedFields)
              .filter(key => key.startsWith(`${section}_`))
              .reduce((acc, key) => {
                // Remove section prefix from field names
                const fieldName = key.replace(`${section}_`, '');
                acc[fieldName] = modifiedFields[key];
                return acc;
              }, {})
          };
      
          // Format specific fields if needed
          if (section === 'caracteristiques') {
            if (requestData.tiroir) {
              requestData.tiroir = requestData.tiroir.toString();
            }
            if (requestData.armoire) {
              requestData.armoire = requestData.armoire.replace(/[^A-Za-z]/g, '');
            }
          }
      
          // Show confirmation with changes
          const changesList = Object.keys(requestData)
            .filter(key => key !== 'section')
            .map(key => ({
              field: key,
              oldValue: dossierData.dossier[key] || 
                       (dossierData.dossier.fonctionnaire?.user?.[key]) ||
                       (dossierData.dossier.fonctionnaire?.[key]) ||
                       (dossierData.dossier.grade?.[key]) ||
                       (dossierData.dossier.entite?.[key]) ||
                       (dossierData.dossier.affectation?.[key]),
              newValue: requestData[key]
            }));
      
          const alertMessage = changesList.map(change => 
            `Champ: ${change.field}\nAncienne valeur: ${change.oldValue || 'Non défini'}\nNouvelle valeur: ${change.newValue}`
          ).join('\n\n');
      
          const userConfirmed = window.confirm(
            `Vous êtes sur le point de modifier la section "${section}":\n\n${alertMessage}\n\nConfirmer les modifications?`
          );
      
          if (!userConfirmed) {
            return;
          }
      
          const response = await axiosClient.put(`/api/update_details/${id}`, requestData);


          await axiosClient.post("/api/tracer-action-table", {
            admin_id: admin?.admin?.id,
            dossier_id: id,
            type_de_transaction: 2,
            details_de_transaction: `Modification de la section ${section} du dossier`
          });
      
          await fetchDossierData();
          setSectionChanges(prev => ({ ...prev, [section]: false }));
          setEditMode(prev => ({ ...prev, [section]: false }));
      
         
          setModifiedFields(prev => {
            const newFields = { ...prev };
            Object.keys(newFields)
              .filter(key => key.startsWith(`${section}_`))
              .forEach(key => delete newFields[key]);
            return newFields;
          });
      
          alert('Modifications enregistrées avec succès!');
      
        } catch (err) {
          console.error("Failed to save changes:", err);
          alert(`Échec de l'enregistrement: ${err.response?.data?.message || err.message || "Veuillez réessayer"}`);
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

    const addSubDoc = (documentId) => {
        const document = dossier.documents.find(doc => doc.id === documentId);
        if (document) {
          setSelectedDocumentForModal(document);
          setShowDocumentModal(true);
        }
      };
      
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
</div>{/* Grade and Entité Section */}
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
            <div className="flex items-center mb-1">
                <label className="block text-gray-600">Corps</label>
                {dossier.grade.corp.deleted_at && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Supprimé
                    </span>
                )}
            </div>
            {!editMode.gradeEntite ? (
                <input
                    type="text"
                    value={dossier.grade.corp.nom_de_corps}
                    readOnly
                    className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                />
            ) : (
                <>
                    <select
                        value={modifiedFields['gradeEntite_corps_id'] ?? dossier.grade.corp.id}
                        onChange={(e) => {
                            handleInputChange('gradeEntite_corps_id', e.target.value, 'gradeEntite');
                            handleInputChange('gradeEntite_grade_id', '', 'gradeEntite');
                        }}
                        className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.gradeEntite_corps_id ? 'border-red-500' : ''}`}
                    >
                        {/* Always show current corps as first option */}
                        <option value={dossier.grade.corp.id}>
                            {dossier.grade.corp.nom_de_corps}
                            {dossier.grade.corp.deleted_at && " (Supprimé)"}
                        </option>
                        
                        {/* Show separator if there are other options */}
                        {dossierData.corps.filter(c => !c.deleted_at && c.id !== dossier.grade.corp.id).length > 0 && (
                            <option disabled>──────────</option>
                        )}
                        
                        {/* Show other non-deleted corps */}
                        {dossierData.corps
                            .filter(corp => !corp.deleted_at && corp.id !== dossier.grade.corp.id)
                            .map((corp) => (
                                <option key={corp.id} value={corp.id}>
                                    {corp.nom_de_corps}
                                </option>
                            ))}
                    </select>
                    {dossier.grade.corp.deleted_at && editMode.gradeEntite && (
                        <div className="text-yellow-600 text-sm mt-1">
                            Le corps actuel a été supprimé. Veuillez sélectionner un nouveau corps valide.
                        </div>
                    )}
                    <ErrorMessage error={errors.gradeEntite_corps_id} />
                </>
            )}
        </div>

        {/* Grade Field */}
        <div>
            <div className="flex items-center mb-1">
                <label className="block text-gray-600">Grade</label>
                {dossier.grade.deleted_at && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Supprimé
                    </span>
                )}
            </div>
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
                    >
                        {dossier.grade.nom_grade} (Supprimé)
                    </option>
                )}
                
                {/* Show other grades for the selected corps */}
                {getGradesByCorpsId(
                    modifiedFields['gradeEntite_corps_id'] ?? dossier.grade.corp.id
                )
                .filter(grade => !grade.deleted_at)
                .map((grade) => (
                    <option key={grade.id} value={grade.id}>
                        {grade.nom_grade}
                    </option>
                ))}
            </select>
            {dossier.grade.deleted_at && editMode.gradeEntite && (
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
            <div className="flex items-center mb-1">
                <label className="block text-gray-600">Entité</label>
                {dossier.entite.deleted_at && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Supprimé
                    </span>
                )}
            </div>
            <select
                value={modifiedFields['gradeEntite_entite_id'] ?? dossier.entite.id}
                onChange={(e) => handleInputChange('gradeEntite_entite_id', e.target.value, 'gradeEntite')}
                disabled={!editMode.gradeEntite || !(modifiedFields['gradeEntite_unite_organi_id'] ?? dossier.entite.unite_organi.id)}
                className={`w-full p-2 border rounded ${editMode.gradeEntite ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'} ${errors.gradeEntite_entite_id ? 'border-red-500' : ''}`}
            >
                <option value="">Sélectionner une entité</option>
                {/* Show current entité even if deleted */}
                {dossier.entite.deleted_at && (
                    <option 
                        value={dossier.entite.id}
                        disabled
                    >
                        {dossier.entite.nom_entite} (Supprimé)
                    </option>
                )}
                
                {/* Show other entités for the selected unit */}
                {getEntitesByUniteId(
                    modifiedFields['gradeEntite_unite_organi_id'] ?? dossier.entite.unite_organi.id
                )
                .filter(entite => !entite.deleted_at)
                .map((entite) => (
                    <option key={entite.id} value={entite.id}>
                        {entite.nom_entite}
                    </option>
                ))}
            </select>
            {dossier.entite.deleted_at && editMode.gradeEntite && (
                <div className="text-yellow-600 text-sm mt-1">
                    L'entité actuelle a été supprimée. Veuillez sélectionner une nouvelle entité valide.
                </div>
            )}
            <ErrorMessage error={errors.gradeEntite_entite_id} />
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
                    <div className="flex items-center h-14 w-full bg-green-50 border border-green-200 rounded-lg px-4 hover:bg-green-100 transition-colors">
                        <div className="flex flex-1 justify-between items-center">
                            <div className="flex flex-col md:flex-row md:space-x-6 md:items-center">
                                <span className="font-medium text-green-800">{document.type_de_document.nom_de_type}</span>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                    <span>Obligatoire: {document.type_de_document.obligatoire ? 'Oui' : 'Non'}</span>
                                    <span>Soumis le: {document.date_de_soumission}</span>
                                    {(() => {
  const expirationDate = new Date(document.date_d_expiration);
  const today = new Date();
  const fiveYearsFromNow = new Date();
  fiveYearsFromNow.setFullYear(today.getFullYear() + 5);
  return expirationDate > fiveYearsFromNow ? (
    <span></span>
  ) : (
    <span>Expire le: {document.date_d_expiration}</span>
  );
})()}
                                </div>
                            </div>
                            <div className="flex space-x-2">
<button 
  onClick={() => addSubDoc(document.id)}
  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
  title="Add sub-document"
>
  <FaPlus />
</button>
                                <button 
                                
                                    onClick={ async () =>
                                        { 
                                            await axiosClient.post("/api/tracer-action-table", {
                                                admin_id: admin?.admin?.id,
                                                dossier_id: id,
                                                type_de_transaction : 2 ,
                                                details_de_transaction: `la consultation du document ${ document.type_de_document.nom_de_type } du dossier `,
                                              });
                                            window.open(`http://localhost:8000/storage/${document.chemin_contenu_document}`, '_blank')} }
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Voir"
                                >
                                    <FaEye />
                                </button>
                                <button 
                                    onClick={ async () => {handleDownload(document.id) 
                                        await axiosClient.post("/api/tracer-action-table", {
                                            admin_id: admin?.admin?.id,
                                            dossier_id: id,
                                            type_de_transaction : 2 ,
                                            details_de_transaction: `le telechargement du document ${ document.type_de_document.nom_de_type } du dossier `,
                                          });
                                    }}
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                    title="Télécharger"
                                >
                                    <FaDownload />
                                </button>
                                <button 
                                    onClick={async () => {
                                        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document?")) {
                                            await axiosClient.post('/api/delete-public-img', {"id": document.id})
                                            await axiosClient.post("/api/tracer-action-table", {
                                                admin_id: admin?.admin?.id,
                                                dossier_id: id,
                                                type_de_transaction : 2 ,
                                                details_de_transaction: `la suppression du document ${ document.type_de_document.nom_de_type } du dossier `,
                                              });
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
                                                onClick={ async () => {
                                                    await axiosClient.post("/api/tracer-action-table", {
                                                        admin_id: admin?.admin?.id,
                                                        dossier_id: id,
                                                        type_de_transaction : 2 ,
                                                        details_de_transaction: `le consultation du sous-document ${ subDoc.nom_document } du dossier `,
                                                      });
                                                    window.open(`http://localhost:8000/storage/${subDoc.chemin_contenu_sous_document}`, '_blank')}}

                                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                                                title="Voir"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
  onClick={ async () => {
    
    await axiosClient.post("/api/tracer-action-table", {
        admin_id: admin?.admin?.id,
        dossier_id: id,
        type_de_transaction : 2 ,
        details_de_transaction: `le telechargement du sous-document ${ subDoc.nom_document } du dossier `,
      });

    handleSubDocDownload(subDoc.id)}}
  className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
  title="Télécharger"
>
  <FaDownload />
</button>
                                            <button
                                                onClick={async () => {
                                                    
                                                    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce sous-document?")) {
                                                        try {
                                                            await axiosClient.post('/api/delete-sous-doc', { id: subDoc.id });
                                                            fetchDossierData();
                                                            alert('Sous-document supprimé avec succès');
                                                        } catch (error) {
                                                            console.error('Error deleting sub-document:', error);
                                                            alert('Une erreur est survenue lors de la suppression du sous-document');
                                                        }
                                                    }
                                                    await axiosClient.post("/api/tracer-action-table", {
                                                        admin_id: admin?.admin?.id,
                                                        dossier_id: id,
                                                        type_de_transaction : 2 ,
                                                        details_de_transaction: `la suppression du sous-document ${ subDoc.nom_document } du dossier `,
                                                      });
                                                
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
        
        {(!dossier.grade.type_de_documents || dossier.grade.type_de_documents.length === 0) && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-600">Aucun document requis défini pour ce grade</p>
            </div>
        )}

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
                                            onClick={async () =>{ 
                                            
                                                await axiosClient.post("/api/tracer-action-table",{
                                                    admin_id: admin?.admin?.id,
                                                    dossier_id: id,
                                                    type_de_transaction : 2 ,
                                                    details_de_transaction: "l'ajout du document  " + docType.nom_de_type
                                                })

                                            handleUpload(docType.id)

                                    
                                            
                                            }}
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
{/* Modern Avertissements Section */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 px-6 py-4 border-b border-yellow-200">
    <div className="flex items-center">
      <div className="p-2 rounded-lg bg-yellow-100 border border-yellow-200">
        <FaExclamationTriangle className="text-yellow-600 text-xl" />
      </div>
      <h2 className="ml-3 text-xl font-semibold text-yellow-800">Avertissements</h2>
      <span className="ml-auto bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
        {dossier.avertissements?.length || 0}
      </span>
    </div>
  </div>

  <div className="p-4">
    {dossier.avertissements && dossier.avertissements.length > 0 ? (
      <div className="space-y-3">
        {dossier.avertissements.map(avertissement => (
          <div key={avertissement.id} className="group relative">
            <div className="flex items-start p-4 rounded-lg hover:bg-yellow-50 transition-colors border border-yellow-100">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center border border-yellow-200">
                  <FaExclamationTriangle className="text-yellow-500 text-sm" />
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900">
                  {avertissement.titre_d_avertissement}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {avertissement.note_d_avertissement}
                </p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span>{new Date(avertissement.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button
  onClick={async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet avertissement?")) {
      try {
        const response = await axiosClient.post("/delete-avert", { id: avertissement.id });
        if (response.data.success) {
          await axiosClient.post("/api/tracer-action-table", {
            admin_id: admin?.admin?.id,
            dossier_id: id,
            type_de_transaction: 2,
            details_de_transaction: `la suppression d'un avertissement du dossier`
          });
          fetchDossierData();
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error("Error deleting avertissement:", error);
        alert("Une erreur est survenue lors de la suppression: " + error.message);
      }
    }
  }}
  className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
  title="Supprimer"
>
  <FaTrash />
</button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <div className="mx-auto h-24 w-24 text-gray-300">
          <FaExclamationTriangle className="w-full h-full" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-500">Aucun avertissement</h3>
        <p className="mt-1 text-sm text-gray-400">Aucun avertissement n'a été enregistré pour ce dossier.</p>
      </div>
    )}
  </div>
</div>

{/* Modern Conseil de Disciplines Section */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
  <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-red-200">
    <div className="flex items-center">
      <div className="p-2 rounded-lg bg-red-100 border border-red-200">
        <FaGavel className="text-red-600 text-xl" />
      </div>
      <h2 className="ml-3 text-xl font-semibold text-red-800">Conseils de Discipline</h2>
      <span className="ml-auto bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
        {dossier.conseil_de_disciplines?.length || 0}
      </span>
    </div>
  </div>

  <div className="p-4">
    {dossier.conseil_de_disciplines && dossier.conseil_de_disciplines.length > 0 ? (
      <div className="space-y-3">
        {dossier.conseil_de_disciplines.map(conseil => (
          <div key={conseil.id} className="group relative">
            <div className="flex items-start p-4 rounded-lg hover:bg-red-50 transition-colors border border-red-100">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                  <FaGavel className="text-red-500 text-sm" />
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-baseline md:space-x-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      Séance du {new Date(conseil.date_conseil).toLocaleDateString()}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-start text-sm text-gray-600">
                        <span className="font-medium text-gray-700 mr-2">Motif:</span>
                        <span>{conseil.motif}</span>
                      </div>
                      <div className="flex items-start text-sm text-gray-600">
                        <span className="font-medium text-gray-700 mr-2">Décision:</span>
                        <span>{conseil.decision}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
  onClick={async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce conseil de discipline?")) {
      try {
        const response = await axiosClient.post("/delete-conseil", { id: conseil.id });
        if (response.data.success) {
          await axiosClient.post("/api/tracer-action-table", {
            admin_id: admin?.admin?.id,
            dossier_id: id,
            type_de_transaction: 2,
            details_de_transaction: `la suppression d'un conseil de discipline du dossier`
          });
          fetchDossierData();
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error("Error deleting conseil:", error);
        alert("Une erreur est survenue lors de la suppression: " + error.message);
      }
    }
  }}
  className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
  title="Supprimer"
>
  <FaTrash />
</button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <div className="mx-auto h-24 w-24 text-gray-300">
          <FaGavel className="w-full h-full" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-500">Aucun conseil de discipline</h3>
        <p className="mt-1 text-sm text-gray-400">Aucun conseil de discipline n'a été enregistré pour ce dossier.</p>
      </div>
    )}
  </div>
</div>
                  </div>
{/* Modal de détails du document */}
                        {showDocumentModal && selectedDocumentForModal && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div 
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
                            onClick={() => {
                                const fileKey = `subdoc-${selectedDocumentForModal.id}`;
                                setUploadStates(prev => {
                                const newState = {...prev};
                                delete newState[fileKey];
                                return newState;
                                });
                                setShowDocumentModal(false);
                            }}
                            ></div>
                            <div className="flex items-center justify-center min-h-screen p-4">
                            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10" onClick={e => e.stopPropagation()}>
                                <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">
                                    Ajouter un sous-document à : {selectedDocumentForModal.type_de_document.nom_de_type}
                                    </h3>
                                    <button 
                        onClick={() => {
                            const fileKey = `subdoc-${selectedDocumentForModal.id}`;
                            setUploadStates(prev => {
                            const newState = {...prev};
                            delete newState[fileKey];
                            return newState;
                            });
                            setShowDocumentModal(false);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                                </div>

                                {/* Informations du document */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                    <span className="font-medium">Nom :</span> {selectedDocumentForModal.type_de_document.nom_de_type}
                                    </div>
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                    <span className="font-medium">Expiration :</span> {selectedDocumentForModal.date_d_expiration}
                                    </div>
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                    <span className="font-medium">Type :</span> {selectedDocumentForModal.type_de_document.type_general}
                                    </div>
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                    <span className="font-medium">Date d'ajout :</span> {selectedDocumentForModal.date_de_soumission}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes du document principal</label>
                                    <div className="p-3 bg-gray-50 rounded border border-gray-200 min-h-[80px]">
                                    {selectedDocumentForModal.note_d_observation || 
                                        <span className="text-gray-400">Aucune note disponible pour ce document</span>}
                                    </div>
                                </div>

                                <hr className="my-4 border-gray-200" />

                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-700">Télécharger un nouveau sous-document</h4>
                                    
                                    <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sélectionner un fichier</label>
                                    <div className="flex items-center gap-3">
                                        <label 
                                        htmlFor={`subdoc-upload-${selectedDocumentForModal.id}`}
                                        className="flex-1 bg-white border border-blue-300 rounded-lg p-2 hover:bg-blue-50 transition-colors cursor-pointer"
                                        >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500 truncate">
                                            {selectedFiles[`subdoc-${selectedDocumentForModal.id}`] ? 
                                                selectedFiles[`subdoc-${selectedDocumentForModal.id}`].name : 
                                                "Aucun fichier sélectionné"}
                                            </span>
                                            <span className="text-blue-600 text-sm font-medium">
                                            Parcourir
                                            </span>
                                        </div>
                                        </label>
                                        <input
                                        id={`subdoc-upload-${selectedDocumentForModal.id}`}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(`subdoc-${selectedDocumentForModal.id}`, e)}
                                        />
                                    </div>
                                    </div>
                                    <div className="flex justify-end">
                                    <button
                        onClick={() => handleSubDocUpload(selectedDocumentForModal.id)}
                        className={`flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium transition-colors
                            ${!selectedFiles[`subdoc-${selectedDocumentForModal.id}`] ? 'bg-gray-400 cursor-not-allowed' : 
                            uploadStates[`subdoc-${selectedDocumentForModal.id}`]?.status === 'uploading' ? 'bg-blue-500' : 
                            'bg-blue-600 hover:bg-blue-700'}`}
                        disabled={!selectedFiles[`subdoc-${selectedDocumentForModal.id}`] || 
                                    uploadStates[`subdoc-${selectedDocumentForModal.id}`]?.status === 'uploading'}
                        >
                        {uploadStates[`subdoc-${selectedDocumentForModal.id}`]?.status === 'uploading' ? (
                            <>
                            <FaSpinner className="animate-spin inline mr-2" />
                            Envoi en cours...
                            </>
                        ) : (
                            <>
                            <FaUpload className="inline mr-2" />
                            Télécharger le sous-document
                            </>
                        )}
                        </button>
                                    </div>

                                    {/* Affichage du statut */}
                                    {uploadStates[`subdoc-${selectedDocumentForModal.id}`]?.status === 'success' && (
                                    <div className="p-3 bg-green-50 text-green-700 rounded">
                                        {uploadStates[`subdoc-${selectedDocumentForModal.id}`].message}
                                    </div>
                                    )}
                                    {uploadStates[`subdoc-${selectedDocumentForModal.id}`]?.status === 'error' && (
                                    <div className="p-3 bg-red-50 text-red-700 rounded">
                                        {uploadStates[`subdoc-${selectedDocumentForModal.id}`].message}
                                    </div>
                                    )}
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        )}
                        </div>
                        );
                        }


