import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"

export default function SinglePage() {
    const { id } = useParams()
    const [targetEmp, setTargetEmp] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchEmployee = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/tableData/${id}`)
            setTargetEmp(response.data)
        } catch (error) {
            console.error("Error fetching employee data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEmployee()
    }, [id])

    const renderDocumentStatus = (status) => {
        return status ? (
            <span className="text-green-600">✓</span>
        ) : (
            <span className="text-red-600">✗</span>
        )
    }

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>
    }

    if (!targetEmp) {
        return <div className="p-8 text-center">Employee not found</div>
    }

    return (
        <div className="bg-gray-100 min-h-screen p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                
                <div className="bg-blue-600 p-6 text-white">
                    <h1 className="text-2xl font-bold">
                        {targetEmp.nomFr} {targetEmp.prenomFr}
                        <span className="block text-right text-xl" dir="rtl">
                            {targetEmp.nomAr} {targetEmp.prenomAr}
                        </span>
                    </h1>
                    <p className="text-blue-100">{targetEmp.email}</p>
                </div>

                
                <div className="p-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="font-semibold text-gray-700 mb-2">Information de base</h2>
                            <p><span className="font-medium">Dossier:</span> {targetEmp.dossier}</p>
                            <p><span className="font-medium">Matricule:</span> {targetEmp.matricule}</p>
                            <p><span className="font-medium">Corps:</span> {targetEmp.corps}</p>
                            <p><span className="font-medium">Affectation:</span> {targetEmp.affectation}</p>
                            <p>
                                <span className="font-medium">Statut:</span> 
                                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusClass(targetEmp.statutColor)}`}>
                                    {targetEmp.statut}
                                </span>
                            </p>
                        </div>

                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="font-semibold text-gray-700 mb-2">Information professionnelle</h2>
                            <p><span className="font-medium">Poste actuel:</span> {targetEmp.details.posteActuel}</p>
                            <p><span className="font-medium">Diplôme:</span> {targetEmp.details.diplome}</p>
                            <p><span className="font-medium">Avertissement:</span> {targetEmp.details.avertissement}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="font-semibold text-gray-700 mb-2">Documents administratifs</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(targetEmp.details.documents).map(([key, value]) => (
                                    <p key={key} className="text-sm">
                                        {formatDocumentKey(key)}: {renderDocumentStatus(value)}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>

                   
                </div>
            </div>
        </div>
    )
}


function getStatusClass(color) {
    const classes = {
        green: 'bg-green-100 text-green-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        blue: 'bg-blue-100 text-blue-800',
        red: 'bg-red-100 text-red-800',
        gray: 'bg-gray-100 text-gray-800',
    }
    return classes[color] || 'bg-gray-100 text-gray-800'
}

function formatDocumentKey(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
}