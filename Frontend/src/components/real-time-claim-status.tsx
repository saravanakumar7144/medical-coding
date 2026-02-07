import { useState } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  FileText,
  DollarSign,
  Search,
  Filter,
  ChevronRight,
  Wifi,
  AlertCircle,
  TrendingUp,
  Activity,
  Download
} from 'lucide-react';

interface ClaimStatus {
  id: string;
  claimNumber: string;
  patientName: string;
  payer: string;
  submissionDate: string;
  totalAmount: number;
  currentStatus: string;
  source: 'EDI' | 'Portal' | 'Both';
  timeline: TimelineEvent[];
  discrepancy?: {
    ediStatus: string;
    portalStatus: string;
    reason: string;
  };
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  status: string;
  source: 'EDI' | 'Portal' | 'Both';
  details: string;
  amount?: number;
  adjustments?: string[];
}

export function RealTimeClaimStatus() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDiscrepanciesOnly, setShowDiscrepanciesOnly] = useState(false);

  const claims: ClaimStatus[] = [
    {
      id: 'claim1',
      claimNumber: 'CLM240001',
      patientName: 'John Smith',
      payer: 'Medicare Part B',
      submissionDate: '2024-01-10',
      totalAmount: 450.00,
      currentStatus: 'Paid',
      source: 'Both',
      timeline: [
        {
          id: 'e1',
          timestamp: '2024-01-10 09:00:00',
          status: 'Submitted',
          source: 'EDI',
          details: 'Claim submitted via EDI transaction'
        },
        {
          id: 'e2',
          timestamp: '2024-01-10 09:30:00',
          status: 'Accepted',
          source: 'EDI',
          details: '999 acknowledgment received'
        },
        {
          id: 'e3',
          timestamp: '2024-01-12 14:20:00',
          status: 'In Process',
          source: 'Portal',
          details: 'Claim under review'
        },
        {
          id: 'e4',
          timestamp: '2024-01-15 16:45:00',
          status: 'Paid',
          source: 'Both',
          details: 'Payment processed - ERA/835 received',
          amount: 360.00,
          adjustments: ['CO-45: Charges exceed fee schedule']
        }
      ]
    },
    {
      id: 'claim2',
      claimNumber: 'CLM240002',
      patientName: 'Sarah Johnson',
      payer: 'Aetna',
      submissionDate: '2024-01-12',
      totalAmount: 750.00,
      currentStatus: 'Pending',
      source: 'Both',
      discrepancy: {
        ediStatus: 'Pending',
        portalStatus: 'Additional Information Required',
        reason: 'Portal shows additional info needed, EDI shows pending review'
      },
      timeline: [
        {
          id: 'e5',
          timestamp: '2024-01-12 11:15:00',
          status: 'Submitted',
          source: 'EDI',
          details: 'Initial submission'
        },
        {
          id: 'e6',
          timestamp: '2024-01-12 11:45:00',
          status: 'Accepted',
          source: 'EDI',
          details: 'Syntax validation passed'
        },
        {
          id: 'e7',
          timestamp: '2024-01-14 10:30:00',
          status: 'Additional Information Required',
          source: 'Portal',
          details: 'Medical records requested'
        }
      ]
    },
    {
      id: 'claim3',
      claimNumber: 'CLM240003',
      patientName: 'Michael Brown',
      payer: 'Blue Cross Blue Shield',
      submissionDate: '2024-01-13',
      totalAmount: 325.00,
      currentStatus: 'Denied',
      source: 'Both',
      timeline: [
        {
          id: 'e8',
          timestamp: '2024-01-13 08:20:00',
          status: 'Submitted',
          source: 'EDI',
          details: 'Claim transmitted'
        },
        {
          id: 'e9',
          timestamp: '2024-01-15 09:15:00',
          status: 'Denied',
          source: 'Both',
          details: 'Claim denied - medical necessity not established',
          adjustments: ['CO-50: Medical necessity not established']
        }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'in process':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'additional information required':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'in process':
        return 'bg-blue-100 text-blue-800';
      case 'additional information required':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'EDI':
        return <FileText className="w-3 h-3 text-blue-600" />;
      case 'Portal':
        return <Wifi className="w-3 h-3 text-green-600" />;
      case 'Both':
        return <Activity className="w-3 h-3 text-purple-600" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (showDiscrepanciesOnly && !claim.discrepancy) return false;
    if (statusFilter !== 'all' && claim.currentStatus.toLowerCase() !== statusFilter) return false;
    if (searchQuery && !claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !claim.patientName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const refreshClaimStatus = (claimId: string) => {
    console.log(`Refreshing status for claim: ${claimId}`);
  };

  const investigateDiscrepancy = (claimId: string) => {
    console.log(`Investigating discrepancy for claim: ${claimId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Real-Time Claim Status</h1>
        <p className="text-sm text-gray-600 mt-1">
          Unified claim status tracking from EDI and payer portal sources
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by claim number or patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4]"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="denied">Denied</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDiscrepanciesOnly}
              onChange={(e) => setShowDiscrepanciesOnly(e.target.checked)}
              className="text-[#62d5e4] focus:ring-[#62d5e4]"
            />
            <span className="text-sm text-gray-700">Discrepancies Only</span>
          </label>

          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors">
            <RefreshCw className="w-4 h-4" />
            Sync All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims List */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Claims ({filteredClaims.length})</h2>

          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => setSelectedClaim(claim.id)}
              className={`bg-white rounded-lg border p-4 cursor-pointer transition-colors ${selectedClaim === claim.id ? 'border-[#62d5e4] bg-cyan-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium text-gray-900">{claim.claimNumber}</span>
                    <div className="flex items-center gap-1">
                      {getSourceIcon(claim.source)}
                      <span className="text-xs text-gray-500">{claim.source}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{claim.patientName}</p>
                </div>

                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(claim.currentStatus)}`}>
                    {getStatusIcon(claim.currentStatus)}
                    {claim.currentStatus}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">${claim.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {claim.discrepancy && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Status Discrepancy</span>
                  </div>
                  <p className="text-xs text-yellow-700">
                    EDI: {claim.discrepancy.ediStatus} | Portal: {claim.discrepancy.portalStatus}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{claim.payer}</span>
                <span>Submitted: {claim.submissionDate}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Claim Detail Timeline */}
        <div>
          {selectedClaim ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {(() => {
                const claim = claims.find(c => c.id === selectedClaim);
                if (!claim) return null;

                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{claim.claimNumber}</h2>
                        <p className="text-sm text-gray-600">{claim.patientName} • {claim.payer}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {claim.discrepancy && (
                          <button
                            onClick={() => investigateDiscrepancy(claim.id)}
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Investigate
                          </button>
                        )}
                        <button
                          onClick={() => refreshClaimStatus(claim.id)}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </button>
                      </div>
                    </div>

                    {claim.discrepancy && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <h3 className="font-medium text-red-900">Status Discrepancy Detected</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-red-800">EDI Status:</span>
                            <p className="text-red-700">{claim.discrepancy.ediStatus}</p>
                          </div>
                          <div>
                            <span className="font-medium text-red-800">Portal Status:</span>
                            <p className="text-red-700">{claim.discrepancy.portalStatus}</p>
                          </div>
                        </div>
                        <p className="text-sm text-red-700 mt-2">{claim.discrepancy.reason}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Status Timeline</h3>
                      <div className="space-y-4">
                        {claim.timeline.map((event, index) => (
                          <div key={event.id} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-[#62d5e4]' : 'bg-gray-100'
                                }`}>
                                {getStatusIcon(event.status)}
                              </div>
                              {index < claim.timeline.length - 1 && (
                                <div className="w-px h-8 bg-gray-200 mt-2" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{event.status}</span>
                                <div className="flex items-center gap-1">
                                  {getSourceIcon(event.source)}
                                  <span className="text-xs text-gray-500">{event.source}</span>
                                </div>
                              </div>

                              <p className="text-sm text-gray-600 mb-1">{event.details}</p>

                              {event.amount && (
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="w-4 h-4 text-green-500" />
                                  <span className="font-medium text-green-600">${event.amount.toFixed(2)}</span>
                                </div>
                              )}

                              {event.adjustments && (
                                <div className="mt-2">
                                  <h4 className="text-xs font-medium text-gray-700 mb-1">Adjustments:</h4>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {event.adjustments.map((adj, adjIndex) => (
                                      <li key={adjIndex} className="flex items-start gap-1">
                                        <span className="text-gray-400">•</span>
                                        <span>{adj}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <p className="text-xs text-gray-500 mt-2">{event.timestamp}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Financial Summary</h4>
                          <p className="text-sm text-gray-600">
                            Billed: ${claim.totalAmount.toFixed(2)}
                            {claim.timeline.find(e => e.amount) && (
                              <span className="ml-2">
                                | Paid: ${claim.timeline.find(e => e.amount)?.amount?.toFixed(2)}
                              </span>
                            )}
                          </p>
                        </div>

                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <Download className="w-4 h-4" />
                          Export Details
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Claim</h3>
              <p className="text-sm text-gray-600">
                Choose a claim from the list to view its detailed status timeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}