import { useState, useEffect } from 'react';
import { 
  Search, Eye, Sparkles, Zap, TrendingUp, Clock, DollarSign,
  AlertTriangle, CheckCircle, Brain, FileText, Send, Download,
  Play, RotateCcw, Target, Filter, ChevronRight, ArrowRight,
  Lightbulb, MessageSquare, Users, BarChart3, Info, X,
  CheckSquare, ClipboardCheck, RefreshCw, Star, Award,
  FileCheck, ArrowUpRight, Timer, Workflow, ChevronDown, ChevronUp
} from 'lucide-react';
import { DenialsClaimsInbox } from './denials-claims-inbox';

interface Denial {
  id: string;
  claimNumber: string;
  patientName: string;
  payer: string;
  serviceDate: string;
  denialDate: string;
  daysOpen: number;
  carcCode: string;
  rarcCode?: string;
  denialReason: string;
  procedureCode: string;
  amount: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  aiSuggestedAction: string;
  aiConfidence: number;
  predictedSuccess: number;
  estimatedDaysToResolve: number;
  category: string;
  autoFixAvailable: boolean;
  appealRecommended: boolean;
}

export function EnhancedDenialsWorkbench() {
  const [selectedDenial, setSelectedDenial] = useState<Denial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'auto-fixable' | 'appeal' | 'critical'>('all');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [showClaimsInbox, setShowClaimsInbox] = useState(true);

  // API state
  const [denials, setDenials] = useState<Denial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch denials from API
  useEffect(() => {
    fetchDenials();
  }, []);

  const fetchDenials = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${apiUrl}/api/claims/denials?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Map API response to Denial format
        const mappedDenials: Denial[] = data.map((denial: any) => ({
          id: denial.denial_id,
          claimNumber: denial.claim_number || 'N/A',
          patientName: 'Patient', // API doesn't return patient name directly
          payer: denial.payer_name || 'Unknown',
          serviceDate: denial.service_date ? new Date(denial.service_date).toLocaleDateString() : 'N/A',
          denialDate: denial.denial_date ? new Date(denial.denial_date).toLocaleDateString() : 'N/A',
          daysOpen: denial.denial_date ? Math.floor((new Date().getTime() - new Date(denial.denial_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          carcCode: denial.carc_code || 'N/A',
          rarcCode: denial.rarc_code,
          denialReason: denial.denial_reason || 'Unknown reason',
          procedureCode: 'N/A', // Would need to join with procedures
          amount: denial.denied_amount || 0,
          severity: mapSeverity(denial.priority || 'medium'),
          aiSuggestedAction: denial.ai_suggested_action || 'Review denial details',
          aiConfidence: denial.ai_confidence_score || 70,
          predictedSuccess: denial.predicted_success_rate || 50,
          estimatedDaysToResolve: 7,
          category: denial.denial_category || 'Other',
          autoFixAvailable: denial.auto_fix_available || false,
          appealRecommended: denial.appeal_recommended || false
        }));
        setDenials(mappedDenials);
      } else {
        setError('Failed to load denials');
        // Fallback to mock data on error
        setDenials(mockDenials);
      }
    } catch (err) {
      console.error('Error fetching denials:', err);
      setError('Failed to connect to API');
      // Fallback to mock data on error
      setDenials(mockDenials);
    } finally {
      setLoading(false);
    }
  };

  const mapSeverity = (priority: string): 'critical' | 'high' | 'medium' | 'low' => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  };

  // Mock denials for fallback
  const mockDenials: Denial[] = [
    {
      id: 'D001',
      claimNumber: 'CLM-2024-001',
      patientName: 'John Smith',
      payer: 'Medicare Part B',
      serviceDate: '01/15/24',
      denialDate: '01/18/24',
      daysOpen: 3,
      carcCode: '59',
      rarcCode: 'M15',
      denialReason: 'Procedure incidental to primary',
      procedureCode: '36415',
      amount: 25,
      severity: 'low',
      aiSuggestedAction: 'Add modifier 59 - Distinct procedural service',
      aiConfidence: 96,
      predictedSuccess: 92,
      estimatedDaysToResolve: 5,
      category: 'Bundling',
      autoFixAvailable: true,
      appealRecommended: false
    },
    {
      id: 'D002',
      claimNumber: 'CLM-2024-002',
      patientName: 'Maria Garcia',
      payer: 'Blue Cross Blue Shield',
      serviceDate: '01/12/24',
      denialDate: '01/16/24',
      daysOpen: 7,
      carcCode: '197',
      denialReason: 'Precertification/authorization absent',
      procedureCode: '99213',
      amount: 850,
      severity: 'critical',
      aiSuggestedAction: 'Request retroactive authorization + Submit appeal with medical necessity',
      aiConfidence: 88,
      predictedSuccess: 65,
      estimatedDaysToResolve: 25,
      category: 'Authorization',
      autoFixAvailable: false,
      appealRecommended: true
    },
    {
      id: 'D003',
      claimNumber: 'CLM-2024-003',
      patientName: 'Robert Wilson',
      payer: 'Aetna',
      serviceDate: '01/10/24',
      denialDate: '01/14/24',
      daysOpen: 9,
      carcCode: '11',
      denialReason: 'Diagnosis inconsistent with procedure',
      procedureCode: '93000',
      amount: 185,
      severity: 'high',
      aiSuggestedAction: 'Update diagnosis pointer: I48.91 (Unspecified atrial fibrillation)',
      aiConfidence: 94,
      predictedSuccess: 89,
      estimatedDaysToResolve: 7,
      category: 'Coding Error',
      autoFixAvailable: true,
      appealRecommended: false
    },
    {
      id: 'D004',
      claimNumber: 'CLM-2024-004',
      patientName: 'Sarah Johnson',
      payer: 'United Healthcare',
      serviceDate: '01/08/24',
      denialDate: '01/12/24',
      daysOpen: 11,
      carcCode: '16',
      denialReason: 'Claim lacks information',
      procedureCode: '99285',
      amount: 420,
      severity: 'medium',
      aiSuggestedAction: 'Add ER visit documentation + Update place of service to 23',
      aiConfidence: 91,
      predictedSuccess: 87,
      estimatedDaysToResolve: 10,
      category: 'Documentation',
      autoFixAvailable: true,
      appealRecommended: false
    }
  ];

  const filteredDenials = denials.filter(denial => {
    const matchesSearch = 
      denial.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      denial.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      denial.carcCode.includes(searchQuery);
    
    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'auto-fixable' && denial.autoFixAvailable) ||
      (activeFilter === 'appeal' && denial.appealRecommended) ||
      (activeFilter === 'critical' && denial.severity === 'critical');
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: denials.length,
    autoFixable: denials.filter(d => d.autoFixAvailable).length,
    needsAppeal: denials.filter(d => d.appealRecommended).length,
    totalAtRisk: denials.reduce((sum, d) => sum + d.amount, 0),
    avgDaysOpen: Math.round(denials.reduce((sum, d) => sum + d.daysOpen, 0) / denials.length),
    aiSuccessRate: 87
  };

  const handleAutoFix = async (denial: Denial) => {
    setProcessingAction(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessingAction(false);
    // Show success message
  };

  const handleGenerateAppeal = async (denial: Denial) => {
    setProcessingAction(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setProcessingAction(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const handleOpenClaim = (claimId: string, section?: string) => {
    console.log('Opening claim:', claimId, 'Section:', section);
    // This would navigate to the claim workspace
  };

  const handleOpenDenial = (claimId: string) => {
    console.log('Opening denial for claim:', claimId);
    // This would open the denial details in the right panel
    // For now, we can simulate by selecting a denial
    const denial = denials.find(d => d.claimNumber === claimId);
    if (denial) {
      setSelectedDenial(denial);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#62d5e4]" />
              AI-Powered Denials Resolution
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Intelligent automation • One-click fixes • Smart prioritization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-[#62d5e4] text-white rounded-lg hover:from-purple-600 hover:to-[#4bc5d6] transition-all"
            >
              <Brain className="w-4 h-4" />
              AI Assistant
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-blue-700">Total Denials</span>
              <AlertTriangle className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl text-blue-900">{stats.total}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-green-700">Auto-Fixable</span>
              <Zap className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xl text-green-900">{stats.autoFixable}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-purple-700">Appeal Ready</span>
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl text-purple-900">{stats.needsAppeal}</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-orange-700">At Risk</span>
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xl text-orange-900">${stats.totalAtRisk.toLocaleString()}</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-yellow-700">Avg Days</span>
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-xl text-yellow-900">{stats.avgDaysOpen}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#62d5e4] to-cyan-200 rounded-lg p-3 border border-cyan-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-cyan-900">AI Success</span>
              <Star className="w-4 h-4 text-cyan-800" />
            </div>
            <p className="text-xl text-cyan-900">{stats.aiSuccessRate}%</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by claim, patient, or CARC code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('auto-fixable')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeFilter === 'auto-fixable' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              Auto-Fix
            </button>
            <button
              onClick={() => setActiveFilter('appeal')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeFilter === 'appeal' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              <FileText className="w-3 h-3 inline mr-1" />
              Appeals
            </button>
            <button
              onClick={() => setActiveFilter('critical')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeFilter === 'critical' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Critical
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Claims Inbox Section - Collapsible */}
        <div className="border-b border-gray-200 bg-white">
          <button
            onClick={() => setShowClaimsInbox(!showClaimsInbox)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#62d5e4]" />
              <h2 className="text-lg font-medium text-gray-900">Claims Inbox - Denials</h2>
              <span className="text-sm text-gray-500">({denials.length} claims)</span>
            </div>
            {showClaimsInbox ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showClaimsInbox && (
            <div className="px-6 pb-6">
              <DenialsClaimsInbox 
                onOpenClaim={handleOpenClaim} 
                onOpenDenial={handleOpenDenial} 
              />
            </div>
          )}
        </div>

        {/* AI-Powered Analysis Section */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-medium text-gray-900">AI-Powered Analysis & Quick Actions</h2>
          </div>

          <div className="flex gap-6">
            {/* Denials List */}
            <div className={`${selectedDenial ? 'w-1/2' : 'w-full'} transition-all`}>
              <div className="space-y-3">
                {filteredDenials.map((denial) => (
                  <div
                    key={denial.id}
                    onClick={() => setSelectedDenial(denial)}
                    className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedDenial?.id === denial.id 
                        ? 'border-[#62d5e4] shadow-md' 
                        : `border-gray-200 ${getSeverityBg(denial.severity)}`
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(denial.severity)}`} />
                          <h3 className="font-mono text-gray-900">{denial.claimNumber}</h3>
                          <span className="text-xs text-gray-500">• {denial.patientName}</span>
                          {denial.autoFixAvailable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                              <Zap className="w-3 h-3 mr-1" />
                              Quick Fix
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-gray-500">Payer:</span>
                            <p className="text-gray-900">{denial.payer}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">CARC:</span>
                            <p className="text-gray-900">{denial.carcCode}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Amount:</span>
                            <p className="text-gray-900">${denial.amount}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Days:</span>
                            <p className={denial.daysOpen > 7 ? 'text-red-600' : 'text-gray-900'}>{denial.daysOpen}</p>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 rounded p-2 mb-2">
                          <p className="text-xs text-gray-600 mb-1">{denial.denialReason}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-[#62d5e4]" />
                          <p className="text-xs text-gray-700 flex-1">{denial.aiSuggestedAction}</p>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600">{denial.predictedSuccess}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Denial Detail Panel */}
            {selectedDenial && (
              <div className="w-1/2 transition-all">
                <div className="bg-white rounded-lg border border-gray-200 sticky top-6">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg text-gray-900">Denial Resolution Workspace</h2>
                      <button
                        onClick={() => setSelectedDenial(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {/* Claim Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm text-gray-700 mb-3">Claim Information</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Claim Number:</span>
                          <p className="text-gray-900 font-mono">{selectedDenial.claimNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Patient:</span>
                          <p className="text-gray-900">{selectedDenial.patientName}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Service Date:</span>
                          <p className="text-gray-900">{selectedDenial.serviceDate}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Denial Date:</span>
                          <p className="text-gray-900">{selectedDenial.denialDate}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Procedure:</span>
                          <p className="text-gray-900 font-mono">{selectedDenial.procedureCode}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <p className="text-gray-900">${selectedDenial.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <h3 className="text-sm text-purple-900">AI Analysis & Recommendation</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-white rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Suggested Action:</span>
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {selectedDenial.aiConfidence}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{selectedDenial.aiSuggestedAction}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white rounded p-2">
                            <span className="text-xs text-gray-600">Success Rate:</span>
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {selectedDenial.predictedSuccess}%
                            </p>
                          </div>
                          <div className="bg-white rounded p-2">
                            <span className="text-xs text-gray-600">Est. Resolution:</span>
                            <p className="text-sm text-blue-600 flex items-center gap-1">
                              <Timer className="w-4 h-4" />
                              {selectedDenial.estimatedDaysToResolve} days
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <h3 className="text-sm text-gray-700">Quick Actions</h3>
                      
                      {selectedDenial.autoFixAvailable && (
                        <button
                          onClick={() => handleAutoFix(selectedDenial)}
                          disabled={processingAction}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            <div className="text-left">
                              <p className="text-sm">Apply AI Auto-Fix</p>
                              <p className="text-xs opacity-90">Applies correction and resubmits automatically</p>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      )}
                      
                      {selectedDenial.appealRecommended && (
                        <button
                          onClick={() => handleGenerateAppeal(selectedDenial)}
                          disabled={processingAction}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            <div className="text-left">
                              <p className="text-sm">Generate AI Appeal Letter</p>
                              <p className="text-xs opacity-90">Creates ready-to-send appeal with evidence</p>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      )}
                      
                      <button className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-[#62d5e4] hover:bg-gray-50 transition-all">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          <span className="text-sm">Open Full Claim Workspace</span>
                        </div>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      
                      <button className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-[#62d5e4] hover:bg-gray-50 transition-all">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-sm">Consult AI Expert</span>
                        </div>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Denial Details */}
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h3 className="text-sm text-red-900 mb-2">Denial Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-red-700">CARC Code:</span>
                          <span className="text-red-900 font-mono">{selectedDenial.carcCode}</span>
                        </div>
                        {selectedDenial.rarcCode && (
                          <div className="flex justify-between">
                            <span className="text-red-700">RARC Code:</span>
                            <span className="text-red-900 font-mono">{selectedDenial.rarcCode}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-red-700">Category:</span>
                          <span className="text-red-900">{selectedDenial.category}</span>
                        </div>
                        <div className="pt-2 border-t border-red-200">
                          <span className="text-red-700">Reason:</span>
                          <p className="text-red-900 mt-1">{selectedDenial.denialReason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {showAIPanel && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
          <div className="bg-gradient-to-r from-purple-600 to-[#62d5e4] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <h3>AI Denial Expert</h3>
            </div>
            <button onClick={() => setShowAIPanel(false)} className="text-white hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="flex items-start gap-2">
                <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-purple-900 mb-2">
                    I'm analyzing your denial patterns and can help you:
                  </p>
                  <ul className="text-xs text-purple-800 space-y-1">
                    <li>• Find the best resolution strategy</li>
                    <li>• Generate appeal letters automatically</li>
                    <li>• Predict success rates</li>
                    <li>• Identify recurring issues</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 mb-1">Pattern Detected</div>
              <p className="text-sm text-blue-900">
                Medicare has denied 5 similar bundling issues this month. Success rate with modifier 59: 94%
              </p>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4]"
              />
              <button className="px-3 py-2 bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6]">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
