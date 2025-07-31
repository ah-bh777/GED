import { useEffect, useState } from "react";
import { axiosClient } from "./Api/axios";
import { 
  FaUser, 
  FaIdCard, 
  FaFile,
  FaFileAlt,
  FaExclamationTriangle,
  FaUpload,
  FaSpinner,
  FaCalendarAlt,
  FaBriefcase,
  FaPlus,
  FaEye,
  FaDownload,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaFolder
} from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

export default function DossierDetail() {
    const [dossier, setDossier] = useState({
        documents: [],
        grade: { type_de_documents: [] },
        fonctionnaire: { user: {} }
    });
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState({});
    const [uploadStates, setUploadStates] = useState({});
    const [documentNotes, setDocumentNotes] = useState({});
    const [documentExpirations, setDocumentExpirations] = useState({});
    const navigate = useNavigate();
    const admin = JSON.parse(localStorage.getItem("ADMIN_INFO"));
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedDocumentForModal, setSelectedDocumentForModal] = useState(null);

    const fetchData = async () => {
        try {
            const response = await axiosClient.get("/api/latest-fonctionnaire");
            setDossier({
                ...response.data.data,
                documents: response.data.data.documents || [],
                grade: {
                    ...response.data.data.grade,
                    type_de_documents: response.data.data.grade?.type_de_documents || []
                },
                fonctionnaire: response.data.data.fonctionnaire || { user: {} }
            });
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileChange = (docTypeId, event) => {
        const file = event.target.files[0];
        setSelectedFiles(prev => ({
            ...prev,
            [docTypeId]: file
        }));
    };

    const handleNoteChange = (docTypeId, note) => {
        setDocumentNotes(prev => ({
            ...prev,
            [docTypeId]: note
        }));
    };

    const handleExpirationChange = (docTypeId, date) => {
        setDocumentExpirations(prev => ({
            ...prev,
            [docTypeId]: date
        }));
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
            formData.append('dossier_id', dossier.id);
            formData.append('date_d_expiration', expirationDate);
            formData.append('note_d_observation', documentNotes[docTypeId] || '');

            const response = await axiosClient.post('/api/post-public-img', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Get document type name for transaction details
            const docType = dossier.grade.type_de_documents.find(doc => doc.id === docTypeId);
            const docTypeName = docType?.nom_de_type || 'document';

            // Log the transaction
            await axiosClient.post("/api/tracer-action-table", {
                admin_id: admin?.admin?.id,
                dossier_id: dossier.id, 
                type_de_transaction: 4,
                details_de_transaction: `l'ajout du document ${docTypeName} pour le dossier `
            });

            setUploadStates(prev => ({
                ...prev,
                [docTypeId]: { 
                    status: 'success', 
                    message: response.data.message || 'Upload successful!',
                    url: response.data.url 
                }
            }));

            fetchData();
        
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
    };

    const handleAddLater = async () => {
        const confirm = window.confirm("L'ajout des documents se fera lors de l'édition du dossier. Voulez-vous continuer ?");
        if (confirm) {
            await axiosClient.post("/api/tracer-action-table", {
                admin_id: admin?.admin?.id,
                dossier_id: dossier.id, 
                type_de_transaction: 4,
                details_de_transaction: "report de l'ajout des documents pour ce dossier"
            });
            
            navigate("/table");
        }
    };

    const handleDownload = async (documentId) => {
        try {
            const document = dossier.documents.find(doc => doc.id === documentId);
            
            const response = await axiosClient.post(
                "/download-public-img",
                { id: documentId },
                { responseType: "blob" }
            );
    
            const url = window.URL.createObjectURL(new Blob([response.data]));
    
            const link = document.createElement("a");
            link.href = url;
    
            let fileName = `${dossier.fonctionnaire.user.nom_fr}_${dossier.fonctionnaire.user.prenom_fr}_${document.type_de_document?.nom_de_type || 'document'}.pdf`;
            
            fileName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-.]/g, '');
    
            link.setAttribute("download", fileName);
    
            document.body.appendChild(link);
            link.click();
    
            if (document) {
                await axiosClient.post("/api/tracer-action-table", {
                    admin_id: admin?.admin?.id,
                    dossier_id: dossier.id,
                    type_de_transaction: 4,
                    details_de_transaction: `le téléchargement du document ${document.type_de_document?.nom_de_type || 'document'} du dossier`
                });
            }
    
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Échec du téléchargement: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteDocument = async (documentId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document?")) {
            try {
              
            
                const docToDelete = dossier.documents.find(doc => doc.id === documentId);
                
                await axiosClient.post('/api/delete-public-img', { id: documentId });
                
                // Log the transaction
                if (docToDelete) {
                    await axiosClient.post("/api/tracer-action-table", {
                        admin_id: admin?.admin?.id,
                        dossier_id: dossier.id, 
                        type_de_transaction: 4,
                        details_de_transaction: `la suppression du document ${docToDelete.type_de_document?.nom_de_type || 'document'} du dossier`
                    });
                }
                
                fetchData();
            } catch (error) {
                console.error("Delete error:", error);
            }
        }
    };

    const handleSubDocDownload = async (subDocId) => {
        try {
            // Get sub-document info for transaction details
            const subDoc = dossier.documents
                .flatMap(doc => doc.sub_docs)
                .find(sd => sd.id === subDocId);
            
            const response = await axiosClient.post(
                "/api/download-sous-doc-public-img",
                { id: subDocId },
                { responseType: "blob" }
            );
        
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
        
            const link = document.createElement("a");
            link.href = url;
            
            const fileName = subDoc 
                ? `${dossier.fonctionnaire.user.nom_fr}_${dossier.fonctionnaire.user.prenom_fr}_${subDoc.nom_document}.pdf` 
                : "sous_document.pdf";
            
            link.setAttribute("download", fileName);
        
            document.body.appendChild(link);
            link.click();

            // Log the transaction after successful download
            if (subDoc) {
                await axiosClient.post("/api/tracer-action-table", {
                    admin_id: admin?.admin?.id,
                    dossier_id: dossier.id,
                    type_de_transaction: 4,
                    details_de_transaction: `le téléchargement du sous-document ${subDoc.nom_document} du dossier`
                });
            }
        
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
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
            const mainDocument = dossier.documents.find(doc => doc.id === mainDocumentId);
            const mainDocumentName = mainDocument?.type_de_document?.nom_de_type || 'Document inconnu';
      
            const response = await axiosClient.post('/api/post-sous-doc-public-img', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            const subDocName = response.data?.data?.nom_document || 
                            selectedFile.name.replace(/\.[^/.]+$/, ""); 
    
            await axiosClient.post("/api/tracer-action-table", {
                admin_id: admin?.admin?.id,
                dossier_id: dossier.id,
                type_de_transaction: 4,
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
      
            await fetchData();
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

    const addSubDoc = (documentId) => {
        const document = dossier.documents.find(doc => doc.id === documentId);
        if (document) {
            setSelectedDocumentForModal(document);
            setShowDocumentModal(true);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </div>
        );
    }

    if (!dossier || !dossier.grade || !dossier.fonctionnaire) {
        return (
            <div className="flex justify-center items-center h-screen text-red-500">
                Error loading dossier information
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Green Header */}
            <div className="relative">
                <div
                    className="w-[25%] h-10 bg-green-600 relative z-10"
                    style={{
                        clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0% 100%)',
                        borderTopLeftRadius: '1.25rem',
                    }}
                >
                    <div
                        className="absolute top-full left-0 w-6 h-6 bg-green-600"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                    ></div>
                </div>

                <div className="bg-green-600 text-white rounded-t-lg p-6 shadow-lg -mt-2 pt-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Dossier Créé avec Succès: {dossier.dossier}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-b-lg shadow-md p-6 space-y-6 border border-gray-200">
                {/* Compact Information Section */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <h3 className="text-sm font-medium text-gray-500">Nom Complet</h3>
                            <div className="flex items-center space-x-4">
                                <p className="text-gray-900">
                                    {dossier.fonctionnaire.user.nom_fr} {dossier.fonctionnaire.user.prenom_fr}
                                </p>
                                <p className="text-gray-900 text-right" dir="rtl">
                                    {dossier.fonctionnaire.user.nom_ar} {dossier.fonctionnaire.user.prenom_ar}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-[200px]">
                            <h3 className="text-sm font-medium text-gray-500">Date d'Affectation</h3>
                            <p className="text-gray-900 flex items-center">
                                <FaCalendarAlt className="mr-2 text-green-500" />
                                {new Date(dossier.date_d_affectation).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                        
                        <div className="flex-1 min-w-[200px]">
                            <h3 className="text-sm font-medium text-gray-500">Corps</h3>
                            <p className="text-gray-900 flex items-center">
                                <FaBriefcase className="mr-2 text-green-500" />
                                {dossier.grade.corp?.nom_de_corps || 'N/A'}
                            </p>
                        </div>
                        
                        <div className="flex-1 min-w-[200px]">
                            <h3 className="text-sm font-medium text-gray-500">Grade</h3>
                            <p className="text-gray-900 flex items-center">
                                <FaIdCard className="mr-2 text-green-500" />
                                {dossier.grade.nom_grade || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Existing Documents Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center mb-4">
                        <FaFile className="text-blue-500 mr-2 text-xl" />
                        <h2 className="text-xl font-semibold">Documents</h2>
                    </div>
                    
                    <div className="space-y-4">
                        {dossier.documents && dossier.documents.length > 0 ? (
                            dossier.documents.map((document) => (
                                <div key={document.id} className="space-y-4 mb-6">
                                    <div className="flex items-center h-14 w-full bg-green-50 border border-green-200 rounded-lg px-4 hover:bg-green-100 transition-colors">
                                        <div className="flex flex-1 justify-between items-center">
                                            <div className="flex flex-col md:flex-row md:space-x-6 md:items-center">
                                                <span className="font-medium text-green-800">
                                                    {document.type_de_document?.nom_de_type || 'Document'}
                                                </span>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                    <span>Obligatoire: {document.type_de_document?.obligatoire ? 'Oui' : 'Non'}</span>
                                                    <span>Soumis le: {new Date(document.created_at).toLocaleDateString('fr-FR')}</span>
                                                    {document.date_d_expiration && (
                                                        <span>Expire le: {new Date(document.date_d_expiration).toLocaleDateString('fr-FR')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => addSubDoc(document.id)}
                                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Ajouter sous-document"
                                                >
                                                    <FaPlus />
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        await axiosClient.post("/api/tracer-action-table", {
                                                            admin_id: admin?.admin?.id,
                                                            dossier_id: dossier.id,
                                                            type_de_transaction: 4,
                                                            details_de_transaction: `la consultation du document ${document.type_de_document?.nom_de_type || 'document'} du dossier`
                                                        });
                                                        window.open(`http://localhost:8000/storage/${document.chemin_contenu_document}`, '_blank');
                                                    }}
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
                                                    onClick={ async () =>{
                                                        await axiosClient.post("/api/tracer-action-table", {
                                                            admin_id: admin?.admin?.id,
                                                            dossier_id: document.id,
                                                            type_de_transaction: 4,
                                                            details_de_transaction: `la suppression du document ${document.type_de_document?.nom_de_type || 'document'} du dossier`
                                                        });
                                                        
                                                        handleDeleteDocument(document.id) }}
                                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sous-documents Section */}
                                    {document.sub_docs && document.sub_docs.length > 0 && (
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
                                                                Ajouté le: {new Date(subDoc.created_at).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between w-32">
                                                            <button
                                                                onClick={async () => {
                                                                    await axiosClient.post("/api/tracer-action-table", {
                                                                        admin_id: admin?.admin?.id,
                                                                        dossier_id: dossier.id,
                                                                        type_de_transaction: 4,
                                                                        details_de_transaction: `la consultation du sous-document ${subDoc.nom_document} du dossier`
                                                                    });
                                                                    window.open(`http://localhost:8000/storage/${subDoc.chemin_contenu_sous_document}`, '_blank');
                                                                }}
                                                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                                                                title="Voir"
                                                            >
                                                                <FaEye />
                                                            </button>
                                                            <button
                                                                onClick={() => handleSubDocDownload(subDoc.id)}
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
                                                                            await axiosClient.post("/api/tracer-action-table", {
                                                                                admin_id: admin?.admin?.id,
                                                                                dossier_id: dossier.id,
                                                                                type_de_transaction: 4,
                                                                                details_de_transaction: `la suppression du sous-document ${subDoc.nom_document} du dossier`
                                                                            });
                                                                            fetchData();
                                                                        } catch (error) {
                                                                            console.error('Error deleting sub-document:', error);
                                                                        }
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
                </div>

                {/* Missing Documents Section */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <FaFileAlt className="text-blue-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Documents Manquants</h2>
                        </div>
                        <button 
                            onClick={handleAddLater}
                            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            <FaClock className="mr-2" />
                            Ajout des documents plus tard
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {dossier.grade.type_de_documents
                            .filter(docType => docType.obligatoire && 
                                !dossier.documents?.some(doc => doc.type_de_document_id === docType.id))
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
                            })}
                        
                        {dossier.grade.type_de_documents
                            .filter(docType => docType.obligatoire && 
                                !dossier.documents?.some(doc => doc.type_de_document_id === docType.id))
                            .length === 0 && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <p className="text-green-600 flex items-center">
                                        <FaCheckCircle className="mr-2" />
                                        Tous les documents obligatoires sont présents
                                    </p>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Modal for adding sub-documents */}
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

                                {/* Document information */}
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

                                {/* Main document notes */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes du document principal</label>
                                    <div className="p-3 bg-gray-50 rounded border border-gray-200 min-h-[80px]">
                                        {selectedDocumentForModal.note_d_observation || 
                                            <span className="text-gray-400">Aucune note disponible pour ce document</span>}
                                    </div>
                                </div>

                                <hr className="my-4 border-gray-200" />

                                {/* Sub-document upload section */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-700">Télécharger un nouveau sous-document</h4>
                                    
                                    {/* File selection */}
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

                                    {/* Upload button */}
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

                                    {/* Status display */}
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