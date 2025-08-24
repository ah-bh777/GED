import { useState, useEffect, useRef } from 'react';
import { axiosClient } from '../../Api/axios';

const CorpsManagement = () => {
  const [selectedButton, setSelectedButton] = useState('ajout');
  const [corps, setCorps] = useState([]);
  const [newCorps, setNewCorps] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState('');
  const [selectedToUpdate, setSelectedToUpdate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updatedValue, setUpdatedValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedCorpsForModal, setSelectedCorpsForModal] = useState(null);
  const operationSectionRef = useRef(null);
  
  const API_BASE = 'http://localhost:8000';
  const GET_CORPS_URL = `${API_BASE}/api/get-corps`;
  const HANDLE_CORPS_URL = `${API_BASE}/api/handle-corps`;

  const scrollToOperationSection = () => {
    operationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch corps data
  const fetchCorps = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(GET_CORPS_URL);
      const corpsData = response.data.corp_grades || [];
      setCorps(corpsData);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total dossiers for a corps
  const getTotalDossiers = (corp) => {
    return corp.grades.reduce((total, grade) => total + (grade.dossiers?.length || 0), 0);
  };

  // Get all dossiers for a corps
  const getAllDossiersForCorps = (corp) => {
    return corp.grades.flatMap(grade => 
      grade.dossiers?.map(dossier => ({
        ...dossier,
        gradeName: grade.nom_grade
      })) || []
    );
  };

const handleCorpsOperation = async (operation, data = {}) => {
  try {
    const payload = {
      operation: operation,
      valuer: operation === 'ajout' ? data.nom_de_corps : 
             operation === 'modification' ? updatedValue : '',
      id: operation !== 'ajout' ? data.id : undefined
    };

    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const response = await axiosClient.post(HANDLE_CORPS_URL, payload);

    await fetchCorps();
    
    // Reset form states
    setNewCorps('');
    setSelectedToDelete('');
    if (operation === 'modification') {
      setIsEditing(false);
      setSelectedToUpdate('');
      setUpdatedValue('');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        "Une erreur inconnue est survenue";
    alert(`Erreur: ${errorMessage}`);
    console.error('Operation error:', error);
  }
};

  useEffect(() => { 
    fetchCorps(); 
  }, []);

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Corps Table - Outside the operation section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Liste des Corps</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Corps
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dossiers Associés
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {corps.map((corp) => {
                  const totalDossiers = getTotalDossiers(corp);
                  return (
                    <tr key={corp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {corp.nom_de_corps}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {totalDossiers > 0 ? (
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200 transition-colors"
                            onClick={() => {
                              setSelectedCorpsForModal({
                                id: corp.id,
                                name: corp.nom_de_corps,
                                dossiers: getAllDossiersForCorps(corp)
                              });
                              setShowDossierModal(true);
                            }}
                          >
                            {totalDossiers} dossier(s)
                          </span>
                        ) : (
                          <span className="text-gray-400">Aucun</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedButton('modification');
                            setSelectedToUpdate(corp.id);
                            setUpdatedValue(corp.nom_de_corps);
                            scrollToOperationSection();
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            setSelectedButton('suppression');
                            setSelectedToDelete(corp.id);
                            scrollToOperationSection();
                          }}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Operation Section - Separate from the table */}
      <div 
        ref={operationSectionRef}
        className="relative rounded-lg shadow-md overflow-hidden border border-gray-200 w-full"
      >
        {/* Operation indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${
          selectedButton === 'suppression' ? 'bg-red-500' : 
          selectedButton === 'ajout' ? 'bg-green-500' : 
          'bg-blue-500'
        }`}></div>
        
        {/* Operation tabs */}
        <div className="flex p-4 space-x-4">
          {['suppression', 'ajout', 'modification'].map((op) => (
            <button
              key={op}
              onClick={() => {
                setSelectedButton(op);
                scrollToOperationSection();
              }}
              className={`flex-1 py-2 rounded-md font-medium ${
                selectedButton === op
                  ? op === 'suppression' ? 'bg-red-600 text-white'
                  : op === 'ajout' ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {op === 'suppression' ? 'Suppression' : 
               op === 'ajout' ? 'Ajout' : 'Modification'}
            </button>
          ))}
        </div>
        
        {/* Operation forms */}
        <div className="p-6 space-y-6">
          {/* Delete form */}
          {selectedButton === 'suppression' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Suppression</h2>
              <div className="flex space-x-4">
                <select
                  value={selectedToDelete}
                  onChange={(e) => setSelectedToDelete(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                >
                  <option value="">Sélectionner</option>
                  {corps.map(corp => (
                    <option key={corp.id} value={corp.id}>{corp.nom_de_corps}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
  handleCorpsOperation('suppression', { id: selectedToDelete });
}}
                  disabled={!selectedToDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-red-300"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}

          {/* Add form */}
          {selectedButton === 'ajout' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ajout</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newCorps}
                  onChange={(e) => setNewCorps(e.target.value)}
                  placeholder="Nouveau corps"
                  className="flex-1 p-2 border rounded-md"
                />
                <button
                  onClick={() => {

  handleCorpsOperation('ajout', { nom_de_corps: newCorps });
}}
                  disabled={!newCorps.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {/* Edit form */}
          {selectedButton === 'modification' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Modification</h2>
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <select
                      value={selectedToUpdate}
                      onChange={(e) => {
                        const selected = corps.find(c => c.id == e.target.value);
                        setSelectedToUpdate(e.target.value);
                        setUpdatedValue(selected?.nom_de_corps || '');
                      }}
                      className="flex-1 p-2 border rounded-md"
                    >
                      <option value="">Sélectionner</option>
                      {corps.map(corp => (
                        <option key={corp.id} value={corp.id}>{corp.nom_de_corps}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setIsEditing(true)}
                      disabled={!selectedToUpdate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                      className="flex-1 p-2 border rounded-md"
                    />
                    <button
                      onClick={() => {
  handleCorpsOperation('modification', { 
    id: selectedToUpdate, 
    nom_de_corps: updatedValue 
  });
}}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
     {/* Dossier Details Modal */}
     {showDossierModal && selectedCorpsForModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDossierModal(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Détails des dossiers associés: {selectedCorpsForModal.name}
                  </h3>
                  <button 
                    onClick={() => setShowDossierModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Non-archived dossiers section */}
                {selectedCorpsForModal.dossiers.filter(d => !d.arch_dossier).length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium mb-4 text-green-600">
                      Dossiers actifs ({selectedCorpsForModal.dossiers.filter(d => !d.arch_dossier).length})
                    </h4>
                    <div className="space-y-3 w-fit">
                      {selectedCorpsForModal.dossiers
                        .filter(d => !d.arch_dossier)
                        .map(dossier => (
                          <div key={dossier.id} className="border border-green-200 rounded-lg p-4 shadow-sm bg-green-50 w-fit min-w-[300px]">
                            <div className="font-medium text-gray-800">{dossier.dossier}</div>
                            <div className="text-sm text-gray-600">
                              Fonctionnaire: {dossier.fonctionnaire?.user?.nom_fr} {dossier.fonctionnaire?.user?.prenom_fr}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Affecté le: {new Date(dossier.date_d_affectation).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Archived dossiers section */}
                {selectedCorpsForModal.dossiers.filter(d => d.arch_dossier).length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-red-600">
                      Dossiers archivés ({selectedCorpsForModal.dossiers.filter(d => d.arch_dossier).length})
                    </h4>
                    <div className="space-y-3 w-fit">
                      {selectedCorpsForModal.dossiers
                        .filter(d => d.arch_dossier)
                        .map(dossier => (
                          <div key={dossier.id} className="border border-red-200 rounded-lg p-4 shadow-sm bg-red-50 w-fit min-w-[300px]">
                            <div className="font-medium text-gray-800">{dossier.dossier}</div>
                            <div className="text-sm text-gray-600">
                              Fonctionnaire: {dossier.fonctionnaire?.user?.nom_fr} {dossier.fonctionnaire?.user?.prenom_fr}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Affecté le: {new Date(dossier.date_d_affectation).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Archivé le: {new Date(dossier.arch_dossier.date_d_archivage).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {selectedCorpsForModal.dossiers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun dossier associé à ce corps
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorpsManagement;