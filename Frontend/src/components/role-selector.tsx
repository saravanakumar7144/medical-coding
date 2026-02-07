import { useState } from 'react';
import { 
  User, ChevronDown, Check, Users, DollarSign, 
  Building, FileText, Target, Shield
} from 'lucide-react';

export type UserRole = 'coder' | 'billing' | 'manager' | 'executive' | 'auditor' | 'admin';

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  availableRoles?: UserRole[]; // NEW: Only show roles the user has
}

const allRoles = [
  { id: 'coder' as UserRole, name: 'Coder', icon: FileText, color: 'blue', description: 'Code charts and review documentation' },
  { id: 'billing' as UserRole, name: 'Billing Specialist', icon: DollarSign, color: 'green', description: 'Process claims and manage revenue' },
  { id: 'manager' as UserRole, name: 'Manager', icon: Users, color: 'purple', description: 'Oversee team and performance' },
  { id: 'executive' as UserRole, name: 'Executive', icon: Building, color: 'indigo', description: 'Strategic oversight and KPIs' },
  { id: 'auditor' as UserRole, name: 'Auditor', icon: Shield, color: 'red', description: 'Review compliance and quality' },
  { id: 'admin' as UserRole, name: 'Administrator', icon: Target, color: 'gray', description: 'System configuration' }
];

export function RoleSelector({ currentRole, onRoleChange, availableRoles }: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter roles to only show those available to the user
  const roles = availableRoles 
    ? allRoles.filter(role => availableRoles.includes(role.id))
    : allRoles;

  const currentRoleInfo = roles.find(r => r.id === currentRole);
  const CurrentIcon = currentRoleInfo?.icon || User;

  // Don't show the role selector if user only has one role
  if (roles.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <div className={`w-8 h-8 rounded-lg bg-${currentRoleInfo?.color}-100 flex items-center justify-center`}>
          <CurrentIcon className={`w-4 h-4 text-${currentRoleInfo?.color}-600`} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500">Current Role</p>
          <p className="text-sm text-gray-900">{currentRoleInfo?.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full"
      >
        <div className={`w-8 h-8 rounded-lg bg-${currentRoleInfo?.color}-100 flex items-center justify-center`}>
          <CurrentIcon className={`w-4 h-4 text-${currentRoleInfo?.color}-600`} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs text-gray-500">Role</p>
          <p className="text-sm text-gray-900">{currentRoleInfo?.name}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2 space-y-1">
              {roles.map((role) => {
                const RoleIcon = role.icon;
                const isSelected = currentRole === role.id;
                
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      onRoleChange(role.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-[#62d5e4] text-white' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected 
                        ? 'bg-white bg-opacity-20' 
                        : `bg-${role.color}-100`
                    }`}>
                      <RoleIcon className={`w-4 h-4 ${
                        isSelected 
                          ? 'text-white' 
                          : `text-${role.color}-600`
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {role.name}
                      </p>
                      <p className={`text-xs ${isSelected ? 'text-white text-opacity-80' : 'text-gray-500'}`}>
                        {role.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}