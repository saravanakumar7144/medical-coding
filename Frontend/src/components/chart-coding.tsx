import { useState, useEffect } from 'react';
import { Upload, Search, Save, ChevronDown, ChevronRight, RefreshCcw } from 'lucide-react';

interface Encounter {
  encounter_id: string;
  patient_id: string;
  encounter_number: string;
  encounter_type: string;
  service_date: string;
  encounter_status: string;
  coding_status: string;
  billing_status: string;
  patient_first_name?: string;
  patient_last_name?: string;
  rendering_provider_name?: string;
}

export function ChartCoding() {
  const [activeTab, setActiveTab] = useState('AI Suggestions');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Chief Complaint': false,
    'Vital Signs': false,
    'History': false,
    'Examination': false,
    'Assessment': false,
    'Plan': false,
  });

  // API state
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const codingTabs = ['AI Suggestions', 'Code Search', 'Issues', 'Notes'];

  // Fetch encounters from API
  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${apiUrl}/api/claims/encounters?coding_status=Not Started&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEncounters(data);
        // Auto-select first encounter if available
        if (data.length > 0 && !selectedEncounter) {
          setSelectedEncounter(data[0]);
        }
      } else {
        setError('Failed to load encounters');
      }
    } catch (err) {
      console.error('Error fetching encounters:', err);
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  // Get patient info from selected encounter
  const patientInfo = selectedEncounter ? {
    name: `${selectedEncounter.patient_first_name || 'N/A'} ${selectedEncounter.patient_last_name || ''}`.trim(),
    id: selectedEncounter.encounter_number || 'N/A',
    dob: 'N/A', // Would need to fetch from patient details
    gender: 'N/A', // Would need to fetch from patient details
    visit: new Date(selectedEncounter.service_date).toLocaleDateString() || 'N/A',
    provider: selectedEncounter.rendering_provider_name || 'N/A'
  } : {
    name: 'N/A',
    id: 'N/A',
    dob: 'N/A',
    gender: 'N/A',
    visit: 'N/A',
    provider: 'N/A'
  };

  const chartSections = [
    'Extracted Raw Content',
    'Chief Complaint',
    'Vital Signs',
    'History',
    'Examination',
    'Assessment',
    'Plan'
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Chart Coding Workspace</h1>
          <div className="flex items-center gap-4">
            {/* Encounter Selector */}
            <select
              value={selectedEncounter?.encounter_id || ''}
              onChange={(e) => {
                const encounter = encounters.find(enc => enc.encounter_id === e.target.value);
                setSelectedEncounter(encounter || null);
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || encounters.length === 0}
            >
              <option value="">Select Encounter...</option>
              {encounters.map((enc) => (
                <option key={enc.encounter_id} value={enc.encounter_id}>
                  {enc.encounter_number} - {enc.patient_first_name} {enc.patient_last_name} ({new Date(enc.service_date).toLocaleDateString()})
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchEncounters}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error/Loading Messages */}
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
        {loading && (
          <div className="mt-2 text-sm text-gray-600">
            Loading encounters...
          </div>
        )}
        {!loading && encounters.length === 0 && !error && (
          <div className="mt-2 text-sm text-gray-600">
            No pending encounters found
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Patient Chart */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          {/* Patient Chart Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Patient Chart</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload PDF
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>

            {/* Patient Info Grid */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name: </span>
                <span className="text-gray-600">{patientInfo.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">ID: </span>
                <span className="text-gray-600">{patientInfo.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">DOB: </span>
                <span className="text-gray-600">{patientInfo.dob}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Gender: </span>
                <span className="text-gray-600">{patientInfo.gender}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Visit: </span>
                <span className="text-gray-600">{patientInfo.visit}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Provider: </span>
                <span className="text-gray-600">{patientInfo.provider}</span>
              </div>
            </div>
          </div>

          {/* Chart Sections */}
          <div className="flex-1 overflow-auto">
            {chartSections.map((section) => (
              <div key={section} className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{section}</span>
                  {expandedSections[section] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSections[section] && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-600">
                      Content for {section} would be displayed here...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Coding */}
        <div className="w-1/2 flex flex-col">
          {/* Coding Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Coding</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Export
                </button>
              </div>
            </div>

            {/* Coding Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-600">AI Codes: </span>
                <span className="font-medium text-gray-900">0</span>
              </div>
              <div>
                <span className="text-gray-600">Selected: </span>
                <span className="font-medium text-gray-900">0</span>
              </div>
              <div>
                <span className="text-gray-600">Issues: </span>
                <span className="font-medium text-gray-900">0</span>
              </div>
            </div>
          </div>

          {/* Coding Tab Navigation */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {codingTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-[#62d5e4] text-[#62d5e4]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Coding Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'AI Suggestions' && (
              <div className="text-center py-12">
                <div className="mb-4">
                  <span className="text-sm text-gray-600">AI-Suggested Codes (</span>
                  <span className="text-sm font-medium text-gray-900">80% confidence</span>
                  <span className="text-sm text-gray-600">)</span>
                </div>
                <div className="mb-6">
                  <button className="bg-[#62d5e4] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#4bc5d6] transition-colors">
                    Run AI Analysis
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  No AI suggestions available. Upload a document and run analysis.
                </p>
              </div>
            )}
            
            {activeTab === 'Code Search' && (
              <div>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search for codes..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center py-8">
                  Enter search terms to find relevant medical codes.
                </p>
              </div>
            )}
            
            {activeTab === 'Issues' && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">
                  No issues detected. Run analysis to identify potential coding issues.
                </p>
              </div>
            )}
            
            {activeTab === 'Notes' && (
              <div>
                <textarea
                  placeholder="Add coding notes..."
                  className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}