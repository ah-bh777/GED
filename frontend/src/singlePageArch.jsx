import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { axiosClient } from "./Api/axios";
import { 
  FaFileAlt, 
  FaCheckCircle,
  FaBox, 
  FaFile, 
  FaFolder, 
  FaUser, 
  FaIdCard, 
  FaBriefcase, 
  FaBuilding,
  FaExclamationTriangle, 
  FaGavel,
  FaEye, 
  FaDownload, 
} from 'react-icons/fa';

export default function SinglePage() {
    const [dossierData, setDossierData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const {id} = useParams();
    const obj = {"id": id};

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
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
    
    return (
        <div className="container mx-auto p-4">
            <div className="relative">
                <div
                    className="w-[25%] h-10 bg-red-600 relative z-10"
                    style={{
                        clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0% 100%)',
                        borderTopLeftRadius: '1.25rem',
                    }}
                >
                    <div
                        className="absolute top-full left-0 w-6 h-6 bg-red-600"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                    ></div>
                </div>

                {/* Header Content */}
                <div className="bg-red-600 text-white rounded-t-lg p-6 shadow-lg -mt-2 pt-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">{dossier.dossier}</h1>
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
                            <FaUser className="text-red-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Fonctionnaire Information</h2>
                        </div>
                    </div>
                    
                    {/* Name Row - French and Arabic side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Nom (FR)</label>
                            <input
                                type="text"
                                value={dossier.fonctionnaire.user.nom_fr || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 mb-1 text-right">النسب (بالعربية)</label>
                            <input
                                type="text"
                                value={dossier.fonctionnaire.user.nom_ar || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded text-right border-gray-300 bg-gray-50"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Prénom (FR)</label>
                            <input
                                type="text"
                                value={dossier.fonctionnaire.user.prenom_fr || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 mb-1 text-right">الاسم (بالعربية)</label>
                            <input
                                type="text"
                                value={dossier.fonctionnaire.user.prenom_ar || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded text-right border-gray-300 bg-gray-50"
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
                                value={dossier.fonctionnaire.user.email || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Téléphone</label>
                            <input
                                type="text"
                                value={dossier.fonctionnaire.user.telephone || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Date de Naissance</label>
                            <input
                                type="date"
                                value={dossier.fonctionnaire.user.date_de_naissance || ''}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Adresse</label>
                            <input
                                type="text"
                                value={dossier.fonctionnaire.user.adresse || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Statut</label>
                            <input
                                type="text"
                                value={dossier.fonctionnaire.statut?.nom_statut || 'N/A'} 
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Date d'affectation</label>
                            <input
                                type="text"
                                value={dossier.date_d_affectation || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Affectation Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <FaBuilding className="text-red-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Affectation</h2>
                            {dossier.affectation?.deleted_at && (
                                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                    Supprimée
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="w-full">
                        <label className="block text-gray-600 mb-1">Lieu d'affectation</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={dossier.affectation?.nom_d_affectation || 'N/A'}
                                readOnly
                                className={`w-full p-3 border rounded-lg border-gray-300 bg-gray-50 focus:outline-none ${
                                    dossier.affectation?.deleted_at ? 'border-red-300 bg-red-50' : ''
                                }`}
                            />
                            {dossier.affectation?.deleted_at && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <FaExclamationTriangle className="text-red-500" />
                                </div>
                            )}
                        </div>
                        {dossier.affectation?.deleted_at && (
                            <div className="mt-2 text-sm text-red-600">
                                Cette affectation a été supprimée le {formatDate(dossier.affectation.deleted_at)}
                            </div>
                        )}
                    </div>
                </div>
              
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <FaBox className="text-red-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Caractéristiques Physiques</h2>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Matricule</label>
                            <input
                                type="text"
                                value={dossier.matricule || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Couleur</label>
                            <input
                                type="text"
                                value={dossier.couleur || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Tiroir</label>
                            <input
                                type="text"
                                value={dossier.tiroir || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Armoire</label>
                            <input
                                type="text"
                                value={dossier.armoire || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Grade and Entité Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <FaIdCard className="text-red-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Grade & Entité</h2>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-600 mb-1">Corps</label>
                            <input
                                type="text"
                                value={dossier.grade?.corp?.nom_de_corps || 'N/A'}
                                readOnly
                                className={`w-full p-2 border rounded border-gray-300 bg-gray-50 ${
                                    dossier.grade?.corp?.deleted_at ? 'border-red-300 bg-red-50' : ''
                                }`}
                            />
                            {dossier.grade?.corp?.deleted_at && (
                                <div className="text-red-600 text-sm mt-1">
                                    Ce corps a été supprimé le {formatDate(dossier.grade.corp.deleted_at)}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Grade</label>
                            <input
                                type="text"
                                value={dossier.grade?.nom_grade || 'N/A'}
                                readOnly
                                className={`w-full p-2 border rounded border-gray-300 bg-gray-50 ${
                                    dossier.grade?.deleted_at ? 'border-red-300 bg-red-50' : ''
                                }`}
                            />
                            {dossier.grade?.deleted_at && (
                                <div className="text-red-600 text-sm mt-1">
                                    Ce grade a été supprimé le {formatDate(dossier.grade.deleted_at)}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Unité Organisationnelle</label>
                            <input
                                type="text"
                                value={dossier.entite?.unite_organi?.nomUnite || 'N/A'}
                                readOnly
                                className="w-full p-2 border rounded border-gray-300 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Entité</label>
                            <input
                                type="text"
                                value={dossier.entite?.nom_entite || 'N/A'}
                                readOnly
                                className={`w-full p-2 border rounded border-gray-300 bg-gray-50 ${
                                    dossier.entite?.deleted_at ? 'border-red-300 bg-red-50' : ''
                                }`}
                            />
                            {dossier.entite?.deleted_at && (
                                <div className="text-red-600 text-sm mt-1">
                                    Cette entité a été supprimée le {formatDate(dossier.entite.deleted_at)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Documents Section */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center mb-4">
                        <FaFile className="text-red-500 mr-2 text-xl" />
                        <h2 className="text-xl font-semibold">Documents</h2>
                    </div>
                    
                    {/* Documents List */}
                    <div className="space-y-4">
                        {dossier.documents?.length > 0 ? (
                            dossier.documents.map((document) => (
                                <div key={document.id} className="space-y-4 mb-6">
                                    {/* Main Document Card */}
                                    <div className="flex items-center h-14 w-full bg-green-50 border border-green-200 rounded-lg px-4 hover:bg-green-100 transition-colors">
                                        <div className="flex flex-1 justify-between items-center">
                                            <div className="flex flex-col md:flex-row md:space-x-6 md:items-center">
                                                <span className="font-medium text-green-800">
                                                    {document.type_de_document?.nom_de_type || 'Document sans type'}
                                                </span>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                    <span>Obligatoire: {document.type_de_document?.obligatoire ? 'Oui' : 'Non'}</span>
                                                    <span>Soumis le: {formatDate(document.date_de_soumission)}</span>
                                                    <span>Expire le: {formatDate(document.date_d_expiration)}</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => window.open(`http://localhost:8000/storage/${document.chemin_contenu_document}`, '_blank')}
                                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Voir"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button 
                                                    onClick={() => {handleDownload(document.id)}}
                                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                                    title="Télécharger"
                                                >
                                                    <FaDownload />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sous-documents Section with divider */}
                                    {document.sub_docs?.length > 0 && (
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
                                                                Ajouté le: {formatDate(subDoc.date_ajout)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between w-28">
                                                            <button
                                                                onClick={() => window.open(subDoc.chemin_contenu_sous_document, '_blank')}
                                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
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
                            <FaFileAlt className="text-red-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Documents Manquants</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {dossier.grade?.type_de_documents
                                ?.filter(docType => docType.obligatoire && 
                                    !dossier.documents?.some(doc => doc.type_de_document_id === docType.id))
                                .map(docType => (
                                    <div key={docType.id} className="bg-red-50 p-4 rounded-lg border border-red-200">
                                        <div className="flex items-center text-red-600">
                                            <FaExclamationTriangle className="mr-2" />
                                            <span className="font-medium">{docType.nom_de_type}</span>
                                            <span className="text-sm text-red-500 ml-2">({docType.type_general})</span>
                                        </div>
                                    </div>
                                ))}
                            
                            {dossier.grade?.type_de_documents
                                ?.filter(docType => docType.obligatoire && 
                                    !dossier.documents?.some(doc => doc.type_de_document_id === docType.id))
                                ?.length === 0 && (
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

                {/* Avertissements Section */}
                {dossier.avertissements?.length > 0 && (
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
                {dossier.conseil_de_disciplines?.length > 0 && (
                    <div className="bg-white rounded-lg p-6 border border-gray-200 mt-6">
                        <div className="flex items-center mb-4">
                            <FaGavel className="text-red-500 mr-2 text-xl" />
                            <h2 className="text-xl font-semibold">Conseil de Disciplines</h2>
                        </div>
                        <div className="space-y-3">
                            {dossier.conseil_de_disciplines.map(conseil => (
                                <div key={conseil.id} className="bg-red-50 p-3 rounded border border-red-200">
                                    <p className="font-medium">{conseil.note_de_conseil}</p>
                                    <p className="text-gray-600">Date: {formatDate(conseil.date_de_conseil)}</p>
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