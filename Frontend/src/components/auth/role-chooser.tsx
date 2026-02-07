import { useState } from 'react';
import { FileText, DollarSign, Users, Building, Shield, Target, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { UserRole } from '../../types/auth';
import { useAuth } from '../../contexts/auth-context';

const roleConfig = [
  { 
    id: 'coder' as UserRole, 
    name: 'Medical Coder', 
    icon: FileText, 
    color: 'blue',
    description: 'Code charts and review documentation',
    features: ['Chart Coding', 'Batch Processing', 'Code Library', 'AI Suggestions']
  },
  { 
    id: 'billing' as UserRole, 
    name: 'Billing Specialist', 
    icon: DollarSign, 
    color: 'green',
    description: 'Process claims and manage revenue',
    features: ['Claims Processing', 'ERA & Payments', 'Denials Workbench', 'Patient Billing']
  },
  { 
    id: 'manager' as UserRole, 
    name: 'Manager', 
    icon: Users, 
    color: 'purple',
    description: 'Oversee team and performance',
    features: ['Team Analytics', 'Performance Metrics', 'Reports', 'Oversight']
  },
  { 
    id: 'executive' as UserRole, 
    name: 'Executive', 
    icon: Building, 
    color: 'indigo',
    description: 'Strategic oversight and KPIs',
    features: ['Strategic KPIs', 'Financial Performance', 'Department Analytics', 'Trends']
  },
  { 
    id: 'auditor' as UserRole, 
    name: 'Auditor', 
    icon: Shield, 
    color: 'red',
    description: 'Review compliance and quality',
    features: ['Audit Queue', 'Compliance Review', 'Quality Metrics', 'Variance Analysis']
  },
  { 
    id: 'admin' as UserRole, 
    name: 'Administrator', 
    icon: Target, 
    color: 'gray',
    description: 'System configuration',
    features: ['User Management', 'System Settings', 'Permissions', 'Configuration']
  },
];

export function RoleChooser() {
  const { user, changeRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(user?.activeRole || null);
  const [isLoading, setIsLoading] = useState(false);

  if (!user || user.roles.length === 0) {
    return null;
  }

  const availableRoles = roleConfig.filter(role => user.roles.includes(role.id));

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      await changeRole(selectedRole);
    } catch (error) {
      console.error('Failed to change role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-gray-900 mb-2">Choose Your Role</h1>
          <p className="text-gray-600">
            Select the role you'd like to access.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Welcome back, {user.name}
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {availableRoles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  relative bg-white rounded-xl p-6 text-left transition-all
                  ${isSelected 
                    ? 'ring-2 ring-[#62d5e4] shadow-lg' 
                    : 'border border-gray-200 hover:border-[#62d5e4] hover:shadow-md'
                  }
                `}
              >
                {/* Selected Check */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-[#62d5e4] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-lg mb-4 flex items-center justify-center
                  ${isSelected 
                    ? 'bg-[#62d5e4]' 
                    : `bg-${role.color}-100`
                  }
                `}>
                  <Icon className={`
                    w-6 h-6
                    ${isSelected 
                      ? 'text-white' 
                      : `text-${role.color}-600`
                    }
                  `} />
                </div>

                {/* Content */}
                <h3 className={`
                  mb-2
                  ${isSelected ? 'text-gray-900' : 'text-gray-700'}
                `}>
                  {role.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {role.description}
                </p>

                {/* Features */}
                <div className="space-y-1">
                  {role.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`
                        w-1 h-1 rounded-full
                        ${isSelected ? 'bg-[#62d5e4]' : 'bg-gray-400'}
                      `} />
                      <span className="text-xs text-gray-600">{feature}</span>
                    </div>
                  ))}
                  {role.features.length > 3 && (
                    <div className="flex items-center gap-2">
                      <div className={`
                        w-1 h-1 rounded-full
                        ${isSelected ? 'bg-[#62d5e4]' : 'bg-gray-400'}
                      `} />
                      <span className="text-xs text-gray-600">
                        +{role.features.length - 3} more
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className="bg-[#62d5e4] hover:bg-[#52c5d4] px-12"
          >
            {isLoading ? 'Loading...' : 'Continue'}
          </Button>
        </div>

        {/* Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          You can switch roles anytime from your profile menu
        </p>
      </div>
    </div>
  );
}