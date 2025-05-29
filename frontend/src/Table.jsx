import { useState, Fragment, useEffect } from 'react'
import axios from 'axios'
import { FaEdit, FaInfoCircle } from 'react-icons/fa'
import { MdDelete } from "react-icons/md";
import { Link } from 'react-router-dom'

export default function EmployeeDirectory() {
  const [expandedRows, setExpandedRows] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [originalData, setOriginalData] = useState([])
  const [filteredData, setFilteredData] = useState([])



  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/tableData')
      setOriginalData(response.data)
      setFilteredData(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusClasses = (color) => {
    const classes = {
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    }
    return classes[color] || 'bg-gray-100 text-gray-800'
  }

  const toggleRow = (rowId, e) => {

    if (e.target.closest('.action-button')) {
      return
    }
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }))
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)

    if (value === '') {
      setFilteredData(originalData)
      return
    }

    const filtered = originalData.filter(employee => {
       return  employee.nomFr.toLowerCase().includes(value.toLowerCase()) ||
        employee.prenomFr.toLowerCase().includes(value.toLowerCase()) || 
        employee.dossier.toLowerCase().includes(value.toLowerCase()) ||
        employee.matricule.toLowerCase().includes(value.toLowerCase()) ||
        employee.prenomAr.toLowerCase().includes(value.toLowerCase()) ||
        employee.nomAr.toLowerCase().includes(value.toLowerCase()) ||
        employee.email.toLowerCase().includes(value.toLowerCase()) 
         
    })

    setFilteredData(filtered)
  }

  const renderDocumentStatus = (status) => {
    return status ? (
      <span className="text-green-600" title="Présent">✓</span>
    ) : (
      <span className="text-red-600" title="Manquant">✗</span>
    )
  }

  return (
    <div className="bg-gray-100 p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Annuaire du Personnel</h1>

        <input
          type="text"
          className="min-w-full p-2 mb-4 rounded border"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={handleSearch}
        />

        



        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Dossier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom (FR/AR)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corps</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affectation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData && Array.isArray(filteredData) && filteredData.map((employee) => (
                <Fragment key={employee.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => toggleRow(employee.id, e)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.dossier}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.matricule}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.nomFr} {employee.prenomFr}
                        </div>
                        <div className="text-sm text-gray-500 text-right" dir="rtl">
                          {employee.nomAr} {employee.prenomAr}
                        </div>
                        <div className="text-xs text-gray-400">
                          {employee.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.corps}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.affectation}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(employee.statutColor)}`}>
                        {employee.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                        
                          className="action-button p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                          title="Modifier"
                        >
                          <FaEdit size={16} />
                        </button>
                        <Link to={`/detail/${employee.id}`} >
                        <button
                        
                          className="action-button p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full"
                          title="Détails"
                        >
                          <FaInfoCircle size={16} />
                        </button>
                        </Link>
                          <button
                         
                          className="action-button p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                          title="Détails"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows[employee.id] && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="text-sm text-gray-700">
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="font-medium mb-1">Avertissement:</p>
                              <p>{employee.details.avertissement}</p>
                            </div>
                            <div>
                              <p className="font-medium mb-1">Poste actuel:</p>
                              <p>{employee.details.posteActuel}</p>
                            </div>
                            <div>
                              <p className="font-medium mb-1">Diplôme:</p>
                              <p>{employee.details.diplome}</p>
                            </div>
                          </div>
                          <div className="border-t pt-4">
                            <p className="font-medium mb-2">Documents administratifs:</p>
                            <div className="grid grid-cols-4 gap-4">
                              {Object.entries(employee.details.documents).map(([key, value]) => (
                                <p key={key} className="text-sm">
                                  {key.replace(/([A-Z])/g, ' $1')}: {renderDocumentStatus(value)}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}