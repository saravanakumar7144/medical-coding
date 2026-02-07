import { useState, useEffect } from 'react';
import { 
  Users,
  FileText,
  CreditCard,
  DollarSign,
  Calendar,
  Mail,
  Printer,
  MessageSquare,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Send,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Building,
  Phone,
  MapPin,
  User,
  Receipt,
  BarChart3,
  Settings,
  Globe,
  Star,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Lock,
  Repeat,
  ArrowRight,
  ExternalLink,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Copy,
  History,
  Flag,
  Ban,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email: string;
  dateOfBirth: string;
  totalBalance: number;
  patientResponsibility: number;
  insurancePending: number;
  lastStatementDate: string;
  statementFrequency: 'monthly' | 'biweekly' | 'weekly';
  paymentPlan?: PaymentPlan;
  collectionStatus: 'current' | 'early' | 'late' | 'collections';
  preferredLanguage: 'en' | 'es' | 'fr';
  communicationPreference: 'mail' | 'email' | 'sms' | 'portal';
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    days120plus: number;
  };
}

interface PaymentPlan {
  id: string;
  totalAmount: number;
  monthlyPayment: number;
  remainingBalance: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'defaulted' | 'paused';
  autopayEnabled: boolean;
  paymentMethodToken: string;
}

interface Payment {
  id: string;
  patientId: string;
  amount: number;
  paymentMethod: 'card' | 'cash' | 'check' | 'ach';
  paymentToken?: string;
  checkNumber?: string;
  transactionDate: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  refundAmount?: number;
  processingFee: number;
  notes: string;
}

interface StatementTemplate {
  id: string;
  name: string;
  language: 'en' | 'es' | 'fr';
  branded: boolean;
  headerContent: string;
  footerContent: string;
  logoUrl?: string;
  colorScheme: string;
}

interface StatementRun {
  id: string;
  name: string;
  createdDate: string;
  cohortCriteria: {
    balanceMin: number;
    balanceMax: number;
    agingDays: string;
    payerStatus: string;
    collectionStatus: string;
  };
  patientCount: number;
  totalAmount: number;
  deliveryMethod: 'print' | 'email' | 'sms' | 'mixed';
  status: 'draft' | 'preview' | 'sent' | 'scheduled';
  scheduledDate?: string;
}

export function PatientBilling() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statementTemplates, setStatementTemplates] = useState<StatementTemplate[]>([]);
  const [statementRuns, setStatementRuns] = useState<StatementRun[]>([]);
  const [activeTab, setActiveTab] = useState('statements');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [showNewStatementRun, setShowNewStatementRun] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentPlanModal, setShowPaymentPlanModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'card' as 'card' | 'cash' | 'check' | 'ach',
    cardToken: '',
    checkNumber: '',
    notes: ''
  });

  // Payment plan form state
  const [paymentPlanForm, setPaymentPlanForm] = useState({
    totalAmount: '',
    monthlyPayment: '',
    startDate: '',
    autopayEnabled: false,
    paymentMethodToken: ''
  });

  // Statement run form state
  const [statementRunForm, setStatementRunForm] = useState({
    name: '',
    balanceMin: '',
    balanceMax: '',
    agingDays: 'all',
    payerStatus: 'all',
    collectionStatus: 'all',
    deliveryMethod: 'mixed' as 'print' | 'email' | 'sms' | 'mixed',
    templateId: '',
    scheduledDate: ''
  });

  // Filter states
  const [filters, setFilters] = useState({
    balanceRange: 'all',
    collectionStatus: 'all',
    paymentPlan: 'all',
    aging: 'all'
  });

  // Sample data
  const samplePatients: Patient[] = [
    {
      id: 'patient-001',
      name: 'John Smith',
      address: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701'
      },
      phone: '(555) 123-4567',
      email: 'john.smith@email.com',
      dateOfBirth: '1980-05-15',
      totalBalance: 450.00,
      patientResponsibility: 200.00,
      insurancePending: 250.00,
      lastStatementDate: '2024-01-15',
      statementFrequency: 'monthly',
      collectionStatus: 'current',
      preferredLanguage: 'en',
      communicationPreference: 'email',
      aging: {
        current: 100.00,
        days30: 100.00,
        days60: 150.00,
        days90: 100.00,
        days120plus: 0.00
      }
    },
    {
      id: 'patient-002',
      name: 'Maria Garcia',
      address: {
        street: '456 Oak Ave',
        city: 'Chicago',
        state: 'IL',
        zip: '60601'
      },
      phone: '(555) 987-6543',
      email: 'maria.garcia@email.com',
      dateOfBirth: '1975-08-22',
      totalBalance: 1250.00,
      patientResponsibility: 750.00,
      insurancePending: 500.00,
      lastStatementDate: '2024-01-10',
      statementFrequency: 'monthly',
      paymentPlan: {
        id: 'plan-001',
        totalAmount: 750.00,
        monthlyPayment: 125.00,
        remainingBalance: 500.00,
        startDate: '2024-01-01',
        endDate: '2024-07-01',
        status: 'active',
        autopayEnabled: true,
        paymentMethodToken: 'tok_visa_1234'
      },
      collectionStatus: 'current',
      preferredLanguage: 'es',
      communicationPreference: 'email',
      aging: {
        current: 250.00,
        days30: 300.00,
        days60: 400.00,
        days90: 300.00,
        days120plus: 0.00
      }
    },
    {
      id: 'patient-003',
      name: 'Robert Wilson',
      address: {
        street: '789 Pine St',
        city: 'Rockford',
        state: 'IL',
        zip: '61101'
      },
      phone: '(555) 456-7890',
      email: 'robert.wilson@email.com',
      dateOfBirth: '1965-12-03',
      totalBalance: 850.00,
      patientResponsibility: 850.00,
      insurancePending: 0.00,
      lastStatementDate: '2023-12-15',
      statementFrequency: 'monthly',
      collectionStatus: 'late',
      preferredLanguage: 'en',
      communicationPreference: 'mail',
      aging: {
        current: 0.00,
        days30: 0.00,
        days60: 0.00,
        days90: 350.00,
        days120plus: 500.00
      }
    }
  ];

  const samplePayments: Payment[] = [
    {
      id: 'payment-001',
      patientId: 'patient-001',
      amount: 100.00,
      paymentMethod: 'card',
      paymentToken: 'tok_visa_4567',
      transactionDate: '2024-01-20',
      status: 'completed',
      processingFee: 3.50,
      notes: 'Copay payment for office visit'
    },
    {
      id: 'payment-002',
      patientId: 'patient-002',
      amount: 125.00,
      paymentMethod: 'card',
      paymentToken: 'tok_visa_1234',
      transactionDate: '2024-01-15',
      status: 'completed',
      processingFee: 4.25,
      notes: 'Monthly payment plan installment'
    }
  ];

  const sampleTemplates: StatementTemplate[] = [
    {
      id: 'template-001',
      name: 'Standard English Statement',
      language: 'en',
      branded: true,
      headerContent: 'Medical Practice Statement',
      footerContent: 'Thank you for choosing our practice. Please remit payment within 30 days.',
      logoUrl: '/logo.png',
      colorScheme: '#62d5e4'
    },
    {
      id: 'template-002',
      name: 'Spanish Statement',
      language: 'es',
      branded: true,
      headerContent: 'Estado de Cuenta Médica',
      footerContent: 'Gracias por elegir nuestra práctica. Por favor envíe el pago dentro de 30 días.',
      logoUrl: '/logo.png',
      colorScheme: '#62d5e4'
    }
  ];

  useEffect(() => {
    setPatients(samplePatients);
    setPayments(samplePayments);
    setStatementTemplates(sampleTemplates);
  }, []);

  const getCollectionStatusBadge = (status: string) => {
    const statusMap = {
      current: 'bg-green-100 text-green-800',
      early: 'bg-yellow-100 text-yellow-800',
      late: 'bg-orange-100 text-orange-800',
      collections: 'bg-red-100 text-red-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.current;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getPaymentPlanStatusBadge = (status: string) => {
    const statusMap = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      defaulted: 'bg-red-100 text-red-800',
      paused: 'bg-yellow-100 text-yellow-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.active;
  };

  const processPayment = (patientId: string) => {
    setLoading(true);
    
    setTimeout(() => {
      const newPayment: Payment = {
        id: `payment-${Date.now()}`,
        patientId,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentToken: paymentForm.paymentMethod === 'card' ? `tok_${Math.random().toString(36).substr(2, 9)}` : undefined,
        checkNumber: paymentForm.checkNumber || undefined,
        transactionDate: new Date().toISOString().split('T')[0],
        status: 'completed',
        processingFee: paymentForm.paymentMethod === 'card' ? parseFloat(paymentForm.amount) * 0.035 : 0,
        notes: paymentForm.notes
      };

      setPayments(prev => [...prev, newPayment]);
      
      // Update patient balance
      setPatients(prev => prev.map(patient => 
        patient.id === patientId 
          ? { 
              ...patient, 
              totalBalance: patient.totalBalance - parseFloat(paymentForm.amount),
              patientResponsibility: patient.patientResponsibility - parseFloat(paymentForm.amount)
            }
          : patient
      ));

      setPaymentForm({
        amount: '',
        paymentMethod: 'card',
        cardToken: '',
        checkNumber: '',
        notes: ''
      });

      setShowPaymentModal(false);
      setLoading(false);
    }, 2000);
  };

  const createPaymentPlan = (patientId: string) => {
    setLoading(true);
    
    setTimeout(() => {
      const newPaymentPlan: PaymentPlan = {
        id: `plan-${Date.now()}`,
        totalAmount: parseFloat(paymentPlanForm.totalAmount),
        monthlyPayment: parseFloat(paymentPlanForm.monthlyPayment),
        remainingBalance: parseFloat(paymentPlanForm.totalAmount),
        startDate: paymentPlanForm.startDate,
        endDate: new Date(new Date(paymentPlanForm.startDate).setMonth(
          new Date(paymentPlanForm.startDate).getMonth() + 
          Math.ceil(parseFloat(paymentPlanForm.totalAmount) / parseFloat(paymentPlanForm.monthlyPayment))
        )).toISOString().split('T')[0],
        status: 'active',
        autopayEnabled: paymentPlanForm.autopayEnabled,
        paymentMethodToken: paymentPlanForm.autopayEnabled ? `tok_${Math.random().toString(36).substr(2, 9)}` : ''
      };

      setPatients(prev => prev.map(patient => 
        patient.id === patientId 
          ? { ...patient, paymentPlan: newPaymentPlan }
          : patient
      ));

      setPaymentPlanForm({
        totalAmount: '',
        monthlyPayment: '',
        startDate: '',
        autopayEnabled: false,
        paymentMethodToken: ''
      });

      setShowPaymentPlanModal(false);
      setLoading(false);
    }, 2000);
  };

  const createStatementRun = () => {
    setLoading(true);
    
    setTimeout(() => {
      // Filter patients based on criteria
      const filteredPatients = patients.filter(patient => {
        const balanceMin = parseFloat(statementRunForm.balanceMin) || 0;
        const balanceMax = parseFloat(statementRunForm.balanceMax) || Infinity;
        
        return patient.totalBalance >= balanceMin && 
               patient.totalBalance <= balanceMax &&
               (statementRunForm.collectionStatus === 'all' || patient.collectionStatus === statementRunForm.collectionStatus);
      });

      const newStatementRun: StatementRun = {
        id: `run-${Date.now()}`,
        name: statementRunForm.name,
        createdDate: new Date().toISOString().split('T')[0],
        cohortCriteria: {
          balanceMin: parseFloat(statementRunForm.balanceMin) || 0,
          balanceMax: parseFloat(statementRunForm.balanceMax) || 0,
          agingDays: statementRunForm.agingDays,
          payerStatus: statementRunForm.payerStatus,
          collectionStatus: statementRunForm.collectionStatus
        },
        patientCount: filteredPatients.length,
        totalAmount: filteredPatients.reduce((sum, p) => sum + p.totalBalance, 0),
        deliveryMethod: statementRunForm.deliveryMethod,
        status: 'preview',
        scheduledDate: statementRunForm.scheduledDate || undefined
      };

      setStatementRuns(prev => [...prev, newStatementRun]);
      setShowNewStatementRun(false);
      setLoading(false);
    }, 2000);
  };

  const exportCollectionsFile = () => {
    const collectionsData = patients
      .filter(p => p.collectionStatus === 'collections' || p.aging.days120plus > 0)
      .map(patient => ({
        patientName: patient.name,
        address: `${patient.address.street}, ${patient.address.city}, ${patient.address.state} ${patient.address.zip}`,
        phone: patient.phone,
        totalBalance: patient.totalBalance,
        aging: patient.aging,
        lastStatement: patient.lastStatementDate
      }));

    console.log('Exporting collections data:', collectionsData);
    // In a real app, this would generate and download a CSV/Excel file
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.phone.includes(searchQuery) ||
                         patient.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBalance = filters.balanceRange === 'all' || 
                          (filters.balanceRange === 'high' && patient.totalBalance > 500) ||
                          (filters.balanceRange === 'medium' && patient.totalBalance >= 100 && patient.totalBalance <= 500) ||
                          (filters.balanceRange === 'low' && patient.totalBalance < 100);
    
    const matchesCollection = filters.collectionStatus === 'all' || patient.collectionStatus === filters.collectionStatus;
    const matchesPaymentPlan = filters.paymentPlan === 'all' || 
                              (filters.paymentPlan === 'active' && patient.paymentPlan?.status === 'active') ||
                              (filters.paymentPlan === 'none' && !patient.paymentPlan);
    
    return matchesSearch && matchesBalance && matchesCollection && matchesPaymentPlan;
  });

  const patient = selectedPatient ? patients.find(p => p.id === selectedPatient) : null;
  const patientPayments = selectedPatient ? payments.filter(p => p.patientId === selectedPatient) : [];

  return (
    <div className="h-full bg-gray-50 flex flex-col max-w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Patient Billing</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage patient statements, payments, and collection activities
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowNewStatementRun(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              New Statement Run
            </button>
            
            <button 
              onClick={exportCollectionsFile}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Collections
            </button>
            
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Post Payment
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total A/R</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${patients.reduce((sum, p) => sum + p.totalBalance, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patient Responsibility</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${patients.reduce((sum, p) => sum + p.patientResponsibility, 0).toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Insurance Pending</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${patients.reduce((sum, p) => sum + p.insurancePending, 0).toLocaleString()}
                </p>
              </div>
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Payment Plans</p>
                <p className="text-lg font-semibold text-gray-900">
                  {patients.filter(p => p.paymentPlan?.status === 'active').length}
                </p>
              </div>
              <Repeat className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Collections</p>
                <p className="text-lg font-semibold text-gray-900">
                  {patients.filter(p => p.collectionStatus === 'collections' || p.aging.days120plus > 0).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {[
            { id: 'statements', label: 'Statement Management', icon: FileText },
            { id: 'payments', label: 'Payment Processing', icon: CreditCard },
            { id: 'collections', label: 'Collections', icon: AlertTriangle }
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
      <div className="flex-1 min-h-0 overflow-auto max-h-96">
        {activeTab === 'statements' && (
          <div className="p-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-6 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-11 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                />
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-4 gap-6 mb-6 p-6 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Balance Range</label>
                  <select
                    value={filters.balanceRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, balanceRange: e.target.value }))}
                    className="w-full h-11 px-3 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Balances</option>
                    <option value="high">$500+</option>
                    <option value="medium">$100-$500</option>
                    <option value="low">Under $100</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collection Status</label>
                  <select
                    value={filters.collectionStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, collectionStatus: e.target.value }))}
                    className="w-full h-11 px-3 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="current">Current</option>
                    <option value="early">Early</option>
                    <option value="late">Late</option>
                    <option value="collections">Collections</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Plan</label>
                  <select
                    value={filters.paymentPlan}
                    onChange={(e) => setFilters(prev => ({ ...prev, paymentPlan: e.target.value }))}
                    className="w-full h-11 px-3 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
                  >
                    <option value="all">All Plans</option>
                    <option value="active">Active Plan</option>
                    <option value="none">No Plan</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aging</label>
                  <select className="w-full h-11 px-3 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white">
                    <option value="all">All Ages</option>
                    <option value="current">Current</option>
                    <option value="30">30+ Days</option>
                    <option value="60">60+ Days</option>
                    <option value="90">90+ Days</option>
                    <option value="120">120+ Days</option>
                  </select>
                </div>
              </div>
            )}

            {/* Patient List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-y-auto max-h-80">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Patient</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Balance</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Patient Resp.</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Insurance Pending</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Collection Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Last Statement</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Payment Plan</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            className="rounded"
                            checked={selectedPatients.includes(patient.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPatients(prev => [...prev, patient.id]);
                              } else {
                                setSelectedPatients(prev => prev.filter(id => id !== patient.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">{patient.phone}</div>
                            <div className="text-xs text-gray-400">{patient.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-gray-900">
                            ${patient.totalBalance.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-red-600">
                            ${patient.patientResponsibility.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-orange-600">
                            ${patient.insurancePending.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCollectionStatusBadge(patient.collectionStatus)}`}>
                              {patient.collectionStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{patient.lastStatementDate}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            {patient.paymentPlan ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentPlanStatusBadge(patient.paymentPlan.status)}`}>
                                ${patient.paymentPlan.monthlyPayment}/mo
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient.id);
                                setShowPaymentModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-[#62d5e4] transition-colors"
                              title="Post payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPatient(patient.id);
                                setShowPaymentPlanModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
                              title="Payment plan"
                            >
                              <Repeat className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                              title="Send statement"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="More actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Aging Analysis */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Aging Analysis</h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">
                    ${filteredPatients.reduce((sum, p) => sum + p.aging.current, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Current</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-yellow-600">
                    ${filteredPatients.reduce((sum, p) => sum + p.aging.days30, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">30 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-orange-600">
                    ${filteredPatients.reduce((sum, p) => sum + p.aging.days60, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">60 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600">
                    ${filteredPatients.reduce((sum, p) => sum + p.aging.days90, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">90 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-800">
                    ${filteredPatients.reduce((sum, p) => sum + p.aging.days120plus, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">120+ Days</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Recent Payments */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Payments</h3>
                  <button className="text-sm text-[#62d5e4] hover:text-[#4bc5d6] transition-colors">
                    View All
                  </button>
                </div>
                
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => {
                    const paymentPatient = patients.find(p => p.id === payment.patientId);
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{paymentPatient?.name}</div>
                          <div className="text-sm text-gray-600">
                            {payment.paymentMethod.toUpperCase()} • {payment.transactionDate}
                          </div>
                          {payment.notes && (
                            <div className="text-xs text-gray-500 mt-1">{payment.notes}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">${payment.amount.toFixed(2)}</div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Methods Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-blue-500" />
                      <div>
                        <div className="font-medium text-gray-900">Credit/Debit Cards</div>
                        <div className="text-sm text-gray-600">PCI-compliant processing</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        ${payments.filter(p => p.paymentMethod === 'card').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">This month</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-8 h-8 text-green-500" />
                      <div>
                        <div className="font-medium text-gray-900">Cash Payments</div>
                        <div className="text-sm text-gray-600">In-person transactions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        ${payments.filter(p => p.paymentMethod === 'cash').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">This month</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-purple-500" />
                      <div>
                        <div className="font-medium text-gray-900">Check Payments</div>
                        <div className="text-sm text-gray-600">Traditional paper checks</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        ${payments.filter(p => p.paymentMethod === 'check').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">This month</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Payment Plans */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 col-span-2">
                <h3 className="font-semibold text-gray-900 mb-4">Active Payment Plans</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Patient</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-900">Total</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-900">Monthly</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-900">Remaining</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">AutoPay</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">Status</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {patients.filter(p => p.paymentPlan).map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">{patient.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-gray-900">
                              ${patient.paymentPlan!.totalAmount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-blue-600">
                              ${patient.paymentPlan!.monthlyPayment.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-orange-600">
                              ${patient.paymentPlan!.remainingBalance.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {patient.paymentPlan!.autopayEnabled ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentPlanStatusBadge(patient.paymentPlan!.status)}`}>
                                {patient.paymentPlan!.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-1 text-gray-400 hover:text-green-500 transition-colors" title="Process payment">
                                <PlayCircle className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-yellow-500 transition-colors" title="Pause plan">
                                <PauseCircle className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Edit plan">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="p-6">
            <div className="grid gap-6">
              {/* Collections Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total in Collections</p>
                      <p className="text-2xl font-semibold text-red-600">
                        ${patients.filter(p => p.aging.days120plus > 0).reduce((sum, p) => sum + p.aging.days120plus, 0).toLocaleString()}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Accounts in Collections</p>
                      <p className="text-2xl font-semibold text-red-600">
                        {patients.filter(p => p.aging.days120plus > 0).length}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">90+ Days</p>
                      <p className="text-2xl font-semibold text-orange-600">
                        ${patients.reduce((sum, p) => sum + p.aging.days90, 0).toLocaleString()}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Collection Rate</p>
                      <p className="text-2xl font-semibold text-green-600">67%</p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Collections Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Collections Accounts</h3>
                  <button 
                    onClick={exportCollectionsFile}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export File
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Patient</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Balance</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">90+ Days</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">120+ Days</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Last Statement</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {patients.filter(p => p.aging.days90 > 0 || p.aging.days120plus > 0).map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">DOB: {patient.dateOfBirth}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{patient.phone}</div>
                            <div className="text-sm text-gray-500">{patient.email}</div>
                            <div className="text-xs text-gray-400">
                              {patient.address.street}, {patient.address.city}, {patient.address.state}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-gray-900">
                              ${patient.totalBalance.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-orange-600">
                              ${patient.aging.days90.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-red-600">
                              ${patient.aging.days120plus.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{patient.lastStatementDate}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCollectionStatusBadge(patient.collectionStatus)}`}>
                                {patient.collectionStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Send final notice">
                                <Mail className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Send to collections">
                                <Flag className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Write off">
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Post Payment</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {patient && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{patient.name}</div>
                <div className="text-sm text-gray-600">Balance: ${patient.totalBalance.toFixed(2)}</div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="ach">ACH/Bank Transfer</option>
                </select>
              </div>

              {paymentForm.paymentMethod === 'card' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">PCI-Compliant Processing</span>
                  </div>
                  <div className="text-xs text-blue-700">
                    Card data is tokenized and encrypted. No raw card information is stored in our system.
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Payment token will be generated..."
                      className="w-full px-2 py-1 text-xs bg-white border border-blue-200 rounded"
                      disabled
                    />
                  </div>
                </div>
              )}

              {paymentForm.paymentMethod === 'check' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Number</label>
                  <input
                    type="text"
                    value={paymentForm.checkNumber}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, checkNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="Check #"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  rows={2}
                  placeholder="Payment notes..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => patient && processPayment(patient.id)}
                  disabled={!paymentForm.amount || loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Process Payment
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Plan Modal */}
      {showPaymentPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Payment Plan</h3>
              <button 
                onClick={() => setShowPaymentPlanModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {patient && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{patient.name}</div>
                <div className="text-sm text-gray-600">Balance: ${patient.totalBalance.toFixed(2)}</div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentPlanForm.totalAmount}
                  onChange={(e) => setPaymentPlanForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentPlanForm.monthlyPayment}
                  onChange={(e) => setPaymentPlanForm(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={paymentPlanForm.startDate}
                  onChange={(e) => setPaymentPlanForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={paymentPlanForm.autopayEnabled}
                    onChange={(e) => setPaymentPlanForm(prev => ({ ...prev, autopayEnabled: e.target.checked }))}
                    className="rounded text-[#62d5e4] focus:ring-[#62d5e4]"
                  />
                  <span className="text-sm text-gray-700">Enable AutoPay</span>
                </label>
                {paymentPlanForm.autopayEnabled && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs text-green-700">
                      AutoPay will automatically charge the payment method on the due date each month.
                      Payment method token will be securely stored.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => patient && createPaymentPlan(patient.id)}
                  disabled={!paymentPlanForm.totalAmount || !paymentPlanForm.monthlyPayment || !paymentPlanForm.startDate || loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Repeat className="w-4 h-4" />
                  )}
                  Create Plan
                </button>
                <button
                  onClick={() => setShowPaymentPlanModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Statement Run Modal */}
      {showNewStatementRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Statement Run</h3>
              <button 
                onClick={() => setShowNewStatementRun(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Run Name</label>
                  <input
                    type="text"
                    value={statementRunForm.name}
                    onChange={(e) => setStatementRunForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                    placeholder="e.g., Monthly Statements - January 2024"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={statementRunForm.balanceMin}
                      onChange={(e) => setStatementRunForm(prev => ({ ...prev, balanceMin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={statementRunForm.balanceMax}
                      onChange={(e) => setStatementRunForm(prev => ({ ...prev, balanceMax: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                      placeholder="No limit"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aging Days</label>
                  <select
                    value={statementRunForm.agingDays}
                    onChange={(e) => setStatementRunForm(prev => ({ ...prev, agingDays: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="all">All Ages</option>
                    <option value="current">Current Only</option>
                    <option value="30">30+ Days</option>
                    <option value="60">60+ Days</option>
                    <option value="90">90+ Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Status</label>
                  <select
                    value={statementRunForm.collectionStatus}
                    onChange={(e) => setStatementRunForm(prev => ({ ...prev, collectionStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="current">Current</option>
                    <option value="early">Early</option>
                    <option value="late">Late</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                  <select
                    value={statementRunForm.deliveryMethod}
                    onChange={(e) => setStatementRunForm(prev => ({ ...prev, deliveryMethod: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="mixed">Mixed (Patient Preference)</option>
                    <option value="print">Print Only</option>
                    <option value="email">Email Only</option>
                    <option value="sms">SMS Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select
                    value={statementRunForm.templateId}
                    onChange={(e) => setStatementRunForm(prev => ({ ...prev, templateId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  >
                    <option value="">Select Template</option>
                    {statementTemplates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date (Optional)</label>
                  <input
                    type="date"
                    value={statementRunForm.scheduledDate}
                    onChange={(e) => setStatementRunForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">Preview</div>
                  <div className="text-sm text-blue-800">
                    This run will include approximately{' '}
                    <span className="font-medium">
                      {patients.filter(p => {
                        const min = parseFloat(statementRunForm.balanceMin) || 0;
                        const max = parseFloat(statementRunForm.balanceMax) || Infinity;
                        return p.totalBalance >= min && p.totalBalance <= max;
                      }).length}
                    </span>{' '}
                    patients with a total balance of{' '}
                    <span className="font-medium">
                      ${patients.filter(p => {
                        const min = parseFloat(statementRunForm.balanceMin) || 0;
                        const max = parseFloat(statementRunForm.balanceMax) || Infinity;
                        return p.totalBalance >= min && p.totalBalance <= max;
                      }).reduce((sum, p) => sum + p.totalBalance, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={createStatementRun}
                disabled={!statementRunForm.name || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Create Run
              </button>
              <button
                onClick={() => setShowNewStatementRun(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}