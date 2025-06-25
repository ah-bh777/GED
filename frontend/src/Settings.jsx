import { useState, useEffect, useRef } from 'react';
import { axiosClient } from './Api/axios';

export default function Setting() {
  // State for affectations section
  const [selectedButton, setSelectedButton] = useState('ajout');
  const [affectations, setAffectations] = useState([]);
  const [newAffectation, setNewAffectation] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState('');
  const [selectedToUpdate, setSelectedToUpdate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updatedValue, setUpdatedValue] = useState('');
  const [dossierInfo, setDossierInfo] = useState({
    count: 0,
    theDossiers: []
  });

  // State for entities section
  const [entitiesSectionMode, setEntitiesSectionMode] = useState('ajout');
  const [entitiesData, setEntitiesData] = useState({ entite: [], units: [] });
  const [newEntity, setNewEntity] = useState({ name: '', unitId: '' });
  const [selectedEntityToDelete, setSelectedEntityToDelete] = useState('');
  const [selectedEntityToUpdate, setSelectedEntityToUpdate] = useState('');
  const [updatedEntity, setUpdatedEntity] = useState({ name: '', unitId: '' });
  const [entityDossierInfo, setEntityDossierInfo] = useState({
    count: 0,
    theDossiers: []
  });

  // State for corps and grades section
  const [corpsGradesSectionMode, setCorpsGradesSectionMode] = useState('ajout');
  const [corpsGradesData, setCorpsGradesData] = useState({ corps: [], grades: [] });
  const [newCorps, setNewCorps] = useState('');
  const [newGrade, setNewGrade] = useState({ name: '', corpsId: '' });
  const [selectedCorpsToDelete, setSelectedCorpsToDelete] = useState('');
  const [selectedCorpsForDelete, setSelectedCorpsForDelete] = useState('');
  const [selectedGradeToDelete, setSelectedGradeToDelete] = useState('');
  const [selectedGradeToUpdate, setSelectedGradeToUpdate] = useState('');
  const [updatedGrade, setUpdatedGrade] = useState({ name: '', corpsId: '' });
  const [gradeDossierInfo, setGradeDossierInfo] = useState({
    count: 0,
    theDossiers: []
  });
  
  const [loading, setLoading] = useState(true);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [modalContentType, setModalContentType] = useState('affectation');
  const modalRef = useRef(null);

  // API endpoints
  const API_BASE = 'http://localhost:8000';
  const GET_AFFECTATION_URL = `${API_BASE}/api/get-affectation`;
  const HANDLE_AFFECTATION_URL = `${API_BASE}/api/handle-affectation`;
  const GET_ENTITIES_URL = `${API_BASE}/api/get-entite`;
  const HANDLE_ENTITIES_URL = `${API_BASE}/api/handle-entite-unite`;
  const CHECK_ASSOCIATION_URL = `${API_BASE}/api/check-assocaition-affectation`;
  const CHECK_ENTITY_ASSOCIATION_URL = `${API_BASE}/api/check-assocaition-entite`;
  const GET_CORPS_GRADES_URL = `${API_BASE}/api/get-corps-grade`;
  const HANDLE_CORPS_URL = `${API_BASE}/api/handle-corps`;
  const HANDLE_GRADE_URL = `${API_BASE}/api/handle-grade`;
  const CHECK_GRADE_ASSOCIATION_URL = `${API_BASE}/api/check-association-grade`;

  // Click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowDossierModal(false);
      }
    };

    if (showDossierModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDossierModal]);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [affectationsRes, entitiesRes, corpsGradesRes] = await Promise.all([
        axiosClient.get(GET_AFFECTATION_URL),
        axiosClient.get(GET_ENTITIES_URL),
        axiosClient.get(GET_CORPS_GRADES_URL)
      ]);
      
      setAffectations(affectationsRes.data.data || []);
      setEntitiesData({
        entite: entitiesRes.data.entite || [],
        units: entitiesRes.data.units || []
      });
      setCorpsGradesData({
        corps: corpsGradesRes.data.corps || [],
        grades: corpsGradesRes.data.grade || []
      });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check dossier association for affectations
  const checkDossierAssociation = async (affectationId) => {
    try {
      const response = await axiosClient.post(CHECK_ASSOCIATION_URL, { id: affectationId });
      setDossierInfo({
        count: response.data.count,
        theDossiers: response.data.theDossiers || []
      });
    } catch (error) {
      console.error('Error checking association:', error);
      setDossierInfo({
        count: 0,
        theDossiers: []
      });
    }
  };

  // Check dossier association for entities
  const checkEntityAssociation = async (entityId) => {
    try {
      const response = await axiosClient.post(CHECK_ENTITY_ASSOCIATION_URL, { id: entityId });
      setEntityDossierInfo({
        count: response.data.count,
        theDossiers: response.data.theDossiers || []
      });
    } catch (error) {
      console.error('Error checking entity association:', error);
      setEntityDossierInfo({
        count: 0,
        theDossiers: []
      });
    }
  };

  // Check dossier association for grades
  const checkGradeAssociation = async (gradeId) => {
    try {
      const response = await axiosClient.post(CHECK_GRADE_ASSOCIATION_URL, { id: gradeId });
      setGradeDossierInfo({
        count: response.data.count,
        theDossiers: response.data.theDossiers || []
      });
    } catch (error) {
      console.error('Error checking grade association:', error);
      setGradeDossierInfo({
        count: 0,
        theDossiers: []
      });
    }
  };

  useEffect(() => { 
    fetchAllData(); 
  }, []);

  // Operation handler for affectations
  const handleAffectationOperation = async (operation, data = {}) => {
    try {
      const payload = {
        operation: operation,
        valuer: operation === 'ajout' ? data.nom_d_affectation : 
               operation === 'modification' ? updatedValue : null,
        id: operation !== 'ajout' ? data.id : null
      };

      const response = await axiosClient.post(HANDLE_AFFECTATION_URL, payload);
      alert(response.data.message);
      await fetchAllData();
      
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
      await fetchAllData();
      
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
      alert(response.data.message);
      await fetchAllData();
      
      setSelectedEntityToDelete('');
      setEntityDossierInfo({ count: 0, theDossiers: [] });
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
      await fetchAllData();
      
      setSelectedEntityToUpdate('');
      setUpdatedEntity({ name: '', unitId: '' });
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle add corps
  const handleAddCorps = async () => {
    try {
      const response = await axiosClient.post(HANDLE_CORPS_URL, {
        operation: 'ajout',
        nom_de_corps: newCorps
      });
      alert(response.data.message);
      await fetchAllData();
      setNewCorps('');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle delete corps
  const handleDeleteCorps = async () => {
    try {
      const response = await axiosClient.post(HANDLE_CORPS_URL, {
        operation: 'suppression',
        id: selectedCorpsToDelete
      });
      alert(response.data.message);
      await fetchAllData();
      setSelectedCorpsToDelete('');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle add grade
  const handleAddGrade = async () => {
    try {
      const response = await axiosClient.post(HANDLE_GRADE_URL, {
        operation: 'ajout',
        nom_grade: newGrade.name,
        corp_id: newGrade.corpsId
      });
      alert(response.data.message);
      await fetchAllData();
      setNewGrade({ name: '', corpsId: '' });
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle delete grade
  const handleDeleteGrade = async () => {
    try {
      const response = await axiosClient.post(HANDLE_GRADE_URL, {
        operation: 'suppression',
        id: selectedGradeToDelete
      });
      alert(response.data.message);
      await fetchAllData();
      setSelectedGradeToDelete('');
      setSelectedCorpsForDelete('');
      setGradeDossierInfo({ count: 0, theDossiers: [] });
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle update grade
  const handleUpdateGrade = async () => {
    try {
      const response = await axiosClient.post(HANDLE_GRADE_URL, {
        operation: 'modification',
        id: selectedGradeToUpdate,
        nom_grade: updatedGrade.name,
        corp_id: updatedGrade.corpsId
      });
      alert(response.data.message);
      await fetchAllData();
      setSelectedGradeToUpdate('');
      setUpdatedGrade({ name: '', corpsId: '' });
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Separate dossiers into archived and non-archived
  const nonArchivedDossiers = modalContentType === 'affectation' 
    ? dossierInfo.theDossiers.filter(d => !d.arch_dossier)
    : modalContentType === 'entity'
      ? entityDossierInfo.theDossiers.filter(d => !d.arch_dossier)
      : gradeDossierInfo.theDossiers.filter(d => !d.arch_dossier);
  
  const archivedDossiers = modalContentType === 'affectation'
    ? dossierInfo.theDossiers.filter(d => d.arch_dossier)
    : modalContentType === 'entity'
      ? entityDossierInfo.theDossiers.filter(d => d.arch_dossier)
      : gradeDossierInfo.theDossiers.filter(d => d.arch_dossier);

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="w-full p-4 space-y-6">
      {/* Dossier Details Modal */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDossierModal(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              ref={modalRef}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    {modalContentType === 'affectation' 
                      ? "Détails des dossiers associés (Affectation)"
                      : modalContentType === 'entity'
                        ? "Détails des dossiers associés (Entité)"
                        : "Détails des dossiers associés (Grade)"}
                  </h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDossierModal(false);
                    }}
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

      {/* Affectations Section */}
      <div className="relative rounded-lg shadow-md overflow-hidden border border-gray-200 w-full min-h-[14.85rem]">
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${
          selectedButton === 'suppression' ? 'bg-red-500' : 
          selectedButton === 'ajout' ? 'bg-green-500' : 
          'bg-blue-500'
        }`}></div>
        
        <div className="flex p-4 space-x-4">
          {['suppression', 'ajout', 'modification'].map((op) => (
            <button
              key={op}
              onClick={() => {
                setSelectedButton(op);
                setDossierInfo({ count: 0, theDossiers: [] }); 
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
        
        <div className="p-6 space-y-6">
          {/* Delete form */}
          {selectedButton === 'suppression' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Suppression</h2>
              <div className="flex space-x-4">
                <select
                  value={selectedToDelete}
                  onChange={async (e) => {
                    setSelectedToDelete(e.target.value);
                    if (e.target.value) {
                      await checkDossierAssociation(e.target.value);
                    } else {
                      setDossierInfo({ count: 0, theDossiers: [] });
                    }
                  }}
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
                  Valider
                </button>
              </div>
              {dossierInfo.count > 0 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="text-yellow-700">
                      Attention: Cette affectation est associée à {dossierInfo.count} dossier(s).
                    </p>
                    <button
                      onClick={() => {
                        setModalContentType('affectation');
                        setShowDossierModal(true);
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              )}
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
                  Valider
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
                      onChange={async (e) => {
                        const selected = affectations.find(a => a.id == e.target.value);
                        setSelectedToUpdate(e.target.value);
                        setUpdatedValue(selected?.nom_d_affectation || '');
                        if (e.target.value) {
                          await checkDossierAssociation(e.target.value);
                        } else {
                          setDossierInfo({ count: 0, theDossiers: [] });
                        }
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
                  {dossierInfo.count > 0 && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <p className="text-yellow-700">
                          Note: Cette affectation est associée à {dossierInfo.count} dossier(s).
                        </p>
                        <button
                          onClick={() => {
                            setModalContentType('affectation');
                            setShowDossierModal(true);
                          }}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                        >
                          Voir détails
                        </button>
                      </div>
                    </div>
                  )}
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
                  {dossierInfo.count > 0 && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <p className="text-yellow-700">
                          Note: Cette affectation est associée à {dossierInfo.count} dossier(s).
                        </p>
                        <button
                          onClick={() => {
                            setModalContentType('affectation');
                            setShowDossierModal(true);
                          }}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                        >
                          Voir détails
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Entities Section */}
      <div className="relative rounded-lg shadow-md overflow-hidden border border-gray-200 w-full min-h-[14.85rem]">
        {/* Operation indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${
          entitiesSectionMode === 'ajout' ? 'bg-green-500' : 
          entitiesSectionMode === 'modification' ? 'bg-blue-500' :
          'bg-red-500'
        }`}></div>
        
        {/* Operation tabs */}
        <div className="flex p-4 space-x-4">
          {['ajout', 'modification', 'suppression'].map((op) => (
            <button
              key={op}
              onClick={() => {
                setEntitiesSectionMode(op);
                setEntityDossierInfo({ count: 0, theDossiers: [] });
              }}
              className={`flex-1 py-2 rounded-md font-medium ${
                entitiesSectionMode === op
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
        
        <div className="p-6 space-y-6">
          {/* Add Entity Form */}
          {entitiesSectionMode === 'ajout' && (
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
          {entitiesSectionMode === 'modification' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Modifier une Entité</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Entité:</label>
                  <select
                    value={selectedEntityToUpdate}
                    onChange={async (e) => {
                      const selected = entitiesData.entite.find(ent => ent.id == e.target.value);
                      setSelectedEntityToUpdate(e.target.value);
                      setUpdatedEntity({
                        name: selected?.nom_entite || '',
                        unitId: selected?.unite_organi_id || ''
                      });
                      if (e.target.value) {
                        await checkEntityAssociation(e.target.value);
                      } else {
                        setEntityDossierInfo({ count: 0, theDossiers: [] });
                      }
                    }}
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Sélectionner une entité</option>
                    {entitiesData.entite.map(entity => (
                      <option key={entity.id} value={entity.id}>{entity.nom_entite}</option>
                    ))}
                  </select>
                </div>
                
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
                    {entityDossierInfo.count > 0 && (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md">
                        <div className="flex justify-between items-center">
                          <p className="text-yellow-700">
                            Attention: Cette entité est associée à {entityDossierInfo.count} dossier(s).
                          </p>
                          <button
                            onClick={() => {
                              setModalContentType('entity');
                              setShowDossierModal(true);
                            }}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                          >
                            Voir détails
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setSelectedEntityToUpdate('');
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
          {entitiesSectionMode === 'suppression' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Supprimer une Entité</h2>
              <div className="flex space-x-4">
                <select
                  value={selectedEntityToDelete}
                  onChange={async (e) => {
                    setSelectedEntityToDelete(e.target.value);
                    if (e.target.value) {
                      await checkEntityAssociation(e.target.value);
                    } else {
                      setEntityDossierInfo({ count: 0, theDossiers: [] });
                    }
                  }}
                  className="flex-1 p-2 border rounded-md"
                >
                  <option value="">Sélectionner une entité</option>
                  {entitiesData.entite.map(entity => (
                    <option key={entity.id} value={entity.id}>{entity.nom_entite}</option>
                  ))}
                </select>
                <button
                  onClick={handleDeleteEntity}
                  disabled={!selectedEntityToDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-red-300"
                >
                  Supprimer
                </button>
              </div>
              {entityDossierInfo.count > 0 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="text-yellow-700">
                      Attention: Cette entité est associée à {entityDossierInfo.count} dossier(s).
                    </p>
                    <button
                      onClick={() => {
                        setModalContentType('entity');
                        setShowDossierModal(true);
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Corps and Grades Section */}
      <div className="relative rounded-lg shadow-md overflow-hidden border border-gray-200 w-full min-h-[14.85rem]">
        {/* Operation indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${
          corpsGradesSectionMode === 'ajout' ? 'bg-green-500' : 
          corpsGradesSectionMode === 'modification' ? 'bg-blue-500' :
          'bg-red-500'
        }`}></div>
        
        {/* Operation tabs */}
        <div className="flex p-4 space-x-4">
          {['ajout', 'modification', 'suppression'].map((op) => (
            <button
              key={op}
              onClick={() => {
                setCorpsGradesSectionMode(op);
                setGradeDossierInfo({ count: 0, theDossiers: [] });
                setSelectedGradeToUpdate('');
                setUpdatedGrade({ name: '', corpsId: '' });
                setSelectedGradeToDelete('');
                setSelectedCorpsForDelete('');
              }}
              className={`flex-1 py-2 rounded-md font-medium ${
                corpsGradesSectionMode === op
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
        
        <div className="p-6 space-y-6">
          {/* Add Corps/Grade Form */}
          {corpsGradesSectionMode === 'ajout' && (
            <div className="space-y-6">
              

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ajouter un Grade</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="w-1/4">Corps:</label>
                    <select
                      value={newGrade.corpsId}
                      onChange={(e) => setNewGrade({...newGrade, corpsId: e.target.value})}
                      className="flex-1 p-2 border rounded-md"
                    >
                      <option value="">Sélectionner un corps</option>
                      {corpsGradesData.corps.map(corps => (
                        <option key={corps.id} value={corps.id}>{corps.nom_de_corps}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="w-1/4">Nom Grade:</label>
                    <input
                      type="text"
                      value={newGrade.name}
                      onChange={(e) => setNewGrade({...newGrade, name: e.target.value})}
                      placeholder="Nom du grade"
                      className="flex-1 p-2 border rounded-md"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddGrade}
                      disabled={!newGrade.name.trim() || !newGrade.corpsId}
                      className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update Grade Form */}
          {corpsGradesSectionMode === 'modification' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Modifier un Grade</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Corps:</label>
                  <select
                    value={updatedGrade.corpsId}
                    onChange={async (e) => {
                      const corpsId = e.target.value;
                      setUpdatedGrade({
                        ...updatedGrade,
                        corpsId,
                        name: ''
                      });
                      setSelectedGradeToUpdate('');
                    }}
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Sélectionner un corps</option>
                    {corpsGradesData.corps.map(corps => (
                      <option key={corps.id} value={corps.id}>{corps.nom_de_corps}</option>
                    ))}
                  </select>
                </div>

                {updatedGrade.corpsId && (
                  <div className="flex items-center space-x-4">
                    <label className="w-1/4">Grade:</label>
                    {selectedGradeToUpdate ? (
                      <input
                        type="text"
                        value={updatedGrade.name}
                        onChange={(e) => setUpdatedGrade({...updatedGrade, name: e.target.value})}
                        className="flex-1 p-2 border rounded-md"
                      />
                    ) : (
                      <select
                        value={selectedGradeToUpdate}
                        onChange={async (e) => {
                          const selected = corpsGradesData.grades.find(g => g.id == e.target.value);
                          setSelectedGradeToUpdate(e.target.value);
                          setUpdatedGrade({
                            name: selected?.nom_grade || '',
                            corpsId: selected?.corp_id || ''
                          });
                          if (e.target.value) {
                            await checkGradeAssociation(e.target.value);
                          } else {
                            setGradeDossierInfo({ count: 0, theDossiers: [] });
                          }
                        }}
                        className="flex-1 p-2 border rounded-md"
                      >
                        <option value="">Sélectionner un grade</option>
                        {corpsGradesData.grades
                          .filter(grade => grade.corp_id == updatedGrade.corpsId)
                          .map(grade => (
                            <option key={grade.id} value={grade.id}>{grade.nom_grade}</option>
                          ))}
                      </select>
                    )}
                  </div>
                )}

                {selectedGradeToUpdate && (
                  <>
                    {gradeDossierInfo.count > 0 && (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md">
                        <div className="flex justify-between items-center">
                          <p className="text-yellow-700">
                            Attention: Ce grade est associé à {gradeDossierInfo.count} dossier(s).
                          </p>
                          <button
                            onClick={() => {
                              setModalContentType('grade');
                              setShowDossierModal(true);
                            }}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                          >
                            Voir détails
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setSelectedGradeToUpdate('');
                          setUpdatedGrade({ name: '', corpsId: '' });
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleUpdateGrade}
                        disabled={!updatedGrade.name.trim()}
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

          {/* Delete Corps/Grade Form */}
          {corpsGradesSectionMode === 'suppression' && (
            <div className="space-y-6">


              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Supprimer un Grade</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="w-1/4">Corps:</label>
                    <select
                      value={selectedCorpsForDelete}
                      onChange={(e) => {
                        setSelectedCorpsForDelete(e.target.value);
                        setSelectedGradeToDelete('');
                        setGradeDossierInfo({ count: 0, theDossiers: [] });
                      }}
                      className="flex-1 p-2 border rounded-md"
                    >
                      <option value="">Sélectionner un corps</option>
                      {corpsGradesData.corps.map(corps => (
                        <option key={corps.id} value={corps.id}>{corps.nom_de_corps}</option>
                      ))}
                    </select>
                  </div>

                  {selectedCorpsForDelete && (
                    <div className="flex items-center space-x-4">
                      <label className="w-1/4">Grade:</label>
                      <select
                        value={selectedGradeToDelete}
                        onChange={async (e) => {
                          setSelectedGradeToDelete(e.target.value);
                          if (e.target.value) {
                            await checkGradeAssociation(e.target.value);
                          } else {
                            setGradeDossierInfo({ count: 0, theDossiers: [] });
                          }
                        }}
                        className="flex-1 p-2 border rounded-md"
                      >
                        <option value="">Sélectionner un grade</option>
                        {corpsGradesData.grades
                          .filter(grade => grade.corp_id == selectedCorpsForDelete)
                          .map(grade => (
                            <option key={grade.id} value={grade.id}>{grade.nom_grade}</option>
                          ))}
                      </select>
                    </div>
                  )}

                  {selectedCorpsForDelete && corpsGradesData.grades.filter(grade => grade.corp_id == selectedCorpsForDelete).length === 0 && (
                    <div className="text-gray-500 text-sm mt-2">
                      Aucun grade disponible pour ce corps
                    </div>
                  )}

                  {gradeDossierInfo.count > 0 && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <p className="text-yellow-700">
                          Attention: Ce grade est associé à {gradeDossierInfo.count} dossier(s).
                        </p>
                        <button
                          onClick={() => {
                            setModalContentType('grade');
                            setShowDossierModal(true);
                          }}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                        >
                          Voir détails
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleDeleteGrade}
                      disabled={!selectedGradeToDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-red-300"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}