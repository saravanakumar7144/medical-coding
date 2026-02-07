import { Download, Clock, MoreHorizontal } from 'lucide-react';

export function WorkQueue() {
  const workItems = [
    {
      id: 'P-1001',
      patient: 'John Smith',
      dateOfService: '2023-06-15',
      status: 'Urgent',
      priority: 'High',
      assignedTo: 'Dr. Johnson',
      estValue: '$1,234'
    },
    {
      id: 'P-1002',
      patient: 'Sarah Williams',
      dateOfService: '2023-06-14',
      status: 'Pending',
      priority: 'Medium',
      assignedTo: 'Dr. Martinez',
      estValue: '$856'
    },
    {
      id: 'P-1003',
      patient: 'Michael Brown',
      dateOfService: '2023-06-14',
      status: 'In Progress',
      priority: 'High',
      assignedTo: 'Dr. Johnson',
      estValue: '$2,150'
    },
    {
      id: 'P-1004',
      patient: 'Emily Davis',
      dateOfService: '2023-06-13',
      status: 'Pending',
      priority: 'Low',
      assignedTo: 'Dr. Wilson',
      estValue: '$456'
    },
    {
      id: 'P-1005',
      patient: 'Robert Miller',
      dateOfService: '2023-06-13',
      status: 'Urgent',
      priority: 'High',
      assignedTo: 'Dr. Martinez',
      estValue: '$1,890'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 max-h-96 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Work Queue</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <Clock className="w-4 h-4" />
              History
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-80">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Est. Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workItems.slice(0, 8).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.patient}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.dateOfService}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.assignedTo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.estValue}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  <button className="hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}