import { useState, useEffect, useRef, Fragment } from 'react';
import { 
  FaInfoCircle,
  FaTrash,
  FaSync, 
  FaSearch,
  FaFilter,
  FaTimes
} from 'react-icons/fa';
import { axiosClient } from './Api/axios';
import { ImBoxAdd } from "react-icons/im";
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';


export default function Archive() {
  const [expandedRows, setExpandedRows] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [couleurFilter, setCouleurFilter] = useState('');
  const [tiroirFilter, setTiroirFilter] = useState('');
  const [armoireFilter, setArmoireFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFiltersUsed, setAdvancedFiltersUsed] = useState(false);
  const modalRef = useRef(null);
  const admin = JSON.parse(localStorage.getItem("ADMIN_INFO"))


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAdvancedFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/api/archived-list');
      
      const formattedData = response.data.data.map(item => ({
        id: item.id,
        dossier_id: item.dossier_id,
        dossier: item.nom_dossier,
        matricule: item.matricule,
        date_archivage: item.date_d_archivage,
        archive_par: item.archive_par_nom_complet,
        fonctionnaire: {
          nom_fr: item.fonctionnaire_nom_fr,
          prenom_fr: item.fonctionnaire_prenom_fr,
          nom_ar: item.fonctionnaire_nom_ar,
          prenom_ar: item.fonctionnaire_prenom_ar
        },
        physique: {
          couleur: item.couleur || 'Non spécifiée',
          tiroir: item.tiroir || 'Non spécifié',
          armoire: item.armoire || 'Non spécifiée'
        }
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

  const filterData = () => {
    const lowerSearch = searchTerm.toLowerCase();
    const lowerCouleur = couleurFilter.toLowerCase();
    const lowerTiroir = tiroirFilter.toLowerCase();
    const lowerArmoire = armoireFilter.toLowerCase();

    const filtered = originalData.filter((item) => {
      const matchesSearch =
        item.dossier.toLowerCase().includes(lowerSearch) ||
        item.matricule.toLowerCase().includes(lowerSearch) ||
        item.archive_par.toLowerCase().includes(lowerSearch) ||
        `${item.fonctionnaire.nom_fr} ${item.fonctionnaire.prenom_fr}`.toLowerCase().includes(lowerSearch);
      
      const matchesCouleur = !lowerCouleur || item.physique.couleur.toLowerCase().includes(lowerCouleur);
      const matchesTiroir = !lowerTiroir || item.physique.tiroir.toLowerCase().includes(lowerTiroir);
      const matchesArmoire = !lowerArmoire || item.physique.armoire.toLowerCase().includes(lowerArmoire);

      let matchesDate = true;
      if (startDateFilter || endDateFilter) {
        const itemDate = new Date(item.date_archivage);
        const startDate = startDateFilter ? new Date(startDateFilter) : null;
        const endDate = endDateFilter ? new Date(endDateFilter) : null;
        
        if (startDate && endDate) {
          matchesDate = itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          matchesDate = itemDate >= startDate;
        } else if (endDate) {
          matchesDate = itemDate <= endDate;
        }
      }

      return matchesSearch && matchesCouleur && matchesTiroir && matchesArmoire && matchesDate;
    });

    setFilteredData(filtered);
    setAdvancedFiltersUsed(
      searchTerm !== '' || 
      couleurFilter !== '' || 
      tiroirFilter !== '' || 
      armoireFilter !== '' ||
      startDateFilter !== '' ||
      endDateFilter !== ''
    );
  };

  useEffect(() => {
    filterData();
  }, [searchTerm, couleurFilter, tiroirFilter, armoireFilter, startDateFilter, endDateFilter, originalData]);

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRow = (rowId, e) => {
    if (e.target.closest('.action-button')) return;
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setCouleurFilter("");
    setTiroirFilter("");
    setArmoireFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setAdvancedFiltersUsed(false);
  };

  const applyDateFilters = () => {
    setShowAdvancedFilters(false);
    filterData();
  };

  const handleDelete = async (id) => {
    
    if (window.confirm("Êtes-vous sûr de vouloir désarchiver ce dossier ?")) {
      try {

       
        await axiosClient.post("/api/unarchive-me",{"id":id});
        await axiosClient.post("/api/tracer-action-table", {
          admin_id: admin?.admin?.id,
          dossier_id: id, 
          type_de_transaction: 3,
          details_de_transaction: "le dossier est desarchivé"
      });


        fetchData();
      } catch (err) {
        alert("Erreur lors de la désarchivage. Veuillez réessayer.");
        
      }
    }
  };

  return (
    <div className="bg-gray-100 p-8 min-h-screen">  
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dossiers Archivés</h1>
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

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Rechercher dossier, matricule ou archivé par..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <input
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Couleur (ex: Rouge)"
                value={couleurFilter}
                onChange={(e) => setCouleurFilter(e.target.value)}
              />
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <input
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Tiroir (ex: Tiroir-2)"
                value={tiroirFilter}
                onChange={(e) => setTiroirFilter(e.target.value)}
              />
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <input
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Armoire"
                value={armoireFilter}
                onChange={(e) => setArmoireFilter(e.target.value)}
              />
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

          {advancedFiltersUsed && (
            <div className="w-full bg-blue-50 rounded-lg p-3 mt-2 border border-blue-100">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-blue-800">Filtres Actifs:</span>
                
                {searchTerm && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Recherche: {searchTerm}
                  </span>
                )}
                {couleurFilter && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Couleur: {couleurFilter}
                  </span>
                )}
                {tiroirFilter && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Tiroir: {tiroirFilter}
                  </span>
                )}
                {armoireFilter && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Armoire: {armoireFilter}
                  </span>
                )}
                {startDateFilter && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Depuis: {new Date(startDateFilter).toLocaleDateString()}
                  </span>
                )}
                {endDateFilter && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Jusqu'à: {new Date(endDateFilter).toLocaleDateString()}
                  </span>
                )}
                
                <button 
                  onClick={resetAllFilters}
                  className="ml-auto text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <FaTimes className="mr-1" /> Effacer tout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Filters Modal */}
        {showAdvancedFilters && (
          <div className="fixed inset-0 backdrop-blur-md bg-transparent flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              ref={modalRef}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Filtres Avancés</h2>
                <button 
                  onClick={() => setShowAdvancedFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setShowAdvancedFilters(false);
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={applyDateFilters}
                >
                  Appliquer
                </button>
              </div>
            </motion.div>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fonctionnaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'archivage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archivé par</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <Fragment key={item.id}>
                      <tr 
                        onClick={(e) => toggleRow(item.id, e)}
                        className="hover:bg-gray-50 cursor-pointer"
                      > 
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.dossier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.matricule}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <p className="font-medium">{item.fonctionnaire.nom_fr} {item.fonctionnaire.prenom_fr}</p>
                            <p className="text-xs text-gray-400">{item.fonctionnaire.nom_ar} {item.fonctionnaire.prenom_ar}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.date_archivage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.archive_par}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-10">
                            <Link to={`/detail-arch/${item.dossier_id}`}>
                            <button 
                              className="action-button text-blue-600 hover:text-blue-800"
                              onClick={ async ()=>{
                                const Object = {
                                  admin_id: admin?.admin?.id,
                                  dossier_id: item.dossier_id, 
                                  type_de_transaction: 3,
                                  details_de_transaction: "la consultation du dossier"
                              };

                            
                              
                              await axiosClient.post("/api/tracer-action-table", Object);
                              }}
                            >
                              <FaInfoCircle size={18} title="Détails" />
                            </button>
                            </Link>
                            <button 
                              className="action-button text-green-600 hover:text-green-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                
                                handleDelete(item.dossier_id);
                              }}
                            >
                              <ImBoxAdd size={18} title="Désarchiver" />
                            </button>
                            <button 
                              className="action-button text-red-600 hover:text-red-800"
                              onClick={async(e) => {
                                e.stopPropagation();
                              

                              await axiosClient.post(`api/delete/${item.dossier_id}`)
                              
                                fetchData()
                              }}
                              title="Supprimer"
                            >
                              <FaTrash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {expandedRows[item.id] && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50">
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="grid grid-cols-4 gap-4 px-6">
                                <div>
                                  <p className="text-sm text-gray-500">Couleur</p>
                                  <p className="font-medium">{item.physique.couleur}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Tiroir</p>
                                  <p className="font-medium">{item.physique.tiroir}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Armoire</p>
                                  <p className="font-medium">{item.physique.armoire}</p>
                                </div>
                                <div></div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm || couleurFilter || tiroirFilter || armoireFilter || startDateFilter || endDateFilter
                        ? 'Aucun résultat trouvé avec les filtres actuels' 
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
};
