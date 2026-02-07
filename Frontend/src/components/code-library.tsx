import { useState } from 'react';
import { Search, Filter, Heart, ExternalLink, Star } from 'lucide-react';

interface Code {
  code: string;
  description: string;
  category: string;
  type: 'ICD-10' | 'CPT' | 'HCPCS';
  isFavorite?: boolean;
  hccMapping?: {
    hccCode: string;
    hccDescription: string;
    rafValue: number;
    hierarchy: string[];
    interactions: string[];
  };
}

export function CodeLibrary() {
  const [activeTab, setActiveTab] = useState('ICD-10');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteFilter, setFavoriteFilter] = useState(false);

  const tabs = ['ICD-10', 'CPT', 'HCPCS', 'HCC/RAF', 'Favorites'];
  
  const categories = [
    'All Categories',
    'Circulatory',
    'Endocrine',
    'Respiratory',
    'Digestive',
    'Musculoskeletal',
    'Neoplasms',
    'Mental Disorders'
  ];

  // Sample code data
  const allCodes: Code[] = [
    { code: 'I10.9', description: 'Angina pectoris, unspecified', category: 'Circulatory', type: 'ICD-10', isFavorite: true },
    { code: 'G11.3', description: 'GT atheritis (GTCA8) myocardial infarction of unspecified site', category: 'Circulatory', type: 'ICD-10' },
    { 
      code: 'I10', 
      description: 'Essential (primary) hypertension', 
      category: 'Circulatory', 
      type: 'ICD-10', 
      isFavorite: true,
      hccMapping: {
        hccCode: 'HCC85',
        hccDescription: 'Congestive Heart Failure',
        rafValue: 0.323,
        hierarchy: ['HCC84', 'HCC85', 'HCC86'],
        interactions: ['HCC18', 'HCC19']
      }
    },
    { 
      code: 'E11.9', 
      description: 'Type 2 diabetes mellitus without complications', 
      category: 'Endocrine', 
      type: 'ICD-10', 
      isFavorite: true,
      hccMapping: {
        hccCode: 'HCC18',
        hccDescription: 'Diabetes with Complications',
        rafValue: 0.104,
        hierarchy: ['HCC17', 'HCC18', 'HCC19'],
        interactions: ['HCC85', 'HCC96']
      }
    },
    { code: 'E78.5', description: 'Hyperlipidemia, unspecified', category: 'Endocrine', type: 'ICD-10' },
    { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified', category: 'Respiratory', type: 'ICD-10' },
    { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', category: 'Respiratory', type: 'ICD-10' },
    { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis', category: 'Digestive', type: 'ICD-10' },
    { code: '99213', description: 'Office/outpatient visit, established patient, low complexity', category: 'Office Visits', type: 'CPT', isFavorite: true },
    { code: '99214', description: 'Office/outpatient visit, established patient, moderate complexity', category: 'Office Visits', type: 'CPT' },
    { code: '99215', description: 'Office/outpatient visit, established patient, high complexity', category: 'Office Visits', type: 'CPT' },
    { code: '36415', description: 'Collection of venous blood by venipuncture', category: 'Laboratory', type: 'CPT' },
    { code: 'G0438', description: 'Annual wellness visit; includes personalized prevention plan', category: 'Preventive', type: 'HCPCS', isFavorite: true },
    { code: 'G0439', description: 'Annual wellness visit; includes personalized prevention plan, subsequent', category: 'Preventive', type: 'HCPCS' }
  ];

  const getFilteredCodes = () => {
    let filtered = allCodes;

    // Filter by active tab
    if (activeTab === 'Favorites') {
      filtered = filtered.filter(code => code.isFavorite);
    } else if (activeTab !== 'All') {
      filtered = filtered.filter(code => code.type === activeTab);
    }

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(code => code.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(code => 
        code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const toggleFavorite = (codeToToggle: string) => {
    // In a real app, this would update the backend
    console.log(`Toggling favorite for code: ${codeToToggle}`);
  };

  const filteredCodes = getFilteredCodes();

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Code Library & Reference</h1>
              <p className="text-sm text-gray-600 mt-1">
                Search for ICD-10, CPT and HCPCS codes
              </p>
            </div>
            <button className="px-4 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
              Export Favorites
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search codes or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white pr-8"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 sticky top-[120px] z-10">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
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
                {tab === 'Favorites' && (
                  <Heart className="w-4 h-4 ml-1 inline-block" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Code Table */}
        <div className="flex-1 px-4 py-3 max-h-96 overflow-auto">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Category</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCodes.length > 0 ? (
                    filteredCodes.map((code, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-teal-600">{code.code}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                          {code.description}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {code.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleFavorite(code.code)}
                              className={`p-1 rounded transition-colors ${
                                code.isFavorite 
                                  ? 'text-red-500 hover:text-red-600' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                              title={code.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Heart className={`w-4 h-4 ${code.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-[#62d5e4] transition-colors"
                              title="View details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Search className="w-8 h-8 text-gray-300 mb-2" />
                          <p>No codes found matching your criteria</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* HCC/RAF Tab Content */}
          {activeTab === 'HCC/RAF' && (
            <div className="mt-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">HCC Hierarchy & RAF Calculator</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* HCC Codes with RAF Values */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">ICD-10 to HCC Mapping</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {allCodes.filter(code => code.hccMapping).map((code) => (
                        <div key={code.code} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-mono text-sm font-medium text-gray-900">{code.code}</span>
                              <p className="text-sm text-gray-600">{code.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                {code.hccMapping?.hccCode}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-gray-700 mb-2">{code.hccMapping?.hccDescription}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">RAF Value:</span>
                              <span className="font-semibold text-green-600">+{code.hccMapping?.rafValue}</span>
                            </div>
                          </div>

                          {/* Hierarchy */}
                          <div className="mb-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-1">Hierarchy:</h5>
                            <div className="flex flex-wrap gap-1">
                              {code.hccMapping?.hierarchy.map((hcc, idx) => (
                                <span key={idx} className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                  hcc === code.hccMapping?.hccCode 
                                    ? 'bg-blue-100 text-blue-800 font-medium' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {hcc}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Interactions */}
                          <div>
                            <h5 className="text-xs font-medium text-gray-700 mb-1">Interactions:</h5>
                            <div className="flex flex-wrap gap-1">
                              {code.hccMapping?.interactions.map((interaction, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-600">
                                  {interaction}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RAF Calculator */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">RAF Score Calculator</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Patient Demographics</label>
                          <div className="grid grid-cols-2 gap-3">
                            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4]">
                              <option>Age: 65-69</option>
                              <option>Age: 70-74</option>
                              <option>Age: 75-79</option>
                              <option>Age: 80+</option>
                            </select>
                            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4]">
                              <option>Male</option>
                              <option>Female</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Active HCCs</label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {['HCC18 - Diabetes', 'HCC85 - Hypertension', 'HCC96 - Ischemic Heart Disease'].map((hcc, idx) => (
                              <label key={idx} className="flex items-center gap-2">
                                <input type="checkbox" className="text-[#62d5e4] focus:ring-[#62d5e4]" />
                                <span className="text-sm text-gray-700">{hcc}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Base RAF Score:</span>
                            <span className="text-sm text-gray-900">0.856</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">HCC Adjustments:</span>
                            <span className="text-sm text-green-600">+0.427</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Interactions:</span>
                            <span className="text-sm text-blue-600">+0.095</span>
                          </div>
                          <div className="border-t border-gray-300 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">Total RAF Score:</span>
                              <span className="text-lg font-semibold text-[#62d5e4]">1.378</span>
                            </div>
                          </div>
                        </div>

                        <button className="w-full px-4 py-2 bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors">
                          Calculate RAF Score
                        </button>
                      </div>
                    </div>

                    {/* HCC Validation Rules */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">HCC Validation Rules</h4>
                      <div className="space-y-2">
                        {[
                          'Age-based HCC restrictions apply',
                          'Hierarchy rules suppress lower-weighted HCCs',
                          'Disease interactions create additional RAF value',
                          'Medicare Advantage vs. Part C differences'
                        ].map((rule, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="w-2 h-2 bg-[#62d5e4] rounded-full mt-2"></span>
                            <span className="text-gray-600">{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coding Guidelines */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Coding Guidelines & References</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-2">CMS ICD-10-CM Official Guidelines</h3>
                <p className="text-sm text-gray-600 mb-4">Official coding guidelines for ICD-10-CM diagnosis coding</p>
                <button className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
                  <ExternalLink className="w-4 h-4" />
                  View Guidelines
                </button>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-2">CPT Assistant</h3>
                <p className="text-sm text-gray-600 mb-4">Monthly CPT coding guidance and updates</p>
                <button className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
                  <ExternalLink className="w-4 h-4" />
                  Access Archive
                </button>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-2">Medicare Claims Processing Manual</h3>
                <p className="text-sm text-gray-600 mb-4">Medicare guidelines for HCPCS and billing</p>
                <button className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
                  <ExternalLink className="w-4 h-4" />
                  View Manual
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}