import { useState, Fragment, useEffect, useRef } from 'react';
import { 
  FaEdit, 
  FaInfoCircle, 
  FaFileAlt, 
  FaExclamationTriangle, 
  FaGavel, 
  FaSync, 
  FaChevronLeft, 
  FaChevronRight,
  FaSearch,
  FaFilter,
  FaTimes
} from 'react-icons/fa';
import { MdDelete } from "react-icons/md";
import { Link } from 'react-router-dom';
import { axiosClient } from './Api/axios';
import { motion } from 'framer-motion';

export default function EmployeeDirectory() {
  const [expandedRows, setExpandedRows] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSections, setCurrentSections] = useState({});
  const [selectSearch, setSelectSearch] = useState("");
  const [selectGrade, setSelectGrade] = useState("");
  const [curCheckBox, setCurCheckBox] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFiltersUsed, setAdvancedFiltersUsed] = useState(false);
  const modalRef = useRef(null);

  // New state for advanced filters
  const [theAvertis, setTheAvertis] = useState("");
  const [firstDate, setFirstData] = useState("");
  const [secondeDate, setSecondeData] = useState("");
  const [docStatusFilter, setDocStatusFilter] = useState("");

  const statuts = ["En activité", "Retraité", "Détache entrant","Détache sortant","Mise en disponibilité","Décès"];
  const sections = [
    { name: 'Infos Supplémentaires', icon: <FaFileAlt className="inline mr-1" /> },
    { name: 'Caractéristiques Physiques', icon: '📦' },
    { name: 'Documents', icon: '📄' },
    { name: 'Sous-documents', icon: '📁' }
  ];

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAdvancedFilters(false);
      }
    }

    if (showAdvancedFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdvancedFilters]);

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

  const getGradesByCorps = (corps) => {
    switch (corps) {
      case "Administrateurs":
        return [
          "Administrateur 2ème grade",
          "Administrateur 3ème grade",
          "Administrateur 3ème grade"
        ];
      case "Ingénieurs d'État":
        return [
          "Ingénieur d'état 1er grade",
          "Principal",
          "Hors grade"
        ];
      case "Techniciens":
        return [
          "Technicien 2ème grade",
          "Technicien 3ème grade",
          "Principal"
        ];
      case "Inspecteurs":
        return [
          "Inspecteur",
          "Inspecteur principal"
        ];
      case "Adjoints techniques":
        return [
          "Adjoint technique 2ème grade",
          "Adjoint technique 1er grade"
        ];
      default:
        return Array.from(new Set(originalData.map((emp) => emp.infosSupp.grade)));
    }
  };

  // Compute document summary for filtering
  const isDocumentComplete = (detail) => {
    return detail.filter(doc => doc.isRequired && !doc.isSubmitted).length === 0;
  };

  const filterData = (searchValue, corpsValue, gradeValue, statutsSelected) => {
    const lowerSearch = searchValue.toLowerCase();

    const filtered = originalData.filter((employee) => {
      const matchesSearch =
        employee.dossier.toLowerCase().includes(lowerSearch) ||
        employee.matricule.toLowerCase().includes(lowerSearch) ||
        employee.nom.fr.toLowerCase().includes(lowerSearch) ||
        employee.nom.ar.includes(lowerSearch);

      const matchesCorps = corpsValue === "" || employee.corps === corpsValue;
      const matchesGrade = gradeValue === "" || employee.infosSupp.grade === gradeValue;
      const matchesStatut =
        statutsSelected.length === 0 || statutsSelected.includes(employee.statut);

      const matchesAvertis =
        theAvertis !== "" && theAvertis !== null && theAvertis !== undefined
          ? employee.infosSupp.avertissements == theAvertis
          : true;

      const empDate = new Date(employee.infosSupp.dateAffectation);
      const first = firstDate ? new Date(firstDate) : null;
      const second = secondeDate ? new Date(secondeDate) : null;

      let matchesDate = true;
      if (!first && second) {
        matchesDate = empDate >= second;
      } else if (first && !second) {
        matchesDate = empDate >= first;
      } else if (first && second) {
        matchesDate = empDate >= first && empDate <= second;
      }

      const isComplete = isDocumentComplete(employee.docsStatus.detail);
      const matchesDocStatus =
        docStatusFilter === "" ||
        (docStatusFilter === "Complet" && isComplete) ||
        (docStatusFilter === "Incomplet" && !isComplete);

      return matchesSearch && matchesCorps && matchesGrade && matchesStatut && 
             matchesAvertis && matchesDate && matchesDocStatus;
    });

    setFilteredData(filtered);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    filterData(value, selectSearch, selectGrade, curCheckBox);
  };

  const handleSelectChange = (value) => {
    setSelectSearch(value);
    setSelectGrade("");
    filterData(searchTerm, value, "", curCheckBox);
  };

  const handleGradeChange = (value) => {
    setSelectGrade(value);
    filterData(searchTerm, selectSearch, value, curCheckBox);
  };

  const handleStatutCheck = (statut) => {
    const updatedCheckbox = curCheckBox.includes(statut)
      ? curCheckBox.filter((s) => s !== statut)
      : [...curCheckBox, statut];

    setCurCheckBox(updatedCheckbox);
    filterData(searchTerm, selectSearch, selectGrade, updatedCheckbox);
  };

  // New handlers for advanced filters
  const handleAvertis = (avertis) => {
    setTheAvertis(avertis);
    setAdvancedFiltersUsed(true);
    filterData(searchTerm, selectSearch, selectGrade, curCheckBox);
  };

  const handleDate = (first, second) => {
    if (first && second && new Date(first) > new Date(second)) {
      alert("Erreur : La première date est après la deuxième.");
      return;
    }
    setFirstData(first);
    setSecondeData(second);
    setAdvancedFiltersUsed(true);
    filterData(searchTerm, selectSearch, selectGrade, curCheckBox);
  };

  const clearDates = () => {
    setFirstData("");
    setSecondeData("");
    setAdvancedFiltersUsed(false);
    filterData(searchTerm, selectSearch, selectGrade, curCheckBox);
  };

  const handleDocStatusFilter = (value) => {
    setDocStatusFilter(value);
    setAdvancedFiltersUsed(true);
    filterData(searchTerm, selectSearch, selectGrade, curCheckBox);
  };

  const resetAllFilters = () => {
    setTheAvertis("");
    setFirstData("");
    setSecondeData("");
    setDocStatusFilter("");
    setAdvancedFiltersUsed(false);
    filterData(searchTerm, selectSearch, selectGrade, curCheckBox);
  };

  const gradesToShow = getGradesByCorps(selectSearch);

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
    
    return (
      <motion.div
        key={currentSection}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {currentSection === 0 && (
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
        )}
        {currentSection === 1 && (
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
        )}
        {currentSection === 2 && (
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
        )}
        {currentSection === 3 && (
          Object.keys(employee.subDocs).length > 0 ? (
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
          )
        )}
      </motion.div>
    );
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

        {/* Search and Filters - Horizontal Layout */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Rechercher dossier, matricule ou nom..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Corps Filter */}
            <div className="flex-1 min-w-[150px]">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectSearch}
                onChange={(e) => handleSelectChange(e.target.value)}
              >
                <option value="">Tous les corps</option>
                <option value="Administrateurs">Administrateurs</option>
                <option value="Ingénieurs d'État">Ingénieurs d'État</option>
                <option value="Techniciens">Techniciens</option>
                <option value="Adjoints techniques">Adjoints techniques</option>
                <option value="Inspecteurs">Inspecteurs</option>
              </select>
            </div>

            {/* Grade Filter */}
            <div className="flex-1 min-w-[150px]">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectGrade}
                onChange={(e) => handleGradeChange(e.target.value)}
              >
                <option value="">Tous les grades</option>
                {gradesToShow.length === 0 ? (
                  <option disabled>Selectionner un corps</option>
                ) : (
                  gradesToShow.map((grade, idx) => (
                    <option key={idx} value={grade}>
                      {grade}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 flex-grow">
              {statuts.map((statut) => (
                <label key={statut} className="inline-flex items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={curCheckBox.includes(statut)}
                    onChange={() => handleStatutCheck(statut)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 whitespace-nowrap">
                    {statut}
                  </span>
                </label>
              ))}
            </div>
            
            <button 
              onClick={() => setShowAdvancedFilters(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 relative"
            >
              <FaFilter />
              <span>Advanced</span>
              {advancedFiltersUsed && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters Modal */}
        {showAdvancedFilters && (
          <>
            {/* Blurred background overlay */}
            <div className="fixed inset-0 z-40 backdrop-blur-md bg-black/20"></div>

            {/* Modal container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                ref={modalRef}
                className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto border border-gray-200"
              >
                {/* Modal header */}
                <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white">
                  <h3 className="text-lg font-medium">Filtres Avancés</h3>
                  <button 
                    onClick={() => setShowAdvancedFilters(false)}
                    className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Modal content */}
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Avertissements Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre d'Avertissements
                      </label>
                      <select
                        value={theAvertis}
                        onChange={(e) => handleAvertis(e.target.value)}
                        className="block w-full p-2 border rounded-md"
                      >
                        <option value="">-- Tous --</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3+</option>
                      </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Période d'Affectation
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={firstDate}
                          onChange={(e) => handleDate(e.target.value, secondeDate)}
                          className="block w-full p-2 border rounded-md"
                        />
                        <span className="text-gray-500">à</span>
                        <input
                          type="date"
                          value={secondeDate}
                          onChange={(e) => handleDate(firstDate, e.target.value)}
                          className="block w-full p-2 border rounded-md"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleDate("", secondeDate)}
                          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Effacer date début
                        </button>
                        <button
                          onClick={() => handleDate(firstDate, "")}
                          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Effacer date fin
                        </button>
                        <button
                          onClick={clearDates}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Effacer toutes
                        </button>
                      </div>
                    </div>

                    {/* Document Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Statut des Documents
                      </label>
                      <select
                        value={docStatusFilter}
                        onChange={(e) => handleDocStatusFilter(e.target.value)}
                        className="block w-full p-2 border rounded-md"
                      >
                        <option value="">-- Tous --</option>
                        <option value="Complet">Documents Complets</option>
                        <option value="Incomplet">Documents Incomplets</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Modal footer */}
                <div className="sticky bottom-0 flex justify-between p-4 border-t bg-white">
                  <button 
                    onClick={resetAllFilters}
                    className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                  >
                    Réinitialiser tous les filtres
                  </button>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowAdvancedFilters(false)}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={() => {
                        setAdvancedFiltersUsed(true);
                        setShowAdvancedFilters(false);
                      }}
                      className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dossier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom (FR)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom (AR)</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.nom.fr}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right" dir="rtl">
                          {employee.nom.ar}
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
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
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

                              {renderSectionContent(employee)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm || selectSearch || selectGrade || curCheckBox.length > 0 || 
                       theAvertis || firstDate || secondeDate || docStatusFilter
                        ? 'Aucun résultat trouvé' 
                        : 'Aucune donnée disponible'}
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