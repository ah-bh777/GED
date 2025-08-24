import { useState, useEffect, useRef } from 'react';
import { axiosClient } from '../../Api/axios';

const AffectationSection = () => {
  const [selectedButton, setSelectedButton] = useState('ajout');
  const [affectations, setAffectations] = useState([]);
  const [newAffectation, setNewAffectation] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState('');
  const [selectedToUpdate, setSelectedToUpdate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updatedValue, setUpdatedValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedAffectationForModal, setSelectedAffectationForModal] = useState(null);
  const [dossierCounts, setDossierCounts] = useState({});
  const operationSectionRef = useRef(null);
  
  const API_BASE = 'http://localhost:8000';
  const GET_AFFECTATION_URL = `${API_BASE}/api/get-affectation`;
  const HANDLE_AFFECTATION_URL = `${API_BASE}/api/handle-affectation`;
  const CHECK_ASSOCIATION_URL = `${API_BASE}/api/check-assocaition-affectation`;

  const scrollToOperationSection = () => {
    operationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch affectations data and their dossier counts
  const fetchAffectations = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(GET_AFFECTATION_URL);
      const affectationsData = response.data.data || [];
      setAffectations(affectationsData);
      
      // Fetch dossier counts for each affectation
      const counts = {};
      for (const affectation of affectationsData) {
        const countResponse = await axiosClient.post(CHECK_ASSOCIATION_URL, { id: affectation.id });
        counts[affectation.id] = countResponse.data.count;
      }
      setDossierCounts(counts);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check dossier association for modal
  const checkDossierAssociationForModal = async (affectationId) => {
    try {
      const response = await axiosClient.post(CHECK_ASSOCIATION_URL, { id: affectationId });
      setSelectedAffectationForModal({
        id: affectationId,
        count: response.data.count,
        theDossiers: response.data.theDossiers || []
      });
    } catch (error) {
      console.error('Error checking association:', error);
    }
  };

  // Handle affectation operations
  const handleAffectationOperation = async (operation, data = {}) => {
    try {
      const payload = {
        operation: operation,
        valuer: operation === 'ajout' ? data.nom_d_affectation : 
               operation === 'modification' ? updatedValue : null,
        id: operation !== 'ajout' ? data.id : null
      };

      const response = await axiosClient.post(HANDLE_AFFECTATION_URL, payload);
  
      await fetchAffectations();
      
      setNewAffectation('');
      setSelectedToDelete('');
      if (operation === 'modification') {
        setIsEditing(false);
        setSelectedToUpdate('');
        setUpdatedValue('');
      }
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  useEffect(() => { 
    fetchAffectations(); 
  }, []);

  // Separate dossiers into archived and non-archived for modal
  const nonArchivedDossiers = selectedAffectationForModal?.theDossiers.filter(d => !d.arch_dossier) || [];
  const archivedDossiers = selectedAffectationForModal?.theDossiers.filter(d => d.arch_dossier) || [];

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Affectations Table - Outside the operation section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Liste des Affectations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affectation
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
                {affectations.map((affectation) => (
                  <tr key={affectation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {affectation.nom_d_affectation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dossierCounts[affectation.id] > 0 ? (
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200 transition-colors"
                          onClick={async () => {
                            await checkDossierAssociationForModal(affectation.id);
                            setShowDossierModal(true);
                          }}
                        >
                          {dossierCounts[affectation.id]} dossier(s)
                        </span>
                      ) : (
                        <span className="text-gray-400">Aucun</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedButton('modification');
                          setSelectedToUpdate(affectation.id);
                          setUpdatedValue(affectation.nom_d_affectation);
                          scrollToOperationSection();
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          setSelectedButton('suppression');
                          setSelectedToDelete(affectation.id);
                          scrollToOperationSection();
                        }}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
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
                  {affectations.map(aff => (
                    <option key={aff.id} value={aff.id}>{aff.nom_d_affectation}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleAffectationOperation('suppression', { id: selectedToDelete })}
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
                  value={newAffectation}
                  onChange={(e) => setNewAffectation(e.target.value)}
                  placeholder="Nouvelle affectation"
                  className="flex-1 p-2 border rounded-md"
                />
                <button
                  onClick={() => handleAffectationOperation('ajout', { nom_d_affectation: newAffectation })}
                  disabled={!newAffectation.trim()}
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
                        const selected = affectations.find(a => a.id == e.target.value);
                        setSelectedToUpdate(e.target.value);
                        setUpdatedValue(selected?.nom_d_affectation || '');
                      }}
                      className="flex-1 p-2 border rounded-md"
                    >
                      <option value="">Sélectionner</option>
                      {affectations.map(aff => (
                        <option key={aff.id} value={aff.id}>{aff.nom_d_affectation}</option>
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
                      onClick={() => handleAffectationOperation('modification', { 
                        id: selectedToUpdate, 
                        nom_d_affectation: updatedValue 
                      })}
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
      {showDossierModal && selectedAffectationForModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDossierModal(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Détails des dossiers associés: {affectations.find(a => a.id === selectedAffectationForModal.id)?.nom_d_affectation}
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
                {nonArchivedDossiers.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium mb-4 text-green-600">Dossiers actifs ({nonArchivedDossiers.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {nonArchivedDossiers.map(dossier => (
                        <div key={dossier.id} className="border border-green-200 rounded-lg p-4 shadow-sm bg-green-50">
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
                {archivedDossiers.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-red-600">Dossiers archivés ({archivedDossiers.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {archivedDossiers.map(dossier => (
                        <div key={dossier.id} className="border border-red-200 rounded-lg p-4 shadow-sm bg-red-50">
                          <div className="font-medium text-gray-800">{dossier.dossier}</div>
                          <div className="text-sm text-gray-600">
                            Fonctionnaire: {dossier.fonctionnaire?.user?.nom_fr} {dossier.fonctionnaire?.user?.prenom_fr}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Archivé le: {new Date(dossier.arch_dossier.date_d_archivage).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
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

export default AffectationSection;