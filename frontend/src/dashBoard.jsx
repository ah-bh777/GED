import { useState, useEffect, useCallback, useRef } from "react";
import { axiosClient } from "./Api/axios";

const DashBoard = () => {
  const [dossiers, setDossiers] = useState([]);
  const [selectedDossierId, setSelectedDossierId] = useState(null);
  const [selectedType, setSelectedType] = useState(1);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [apiError, setApiError] = useState(null);


  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  
  const adminInfo = useRef(JSON.parse(localStorage.getItem("ADMIN_INFO")));
  const adminId = adminInfo.current?.admin?.id || null;

  const prevValues = useRef({
    adminId: null,
    dossierId: null,
    type: null,
    page: null,
  });

  
  const fetchDossiers = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);

      const response = await axiosClient.post("/api/histoire", {
        admin_id: adminId,
      });

      const data = response.data.data || [];
      setDossiers(data);

      if (data.length > 0) {
        setSelectedDossierId(data[0].dossier_id);
      }
    } catch (error) {
      setApiError("Erreur lors du chargement des dossiers.");
      console.error("Fetch dossier error:", error);
    } finally {
      setLoading(false);
    }
  }, [adminId]);


  const fetchTransactionHistory = useCallback(async (adminId, dossierId, type, page = 1) => {
    if (!dossierId) {
      setTransactionHistory([]);
      return;
    }

    const isSameParams =
      prevValues.current.adminId === adminId &&
      prevValues.current.dossierId === dossierId &&
      prevValues.current.type === type &&
      prevValues.current.page === page;

    if (isSameParams) {
      console.log("Skipping duplicate API call");
      return;
    }

    try {
      setHistoryLoading(true);
      setApiError(null);

      const response = await axiosClient.post("/api/chercher-histoire", {
        admin_id: adminId,
        dossier_id: dossierId,
        type_de_transaction: type,
        page: page,
      });

      prevValues.current = { adminId, dossierId, type, page };
      setTransactionHistory(response.data.data || []);
      setCurrentPage(response.data.current_page);
      setLastPage(response.data.last_page);
    } catch (error) {
      setApiError("Erreur lors du chargement de l'historique.");
      console.error("Transaction fetch error:", error);
      setTransactionHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  useEffect(() => {
    if (adminId && selectedDossierId) {
      fetchTransactionHistory(adminId, selectedDossierId, selectedType, currentPage);
    }
  }, [adminId, selectedDossierId, selectedType, currentPage, fetchTransactionHistory]);


  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDossierId, selectedType]);

  const handleDossierChange = (e) => {
    const selectedId = parseInt(e.target.value);
    setSelectedDossierId(selectedId || null);
  };

  const getTypeColor = (type) => {
    const colors = {
      1: "bg-blue-100 text-blue-800 border-blue-200",
      2: "bg-purple-100 text-purple-800 border-purple-200",
      3: "bg-yellow-100 text-yellow-800 border-yellow-200",
      4: "bg-green-100 text-green-800 border-green-200",
      5: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeLabel = (type) => {
    const labels = {
      1: "Consultation",
      2: "Archivage",
      3: "Modification",
      4: "Désarchivage",
      5: "Ajout",
    };
    return labels[type] || "Autre";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-4">
      {apiError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">Erreur :</p>
          <p>{apiError}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="bg-blue-700 p-4">
        <div className="flex flex-wrap justify-between items-center mb-4">
  <h2 className="text-xl font-bold text-white">
    Historique des actions
  </h2>

  {adminInfo.current?.admin && (
    <h2 className="text-xl font-bold text-white">
         Admin: {adminInfo.current.nom_fr} {adminInfo.current.prenom_fr}
         </h2>
  )}
</div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-blue-100 mb-1">
              Sélectionner un dossier
            </label>
            {loading ? (
              <div className="animate-pulse bg-blue-600 h-10 rounded-lg"></div>
            ) : (
              <select
                className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white bg-blue-50"
                value={selectedDossierId || ""}
                onChange={handleDossierChange}
              >
                <option value="">Sélectionnez un dossier</option>
                {dossiers.map((dossier) => (
                  <option key={dossier.dossier_id} value={dossier.dossier_id}>
                    {dossier.nom_complet} - {dossier.dossier}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  selectedType === type
                    ? `${getTypeColor(type).replace("100", "600").replace("800", "50")} border-current font-bold`
                    : `${getTypeColor(type)} hover:bg-opacity-70`
                }`}
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Type sélectionné: <span className="font-medium">{getTypeLabel(selectedType)}</span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Historique des Transactions</h3>

            {!selectedDossierId ? (
              <div className="text-center text-gray-500 py-4">
                Sélectionnez un dossier pour voir son historique
              </div>
            ) : historyLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : transactionHistory.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionHistory.map((transaction, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(transaction.type_de_transaction)}`}>
                              {getTypeLabel(transaction.type_de_transaction)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.details_de_transaction}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(transaction.date_de_transaction)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {lastPage > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    <button
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </button>
                    {[...Array(lastPage)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === i + 1 ? "bg-blue-600 text-white" : ""
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, lastPage))}
                      disabled={currentPage === lastPage}
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Aucun historique trouvé pour ce dossier et ce type de transaction.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashBoard;