import { useState, useEffect, useCallback, useRef } from "react";
import { axiosClient } from "./Api/axios";

const DashBoard = () => {
  const [dossiers, setDossiers] = useState([]);
  const [selectedDossierId, setSelectedDossierId] = useState(null);
  const [selectedPageType, setSelectedPageType] = useState(1); // Changed from selectedType to selectedPageType
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
    pageType: null, // Changed from type to pageType
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

  const fetchTransactionHistory = useCallback(async (adminId, dossierId, pageType, page = 1) => {
    if (!dossierId) {
      setTransactionHistory([]);
      return;
    }

    const isSameParams =
      prevValues.current.adminId === adminId &&
      prevValues.current.dossierId === dossierId &&
      prevValues.current.pageType === pageType &&
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
        type_de_transaction: pageType, // Still using type_de_transaction for API but mapped to page types
        page: page,
      });

      prevValues.current = { adminId, dossierId, pageType, page };
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
      fetchTransactionHistory(adminId, selectedDossierId, selectedPageType, currentPage);
    }
  }, [adminId, selectedDossierId, selectedPageType, currentPage, fetchTransactionHistory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDossierId, selectedPageType]);

  const handleDossierChange = (e) => {
    const selectedId = parseInt(e.target.value);
    setSelectedDossierId(selectedId || null);
  };

  const getPageTypeColor = (pageType) => {
    const colors = {
      1: "bg-blue-600 hover:bg-blue-700 text-white",
      2: "bg-emerald-600 hover:bg-emerald-700 text-white",
      3: "bg-amber-600 hover:bg-amber-700 text-white",
      4: "bg-purple-600 hover:bg-purple-700 text-white",
      5: "bg-rose-600 hover:bg-rose-700 text-white",
    };
    return colors[pageType] || "bg-gray-600 hover:bg-gray-700 text-white";
  };

  const getPageTypeLabel = (pageType) => {
    const labels = {
      1: "Tableau",
      2: "Détails/Modification",
      3: "Archivage",
      4: "Ajout",
      5: "Avertissements/Conseils",
    };
    return labels[pageType] || "Autre";
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
            <h2 className="text-xl font-bold text-white">Historique des actions</h2>
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
                className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-white focus:border-white bg-blue-50 text-gray-800"
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
          <div className="flex flex-wrap gap-3 items-end">
            {[1, 2, 3, 4, 5].map((pageType) => (
              <button
                key={pageType}
                onClick={() => setSelectedPageType(pageType)}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  selectedPageType === pageType
                    ? `${getPageTypeColor(pageType).replace("hover:", "")} shadow-lg text-lg h-12`
                    : `${getPageTypeColor(pageType)} opacity-90 hover:opacity-100 text-base h-10`
                }`}
              >
                {getPageTypeLabel(pageType)}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Page sélectionnée: <span className="font-medium">{getPageTypeLabel(selectedPageType)}</span>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionHistory.map((transaction, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPageTypeColor(transaction.type_de_transaction)}`}>
                              {getPageTypeLabel(transaction.type_de_transaction)}
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
                Aucun historique trouvé pour ce dossier et ce type de page.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashBoard; 