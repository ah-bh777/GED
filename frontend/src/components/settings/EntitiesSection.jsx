import { useState, useEffect, useRef } from 'react';
import { axiosClient } from '../../Api/axios';

const EntitiesSection = () => {
  const [mode, setMode] = useState('ajout');
  const [entitiesData, setEntitiesData] = useState({ entite: [], units: [] });
  const [newEntity, setNewEntity] = useState({ name: '', unitId: '' });
  const [selectedEntityToDelete, setSelectedEntityToDelete] = useState('');
  const [selectedEntityToUpdate, setSelectedEntityToUpdate] = useState('');
  const [updatedEntity, setUpdatedEntity] = useState({ name: '', unitId: '' });
  const [loading, setLoading] = useState(true);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedEntityForModal, setSelectedEntityForModal] = useState(null);
  const [dossierCounts, setDossierCounts] = useState({});
  const [selectedUnitForDelete, setSelectedUnitForDelete] = useState('');
  const [selectedUnitForUpdate, setSelectedUnitForUpdate] = useState('');
  const operationSectionRef = useRef(null);

  const API_BASE = 'http://localhost:8000';
  const GET_ENTITIES_URL = `${API_BASE}/api/get-entite`;
  const HANDLE_ENTITIES_URL = `${API_BASE}/api/handle-entite-unite`;
  const CHECK_ENTITY_ASSOCIATION_URL = `${API_BASE}/api/check-assocaition-entite`;

  const scrollToOperationSection = () => {
    operationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(GET_ENTITIES_URL);
      const { entite, units } = response.data;
      setEntitiesData({ entite: entite || [], units: units || [] });
      
      // Fetch dossier counts for each entity
      const counts = {};
      for (const entity of entite) {
        const countResponse = await axiosClient.post(CHECK_ENTITY_ASSOCIATION_URL, { id: entity.id });
        counts[entity.id] = countResponse.data.count;
      }
      setDossierCounts(counts);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check dossier association for modal
  const checkEntityAssociationForModal = async (entityId) => {
    try {
      const response = await axiosClient.post(CHECK_ENTITY_ASSOCIATION_URL, { id: entityId });
      setSelectedEntityForModal({
        id: entityId,
        count: response.data.count,
        theDossiers: response.data.theDossiers || []
      });
    } catch (error) {
      console.error('Error checking association:', error);
    }
  };

  // Handle add entity
  const handleAddEntity = async () => {
    try {
      const payload = {
        operation: 'ajout',
        unit: newEntity.unitId,
        entite: newEntity.name
      };

      const response = await axiosClient.post(HANDLE_ENTITIES_URL, payload);
      alert(response.data.message);
      await fetchEntities();
      setNewEntity({ name: '', unitId: '' });
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle delete entity
  const handleDeleteEntity = async () => {
    try {
      const payload = {
        operation: 'suppression',
        entite_id: selectedEntityToDelete
      };

      const response = await axiosClient.post(HANDLE_ENTITIES_URL, payload);
      alert(JSON.stringify(response.data.message));
      await fetchEntities();
      setSelectedEntityToDelete('');
      setSelectedUnitForDelete('');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle update entity
  const handleUpdateEntity = async () => {
    try {
      const payload = {
        operation: 'modification',
        entite_id: selectedEntityToUpdate,
        unit: updatedEntity.unitId,
        entite: updatedEntity.name
      };

      const response = await axiosClient.post(HANDLE_ENTITIES_URL, payload);
      alert(response.data.message);
      await fetchEntities();
      setSelectedEntityToUpdate('');
      setSelectedUnitForUpdate('');
      setUpdatedEntity({ name: '', unitId: '' });
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Get unit name by ID
  const getUnitName = (unitId) => {
    const unit = entitiesData.units.find(u => u.id == unitId);
    return unit ? unit.nomUnite : 'Unité inconnue';
  };

  useEffect(() => { 
    fetchEntities(); 
  }, []);

  // Separate dossiers into archived and non-archived for modal
  const nonArchivedDossiers = selectedEntityForModal?.theDossiers.filter(d => !d.arch_dossier) || [];
  const archivedDossiers = selectedEntityForModal?.theDossiers.filter(d => d.arch_dossier) || [];

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Entities Table - Outside the operation section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Liste des Entités</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entité
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unité
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
                {entitiesData.entite.map((entity) => (
                  <tr key={entity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entity.nom_entite}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getUnitName(entity.unite_organi_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dossierCounts[entity.id] > 0 ? (
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200 transition-colors"
                          onClick={async () => {
                            await checkEntityAssociationForModal(entity.id);
                            setShowDossierModal(true);
                          }}
                        >
                          {dossierCounts[entity.id]} dossier(s)
                        </span>
                      ) : (
                        <span className="text-gray-400">Aucun</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setMode('modification');
                          setSelectedEntityToUpdate(entity.id);
                          setSelectedUnitForUpdate(entity.unite_organi_id);
                          setUpdatedEntity({
                            name: entity.nom_entite,
                            unitId: entity.unite_organi_id
                          });
                          scrollToOperationSection();
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          setMode('suppression');
                          setSelectedEntityToDelete(entity.id);
                          setSelectedUnitForDelete(entity.unite_organi_id);
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

      {/* Operation Section - With color side indicator */}
      <div 
        ref={operationSectionRef}
        className="relative rounded-lg shadow-md overflow-hidden border border-gray-200 w-full"
      >
        {/* Color side indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${
          mode === 'suppression' ? 'bg-red-500' : 
          mode === 'ajout' ? 'bg-green-500' : 
          'bg-blue-500'
        }`}></div>
        
        {/* Operation tabs */}
        <div className="flex p-4 space-x-4">
          {['ajout', 'modification', 'suppression'].map((op) => (
            <button
              key={op}
              onClick={() => {
                setMode(op);
                scrollToOperationSection();
              }}
              className={`flex-1 py-2 rounded-md font-medium ${
                mode === op
                  ? op === 'ajout' ? 'bg-green-600 text-white'
                  : op === 'modification' ? 'bg-blue-600 text-white'
                  : 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {op === 'ajout' ? 'Ajout' : 
               op === 'modification' ? 'Modification' : 'Suppression'}
            </button>
          ))}
        </div>
        
        {/* Operation forms */}
        <div className="p-6 space-y-6">
          {/* Add Entity Form */}
          {mode === 'ajout' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ajouter une Entité</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Unité:</label>
                  <select
                    value={newEntity.unitId}
                    onChange={(e) => setNewEntity({...newEntity, unitId: e.target.value})}
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Sélectionner une unité</option>
                    {entitiesData.units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.nomUnite}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Nom Entité:</label>
                  <input
                    type="text"
                    value={newEntity.name}
                    onChange={(e) => setNewEntity({...newEntity, name: e.target.value})}
                    placeholder="Nom de l'entité"
                    className="flex-1 p-2 border rounded-md"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddEntity}
                    disabled={!newEntity.name.trim() || !newEntity.unitId}
                    className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Update Entity Form */}
          {mode === 'modification' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Modifier une Entité</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Unité:</label>
                  <select
                    value={selectedUnitForUpdate}
                    onChange={(e) => {
                      setSelectedUnitForUpdate(e.target.value);
                      setSelectedEntityToUpdate('');
                    }}
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Sélectionner une unité</option>
                    {entitiesData.units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.nomUnite}</option>
                    ))}
                  </select>
                </div>

                {selectedUnitForUpdate && (
                  <div className="flex items-center space-x-4">
                    <label className="w-1/4">Entité:</label>
                    <select
                      value={selectedEntityToUpdate}
                      onChange={(e) => {
                        const selected = entitiesData.entite.find(ent => ent.id == e.target.value);
                        setSelectedEntityToUpdate(e.target.value);
                        setUpdatedEntity({
                          name: selected?.nom_entite || '',
                          unitId: selected?.unite_organi_id || ''
                        });
                      }}
                      className="flex-1 p-2 border rounded-md"
                    >
                      <option value="">Sélectionner une entité</option>
                      {entitiesData.entite
                        .filter(ent => ent.unite_organi_id == selectedUnitForUpdate)
                        .map(entity => (
                          <option key={entity.id} value={entity.id}>{entity.nom_entite}</option>
                        ))}
                    </select>
                  </div>
                )}

                {selectedEntityToUpdate && (
                  <>
                    <div className="flex items-center space-x-4">
                      <label className="w-1/4">Nouvelle Unité:</label>
                      <select
                        value={updatedEntity.unitId}
                        onChange={(e) => setUpdatedEntity({...updatedEntity, unitId: e.target.value})}
                        className="flex-1 p-2 border rounded-md"
                      >
                        <option value="">Sélectionner une unité</option>
                        {entitiesData.units.map(unit => (
                          <option key={unit.id} value={unit.id}>{unit.nomUnite}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="w-1/4">Nouveau Nom:</label>
                      <input
                        type="text"
                        value={updatedEntity.name}
                        onChange={(e) => setUpdatedEntity({...updatedEntity, name: e.target.value})}
                        className="flex-1 p-2 border rounded-md"
                      />
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setSelectedEntityToUpdate('');
                          setSelectedUnitForUpdate('');
                          setUpdatedEntity({ name: '', unitId: '' });
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleUpdateEntity}
                        disabled={!updatedEntity.name.trim() || !updatedEntity.unitId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Delete Entity Form */}
          {mode === 'suppression' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Supprimer une Entité</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Unité:</label>
                  <select
                    value={selectedUnitForDelete}
                    onChange={(e) => {
                      setSelectedUnitForDelete(e.target.value);
                      setSelectedEntityToDelete('');
                    }}
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Sélectionner une unité</option>
                    {entitiesData.units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.nomUnite}</option>
                    ))}
                  </select>
                </div>

                {selectedUnitForDelete && (
                  <div className="flex items-center space-x-4">
                    <label className="w-1/4">Entité:</label>
                    <select
                      value={selectedEntityToDelete}
                      onChange={(e) => setSelectedEntityToDelete(e.target.value)}
                      className="flex-1 p-2 border rounded-md"
                    >
                      <option value="">Sélectionner une entité</option>
                      {entitiesData.entite
                        .filter(ent => ent.unite_organi_id == selectedUnitForDelete)
                        .map(entity => (
                          <option key={entity.id} value={entity.id}>{entity.nom_entite}</option>
                        ))}
                    </select>
                  </div>
                )}

                {selectedEntityToDelete && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleDeleteEntity}
                      disabled={!selectedEntityToDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-red-300"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dossier Details Modal */}
      {showDossierModal && selectedEntityForModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDossierModal(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Détails des dossiers associés: {entitiesData.entite.find(e => e.id === selectedEntityForModal.id)?.nom_entite}
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

export default EntitiesSection;