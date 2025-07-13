import React, { useState, useEffect, useRef } from 'react';
import { axiosClient } from '../../Api/axios';

const GradesSection = () => {
  const [mode, setMode] = useState('ajout');
  const [gradesData, setGradesData] = useState({ grade: [], corps: [] });
  const [newGrade, setNewGrade] = useState({ name: '', corpsId: '' });
  const [selectedGradeToDelete, setSelectedGradeToDelete] = useState('');
  const [selectedGradeToUpdate, setSelectedGradeToUpdate] = useState('');
  const [updatedGrade, setUpdatedGrade] = useState({ name: '', corpsId: '' });
  const [selectedCorpsForDelete, setSelectedCorpsForDelete] = useState('');
  const [selectedCorpsForUpdate, setSelectedCorpsForUpdate] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedGradeForModal, setSelectedGradeForModal] = useState(null);
  const [dossierCounts, setDossierCounts] = useState({});
  const [expandedCorps, setExpandedCorps] = useState([]);
  const operationSectionRef = useRef(null);

  const API_BASE = 'http://localhost:8000';
  const GET_CORPS_GRADES_URL = `${API_BASE}/api/get-corps-grade`;
  const HANDLE_GRADE_URL = `${API_BASE}/api/handle-grade`;
  const CHECK_GRADE_ASSOCIATION_URL = `${API_BASE}/api/check-association-grade`;

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(GET_CORPS_GRADES_URL);
      const { grade, corps } = response.data;
      setGradesData({ grade: grade || [], corps: corps || [] });
      
      const counts = {};
      for (const gradeItem of grade) {
        const countResponse = await axiosClient.post(CHECK_GRADE_ASSOCIATION_URL, { id: gradeItem.id });
        counts[gradeItem.id] = countResponse.data.count;
      }
      setDossierCounts(counts);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkGradeAssociationForModal = async (gradeId) => {
    try {
      const response = await axiosClient.post(CHECK_GRADE_ASSOCIATION_URL, { id: gradeId });
      setSelectedGradeForModal({
        id: gradeId,
        count: response.data.count,
        theDossiers: response.data.theDossiers || []
      });
    } catch (error) {
      console.error('Error checking association:', error);
    }
  };

  const handleAddGrade = async () => {
    try {
      const response = await axiosClient.post(HANDLE_GRADE_URL, {
        operation: 'ajout',
        nom_grade: newGrade.name,
        corp_id: newGrade.corpsId
      });
      alert(response.data.message);
      await fetchGrades();
      setNewGrade({ name: '', corpsId: '' });
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteGrade = async () => {
    try {
      const response = await axiosClient.post(HANDLE_GRADE_URL, {
        operation: 'suppression',
        id: selectedGradeToDelete
      });
      alert(JSON.stringify(response.data.message));
      await fetchGrades();
      setSelectedGradeToDelete('');
      setSelectedCorpsForDelete('');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateGrade = async () => {
    try {
      const response = await axiosClient.post(HANDLE_GRADE_URL, {
        operation: 'modification',
        id: selectedGradeToUpdate,
        nom_grade: updatedGrade.name,
        corp_id: updatedGrade.corpsId
      });
      alert(response.data.message);
      await fetchGrades();
      setSelectedGradeToUpdate('');
      setSelectedCorpsForUpdate('');
      setUpdatedGrade({ name: '', corpsId: '' });
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const toggleCorpsExpansion = (corpsId) => {
    if (expandedCorps.includes(corpsId)) {
      setExpandedCorps(expandedCorps.filter(id => id !== corpsId));
    } else {
      setExpandedCorps([...expandedCorps, corpsId]);
    }
  };

  const handleRowClick = (corpsId, e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    toggleCorpsExpansion(corpsId);
  };

  const scrollToOperationSection = () => {
    operationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { 
    fetchGrades(); 
  }, []);

  const nonArchivedDossiers = selectedGradeForModal?.theDossiers.filter(d => !d.arch_dossier) || [];
  const archivedDossiers = selectedGradeForModal?.theDossiers.filter(d => d.arch_dossier) || [];

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Corps and Grades Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Liste des Corps et Grades</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Corps
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grades
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gradesData.corps.map((corps) => {
                  const corpsGrades = gradesData.grade.filter(grade => grade.corp_id === corps.id);
                  const isExpanded = expandedCorps.includes(corps.id);
                  
                  return (
                    <React.Fragment key={corps.id}>
                      <tr 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={(e) => handleRowClick(corps.id, e)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {corps.nom_de_corps}
                            <svg
                              className={`ml-2 h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {corpsGrades.length} grade(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMode('ajout');
                              setNewGrade(prev => ({ ...prev, corpsId: corps.id }));
                              scrollToOperationSection();
                            }}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                          >
                            Ajouter Grade
                          </button>
                        </td>
                      </tr>
                      
                      {isExpanded && corpsGrades.length > 0 && (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 bg-gray-50">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dossiers Associés</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {corpsGrades.map((grade) => (
                                  <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {grade.nom_grade}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {dossierCounts[grade.id] > 0 ? (
                                        <span 
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200 transition-colors"
                                          onClick={async () => {
                                            await checkGradeAssociationForModal(grade.id);
                                            setShowDossierModal(true);
                                          }}
                                        >
                                          {dossierCounts[grade.id]} dossier(s)
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">Aucun</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                      <button
                                        onClick={() => {
                                          setMode('modification');
                                          setSelectedGradeToUpdate(grade.id);
                                          setSelectedCorpsForUpdate(grade.corp_id);
                                          setUpdatedGrade({
                                            name: grade.nom_grade,
                                            corpsId: grade.corp_id
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
                                          setSelectedGradeToDelete(grade.id);
                                          setSelectedCorpsForDelete(grade.corp_id);
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Operation Section */}
      <div 
        ref={operationSectionRef}
        className="relative rounded-lg shadow-md overflow-hidden border border-gray-200"
      >
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${
          mode === 'ajout' ? 'bg-green-500' : 
          mode === 'modification' ? 'bg-blue-500' :
          'bg-red-500'
        }`}></div>
        
        <div className="flex p-4 space-x-4">
          {['ajout', 'modification', 'suppression'].map((op) => (
            <button
              key={op}
              onClick={() => {
                setMode(op);
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
        
        <div className="p-6 space-y-6">
          {/* Add Grade Form */}
          {mode === 'ajout' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ajouter un Grade</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Corps:</label>
                  <select
                    value={newGrade.corpsId}
                    onChange={(e) => setNewGrade({...newGrade, corpsId: e.target.value})}
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Sélectionner un corps</option>
                    {gradesData.corps.map(corps => (
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
          )}

          {/* Update Grade Form */}
          {mode === 'modification' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Modifier un Grade</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Corps:</label>
                  <select
                    value={selectedCorpsForUpdate}
                    onChange={(e) => {
                      const corpsId = e.target.value;
                      setSelectedCorpsForUpdate(corpsId);
                      setSelectedGradeToUpdate('');
                    }}
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Sélectionner un corps</option>
                    {gradesData.corps.map(corps => (
                      <option key={corps.id} value={corps.id}>{corps.nom_de_corps}</option>
                    ))}
                  </select>
                </div>

                {selectedCorpsForUpdate && (
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
                        onChange={(e) => {
                          const selected = gradesData.grade.find(g => g.id == e.target.value);
                          setSelectedGradeToUpdate(e.target.value);
                          setUpdatedGrade({
                            name: selected?.nom_grade || '',
                            corpsId: selected?.corp_id || ''
                          });
                        }}
                        className="flex-1 p-2 border rounded-md"
                      >
                        <option value="">Sélectionner un grade</option>
                        {gradesData.grade
                          .filter(grade => grade.corp_id == selectedCorpsForUpdate)
                          .map(grade => (
                            <option key={grade.id} value={grade.id}>{grade.nom_grade}</option>
                          ))}
                      </select>
                    )}
                  </div>
                )}

                {selectedGradeToUpdate && (
                  <>
                    <div className="flex items-center space-x-4">
                      <label className="w-1/4">Nouveau Corps:</label>
                      <select
                        value={updatedGrade.corpsId}
                        onChange={(e) => setUpdatedGrade({...updatedGrade, corpsId: e.target.value})}
                        className="flex-1 p-2 border rounded-md"
                      >
                        <option value="">Sélectionner un corps</option>
                        {gradesData.corps.map(corps => (
                          <option key={corps.id} value={corps.id}>{corps.nom_de_corps}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="w-1/4">Nouveau Nom:</label>
                      <input
                        type="text"
                        value={updatedGrade.name}
                        onChange={(e) => setUpdatedGrade({...updatedGrade, name: e.target.value})}
                        className="flex-1 p-2 border rounded-md"
                      />
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setSelectedGradeToUpdate('');
                          setSelectedCorpsForUpdate('');
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

          {/* Delete Grade Form */}
          {mode === 'suppression' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Supprimer un Grade</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Corps:</label>
                  <select
                    value={selectedCorpsForDelete}
                    onChange={(e) => {
                      setSelectedCorpsForDelete(e.target.value);
                      setSelectedGradeToDelete('');
                    }}
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Sélectionner un corps</option>
                    {gradesData.corps.map(corps => (
                      <option key={corps.id} value={corps.id}>{corps.nom_de_corps}</option>
                    ))}
                  </select>
                </div>

                {selectedCorpsForDelete && (
                  <div className="flex items-center space-x-4">
                    <label className="w-1/4">Grade:</label>
                    <select
                      value={selectedGradeToDelete}
                      onChange={(e) => setSelectedGradeToDelete(e.target.value)}
                      className="flex-1 p-2 border rounded-md"
                    >
                      <option value="">Sélectionner un grade</option>
                      {gradesData.grade
                        .filter(grade => grade.corp_id == selectedCorpsForDelete)
                        .map(grade => (
                          <option key={grade.id} value={grade.id}>{grade.nom_grade}</option>
                        ))}
                    </select>
                  </div>
                )}

                {selectedGradeToDelete && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleDeleteGrade}
                      disabled={!selectedGradeToDelete}
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
      {showDossierModal && selectedGradeForModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDossierModal(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Détails des dossiers associés: {gradesData.grade.find(g => g.id === selectedGradeForModal.id)?.nom_grade}
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

export default GradesSection;