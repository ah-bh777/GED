import { useState, Fragment, useEffect } from 'react';
import { 
  FaEdit, 
  FaInfoCircle, 
  FaFileAlt, 
  FaExclamationTriangle, 
  FaGavel, 
  FaSync, 
  FaChevronLeft, 
  FaChevronRight 
} from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import { Link } from 'react-router-dom';
import { axiosClient } from './Api/axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmployeeDirectory() {
  const [expandedRows, setExpandedRows] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSections, setCurrentSections] = useState({});

  const sections = [
    { name: 'Infos Supplémentaires', icon: <FaFileAlt className="mr-1" /> },
    { name: 'Caractéristiques Physiques', icon: '📦' },
    { name: 'Documents', icon: '📄' },
    { name: 'Sous-documents', icon: '📁' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/api/public-data');
      
      const formattedData = response.data.map(item => ({
        id: item.id,
        dossier: item.dossier,
        matricule: item.matricule,
        nom: {
          fr: `${item.fonctionnaire?.user?.prenom_fr} ${item.fonctionnaire?.user?.nom_fr}`,
          ar: `${item.fonctionnaire?.user?.prenom_ar} ${item.fonctionnaire?.user?.nom_ar}`
        },
        corps: item.grade?.corp?.nom_de_corps || 'Non spécifié',
        statut: item.fonctionnaire?.statut || 'Inconnu',
        statutColor: getStatusColor(item.fonctionnaire?.statut),
        docsStatus: getDocsStatus(item),
        actionLabel: "Voir",
        infosSupp: {
          grade: item.grade?.nom_grade || 'Non spécifié',
          nomUnite: item.entite?.unite_organi?.nomUnite || 'Non spécifié',
          entite: item.entite?.nom_entite || 'Non spécifié',
          avertissements: item.avertissements?.length || 0,
          conseils: item.conseil_de_disciplines?.length || 0,
          dateAffectation: item.date_d_affectation || 'Non spécifiée'
        },
        physique: {
          couleur: item.couleur || 'Non spécifiée',
          tiroir: item.tiroir || 'Non spécifié',
          armoire: item.armoire || 'Non spécifiée'
        },
        subDocs: groupSubDocsByDossier(item.documents)
      }));

      setOriginalData(formattedData);
      setFilteredData(formattedData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut) => {
    const statusMap = {
      'En activité': 'green',
      'Mise en disponibilité': 'yellow',
      'Détachement': 'blue',
      'Décès': 'red',
      'Retraite': 'gray'
    };
    return statusMap[statut] || 'gray';
  };

  const getDocsStatus = (item) => {
    const allDocs = item.grade?.type_de_documents || [];
    const submittedDocs = item.documents || [];
    
    const detail = allDocs.map(docType => {
      const submittedDoc = submittedDocs.find(doc => doc.type_de_document_id === docType.id);
      return {
        id: docType.id,
        nom: docType.nom_de_type,
        categorie: docType.categorie,
        isSubmitted: !!submittedDoc,
        isRequired: docType.obligatoire === 1,
        dateDepot: submittedDoc?.date_de_soumission || null
      };
    });
    
    const requiredDocs = detail.filter(doc => doc.isRequired);
    const missingCount = requiredDocs.filter(doc => !doc.isSubmitted).length;
    const summary = missingCount === 0 ? "OK" : "Incomplet";
    
    return { summary, missingCount, detail };
  };

  const groupSubDocsByDossier = (documents) => {
    const grouped = {};
    documents?.forEach(doc => {
      if (doc.sub_docs?.length > 0) {
        grouped[doc.id] = {
          parentDocName: doc.type_de_document?.nom_de_type,
          subDocs: doc.sub_docs.map(sd => sd.note_d_observation)
        };
      }
    });
    return grouped;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRow = (rowId, e) => {
    if (e.target.closest('.action-button')) {
      return;
    }
    setExpandedRows(prev => {
      const newState = { ...prev, [rowId]: !prev[rowId] };
      if (newState[rowId] && currentSections[rowId] === undefined) {
        setCurrentSections(prev => ({ ...prev, [rowId]: 0 }));
      }
      return newState;
    });
  };

  const nextSection = (rowId) => {
    setCurrentSections(prev => ({
      ...prev,
      [rowId]: (prev[rowId] + 1) % sections.length
    }));
  };

  const prevSection = (rowId) => {
    setCurrentSections(prev => ({
      ...prev,
      [rowId]: (prev[rowId] - 1 + sections.length) % sections.length
    }));
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    if (!value) {
      setFilteredData(originalData);
      return;
    }

    const filtered = originalData.filter(employee => 
      employee.dossier.toLowerCase().includes(value) ||
      employee.matricule.toLowerCase().includes(value) ||
      employee.nom.fr.toLowerCase().includes(value) ||
      employee.nom.ar.includes(value) ||
      employee.corps.toLowerCase().includes(value) ||
      employee.statut.toLowerCase().includes(value)
    );

    setFilteredData(filtered);
  };

  const getDocStatusClasses = (doc) => {
    if (!doc.isSubmitted) {
      return doc.isRequired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200';
    }
    return 'bg-green-50 border-green-200';
  };

  const getDocStatusText = (doc) => {
    if (!doc.isSubmitted) {
      return doc.isRequired ? 'Non déposé' : 'Non requis';
    }
    return `Soumis le ${doc.dateDepot}`;
  };

  const getDocStatusTextColor = (doc) => {
    if (!doc.isSubmitted) {
      return doc.isRequired ? 'text-red-600' : 'text-gray-600';
    }
    return 'text-green-600';
  };

  const getStatusClasses = (color) => {
    const classes = {
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return classes[color] || 'bg-gray-100 text-gray-800';
  };

  const renderSectionContent = (employee) => {
    const currentSection = currentSections[employee.id] || 0;
    
    switch(currentSection) {
      case 0:
        return (
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-sm text-gray-500">Grade</p>
              <p>{employee.infosSupp.grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nom Unité</p>
              <p>{employee.infosSupp.nomUnite}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Entité</p>
              <p>{employee.infosSupp.entite}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <FaExclamationTriangle className="mr-1" /> Avertissements
              </p>
              <p>{employee.infosSupp.avertissements}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <FaGavel className="mr-1" /> Conseils
              </p>
              <p>{employee.infosSupp.conseils}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">📅 Date d'affectation</p>
              <p>{employee.infosSupp.dateAffectation}</p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-sm text-gray-500">Couleur</p>
              <p>{employee.physique.couleur}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiroir</p>
              <p>{employee.physique.tiroir}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Armoire</p>
              <p>{employee.physique.armoire}</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {employee.docsStatus.detail.map((doc) => (
              <div 
                key={doc.id} 
                className={`p-3 rounded border ${getDocStatusClasses(doc)}`}
              >
                <p className="font-medium">{doc.nom}</p>
                <p className="text-sm text-gray-500">{doc.categorie}</p>
                <p className={`text-sm mt-1 ${getDocStatusTextColor(doc)}`}>
                  {getDocStatusText(doc)}
                </p>
              </div>
            ))}
          </div>
        );
      case 3:
        return Object.keys(employee.subDocs).length > 0 ? (
          <div className="space-y-2 mt-2">
            {Object.values(employee.subDocs).map((docGroup, idx) => (
              <div key={idx}>
                <p className="font-medium text-sm">{docGroup.parentDocName}:</p>
                <ul className="list-disc list-inside text-sm ml-4">
                  {docGroup.subDocs.map((subDoc, sIdx) => (
                    <li key={sIdx}>{subDoc}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-2">Aucun sous-document disponible</p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Annuaire du Personnel</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchData}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
              title="Actualiser"
              disabled={loading}
            >
              <FaSync className={`${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
            <button 
              onClick={fetchData}
              className="ml-4 text-blue-600 hover:text-blue-800"
            >
              Réessayer
            </button>
          </div>
        )}

        <input
          type="text"
          className="min-w-full p-2 mb-4 rounded border"
          placeholder="Rechercher par nom, matricule, dossier..."
          value={searchTerm}
          onChange={handleSearch}
          disabled={loading}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Dossier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom (FR/AR)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corps</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docs Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((employee) => (
                    <Fragment key={employee.id}>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={(e) => toggleRow(employee.id, e)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.dossier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.matricule}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.nom.fr}
                            </div>
                            <div className="text-sm text-gray-500 text-right" dir="rtl">
                              {employee.nom.ar}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.corps}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(employee.statutColor)}`}>
                            {employee.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.docsStatus.summary === "OK" ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              OK
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Manquant {employee.docsStatus.missingCount}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              className="action-button p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                              title="Modifier"
                            >
                              <FaEdit size={16} />
                            </button>
                            <Link to={`/detail/${employee.id}`}>
                              <button
                                className="action-button p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full"
                                title="Détails"
                              >
                                <FaInfoCircle size={16} />
                              </button>
                            </Link>
                            <button
                              className="action-button p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                              title="Supprimer"
                            >
                              <MdDelete size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[employee.id] && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div className="w-full">
                                <div className="flex justify-between items-center w-full px-4">
                                  <button
                                    onClick={() => prevSection(employee.id)}
                                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                                    title="Précédent"
                                  >
                                    <FaChevronLeft />
                                  </button>
                                  <div className="flex-1 flex justify-between mx-2 overflow-hidden">
                                    {sections.map((section, index) => (
                                      <button
                                        key={index}
                                        onClick={() => setCurrentSections(prev => ({
                                          ...prev,
                                          [employee.id]: index
                                        }))}
                                        className={`px-2 py-1 rounded-full text-sm flex items-center justify-center flex-1 mx-1 min-w-0 truncate ${
                                          currentSections[employee.id] === index
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                      >
                                        <span className="truncate">
                                          {section.icon} 
                                          <span className="hidden sm:inline ml-1">{section.name}</span>
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => nextSection(employee.id)}
                                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                                    title="Suivant"
                                  >
                                    <FaChevronRight />
                                  </button>
                                </div>
                              </div>

                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={currentSections[employee.id] || 0}
                                  initial={{ opacity: 0, x: 50 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -50 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {renderSectionContent(employee)}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'Aucun résultat trouvé' : 'Aucune donnée disponible'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}