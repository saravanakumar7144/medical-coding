import { useState } from 'react';
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
  Calendar
} from 'lucide-react';

interface WorklistItem {
  id: string;
  patientName: string;
  patientId: string;
  dateOfService: string;
  status: 'pending' | 'in_progress' | 'completed' | 'denied' | 'on_hold';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignedTo: string;
  estimatedValue: string;
  codes: string[];
  payer: string;
  lastActivity: string;
  daysInQueue: number;
}

interface EnhancedWorklistProps {
  filter?: string;
  queueType?: string;
}

export function EnhancedWorklist({ filter, queueType }: EnhancedWorklistProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [sortField, setSortField] = useState('dateOfService');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Sample worklist data
  const worklistItems: WorklistItem[] = [
    {
      id: 'WL-2024-001',
      patientName: 'John Smith',
      patientId: 'P-2024-001',
      dateOfService: '2024-01-15',
      status: 'pending',
      priority: 'urgent',
      assignedTo: 'Dr. Sarah Johnson',
      estimatedValue: '$2,450',
      codes: ['99213', 'I10', 'E11.9'],
      payer: 'Medicare',
      lastActivity: '2 hours ago',
      daysInQueue: 2
    },
    {
      id: 'WL-2024-002',
      patientName: 'Maria Garcia',
      patientId: 'P-2024-002',
      dateOfService: '2024-01-14',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'Dr. Michael Chen',
      estimatedValue: '$1,875',
      codes: ['99214', 'J44.9', 'Z87.891'],
      payer: 'Blue Cross',
      lastActivity: '1 hour ago',
      daysInQueue: 3
    },
    {
      id: 'WL-2024-003',
      patientName: 'Robert Wilson',
      patientId: 'P-2024-003',
      dateOfService: '2024-01-13',
      status: 'completed',
      priority: 'medium',
      assignedTo: 'Dr. Jennifer Walsh',
      estimatedValue: '$3,200',
      codes: ['99215', 'I50.9', 'N18.6'],
      payer: 'Aetna',
      lastActivity: '30 minutes ago',
      daysInQueue: 1
    },
    {
      id: 'WL-2024-004',
      patientName: 'Lisa Davis',
      patientId: 'P-2024-004',
      dateOfService: '2024-01-12',
      status: 'denied',
      priority: 'high',
      assignedTo: 'Dr. David Park',
      estimatedValue: '$1,650',
      codes: ['99213', 'K21.9'],
      payer: 'United Healthcare',
      lastActivity: '4 hours ago',
      daysInQueue: 5
    },
    {
      id: 'WL-2024-005',
      patientName: 'James Brown',
      patientId: 'P-2024-005',
      dateOfService: '2024-01-11',
      status: 'on_hold',
      priority: 'medium',
      assignedTo: 'Dr. Lisa Rodriguez',
      estimatedValue: '$2,100',
      codes: ['99214', 'E78.5', 'I10'],
      payer: 'Cigna',
      lastActivity: '6 hours ago',
      daysInQueue: 7
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'on_hold':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      on_hold: 'bg-yellow-100 text-yellow-800'
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on items:`, selectedItems);
    // Handle bulk actions
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Enhanced Worklist
              {queueType && <span className="text-base text-gray-600 ml-2">• {queueType}</span>}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Filtered by: {filter || 'All items'} • {worklistItems.length} items
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedItems.length} selected</span>
                <button 
                  onClick={() => handleBulkAction('approve')}
                  className="px-3 py-2 text-sm text-white bg-[#62d5e4] rounded-lg hover:bg-[#4bc5d6] transition-colors"
                >
                  Bulk Approve
                </button>
                <button 
                  onClick={() => handleBulkAction('assign')}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bulk Assign
                </button>
              </div>
            )}
            
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients, IDs, codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="denied">Denied</option>
            <option value="on_hold">On Hold</option>
          </select>
          
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent bg-white"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Worklist Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(worklistItems.map(item => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      className="rounded border-gray-300 text-[#62d5e4] focus:ring-[#62d5e4]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    <button 
                      onClick={() => handleSort('patientName')}
                      className="flex items-center gap-1 hover:text-[#62d5e4] transition-colors"
                    >
                      Patient
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    <button 
                      onClick={() => handleSort('dateOfService')}
                      className="flex items-center gap-1 hover:text-[#62d5e4] transition-colors"
                    >
                      Service Date
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Assigned To</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    <button 
                      onClick={() => handleSort('estimatedValue')}
                      className="flex items-center gap-1 hover:text-[#62d5e4] transition-colors"
                    >
                      Est. Value
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Codes</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Payer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Queue Days</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {worklistItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="rounded border-gray-300 text-[#62d5e4] focus:ring-[#62d5e4]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{item.patientName}</div>
                        <div className="text-sm text-gray-500">{item.patientId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{item.dateOfService}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{item.assignedTo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{item.estimatedValue}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.codes.map((code, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{item.payer}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        item.daysInQueue > 5 ? 'text-red-600' : 
                        item.daysInQueue > 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {item.daysInQueue} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1 text-gray-400 hover:text-[#62d5e4] transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-[#62d5e4] transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
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
      </div>
    </div>
  );
}