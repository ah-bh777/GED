import { useState, useEffect } from 'react';
import { axiosClient } from './Api/axios';
import { FaSearch, FaExclamationTriangle, FaGavel } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

export default function AvertissementDiscipline() {
    const [dossiers, setDossiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);
    const [expandedType, setExpandedType] = useState(null);
    const [formData, setFormData] = useState({
        avertissement: { id_dossier: '', titre_d_avertissement: '', note_d_avertissement: '' },
        conseil: { id_dossier: '', date_conseil: '', motif: '', decision: '' }
    });
    const [errors, setErrors] = useState({
        avertissement: {},
        conseil: {}
    });
    const admin = JSON.parse(localStorage.getItem("ADMIN_INFO"))

    useEffect(() => {
        fetchDossiers();
    }, []);

    const fetchDossiers = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get("/api/list-averts-consiels");
            setDossiers(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDossiers = dossiers.filter(dossier => {
        const searchLower = searchTerm.toLowerCase();
        return (
            dossier.corps?.toLowerCase().includes(searchLower) ||
            dossier.grade?.toLowerCase().includes(searchLower) ||
            dossier.nom_de_fonctionnaire?.toLowerCase().includes(searchLower) ||
            dossier.dossier?.toLowerCase().includes(searchLower)
        );
    });

    const toggleExpand = (dossierId, type) => {
        if (expandedRow === dossierId && expandedType === type) {
            setExpandedRow(null);
            setExpandedType(null);
        } else {
            setExpandedRow(dossierId);
            setExpandedType(type);
            setFormData(prev => ({
                ...prev,
                [type]: { 
                    ...(type === 'avertissement' 
                        ? { id_dossier: dossierId, titre_d_avertissement: '', note_d_avertissement: '' }
                        : { id_dossier: dossierId, date_conseil: '', motif: '', decision: '' }
                    )
                }
            }));
            setErrors(prev => ({ ...prev, [type]: {} }));
        }
    };

    const handleInputChange = (type, e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [type]: { ...prev[type], [name]: value }
        }));
        // Clear error when user types
        if (errors[type][name]) {
            setErrors(prev => ({
                ...prev,
                [type]: { ...prev[type], [name]: null }
            }));
        }
    };

    const validateForm = (type) => {
        const newErrors = {};
        const data = formData[type];
        
        if (type === 'avertissement') {
            if (!data.titre_d_avertissement.trim()) {
                newErrors.titre_d_avertissement = 'Le titre est requis';
            }
            if (!data.note_d_avertissement.trim()) {
                newErrors.note_d_avertissement = 'La note est requise';
            }
        } else if (type === 'conseil') {
            if (!data.date_conseil) {
                newErrors.date_conseil = 'La date est requise';
            } else {
                const selectedDate = new Date(data.date_conseil);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate <= today) {
                    newErrors.date_conseil = 'La date doit être ultérieure à aujourd\'hui';
                }
            }
            if (!data.motif.trim()) {
                newErrors.motif = 'Le motif est requis';
            }
            if (!data.decision.trim()) {
                newErrors.decision = 'La décision est requise';
            }
        }
        
        setErrors(prev => ({ ...prev, [type]: newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (type, dossierId) => {
        if (!validateForm(type)) {
            return;
        }

        try {
            const endpoint = type === 'avertissement' 
                ? '/api/avertissements' 
                : '/api/conseil-de-disciplines';


                const details = type === "avertissement"
                ? "avertissement pour le dossier "
                : "conseil de discipline donné pour le dossier ";
            
            await axiosClient.post("/api/tracer-action-table", {
                admin_id: admin?.admin?.id,
                dossier_id: dossierId   ,
                type_de_transaction: 5,
                details_de_transaction: details
            });
            
            const payload = type === 'avertissement'
                ? {
                    dossier_id: dossierId,
                    titre_d_avertissement: formData.avertissement.titre_d_avertissement,
                    note_d_avertissement: formData.avertissement.note_d_avertissement
                  }
                : {
                    id_dossier: dossierId,
                    date_conseil: formData.conseil.date_conseil,
                    motif: formData.conseil.motif,
                    decision: formData.conseil.decision
                  };
            
            const response = await axiosClient.post(endpoint, payload);
                  
            alert(JSON.stringify(response.data))
         
            setFormData(prev => ({
                ...prev,
                [type]: type === 'avertissement' 
                    ? { id_dossier: '', titre_d_avertissement: '', note_d_avertissement: '' }
                    : { id_dossier: '', date_conseil: '', motif: '', decision: '' }
            }));
            
            setExpandedRow(null);
            setExpandedType(null);
            await fetchDossiers();
            
            alert(`${type === 'avertissement' ? 'Avertissement' : 'Conseil de discipline'} ajouté avec succès!`);
        } catch (error) {
            console.error(`Error adding ${type}:`, error);
            if (error.response?.data?.errors) {
                setErrors(prev => ({
                    ...prev,
                    [type]: error.response.data.errors
                }));
            }
            alert(`Une erreur est survenue lors de l'ajout: ${error.response?.data?.message || error.message}`);
        }
    };

    const getTodayDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 1); 
        return today.toISOString().split('T')[0];
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Chargement...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Gestion des Avertissements et Conseils</h1>
            
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Rechercher par dossier, nom, corps ou grade..."
                    />
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-700 text-white">
                        <tr>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Dossier</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Fonctionnaire</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Corps</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Grade</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDossiers.map((dossier) => (
                            <React.Fragment key={dossier.id}>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{dossier.dossier}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{dossier.nom_de_fonctionnaire}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{dossier.corps}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{dossier.grade}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-center space-x-4">
                                            {/* Avertissement Button */}
                                            <div className="flex flex-col items-center">
                                                <button
                                                    onClick={() => toggleExpand(dossier.id, 'avertissement')}
                                                    className={`p-2 rounded-full flex items-center ${
                                                        expandedRow === dossier.id && expandedType === 'avertissement' 
                                                            ? 'bg-yellow-100 text-yellow-600' 
                                                            : 'bg-yellow-50 text-yellow-500'
                                                    } hover:bg-yellow-100 transition`}
                                                    title="Ajouter avertissement"
                                                >
                                                    <FaExclamationTriangle className="mr-2" />
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        dossier.count_avert > 0 
                                                            ? 'bg-yellow-100 text-yellow-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {dossier.count_avert || 0}
                                                    </span>
                                                </button>
                                                <span className="text-xs mt-1 text-gray-500">Avertissements</span>
                                            </div>
                                            
                                           
                                            <div className="flex flex-col items-center">
                                                <button
                                                    onClick={() => toggleExpand(dossier.id, 'conseil')}
                                                    className={`p-2 rounded-full flex items-center ${
                                                        expandedRow === dossier.id && expandedType === 'conseil' 
                                                            ? 'bg-red-100 text-red-600' 
                                                            : 'bg-red-50 text-red-500'
                                                    } hover:bg-red-100 transition`}
                                                    title="Ajouter conseil"
                                                >
                                                    <FaGavel className="mr-2" />
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        dossier.count_disipline > 0 
                                                            ? 'bg-red-100 text-red-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {dossier.count_disipline || 0}
                                                    </span>
                                                </button>
                                                <span className="text-xs mt-1 text-gray-500">Conseils</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                
                                {/* Avertissement Form */}
                                <AnimatePresence>
                                    {expandedRow === dossier.id && expandedType === 'avertissement' && (
                                        <motion.tr 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-yellow-50"
                                        >
                                            <td colSpan="5" className="px-6 py-4">
                                                <div className="w-full space-y-4">
                                                    <div className="flex items-center space-x-2 pb-2 border-b border-yellow-200">
                                                        <FaExclamationTriangle className="text-yellow-600" />
                                                        <h3 className="text-lg font-medium text-yellow-800">Nouvel Avertissement</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'avertissement *</label>
                                                            <input
                                                                type="text"
                                                                name="titre_d_avertissement"
                                                                value={formData.avertissement.titre_d_avertissement}
                                                                onChange={(e) => handleInputChange('avertissement', e)}
                                                                className={`w-full p-2 border ${
                                                                    errors.avertissement.titre_d_avertissement 
                                                                        ? 'border-red-500' 
                                                                        : 'border-gray-300'
                                                                } rounded-md focus:ring-yellow-500 focus:border-yellow-500`}
                                                                placeholder="Entrez le titre"
                                                            />
                                                            {errors.avertissement.titre_d_avertissement && (
                                                                <p className="mt-1 text-sm text-red-600">{errors.avertissement.titre_d_avertissement}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Note d'avertissement *</label>
                                                            <textarea
                                                                name="note_d_avertissement"
                                                                value={formData.avertissement.note_d_avertissement}
                                                                onChange={(e) => handleInputChange('avertissement', e)}
                                                                className={`w-full p-2 border ${
                                                                    errors.avertissement.note_d_avertissement 
                                                                        ? 'border-red-500' 
                                                                        : 'border-gray-300'
                                                                } rounded-md focus:ring-yellow-500 focus:border-yellow-500`}
                                                                rows="3"
                                                                placeholder="Détails de l'avertissement"
                                                            />
                                                            {errors.avertissement.note_d_avertissement && (
                                                                <p className="mt-1 text-sm text-red-600">{errors.avertissement.note_d_avertissement}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end space-x-2 pt-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => { setExpandedRow(null); setExpandedType(null); }}
                                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                        >
                                                            Annuler
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleSubmit('avertissement', dossier.id)}
                                                            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                                        >
                                                            Enregistrer
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )}
                                </AnimatePresence>
                                
                                {/* Conseil Form */}
                                <AnimatePresence>
                                    {expandedRow === dossier.id && expandedType === 'conseil' && (
                                        <motion.tr 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-red-50"
                                        >
                                            <td colSpan="5" className="px-6 py-4">
                                                <div className="w-full space-y-4">
                                                    <div className="flex items-center space-x-2 pb-2 border-b border-red-200">
                                                        <FaGavel className="text-red-600" />
                                                        <h3 className="text-lg font-medium text-red-800">Nouveau Conseil de Discipline</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date du conseil *</label>
                                                            <input
                                                                type="date"
                                                                name="date_conseil"
                                                                value={formData.conseil.date_conseil}
                                                                onChange={(e) => handleInputChange('conseil', e)}
                                                                min={getTodayDate()}
                                                                className={`w-full p-2 border ${
                                                                    errors.conseil.date_conseil 
                                                                        ? 'border-red-500' 
                                                                        : 'border-gray-300'
                                                                } rounded-md focus:ring-red-500 focus:border-red-500`}
                                                            />
                                                            {errors.conseil.date_conseil && (
                                                                <p className="mt-1 text-sm text-red-600">{errors.conseil.date_conseil}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Motif du conseil *</label>
                                                            <input
                                                                type="text"
                                                                name="motif"
                                                                value={formData.conseil.motif}
                                                                onChange={(e) => handleInputChange('conseil', e)}
                                                                className={`w-full p-2 border ${
                                                                    errors.conseil.motif 
                                                                        ? 'border-red-500' 
                                                                        : 'border-gray-300'
                                                                } rounded-md focus:ring-red-500 focus:border-red-500`}
                                                                placeholder="Raison du conseil"
                                                            />
                                                            {errors.conseil.motif && (
                                                                <p className="mt-1 text-sm text-red-600">{errors.conseil.motif}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Décision prise *</label>
                                                            <input
                                                                type="text"
                                                                name="decision"
                                                                value={formData.conseil.decision}
                                                                onChange={(e) => handleInputChange('conseil', e)}
                                                                className={`w-full p-2 border ${
                                                                    errors.conseil.decision 
                                                                        ? 'border-red-500' 
                                                                        : 'border-gray-300'
                                                                } rounded-md focus:ring-red-500 focus:border-red-500`}
                                                                placeholder="Décision finale"
                                                            />
                                                            {errors.conseil.decision && (
                                                                <p className="mt-1 text-sm text-red-600">{errors.conseil.decision}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end space-x-2 pt-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => { setExpandedRow(null); setExpandedType(null); }}
                                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                        >
                                                            Annuler
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleSubmit('conseil', dossier.id)}
                                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                        >
                                                            Enregistrer
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}