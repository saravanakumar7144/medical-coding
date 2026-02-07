import { useState, useEffect, useRef } from 'react';
import { ClaimWorkspace } from './claim-workspace';
import {
  Filter,
  Search,
  Download,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
  Star,
  Plus,
  Trash2,
  Send,
  UserPlus,
  RotateCcw,
  FileText,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface ClaimItem {
  id: string;
  claimNumber: string;
  patientName: string;
  patientId: string;
  dateOfService: string;
  provider: string;
  payer: string;
  status: 'submitted' | 'pending' | 'paid' | 'denied' | 'appealed' | 'on_hold' | 'ready_to_bill';
  chargeAmount: number;
  allowedAmount: number | null;
  aging: number;
  lastAction: string;
  lastActionBy: string;
  lastActionDate: string;
  location: string;
  posCode: string;
  inHouseLab: boolean;
  hasERA: boolean;
  hasDenial: boolean;
  agingBucket: '0-30' | '31-60' | '61-90' | '91-120' | '120+';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  diagnosis: string[];
  procedures: string[];
}

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
  isDefault?: boolean;
}

export function ClaimsWorklist() {
  const [claimsData, setClaimsData] = useState<ClaimItem[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<ClaimItem[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [sortField, setSortField] = useState('dateOfService');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    payer: 'all',
    provider: 'all',
    dateRange: 'all',
    amountMin: '',
    amountMax: '',
    location: 'all',
    inHouseLab: 'all',
    hasERA: 'all',
    hasDenial: 'all',
    agingBucket: 'all'
  });

  // UI states
  const [showFilters, setShowFilters] = useState(true);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeView, setActiveView] = useState<string>('default');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);

  const tableRef = useRef<HTMLTableElement>(null);
  const filterInputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement>>({});

  // Sample data
  const sampleClaims: ClaimItem[] = [
    {
      id: 'CL-2024-001',
      claimNumber: 'CLM240001',
      patientName: 'John Smith',
      patientId: 'P-2024-001',
      dateOfService: '2024-01-15',
      provider: 'Dr. Sarah Johnson',
      payer: 'Medicare Part B',
      status: 'pending',
      chargeAmount: 2450.00,
      allowedAmount: 1960.00,
      aging: 15,
      lastAction: 'Submitted to payer',
      lastActionBy: 'System',
      lastActionDate: '2024-01-16',
      location: 'Main Clinic',
      posCode: '11',
      inHouseLab: false,
      hasERA: false,
      hasDenial: false,
      agingBucket: '0-30',
      priority: 'medium',
      diagnosis: ['I10', 'E11.9'],
      procedures: ['99213']
    },
    {
      id: 'CL-2024-002',
      claimNumber: 'CLM240002',
      patientName: 'Maria Garcia',
      patientId: 'P-2024-002',
      dateOfService: '2024-01-10',
      provider: 'Dr. Michael Chen',
      payer: 'Blue Cross Blue Shield',
      status: 'denied',
      chargeAmount: 1875.00,
      allowedAmount: null,
      aging: 20,
      lastAction: 'Denial received',
      lastActionBy: 'Jennifer Walsh',
      lastActionDate: '2024-01-18',
      location: 'Outpatient Center',
      posCode: '22',
      inHouseLab: true,
      hasERA: true,
      hasDenial: true,
      agingBucket: '0-30',
      priority: 'high',
      diagnosis: ['J44.9', 'Z87.891'],
      procedures: ['99214', '80053']
    },
    {
      id: 'CL-2024-003',
      claimNumber: 'CLM240003',
      patientName: 'Robert Wilson',
      patientId: 'P-2024-003',
      dateOfService: '2024-01-05',
      provider: 'Dr. Jennifer Walsh',
      payer: 'Aetna',
      status: 'paid',
      chargeAmount: 3200.00,
      allowedAmount: 2880.00,
      aging: 25,
      lastAction: 'Payment posted',
      lastActionBy: 'Lisa Rodriguez',
      lastActionDate: '2024-01-19',
      location: 'Main Clinic',
      posCode: '11',
      inHouseLab: false,
      hasERA: true,
      hasDenial: false,
      agingBucket: '0-30',
      priority: 'low',
      diagnosis: ['I50.9', 'N18.6'],
      procedures: ['99215']
    },
    {
      id: 'CL-2024-004',
      claimNumber: 'CLM240004',
      patientName: 'Lisa Davis',
      patientId: 'P-2024-004',
      dateOfService: '2023-12-15',
      provider: 'Dr. David Park',
      payer: 'United Healthcare',
      status: 'on_hold',
      chargeAmount: 1650.00,
      allowedAmount: 1485.00,
      aging: 45,
      lastAction: 'Pending auth verification',
      lastActionBy: 'Mike Chen',
      lastActionDate: '2024-01-10',
      location: 'Specialty Clinic',
      posCode: '11',
      inHouseLab: false,
      hasERA: false,
      hasDenial: false,
      agingBucket: '31-60',
      priority: 'urgent',
      diagnosis: ['K21.9'],
      procedures: ['99213']
    },
    {
      id: 'CL-2024-005',
      claimNumber: 'CLM240005',
      patientName: 'James Brown',
      patientId: 'P-2024-005',
      dateOfService: '2023-11-20',
      provider: 'Dr. Lisa Rodriguez',
      payer: 'Cigna',
      status: 'appealed',
      chargeAmount: 2100.00,
      allowedAmount: null,
      aging: 90,
      lastAction: 'Appeal submitted',
      lastActionBy: 'Sarah Kim',
      lastActionDate: '2024-01-12',
      location: 'Main Clinic',
      posCode: '11',
      inHouseLab: true,
      hasERA: false,
      hasDenial: true,
      agingBucket: '61-90',
      priority: 'high',
      diagnosis: ['E78.5', 'I10'],
      procedures: ['99214', '82465']
    }
  ];

  // Initialize data
  useEffect(() => {
    setClaimsData(sampleClaims);
    setFilteredClaims(sampleClaims);

    // Initialize saved views
    setSavedViews([
      {
        id: 'default',
        name: 'All Claims',
        filters: {},
        isDefault: true
      },
      {
        id: 'my_denials',
        name: 'My Denials This Week',
        filters: {
          status: 'denied',
          dateRange: '7days'
        }
      },
      {
        id: 'pending_auth',
        name: 'Pending Authorization',
        filters: {
          status: 'on_hold'
        }
      },
      {
        id: 'high_value',
        name: 'High Value Claims',
        filters: {
          amountMin: '2000'
        }
      }
    ]);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setIsShiftPressed(e.shiftKey);

      if (e.target === document.body || (e.target as HTMLElement).closest('.claims-table')) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setFocusedRowIndex(prev => Math.min(prev + 1, filteredClaims.length - 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setFocusedRowIndex(prev => Math.max(prev - 1, 0));
            break;
          case ' ':
            e.preventDefault();
            if (filteredClaims[focusedRowIndex]) {
              handleClaimSelection(filteredClaims[focusedRowIndex].id, focusedRowIndex);
            }
            break;
          case 'Enter':
            e.preventDefault();
            if (filteredClaims[focusedRowIndex]) {
              handleClaimDoubleClick(filteredClaims[focusedRowIndex]);
            }
            break;
          case 'Escape':
            setSelectedClaims([]);
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setIsShiftPressed(e.shiftKey);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [filteredClaims, focusedRowIndex]);

  // Filter and search logic
  useEffect(() => {
    let filtered = claimsData;

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(claim =>
        claim.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.payer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(claim => claim.status === filters.status);
    }
    if (filters.payer !== 'all') {
      filtered = filtered.filter(claim => claim.payer.includes(filters.payer));
    }
    if (filters.provider !== 'all') {
      filtered = filtered.filter(claim => claim.provider.includes(filters.provider));
    }
    if (filters.agingBucket !== 'all') {
      filtered = filtered.filter(claim => claim.agingBucket === filters.agingBucket);
    }
    if (filters.inHouseLab !== 'all') {
      const isLab = filters.inHouseLab === 'true';
      filtered = filtered.filter(claim => claim.inHouseLab === isLab);
    }
    if (filters.hasERA !== 'all') {
      const hasERA = filters.hasERA === 'true';
      filtered = filtered.filter(claim => claim.hasERA === hasERA);
    }
    if (filters.hasDenial !== 'all') {
      const hasDenial = filters.hasDenial === 'true';
      filtered = filtered.filter(claim => claim.hasDenial === hasDenial);
    }
    if (filters.amountMin) {
      filtered = filtered.filter(claim => claim.chargeAmount >= parseFloat(filters.amountMin));
    }
    if (filters.amountMax) {
      filtered = filtered.filter(claim => claim.chargeAmount <= parseFloat(filters.amountMax));
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue = a[sortField as keyof ClaimItem];
      let bValue = b[sortField as keyof ClaimItem];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredClaims(filtered);
    setCurrentPage(1);
  }, [claimsData, searchQuery, filters, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleClaimSelection = (claimId: string, index: number) => {
    if (isShiftPressed && lastSelectedIndex !== -1) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredClaims.slice(start, end + 1).map(claim => claim.id);
      setSelectedClaims(prev => [...new Set([...prev, ...rangeIds])]);
    } else {
      // Regular click: toggle selection
      setSelectedClaims(prev =>
        prev.includes(claimId)
          ? prev.filter(id => id !== claimId)
          : [...prev, claimId]
      );
      setLastSelectedIndex(index);
    }
  };

  const handleClaimDoubleClick = (claim: ClaimItem) => {
    console.log('Opening Claim Workspace for:', claim.claimNumber);
    setSelectedClaimId(claim.id);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on claims:`, selectedClaims);
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSelectedClaims([]);
      // Show success message
    }, 1500);
  };

  const handleInlineStatusChange = (claimId: string, newStatus: string) => {
    setClaimsData(prev => prev.map(claim =>
      claim.id === claimId
        ? { ...claim, status: newStatus as ClaimItem['status'] }
        : claim
    ));
  };

  const saveCurrentView = () => {
    const viewName = prompt('Enter a name for this view:');
    if (viewName) {
      const newView: SavedView = {
        id: Date.now().toString(),
        name: viewName,
        filters: { ...filters, searchQuery }
      };
      setSavedViews(prev => [...prev, newView]);
    }
  };

  const loadSavedView = (view: SavedView) => {
    setFilters(view.filters as any);
    setSearchQuery(view.filters.searchQuery || '');
    setActiveView(view.id);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      submitted: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      appealed: 'bg-purple-100 text-purple-800',
      on_hold: 'bg-orange-100 text-orange-800',
      ready_to_bill: 'bg-cyan-100 text-cyan-800'
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };

    return colorMap[priority as keyof typeof colorMap] || colorMap.medium;
  };

  const columns = [
    { key: 'patientName', label: 'Patient', sortable: true },
    { key: 'dateOfService', label: 'DOS', sortable: true },
    { key: 'provider', label: 'Provider', sortable: true },
    { key: 'payer', label: 'Payer', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'chargeAmount', label: '$Charge', sortable: true },
    { key: 'allowedAmount', label: '$Allowed', sortable: true },
    { key: 'aging', label: 'Aging', sortable: true },
    { key: 'lastAction', label: 'Last Action/By', sortable: false },
    { key: 'claimNumber', label: 'Claim #', sortable: true }
  ];

  const visibleColumns = columns.filter(col => !hiddenColumns.includes(col.key));

  // Pagination
  const totalPages = Math.ceil(filteredClaims.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredClaims.length);
  const currentClaims = filteredClaims.slice(startIndex, endIndex);

  // If a claim is selected, show the workspace
  if (selectedClaimId) {
    return (
      <ClaimWorkspace
        claimId={selectedClaimId}
        onClose={() => setSelectedClaimId(null)}
      />
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Claims Worklist</h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredClaims.length} claims • {selectedClaims.length} selected
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Saved Views Dropdown */}
            <div className="relative">
              <select
                value={activeView}
                onChange={(e) => {
                  const view = savedViews.find(v => v.id === e.target.value);
                  if (view) loadSavedView(view);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                {savedViews.map(view => (
                  <option key={view.id} value={view.id}>{view.name}</option>
                ))}
              </select>
            </div>

            {/* Save Current View */}
            <button
              onClick={saveCurrentView}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Star className="w-4 h-4" />
              Save View
            </button>

            {/* Column Settings */}
            <div className="relative">
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Columns
              </button>

              {showColumnSettings && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Show/Hide Columns</h3>
                    {columns.map(column => (
                      <label key={column.key} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={!hiddenColumns.includes(column.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHiddenColumns(prev => prev.filter(col => col !== column.key));
                            } else {
                              setHiddenColumns(prev => [...prev, column.key]);
                            }
                          }}
                          className="rounded border-gray-300 text-[#62d5e4] focus:ring-[#62d5e4]"
                        />
                        <span className="text-sm text-gray-700">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search claims, patients, providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="denied">Denied</option>
                <option value="appealed">Appealed</option>
                <option value="on_hold">On Hold</option>
                <option value="ready_to_bill">Ready to Bill</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payer</label>
              <select
                value={filters.payer}
                onChange={(e) => setFilters(prev => ({ ...prev, payer: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All Payers</option>
                <option value="Medicare">Medicare</option>
                <option value="Blue Cross">Blue Cross</option>
                <option value="Aetna">Aetna</option>
                <option value="United">United Healthcare</option>
                <option value="Cigna">Cigna</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Aging Bucket</label>
              <select
                value={filters.agingBucket}
                onChange={(e) => setFilters(prev => ({ ...prev, agingBucket: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All Ages</option>
                <option value="0-30">0-30 days</option>
                <option value="31-60">31-60 days</option>
                <option value="61-90">61-90 days</option>
                <option value="91-120">91-120 days</option>
                <option value="120+">120+ days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">In-House Lab</label>
              <select
                value={filters.inHouseLab}
                onChange={(e) => setFilters(prev => ({ ...prev, inHouseLab: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Has ERA</label>
              <select
                value={filters.hasERA}
                onChange={(e) => setFilters(prev => ({ ...prev, hasERA: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Has Denial</label>
              <select
                value={filters.hasDenial}
                onChange={(e) => setFilters(prev => ({ ...prev, hasDenial: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedClaims.length > 0 && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-cyan-50 border border-[#62d5e4] rounded-lg">
            <span className="text-sm font-medium text-gray-900">{selectedClaims.length} claims selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('re-scrub')}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 border border-gray-200 rounded hover:bg-white transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Re-scrub
              </button>
              <button
                onClick={() => handleBulkAction('submit')}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-[#62d5e4] rounded hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
              <button
                onClick={() => handleBulkAction('assign')}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 border border-gray-200 rounded hover:bg-white transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                Assign
              </button>
              <button
                onClick={() => setSelectedClaims([])}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 border border-gray-200 rounded hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Claims Table */}
      <div className="flex-1 min-h-0 px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-h-96 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table ref={tableRef} className="w-full claims-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedClaims.length === currentClaims.length && currentClaims.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClaims(currentClaims.map(claim => claim.id));
                        } else {
                          setSelectedClaims([]);
                        }
                      }}
                      className="rounded border-gray-300 text-[#62d5e4] focus:ring-[#62d5e4]"
                    />
                  </th>
                  {visibleColumns.map(column => (
                    <th key={column.key} className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      {column.sortable ? (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="flex items-center gap-1 hover:text-[#62d5e4] transition-colors"
                        >
                          {column.label}
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentClaims.map((claim, index) => (
                  <tr
                    key={claim.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${focusedRowIndex === startIndex + index ? 'ring-2 ring-[#62d5e4] ring-inset' : ''
                      } ${selectedClaims.includes(claim.id) ? 'bg-cyan-50' : ''}`}
                    onDoubleClick={() => handleClaimDoubleClick(claim)}
                    onClick={(e) => {
                      if (e.detail === 1) { // Single click
                        handleClaimSelection(claim.id, startIndex + index);
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedClaims.includes(claim.id)}
                        onChange={() => handleClaimSelection(claim.id, startIndex + index)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-[#62d5e4] focus:ring-[#62d5e4]"
                      />
                    </td>

                    {visibleColumns.map(column => {
                      switch (column.key) {
                        case 'patientName':
                          return (
                            <td key={column.key} className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900">{claim.patientName}</div>
                                <div className="text-sm text-gray-500">{claim.patientId}</div>
                              </div>
                            </td>
                          );
                        case 'dateOfService':
                          return (
                            <td key={column.key} className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">{claim.dateOfService}</span>
                              </div>
                            </td>
                          );
                        case 'provider':
                          return (
                            <td key={column.key} className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">{claim.provider}</span>
                              </div>
                            </td>
                          );
                        case 'status':
                          return (
                            <td key={column.key} className="px-4 py-3">
                              <select
                                value={claim.status}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleInlineStatusChange(claim.id, e.target.value);
                                }}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-[#62d5e4] ${getStatusBadge(claim.status)}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="submitted">Submitted</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="denied">Denied</option>
                                <option value="appealed">Appealed</option>
                                <option value="on_hold">On Hold</option>
                                <option value="ready_to_bill">Ready to Bill</option>
                              </select>
                            </td>
                          );
                        case 'chargeAmount':
                          return (
                            <td key={column.key} className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {claim.chargeAmount.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                  })}
                                </span>
                              </div>
                            </td>
                          );
                        case 'allowedAmount':
                          return (
                            <td key={column.key} className="px-4 py-3">
                              {claim.allowedAmount ? (
                                <span className="font-medium text-green-600">
                                  {claim.allowedAmount.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                  })}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                          );
                        case 'aging':
                          return (
                            <td key={column.key} className="px-4 py-3">
                              <span className={`text-sm font-medium ${claim.aging > 90 ? 'text-red-600' :
                                  claim.aging > 60 ? 'text-yellow-600' :
                                    claim.aging > 30 ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                {claim.aging} days
                              </span>
                            </td>
                          );
                        case 'lastAction':
                          return (
                            <td key={column.key} className="px-4 py-3">
                              <div>
                                <div className="text-sm text-gray-900">{claim.lastAction}</div>
                                <div className="text-xs text-gray-500">
                                  by {claim.lastActionBy} • {claim.lastActionDate}
                                </div>
                              </div>
                            </td>
                          );
                        case 'claimNumber':
                          return (
                            <td key={column.key} className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="font-mono text-sm text-gray-900">{claim.claimNumber}</span>
                              </div>
                            </td>
                          );
                        default:
                          return (
                            <td key={column.key} className="px-4 py-3">
                              <span className="text-sm text-gray-900">
                                {claim[column.key as keyof ClaimItem]}
                              </span>
                            </td>
                          );
                      }
                    })}

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimDoubleClick(claim);
                          }}
                          className="p-1 text-gray-400 hover:text-[#62d5e4] transition-colors"
                          title="View claim workspace"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {claim.hasERA && (
                          <div className="w-2 h-2 rounded-full bg-green-500" title="Has ERA" />
                        )}
                        {claim.hasDenial && (
                          <div className="w-2 h-2 rounded-full bg-red-500" title="Has Denial" />
                        )}
                        {claim.inHouseLab && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" title="In-house Lab" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {endIndex} of {filteredClaims.length} claims
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}