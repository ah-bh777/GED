import React, { useState } from 'react';
import AffectationSection from './components/settings/AffectationSection';
import EntitiesSection from './components/settings/EntitiesSection';
import GradesSection from './components/settings/CorpsGradesSection';
import DocumentGradeManagement from './components/settings/DocumentGradeManagement';
import CorpsManagement from './components/settings/CorpsManagement';

export default function Setting() {
  const [activeSection, setActiveSection] = useState('affectation');

  const sections = [
    { id: 'affectation', label: 'Affectations', component: <AffectationSection /> },
    { id: 'entities', label: 'Entités', component: <EntitiesSection /> },
    { id: 'corps-grades', label: 'Corps & Grades', component: <GradesSection /> },
    { id: 'corps-management', label: 'Gestion des Corps', component: <CorpsManagement /> },
    { id: 'doc-grades', label: 'Documents par Grade', component: <DocumentGradeManagement /> }
  ];

  return (
    <div className="w-full p-4 space-y-6">
      {/* Navigation Bar */}
      <div className="flex border-b border-gray-200">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeSection === section.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Active Section */}
      <div className="mt-4">
        {sections.find(section => section.id === activeSection)?.component}
      </div>
    </div>
  );
}