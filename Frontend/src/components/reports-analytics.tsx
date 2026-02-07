import { useState, useEffect } from 'react';
import { 
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Share,
  Mail,
  Save,
  Bookmark,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  DollarSign,
  FileText,
  Users,
  Building,
  Activity,
  Target,
  Zap,
  Database,
  Hash,
  Tag,
  Flag,
  Star,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ExternalLink,
  Copy,
  Maximize,
  Minimize,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Calendar as CalendarIcon,
  Clock3,
  MapPin,
  Phone,
  Globe,
  Link,
  Paperclip,
  Archive,
  BookOpen,
  Folder,
  FolderOpen,
  FileCheck,
  FileX,
  FilePlus,
  Loader,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart, ComposedChart } from 'recharts';

interface DashboardMetric {
  id: string;
  name: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'percentage' | 'currency' | 'number' | 'days';
  description: string;
  trend: number[];
}

interface ChartData {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'composed';
  data: any[];
  xAxis?: string;
  yAxis?: string[];
  description: string;
  period: string;
}

interface SavedQuery {
  id: string;
  name: string;
  description: string;
  dimensions: string[];
  measures: string[];
  filters: QueryFilter[];
  dateRange: DateRange;
  createdBy: string;
  createdDate: string;
  lastRun: string;
  isBookmarked: boolean;
  isShared: boolean;
}

interface QueryFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between';
  value: string | string[] | number | { min?: number; max?: number };
}

interface DateRange {
  start: string;
  end: string;
  preset?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' | 'ytd' | 'custom';
}

interface Cohort {
  id: string;
  name: string;
  description: string;
  filters: QueryFilter[];
  patientCount: number;
  claimCount: number;
  totalCharges: number;
  createdDate: string;
  isBookmarked: boolean;
}

interface ExportConfig {
  format: 'csv' | 'pdf' | 'excel';
  includeCharts: boolean;
  includeData: boolean;
  includeFilters: boolean;
  emailRecipients?: string[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
}

export function ReportsAnalytics() {
  const [activeTab, setActiveTab] = useState('standard-dashboards');
  const [selectedDashboard, setSelectedDashboard] = useState('coding-accuracy');
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [showSaveQuery, setShowSaveQuery] = useState(false);
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Query builder state
  const [queryForm, setQueryForm] = useState({
    name: '',
    description: '',
    dimensions: [] as string[],
    measures: [] as string[],
    filters: [] as QueryFilter[],
    dateRange: {
      start: '',
      end: '',
      preset: 'last_30_days' as DateRange['preset']
    }
  });

  // Export state
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'csv',
    includeCharts: true,
    includeData: true,
    includeFilters: true
  });

  // Available dimensions and measures
  const availableDimensions = [
    'payer', 'provider', 'specialty', 'dos', 'procedure_code', 'diagnosis_code', 
    'modifier', 'pos', 'status', 'denial_reason', 'user', 'team', 'facility'
  ];

  const availableMeasures = [
    'charge_amount', 'allowed_amount', 'paid_amount', 'adjustment_amount',
    'denial_rate', 'claim_count', 'patient_count', 'avg_days_to_payment',
    'coding_accuracy', 'first_pass_rate', 'clean_claim_rate'
  ];

  // Sample data
  const sampleMetrics: DashboardMetric[] = [
    {
      id: 'coding-accuracy',
      name: 'Coding Accuracy',
      value: '94.8%',
      change: 2.3,
      changeType: 'increase',
      format: 'percentage',
      description: 'Overall coding accuracy rate',
      trend: [91.2, 92.1, 93.4, 94.1, 94.8]
    },
    {
      id: 'denial-rate',
      name: 'Denial Rate',
      value: '8.2%',
      change: -1.1,
      changeType: 'decrease',
      format: 'percentage',
      description: 'Claims denied on first submission',
      trend: [10.1, 9.8, 9.2, 8.7, 8.2]
    },
    {
      id: 'revenue-cycle',
      name: 'Avg Days in A/R',
      value: 24.5,
      change: -3.2,
      changeType: 'decrease',
      format: 'days',
      description: 'Average days in accounts receivable',
      trend: [28.1, 27.3, 26.2, 25.1, 24.5]
    },
    {
      id: 'clean-claim-rate',
      name: 'Clean Claim Rate',
      value: '91.7%',
      change: 4.2,
      changeType: 'increase',
      format: 'percentage',
      description: 'Claims passing first submission',
      trend: [87.2, 88.1, 89.4, 90.6, 91.7]
    },
    {
      id: 'monthly-revenue',
      name: 'Monthly Revenue',
      value: '$2.8M',
      change: 8.5,
      changeType: 'increase',
      format: 'currency',
      description: 'Total revenue collected this month',
      trend: [2.4, 2.5, 2.6, 2.7, 2.8]
    },
    {
      id: 'pending-claims',
      name: 'Pending Claims',
      value: 1247,
      change: -156,
      changeType: 'decrease',
      format: 'number',
      description: 'Claims awaiting processing',
      trend: [1450, 1398, 1324, 1289, 1247]
    }
  ];

  const sampleCharts: ChartData[] = [
    {
      id: 'denial-trends',
      title: 'Denial Trends by Payer',
      type: 'bar',
      data: [
        { payer: 'Medicare', denials: 145, total: 1823, rate: 7.95 },
        { payer: 'Medicaid', denials: 89, total: 1156, rate: 7.70 },
        { payer: 'BCBS', denials: 123, total: 1456, rate: 8.45 },
        { payer: 'Aetna', denials: 67, total: 892, rate: 7.51 },
        { payer: 'Cigna', denials: 78, total: 934, rate: 8.35 },
        { payer: 'UHC', denials: 91, total: 1189, rate: 7.65 }
      ],
      xAxis: 'payer',
      yAxis: ['rate'],
      description: 'Denial rates by payer over the last 30 days',
      period: 'Last 30 Days'
    },
    {
      id: 'revenue-trend',
      title: 'Revenue Impact Trend',
      type: 'line',
      data: [
        { month: 'Jan', charges: 2.8, payments: 2.4, adjustments: 0.3 },
        { month: 'Feb', charges: 2.9, payments: 2.5, adjustments: 0.3 },
        { month: 'Mar', charges: 3.1, payments: 2.7, adjustments: 0.3 },
        { month: 'Apr', charges: 3.2, payments: 2.8, adjustments: 0.3 },
        { month: 'May', charges: 3.4, payments: 2.9, adjustments: 0.4 },
        { month: 'Jun', charges: 3.3, payments: 3.0, adjustments: 0.2 }
      ],
      xAxis: 'month',
      yAxis: ['charges', 'payments', 'adjustments'],
      description: 'Monthly charges, payments, and adjustments',
      period: 'Last 6 Months'
    },
    {
      id: 'ar-aging',
      title: 'A/R Aging Distribution',
      type: 'pie',
      data: [
        { range: '0-30 days', amount: 1.2, percentage: 42.8 },
        { range: '31-60 days', amount: 0.8, percentage: 28.6 },
        { range: '61-90 days', amount: 0.5, percentage: 17.9 },
        { range: '91-120 days', amount: 0.2, percentage: 7.1 },
        { range: '120+ days', amount: 0.1, percentage: 3.6 }
      ],
      description: 'Current accounts receivable aging distribution',
      period: 'Current'
    },
    {
      id: 'throughput',
      title: 'Throughput by Team',
      type: 'bar',
      data: [
        { team: 'Coding Team A', claims: 456, accuracy: 96.2 },
        { team: 'Coding Team B', claims: 389, accuracy: 94.8 },
        { team: 'Coding Team C', claims: 423, accuracy: 95.1 },
        { team: 'Billing Team A', claims: 523, accuracy: 92.4 },
        { team: 'Billing Team B', claims: 467, accuracy: 93.7 }
      ],
      xAxis: 'team',
      yAxis: ['claims', 'accuracy'],
      description: 'Claims processed and accuracy by team',
      period: 'Last 30 Days'
    }
  ];

  const sampleSavedQueries: SavedQuery[] = [
    {
      id: 'query-001',
      name: 'High Value Denials Analysis',
      description: 'Claims over $5,000 denied in the last 30 days',
      dimensions: ['payer', 'denial_reason', 'provider'],
      measures: ['charge_amount', 'claim_count'],
      filters: [
        { field: 'charge_amount', operator: 'greater_than', value: 5000 },
        { field: 'status', operator: 'equals', value: 'denied' }
      ],
      dateRange: { start: '2024-01-01', end: '2024-01-31', preset: 'last_30_days' },
      createdBy: 'Sarah Johnson',
      createdDate: '2024-01-15',
      lastRun: '2024-01-20',
      isBookmarked: true,
      isShared: false
    },
    {
      id: 'query-002',
      name: 'Provider Performance Scorecard',
      description: 'Coding accuracy and throughput by provider',
      dimensions: ['provider', 'specialty'],
      measures: ['coding_accuracy', 'claim_count', 'avg_days_to_payment'],
      filters: [],
      dateRange: { start: '2024-01-01', end: '2024-01-31', preset: 'last_30_days' },
      createdBy: 'Mike Chen',
      createdDate: '2024-01-10',
      lastRun: '2024-01-18',
      isBookmarked: false,
      isShared: true
    }
  ];

  const sampleCohorts: Cohort[] = [
    {
      id: 'cohort-001',
      name: 'Cardiology High-Risk Claims',
      description: 'Cardiology claims over $10,000 with complex procedures',
      filters: [
        { field: 'specialty', operator: 'equals', value: 'cardiology' },
        { field: 'charge_amount', operator: 'greater_than', value: 10000 }
      ],
      patientCount: 234,
      claimCount: 456,
      totalCharges: 5670000,
      createdDate: '2024-01-10',
      isBookmarked: true
    },
    {
      id: 'cohort-002',
      name: 'Medicare Advantage Denials',
      description: 'Medicare Advantage claims denied for prior auth',
      filters: [
        { field: 'payer', operator: 'contains', value: 'Medicare Advantage' },
        { field: 'denial_reason', operator: 'equals', value: 'prior_auth_required' }
      ],
      patientCount: 89,
      claimCount: 156,
      totalCharges: 890000,
      createdDate: '2024-01-12',
      isBookmarked: false
    }
  ];

  useEffect(() => {
    setMetrics(sampleMetrics);
    setCharts(sampleCharts);
    setSavedQueries(sampleSavedQueries);
    setCohorts(sampleCohorts);
  }, []);

  const formatValue = (value: string | number, format: string): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'days':
        return `${value.toFixed(1)} days`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <ArrowRight className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeColor = (changeType: string, metricId: string) => {
    // For certain metrics, decrease is good (like denial rate, days in AR)
    const reverseMetrics = ['denial-rate', 'revenue-cycle', 'pending-claims'];
    const isReverse = reverseMetrics.includes(metricId);
    
    if (changeType === 'increase') {
      return isReverse ? 'text-red-600' : 'text-green-600';
    } else if (changeType === 'decrease') {
      return isReverse ? 'text-green-600' : 'text-red-600';
    }
    return 'text-gray-600';
  };

  const renderChart = (chart: ChartData) => {
    const colors = ['#62d5e4', '#4bc5d6', '#34b8c8', '#1da8ba', '#0698ac'];
    
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={chart.xAxis} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              {chart.yAxis?.map((key, index) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={chart.xAxis} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              {chart.yAxis?.map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index % colors.length]}
                  strokeWidth={3}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="amount"
                label={({ range, percentage }) => `${range}: ${percentage}%`}
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }} 
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={chart.xAxis} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              {chart.yAxis?.map((key, index) => (
                <Area 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      default:
        return <div className="flex items-center justify-center h-64 text-gray-500">Chart type not supported</div>;
    }
  };

  const drillToClaim = (data: any) => {
    // This would navigate to the claim workspace with the specific claim
    console.log('Drilling to claim workspace with data:', data);
  };

  const exportData = () => {
    setLoading(true);
    
    setTimeout(() => {
      console.log('Exporting data with config:', exportConfig);
      setLoading(false);
      setShowExportModal(false);
    }, 2000);
  };

  const saveQuery = () => {
    setLoading(true);
    
    setTimeout(() => {
      const newQuery: SavedQuery = {
        id: `query-${Date.now()}`,
        ...queryForm,
        createdBy: 'Current User',
        createdDate: new Date().toISOString().split('T')[0],
        lastRun: new Date().toISOString().split('T')[0],
        isBookmarked: false,
        isShared: false
      };

      setSavedQueries(prev => [...prev, newQuery]);
      setShowSaveQuery(false);
      setLoading(false);
      
      // Reset form
      setQueryForm({
        name: '',
        description: '',
        dimensions: [],
        measures: [],
        filters: [],
        dateRange: {
          start: '',
          end: '',
          preset: 'last_30_days'
        }
      });
    }, 1500);
  };

  const runQuery = (query: SavedQuery) => {
    setLoading(true);
    
    setTimeout(() => {
      console.log('Running query:', query);
      setSavedQueries(prev => prev.map(q => 
        q.id === query.id 
          ? { ...q, lastRun: new Date().toISOString().split('T')[0] }
          : q
      ));
      setLoading(false);
    }, 2000);
  };

  const filteredCharts = charts.filter(chart => {
    switch (selectedDashboard) {
      case 'coding-accuracy':
        return ['denial-trends', 'throughput'].includes(chart.id);
      case 'denial-trends':
        return ['denial-trends', 'ar-aging'].includes(chart.id);
      case 'revenue-impact':
        return ['revenue-trend', 'ar-aging'].includes(chart.id);
      case 'ar-aging':
        return ['ar-aging', 'revenue-trend'].includes(chart.id);
      case 'throughput':
        return ['throughput', 'denial-trends'].includes(chart.id);
      default:
        return true;
    }
  });

  const dashboards = [
    { id: 'coding-accuracy', name: 'Coding Accuracy', icon: Target },
    { id: 'denial-trends', name: 'Denial Trends', icon: TrendingDown },
    { id: 'revenue-impact', name: 'Revenue Impact', icon: DollarSign },
    { id: 'ar-aging', name: 'A/R Aging', icon: Clock },
    { id: 'tfl-exposure', name: 'TFL Exposure', icon: AlertTriangle },
    { id: 'throughput', name: 'Throughput', icon: Activity },
    { id: 'pending-claims', name: 'Pending Claims', icon: FileText }
  ];

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              Ready-to-use dashboards and ad-hoc analysis tools
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCohortModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              Cohorts
            </button>
            
            <button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button 
              onClick={() => setShowQueryBuilder(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Query
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{metric.name}</span>
                {getChangeIcon(metric.changeType)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {formatValue(metric.value, metric.format)}
                </span>
                <span className={`text-sm ${getChangeColor(metric.changeType, metric.id)}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}
                  {metric.format === 'percentage' || metric.format === 'number' ? '%' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {[
            { id: 'standard-dashboards', label: 'Standard Dashboards', icon: BarChart3 },
            { id: 'ad-hoc-explorer', label: 'Ad-hoc Explorer', icon: Search },
            { id: 'saved-queries', label: 'Saved Queries', icon: Bookmark },
            { id: 'scheduled-reports', label: 'Scheduled Reports', icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-[#62d5e4] text-[#62d5e4]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto max-h-96">
        {activeTab === 'standard-dashboards' && (
          <div className="p-4">
            {/* Dashboard Selector */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Dashboard:</span>
                <div className="flex flex-wrap gap-2">
                  {dashboards.map((dashboard) => (
                    <button
                      key={dashboard.id}
                      onClick={() => setSelectedDashboard(dashboard.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedDashboard === dashboard.id
                          ? 'bg-[#62d5e4] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <dashboard.icon className="w-4 h-4" />
                      {dashboard.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="ml-auto flex items-center gap-2">
                <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white">
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_90_days">Last 90 Days</option>
                  <option value="last_year">Last Year</option>
                  <option value="ytd">Year to Date</option>
                </select>
                
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCharts.map((chart) => (
                <div key={chart.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{chart.title}</h3>
                      <p className="text-sm text-gray-600">{chart.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{chart.period}</span>
                      <button 
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Drill down"
                        onClick={() => drillToClaim(chart.data)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {renderChart(chart)}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ad-hoc-explorer' && (
          <div className="p-6">
            {/* Query Builder */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Build Your Query</h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (Group By)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableDimensions.map((dimension) => (
                      <label key={dimension} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={queryForm.dimensions.includes(dimension)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQueryForm(prev => ({ ...prev, dimensions: [...prev.dimensions, dimension] }));
                            } else {
                              setQueryForm(prev => ({ ...prev, dimensions: prev.dimensions.filter(d => d !== dimension) }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{dimension.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Measures */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Measures (Calculate)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableMeasures.map((measure) => (
                      <label key={measure} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={queryForm.measures.includes(measure)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQueryForm(prev => ({ ...prev, measures: [...prev.measures, measure] }));
                            } else {
                              setQueryForm(prev => ({ ...prev, measures: prev.measures.filter(m => m !== measure) }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{measure.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={queryForm.dateRange.preset}
                    onChange={(e) => setQueryForm(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, preset: e.target.value as DateRange['preset'] }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="last_90_days">Last 90 Days</option>
                    <option value="last_year">Last Year</option>
                    <option value="ytd">Year to Date</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                {queryForm.dateRange.preset === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={queryForm.dateRange.start}
                        onChange={(e) => setQueryForm(prev => ({ 
                          ...prev, 
                          dateRange: { ...prev.dateRange, start: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={queryForm.dateRange.end}
                        onChange={(e) => setQueryForm(prev => ({ 
                          ...prev, 
                          dateRange: { ...prev.dateRange, end: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  disabled={queryForm.dimensions.length === 0 || queryForm.measures.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
                >
                  <PlayCircle className="w-4 h-4" />
                  Run Query
                </button>
                
                <button
                  onClick={() => setShowSaveQuery(true)}
                  disabled={queryForm.dimensions.length === 0 || queryForm.measures.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Query
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

            {/* Query Results Preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Query Results</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">1,247 rows</span>
                  <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-center py-12 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select dimensions and measures to run your query</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saved-queries' && (
          <div className="p-6">
            <div className="space-y-4">
              {savedQueries.map((query) => (
                <div key={query.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{query.name}</h3>
                        {query.isBookmarked && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        {query.isShared && (
                          <Share className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{query.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Dimensions:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {query.dimensions.map((dim, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {dim.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Measures:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {query.measures.map((measure, index) => (
                              <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {measure.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>Created by {query.createdBy} on {query.createdDate}</span>
                        <span>Last run: {query.lastRun}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => runQuery(query)}
                        className="p-1 text-gray-400 hover:text-green-500 transition-colors" 
                        title="Run query"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Edit query">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-purple-500 transition-colors" title="Share query">
                        <Share className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="More actions">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="flex gap-4">
                  {[
                    { value: 'csv', label: 'CSV', icon: FileText },
                    { value: 'pdf', label: 'PDF', icon: FileCheck },
                    { value: 'excel', label: 'Excel', icon: FileX }
                  ].map((format) => (
                    <label key={format.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={exportConfig.format === format.value}
                        onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value as ExportConfig['format'] }))}
                        className="rounded"
                      />
                      <format.icon className="w-4 h-4" />
                      <span className="text-sm">{format.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Include</label>
                <div className="space-y-2">
                  {[
                    { key: 'includeCharts', label: 'Charts and Visualizations' },
                    { key: 'includeData', label: 'Raw Data Tables' },
                    { key: 'includeFilters', label: 'Applied Filters and Parameters' }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportConfig[option.key as keyof ExportConfig] as boolean}
                        onChange={(e) => setExportConfig(prev => ({ 
                          ...prev, 
                          [option.key]: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Recipients (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter email addresses separated by commas"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Export Preview</span>
                </div>
                <div className="text-sm text-blue-800">
                  This will export the current dashboard data including all selected visualizations and metrics.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={exportData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Query Modal */}
      {showSaveQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Save Query</h3>
              <button 
                onClick={() => setShowSaveQuery(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Query Name</label>
                <input
                  type="text"
                  value={queryForm.name}
                  onChange={(e) => setQueryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  placeholder="Enter query name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={queryForm.description}
                  onChange={(e) => setQueryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  rows={3}
                  placeholder="Describe this query"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Dimensions:</strong> {queryForm.dimensions.join(', ') || 'None selected'}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Measures:</strong> {queryForm.measures.join(', ') || 'None selected'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={saveQuery}
                disabled={!queryForm.name || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Query
              </button>
              <button
                onClick={() => setShowSaveQuery(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cohort Modal */}
      {showCohortModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Patient Cohorts</h3>
              <button 
                onClick={() => setShowCohortModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {cohorts.map((cohort) => (
                <div key={cohort.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{cohort.name}</h4>
                        {cohort.isBookmarked && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{cohort.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Patients:</span>
                          <div className="font-medium">{cohort.patientCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Claims:</span>
                          <div className="font-medium">{cohort.claimCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Charges:</span>
                          <div className="font-medium">${(cohort.totalCharges / 1000000).toFixed(1)}M</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2">
                        Created: {cohort.createdDate}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Analyze cohort">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-yellow-500 transition-colors" title="Bookmark">
                        <Star className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="More actions">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowCohortModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}