export function AISuggestions() {
  const patients = [
    {
      id: 'P-1001',
      name: 'John Smith',
      diagnosis: 'Type 2 diabetes mellitus without complications',
      suggestions: [
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', confidence: 92 },
        { code: '110', description: 'Essential (primary) hypertension', confidence: 85 },
        { code: 'E78.5', description: 'Hyperlipidemia, unspecified', confidence: 78 }
      ]
    },
    {
      id: 'P-1003',
      name: 'Michael Brown',
      diagnosis: 'Acute bronchitis with COPD exacerbation',
      suggestions: [
        { code: 'J44.1', description: 'Chronic obstructive pulmonary disease with acute exacerbation', confidence: 94 },
        { code: 'J20.9', description: 'Acute bronchitis, unspecified', confidence: 89 },
        { code: 'J45.901', description: 'Unspecified asthma with (acute) exacerbation', confidence: 65 }
      ]
    },
    {
      id: 'P-1005',
      name: 'Robert Miller',
      diagnosis: 'Chest pain, unspecified',
      suggestions: [
        { code: 'R07.9', description: 'Chest pain, unspecified', confidence: 88 },
        { code: 'I20.9', description: 'Angina pectoris, unspecified', confidence: 72 },
        { code: 'R07.89', description: 'Other chest pain', confidence: 68 }
      ]
    }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-teal-500';
    if (confidence >= 80) return 'bg-blue-500';
    if (confidence >= 70) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getConfidenceTextColor = (confidence: number) => {
    if (confidence >= 90) return 'text-teal-700';
    if (confidence >= 80) return 'text-blue-700';
    if (confidence >= 70) return 'text-yellow-700';
    return 'text-gray-700';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
      {patients.slice(0, 4).map((patient) => (
        <div key={patient.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{patient.id}</h3>
              <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View Chart
              </button>
            </div>
            <h4 className="font-medium text-gray-900 mb-3">{patient.name}</h4>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Diagnosis:</span> {patient.diagnosis}
            </p>
          </div>

          <div>
            <h5 className="font-medium text-gray-900 mb-4 pb-3 border-b border-gray-200">AI-Suggested Codes:</h5>
            <div className="space-y-4">
              {patient.suggestions.map((suggestion, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-teal-600">{suggestion.code}</span>
                    <span className={`text-sm font-medium ${getConfidenceTextColor(suggestion.confidence)}`}>
                      {suggestion.confidence}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getConfidenceColor(suggestion.confidence)}`}
                      style={{ width: `${suggestion.confidence}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}