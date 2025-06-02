import React, { useState } from "react";

const DashBoard = () => {
  const originalData = [
    {
      id: 1,
      dossier: "Dossier-001",
      matricule: "MAT-001",
      nom: { fr: "Ahmed Benali", ar: "أحمد بنعلي" },
      corps: "Administrateurs",
      statut: "En activité",
      statutColor: "green",
      docsStatus: {
        detail: [
          { id: 4, nom: "CIN", isSubmitted: true, isRequired: true },
          { id: 5, nom: "Certificat de naissance", isSubmitted: true, isRequired: true },
          { id: 6, nom: "Contrat de travail", isSubmitted: false, isRequired: true },
          { id: 7, nom: "RIB", isSubmitted: true, isRequired: true },
          { id: 8, nom: "Attestation de travail", isSubmitted: false, isRequired: false },
          { id: 9, nom: "CNOPS", isSubmitted: false, isRequired: true },
          { id: 10, nom: "CNOPS enfants", isSubmitted: false, isRequired: false }
        ]
      },
      infosSupp: {
        grade: "Administrateur 2ème grade",
        nomUnite: "Direction Générale de la Transition Numérique",
        entite: "Direction des Infrastructures Cloud et de l'Offshoring",
        avertissements: 1,
        conseils: 0,
        dateAffectation: "2024-01-10"
      },
      physique: { couleur: "Bleu", tiroir: "Tiroir-1", armoire: "Armoire-A" },
      subDocs: {}
    },
    {
      id: 2,
      dossier: "Dossier-002",
      matricule: "MAT-002",
      nom: { fr: "Fatima Elouardi", ar: "فاطمة الوردي" },
      corps: "Ingénieurs d'État",
      statut: "En activité",
      statutColor: "green",
      docsStatus: {
        detail: [
          { id: 4, nom: "CIN", isSubmitted: true, isRequired: true },
          { id: 5, nom: "Certificat de naissance", isSubmitted: false, isRequired: true },
          { id: 6, nom: "Contrat de travail", isSubmitted: true, isRequired: true },
          { id: 7, nom: "RIB", isSubmitted: false, isRequired: true }
        ]
      },
      infosSupp: {
        grade: "Ingénieur d'état 1er grade",
        nomUnite: "Direction Générale de la Transition Numérique",
        entite: "Direction des Infrastructures Cloud et de l'Offshoring",
        avertissements: 1,
        conseils: 1,
        dateAffectation: "2024-03-15"
      },
      physique: { couleur: "Rouge", tiroir: "Tiroir-2", armoire: "Armoire-A" },
      subDocs: {}
    },
    {
      id: 3,
      dossier: "Dossier-003",
      matricule: "MAT-003",
      nom: { fr: "Karim Amrani", ar: "كريم عمراني" },
      corps: "Techniciens",
      statut: "En activité",
      statutColor: "green",
      docsStatus: {
        detail: [
          { id: 4, nom: "CIN", isSubmitted: false, isRequired: true },
          { id: 5, nom: "Certificat de naissance", isSubmitted: false, isRequired: true },
          { id: 6, nom: "Contrat de travail", isSubmitted: false, isRequired: true },
          { id: 7, nom: "RIB", isSubmitted: false, isRequired: true },
          { id: 9, nom: "CNOPS", isSubmitted: true, isRequired: true },
          { id: 8, nom: "Attestation de travail", isSubmitted: false, isRequired: false }
        ]
      },
      infosSupp: {
        grade: "Technicien 2ème grade",
        nomUnite: "Direction Générale de la Transition Numérique",
        entite: "Direction des Ecosystèmes et Entrepreneuriat Digital",
        avertissements: 0,
        conseils: 0,
        dateAffectation: "2024-05-22"
      },
      physique: { couleur: "Vert", tiroir: "Tiroir-3", armoire: "Armoire-B" },
      subDocs: {}
    }
  ];

  // State
  const [search, setSearch] = useState("");
  const [selectSearch, setSelectSearch] = useState("");
  const [selectGrade, setSelectGrade] = useState("");
  const [curCheckBox, setCurCheckBox] = useState([]);
  const [theFiltered, setTheFiltered] = useState(originalData);
  const [theAvertis, setTheAvertis] = useState("");
  const [firstDate, setFirstData] = useState("");
  const [secondeDate, setSecondeData] = useState("");
  const [docStatusFilter, setDocStatusFilter] = useState("");

  // Compute document summary for filtering
  const isDocumentComplete = (detail) => {
    return detail.filter(doc => doc.isRequired && !doc.isSubmitted).length === 0;
  };

  // Grades by corps
  const getGradesByCorps = (corps) => {
    switch (corps) {
      case "Administrateurs":
        return ["Administrateur 1er grade", "Administrateur 2ème grade", "Administrateur 3ème grade", "Administrateur 4ème grade"];
      case "Ingénieurs d'État":
        return ["Ingénieur d'état 1er grade", "Ingénieur d'état 2ème grade", "Ingénieur d'état 3ème grade"];
      case "Techniciens":
        return ["Technicien 1er grade", "Technicien 2ème grade", "Technicien 3ème grade"];
      default:
        return Array.from(originalData.map((emp) => emp.infosSupp.grade));
    }
  };

  const filterData = (searchValue, corpsValue, gradeValue, statutsSelected, avertis, theFirstDate, theSecondeDate, docStatus) => {
    const lowerSearch = searchValue.toLowerCase();

    const filtered = originalData.filter((employee) => {
      const matchesSearch =
        employee.dossier.toLowerCase().includes(lowerSearch) ||
        employee.matricule.toLowerCase().includes(lowerSearch) ||
        employee.nom.fr.toLowerCase().includes(lowerSearch) ||
        employee.nom.ar.includes(lowerSearch);

      const matchesCorps = corpsValue === "" || employee.corps === corpsValue;
      const matchesGrade = gradeValue === "" || employee.infosSupp.grade === gradeValue;
      const matchesStatut = statutsSelected.length === 0 || statutsSelected.includes(employee.statut);

      const matchesAvertis =
        avertis !== "" && avertis !== null && avertis !== undefined
          ? employee.infosSupp.avertissements == avertis
          : true;

      const empDate = new Date(employee.infosSupp.dateAffectation);
      const first = theFirstDate ? new Date(theFirstDate) : null;
      const second = theSecondeDate ? new Date(theSecondeDate) : null;

      // Modified date logic:
      // If first is null and second is not null => filter dateAffectation >= second
      // If first and second exist, filter dateAffectation between first and second
      // If only first exists, filter dateAffectation >= first
      // If none, no filter

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
        docStatus === "" ||
        (docStatus === "Complet" && isComplete) ||
        (docStatus === "Incomplet" && !isComplete);

      return matchesSearch && matchesCorps && matchesGrade && matchesStatut && matchesAvertis && matchesDate && matchesDocStatus;
    });

    setTheFiltered(filtered);
  };

  // Event handlers
  const handleSearchChange = (value) => {
    setSearch(value);
    filterData(value, selectSearch, selectGrade, curCheckBox, theAvertis, firstDate, secondeDate, docStatusFilter);
  };

  const handleSelectChange = (value) => {
    setSelectSearch(value);
    setSelectGrade("");
    filterData(search, value, "", curCheckBox, theAvertis, firstDate, secondeDate, docStatusFilter);
  };

  const handleGradeChange = (value) => {
    setSelectGrade(value);
    filterData(search, selectSearch, value, curCheckBox, theAvertis, firstDate, secondeDate, docStatusFilter);
  };

  const handleStatutCheck = (statut) => {
    const updatedCheckbox = curCheckBox.includes(statut)
      ? curCheckBox.filter((s) => s !== statut)
      : [...curCheckBox, statut];
    setCurCheckBox(updatedCheckbox);
    filterData(search, selectSearch, selectGrade, updatedCheckbox, theAvertis, firstDate, secondeDate, docStatusFilter);
  };

  const handleAvertis = (avertis) => {
    setTheAvertis(avertis);
    filterData(search, selectSearch, selectGrade, curCheckBox, avertis, firstDate, secondeDate, docStatusFilter);
  };

  const handleDate = (first, second) => {
    if (first && second && new Date(first) > new Date(second)) {
      alert("Erreur : La première date est après la deuxième.");
      return;
    }
    setFirstData(first);
    setSecondeData(second);
    filterData(search, selectSearch, selectGrade, curCheckBox, theAvertis, first, second, docStatusFilter);
  };

  // New: clear both dates
  const clearDates = () => {
    setFirstData("");
    setSecondeData("");
    filterData(search, selectSearch, selectGrade, curCheckBox, theAvertis, "", "", docStatusFilter);
  };

  const handleDocStatusFilter = (value) => {
    setDocStatusFilter(value);
    filterData(search, selectSearch, selectGrade, curCheckBox, theAvertis, firstDate, secondeDate, value);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Tableau de bord</h2>

      <div className="mb-4 space-y-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Rechercher par dossier, matricule, nom FR/AR"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border p-2 rounded w-full"
        />

        {/* Select Corps */}
        <select
          value={selectSearch}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">-- Sélectionner un corps --</option>
          <option value="Administrateurs">Administrateurs</option>
          <option value="Ingénieurs d'État">Ingénieurs d'État</option>
          <option value="Techniciens">Techniciens</option>
        </select>

        {/* Select Grade */}
        <select
          value={selectGrade}
          onChange={(e) => handleGradeChange(e.target.value)}
          className="border p-2 rounded"
          disabled={!selectSearch}
        >
          <option value="">-- Sélectionner un grade --</option>
          {getGradesByCorps(selectSearch).map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>

        {/* Statut Checkboxes */}
        <div className="flex gap-4">
          {["En activité", "Détaché", "Sans activité"].map((statut) => (
            <label key={statut} className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={curCheckBox.includes(statut)}
                onChange={() => handleStatutCheck(statut)}
              />
              {statut}
            </label>
          ))}
        </div>

        {/* Avertissements */}
        <select
          value={theAvertis}
          onChange={(e) => handleAvertis(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">-- Filtrer par avertissements --</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>

        {/* Date Filters */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={firstDate}
            onChange={(e) => handleDate(e.target.value, secondeDate)}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={secondeDate}
            onChange={(e) => handleDate(firstDate, e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={() => handleDate("", secondeDate)}
            className="px-2 py-1 bg-yellow-300 rounded"
          >
            Réinitialiser Date 1
          </button>
          <button
            onClick={() => handleDate(firstDate, "")}
            className="px-2 py-1 bg-yellow-300 rounded"
          >
            Réinitialiser Date 2
          </button>
          <button
            onClick={clearDates}
            className="px-2 py-1 bg-red-400 text-white rounded"
          >
            Réinitialiser toutes les dates
          </button>
        </div>

        {/* Document Status Filter */}
        <select
          value={docStatusFilter}
          onChange={(e) => handleDocStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">-- Statut des documents --</option>
          <option value="Complet">Complet</option>
          <option value="Incomplet">Incomplet</option>
        </select>
      </div>

      {/* Table or List of Filtered Data */}
      <div>
        {theFiltered.length === 0 ? (
          <p>Aucun résultat trouvé.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Dossier</th>
                <th className="border border-gray-300 p-2">Matricule</th>
                <th className="border border-gray-300 p-2">Nom FR</th>
                <th className="border border-gray-300 p-2">Corps</th>
                <th className="border border-gray-300 p-2">Statut</th>
                <th className="border border-gray-300 p-2">Date Affectation</th>
                <th className="border border-gray-300 p-2">Avertissements</th>
              </tr>
            </thead>
            <tbody>
              {theFiltered.map((emp) => (
                <tr key={emp.id} className="text-center">
                  <td className="border border-gray-300 p-2">{emp.dossier}</td>
                  <td className="border border-gray-300 p-2">{emp.matricule}</td>
                  <td className="border border-gray-300 p-2">{emp.nom.fr}</td>
                  <td className="border border-gray-300 p-2">{emp.corps}</td>
                  <td className="border border-gray-300 p-2">{emp.statut}</td>
                  <td className="border border-gray-300 p-2">{emp.infosSupp.dateAffectation}</td>
                  <td className="border border-gray-300 p-2">{emp.infosSupp.avertissements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashBoard;
