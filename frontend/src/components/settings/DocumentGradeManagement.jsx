import React, { useState, useEffect } from 'react';
import { axiosClient } from '../../Api/axios';

const DocumentGradeManagement = () => {
  const [mode, setMode] = useState('ajout');
  const [corps, setCorps] = useState([]);
  const [grades, setGrades] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [selectedCorpsId, setSelectedCorpsId] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedGrades, setExpandedGrades] = useState([]);
  
  // Ajout state
  const [newDocType, setNewDocType] = useState({
    generalTypeId: '',
    name: ''
  });
  
  // Modification state
  const [selectedGeneralTypeForUpdate, setSelectedGeneralTypeForUpdate] = useState('');
  const [selectedDocTypeForUpdate, setSelectedDocTypeForUpdate] = useState('');
  const [updatedDocType, setUpdatedDocType] = useState({
    generalTypeId: '',
    name: ''
  });
  
  // Suppression state
  const [selectedGeneralTypeForDelete, setSelectedGeneralTypeForDelete] = useState('');
  const [selectedDocTypeForDelete, setSelectedDocTypeForDelete] = useState('');

  const API_BASE = 'http://localhost:8000/api';
  const GET_CORPS_URL = `${API_BASE}/get-doc-corp`;
  const GET_GRADES_DOCS_URL = `${API_BASE}/get-doc-grade`;
  const HANDLE_DOC_TYPE_URL = `${API_BASE}/handle-doc-type`;
  const HANDLE_DOC_ATTACHMENT_URL = `${API_BASE}/handle-attachement`;

  const fetchCorps = async () => {
    try {
      const response = await axiosClient.get(GET_CORPS_URL);
      setCorps(response.data.corp || []);
      // Automatically select the first corps if available
      if (response.data.corp?.length > 0) {
        setSelectedCorpsId(response.data.corp[0].id);
      }
    } catch (error) {
      console.error('Error fetching corps:', error);
    }
  };

  const fetchGradesAndDocTypes = async (corpsId) => {
    if (!corpsId) return;
    try {
      const response = await axiosClient.post(GET_GRADES_DOCS_URL, { id: corpsId });
      setGrades(response.data.grades || []);
      setDocTypes(response.data.type_docs || []);
      setExpandedGrades([]); // Reset expanded grades when corps changes
    } catch (error) {
      console.error('Error fetching grades and doc types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCorps();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchGradesAndDocTypes(selectedCorpsId);
  }, [selectedCorpsId]);

  const getGeneralTypes = () => {
    return docTypes.filter(doc => doc.parent_general_id === null);
  };

  const getDocTypesByGeneralType = (generalTypeId) => {
    return docTypes.filter(doc => doc.parent_general_id == generalTypeId);
  };

  const toggleGradeExpansion = (gradeId) => {
    if (expandedGrades.includes(gradeId)) {
      setExpandedGrades(expandedGrades.filter(id => id !== gradeId));
    } else {
      setExpandedGrades([...expandedGrades, gradeId]);
    }
  };

  const isDocAssociated = (grade, docId) => {
    return grade.type_de_documents.some(doc => doc.id === docId);
  };

  const handleDocAttachment = async (gradeId, docId) => {
    const grade = grades.find(g => g.id === gradeId);
    const isCurrentlyAttached = isDocAssociated(grade, docId);
    
    // Get all currently attached document IDs for this grade
    const currentAttachedDocIds = grade.type_de_documents.map(doc => doc.id);
    
    // Prepare the new list of document IDs
    let newDocIds;
    if (isCurrentlyAttached) {
      newDocIds = currentAttachedDocIds.filter(id => id !== docId);
    } else {
      newDocIds = [...currentAttachedDocIds, docId];
    }
  
    try {
      const payload = {
        id: gradeId,
        type_docs: newDocIds
      };
  
      const response = await axiosClient.post(HANDLE_DOC_ATTACHMENT_URL, payload);
      
      // Update local state instead of full refresh
      setGrades(prevGrades => 
        prevGrades.map(grade => {
          if (grade.id === gradeId) {
            const docType = docTypes.find(doc => doc.id === docId);
            if (isCurrentlyAttached) {
              // Remove the document
              return {
                ...grade,
                type_de_documents: grade.type_de_documents.filter(doc => doc.id !== docId)
              };
            } else {
              // Add the document
              return {
                ...grade,
                type_de_documents: [...grade.type_de_documents, docType]
              };
            }
          }
          return grade;
        })
      );
      
      alert(`Backend response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

const confirmAndAddDocType = async () => {
  const payload = {
    operation: 'ajout',
    id: newDocType.generalTypeId,
    doc: {
      nom_de_type: newDocType.name,
      type_general: getGeneralTypes().find(t => t.id == newDocType.generalTypeId)?.type_general,
      categorie: "primaire",
      parent_general_id: newDocType.generalTypeId,
      obligatoire: 1 // Always set to obligatory
    }
  };
  
  if (window.confirm(`Voulez-vous vraiment ajouter ce type de document?\n${JSON.stringify(payload, null, 2)}`)) {
    try {
      const response = await axiosClient.post(HANDLE_DOC_TYPE_URL, payload);
      alert(`Document type added: ${JSON.stringify(response.data)}`);
      if (selectedCorpsId) {
        await fetchGradesAndDocTypes(selectedCorpsId);
      }
      setNewDocType({
        generalTypeId: '',
        name: ''
      });
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  }
};

  const confirmAndUpdateDocType = async () => {
    const payload = {
      operation: 'modification',
      id: selectedDocTypeForUpdate,
      id_general_type: updatedDocType.generalTypeId,
      doc: {
        nom_de_type: updatedDocType.name,
        type_general: getGeneralTypes().find(t => t.id == updatedDocType.generalTypeId)?.type_general,
        categorie: "primaire",
        parent_general_id: updatedDocType.generalTypeId
      }
    };
    
    if (window.confirm(`Voulez-vous vraiment modifier ce type de document?\n${JSON.stringify(payload, null, 2)}`)) {
      try {
        const response = await axiosClient.post(HANDLE_DOC_TYPE_URL, payload);
        alert(`Document type updated: ${JSON.stringify(response.data)}`);
        if (selectedCorpsId) {
          await fetchGradesAndDocTypes(selectedCorpsId);
        }
        setSelectedGeneralTypeForUpdate('');
        setSelectedDocTypeForUpdate('');
        setUpdatedDocType({
          generalTypeId: '',
          name: ''
        });
      } catch (error) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const confirmAndDeleteDocType = async () => {
    const payload = {
      operation: 'suppression',
      id: selectedDocTypeForDelete
    };
    
    if (window.confirm(`Voulez-vous vraiment supprimer ce type de document?\n${JSON.stringify(payload, null, 2)}`)) {
      try {
        const response = await axiosClient.post(HANDLE_DOC_TYPE_URL, payload);
        alert(`Document type deleted: ${JSON.stringify(response.data)}`);
        if (selectedCorpsId) {
          await fetchGradesAndDocTypes(selectedCorpsId);
        }
        setSelectedGeneralTypeForDelete('');
        setSelectedDocTypeForDelete('');
      } catch (error) {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Corps Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <label className="w-1/4">Sélectionner un Corps:</label>
          <select
            value={selectedCorpsId}
            onChange={(e) => setSelectedCorpsId(e.target.value)}
            className="flex-1 p-2 border rounded-md"
          >
            {corps.length === 0 ? (
              <option value="">Chargement des corps...</option>
            ) : (
              <>
                <option value="">Sélectionner un corps</option>
                {corps.map(corps => (
                  <option key={corps.id} value={corps.id}>{corps.nom_de_corps}</option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      {/* Grades Table */}
      {selectedCorpsId && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Documents par Grade</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents Associés
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => {
                    const isExpanded = expandedGrades.includes(grade.id);
                    return (
                      <React.Fragment key={grade.id}>
                        <tr 
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleGradeExpansion(grade.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              {grade.nom_grade}
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
                            {grade.type_de_documents.length > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {grade.type_de_documents.length} document(s)
                              </span>
                            ) : (
                              <span className="text-gray-400">Aucun</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGradeExpansion(grade.id);
                              }}
                              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              {isExpanded ? 'Masquer' : 'Afficher'} les documents
                            </button>
                          </td>
                        </tr>
                        
                        {isExpanded && (
  <tr className="bg-gray-50">
    <td colSpan="3" className="px-0 py-0">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obligatoire</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Attachement</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {docTypes.filter(doc => doc.parent_general_id !== null).map((docType) => {
            const isAttached = isDocAssociated(grade, docType.id);
            return (
              <tr key={docType.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {docType.nom_de_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {docType.type_general}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {docType.obligatoire === 1 ? 'Oui' : 'Non'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDocAttachment(grade.id, docType.id);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      isAttached
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {isAttached ? 'Attaché' : 'Non attaché'}
                  </button>
                </td>
              </tr>
            );
          })}
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
      )}

      {/* Document Type Management Section */}
      <div className="relative rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${
          mode === 'ajout' ? 'bg-green-500' : 
          mode === 'modification' ? 'bg-blue-500' :
          'bg-red-500'
        }`}></div>
        
        <div className="flex p-4 space-x-4">
          {['ajout', 'modification', 'suppression'].map((op) => (
            <button
              key={op}
              onClick={() => setMode(op)}
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
          {/* Ajout Form */}
          {mode === 'ajout' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ajouter un Type de Document</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Type Général:</label>
                  <select
                    value={newDocType.generalTypeId}
                    onChange={(e) => setNewDocType({...newDocType, generalTypeId: e.target.value})}
                    className="flex-1 p-2 border rounded-md"
                    disabled={getGeneralTypes().length === 0}
                  >
                    {getGeneralTypes().length === 0 ? (
                      <option value="">Aucun type général disponible</option>
                    ) : (
                      <>
                        <option value="">Sélectionner un type général</option>
                        {getGeneralTypes().map(type => (
                          <option key={type.id} value={type.id}>{type.nom_de_type}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Nom du Document:</label>
                  <input
                    type="text"
                    value={newDocType.name}
                    onChange={(e) => setNewDocType({...newDocType, name: e.target.value})}
                    placeholder="Nom du type de document"
                    className="flex-1 p-2 border rounded-md"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={confirmAndAddDocType}
                    disabled={!newDocType.name.trim() || !newDocType.generalTypeId}
                    className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modification Form */}
          {mode === 'modification' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Modifier un Type de Document</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Type Général:</label>
                  <select
                    value={selectedGeneralTypeForUpdate}
                    onChange={(e) => {
                      setSelectedGeneralTypeForUpdate(e.target.value);
                      setSelectedDocTypeForUpdate('');
                    }}
                    className="flex-1 p-2 border rounded-md"
                    disabled={getGeneralTypes().length === 0}
                  >
                    {getGeneralTypes().length === 0 ? (
                      <option value="">Aucun type général disponible</option>
                    ) : (
                      <>
                        <option value="">Sélectionner un type général</option>
                        {getGeneralTypes().map(type => (
                          <option key={type.id} value={type.id}>{type.nom_de_type}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {selectedGeneralTypeForUpdate && (
                  <div className="flex items-center space-x-4">
                    <label className="w-1/4">Type de Document:</label>
                    {selectedDocTypeForUpdate ? (
                      <>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center space-x-4">
                            <label className="w-1/4">Nouveau Type Général:</label>
                            <select
                              value={updatedDocType.generalTypeId}
                              onChange={(e) => setUpdatedDocType({
                                ...updatedDocType, 
                                generalTypeId: e.target.value
                              })}
                              className="flex-1 p-2 border rounded-md"
                            >
                              <option value="">Sélectionner un type général</option>
                              {getGeneralTypes().map(type => (
                                <option key={type.id} value={type.id}>{type.nom_de_type}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center space-x-4">
                            <label className="w-1/4">Nouveau Nom:</label>
                            <input
                              type="text"
                              value={updatedDocType.name}
                              onChange={(e) => setUpdatedDocType({
                                ...updatedDocType, 
                                name: e.target.value
                              })}
                              className="flex-1 p-2 border rounded-md"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <select
                        value={selectedDocTypeForUpdate}
                        onChange={(e) => {
                          const selected = docTypes.find(d => d.id == e.target.value);
                          setSelectedDocTypeForUpdate(e.target.value);
                          setUpdatedDocType({
                            generalTypeId: selected?.parent_general_id || '',
                            name: selected?.nom_de_type || ''
                          });
                        }}
                        className="flex-1 p-2 border rounded-md"
                      >
                        <option value="">Sélectionner un type de document</option>
                        {getDocTypesByGeneralType(selectedGeneralTypeForUpdate).map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.nom_de_type}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {selectedDocTypeForUpdate && (
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setSelectedDocTypeForUpdate('');
                        setSelectedGeneralTypeForUpdate('');
                        setUpdatedDocType({
                          generalTypeId: '',
                          name: ''
                        });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirmAndUpdateDocType}
                      disabled={!updatedDocType.name.trim() || !updatedDocType.generalTypeId}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
                    >
                      Enregistrer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suppression Form */}
          {mode === 'suppression' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Supprimer un Type de Document</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-1/4">Type Général:</label>
                  <select
                    value={selectedGeneralTypeForDelete}
                    onChange={(e) => {
                      setSelectedGeneralTypeForDelete(e.target.value);
                      setSelectedDocTypeForDelete('');
                    }}
                    className="flex-1 p-2 border rounded-md"
                    disabled={getGeneralTypes().length === 0}
                  >
                    {getGeneralTypes().length === 0 ? (
                      <option value="">Aucun type général disponible</option>
                    ) : (
                      <>
                        <option value="">Sélectionner un type général</option>
                        {getGeneralTypes().map(type => (
                          <option key={type.id} value={type.id}>{type.nom_de_type}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {selectedGeneralTypeForDelete && (
                  <div className="flex items-center space-x-4">
                    <label className="w-1/4">Type de Document:</label>
                    <select
                      value={selectedDocTypeForDelete}
                      onChange={(e) => setSelectedDocTypeForDelete(e.target.value)}
                      className="flex-1 p-2 border rounded-md"
                    >
                      <option value="">Sélectionner un type de document</option>
                      {getDocTypesByGeneralType(selectedGeneralTypeForDelete).map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.nom_de_type}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedDocTypeForDelete && (
                  <div className="flex justify-end">
                    <button
                      onClick={confirmAndDeleteDocType}
                      disabled={!selectedDocTypeForDelete}
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
    </div>
  );
};

export default DocumentGradeManagement;