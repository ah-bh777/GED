import React, { useState, useEffect } from 'react';
import { axiosClient } from "./Api/axios";

const DashBoard = () => {
  const [dossierData, setDossierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [selectedStatutId, setSelectedStatutId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDossierData = async () => {
    try {
      const obj = { id: 4 };
      const response = await axiosClient.post(`/api/details/`, obj);
      setDossierData(response.data);
      
      if (response.data.dossier.fonctionnaire.statut) {
        setSelectedStatut(response.data.dossier.fonctionnaire.statut.id.toString());
        setSelectedStatutId(response.data.dossier.fonctionnaire.statut.id.toString());
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossierData();
  }, []);

  const handleStatutChange = async (e) => {
    const newStatutId = e.target.value;
    setSelectedStatut(newStatutId);
    setSelectedStatutId(newStatutId);
    
    try {
      setIsUpdating(true);
      const obj = {
        "id_statut": newStatutId
      };
      
      await axiosClient.post("/api/change-statut", obj);
      
      // Refresh the data after successful update
      await fetchDossierData();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dossierData) return <div>No data found</div>;

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Dossier Details</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Dossier Number:</label>
        <input 
          type="text" 
          value={dossierData.dossier.dossier || ''} 
          readOnly 
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Matricule:</label>
        <input 
          type="text" 
          value={dossierData.dossier.matricule || ''} 
          readOnly 
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Fonctionnaire Name:</label>
        <input 
          type="text" 
          value={`${dossierData.dossier.fonctionnaire.user.nom_fr} ${dossierData.dossier.fonctionnaire.user.prenom_fr}` || ''} 
          readOnly 
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Couleur:</label>
        <input 
          type="text" 
          value={dossierData.dossier.couleur || ''} 
          readOnly 
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Location (Tiroir/Armoire):</label>
        <input 
          type="text" 
          value={`${dossierData.dossier.tiroir} / ${dossierData.dossier.armoire}` || ''} 
          readOnly 
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Date d'affectation:</label>
        <input 
          type="text" 
          value={dossierData.dossier.date_d_affectation || ''} 
          readOnly 
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Current Status:</label>
        <select 
          value={selectedStatut}
          onChange={handleStatutChange}
          style={{ width: '100%', padding: '8px' }}
          disabled={isUpdating}
        >
          {dossierData.statut.map((stat) => (
            <option key={stat.id} value={stat.id}>
              {stat.nom_statut} (ID: {stat.id})
            </option>
          ))}
        </select>
        {selectedStatutId && (
          <div style={{ marginTop: '5px', color: '#666' }}>
            Selected Status ID: {selectedStatutId}
            {isUpdating && <span style={{ marginLeft: '10px' }}>Updating...</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashBoard;