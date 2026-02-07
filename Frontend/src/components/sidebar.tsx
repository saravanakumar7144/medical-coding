import { 
  Home,
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  BookOpen, 
  BarChart3, 
  Settings,
  Search,
  User,
  Inbox,
  Shield,
  Send,
  Receipt,
  AlertTriangle,
  Scale,
  CreditCard,
  Building,
  Database,
  Filter,
  TrendingUp,
  Activity,
  ShieldCheck,
  Calculator,
  Sparkles,
  LogOut
} from 'lucide-react';
import { RoleSelector, UserRole } from './role-selector';
import { filterNavigationByRole } from '../types/role-permissions';
import panaceonLogo from 'figma:asset/70083142d91bdea5dada0c2eb73537f5bbd81c40.png';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenSearch?: () => void;
  userRoles?: UserRole[];
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export function Sidebar({ activePage, setActivePage, currentRole, onRoleChange, onOpenSearch, userRoles, userName, userEmail, onLogout }: SidebarProps) {
  // Entity-based navigation structure
  const allNavigationGroups = [
    {
      title: 'CLAIMS MANAGEMENT',
      emoji: '🏥',
      items: [
        { name: 'Claims Inbox', icon: Inbox },
        { name: 'Submissions & Acks', icon: Send },
        { name: 'Enhanced Claim Workspace', icon: FileText },
        { name: 'Real-Time Claim Status', icon: Activity },
      ]
    },
    {
      title: 'PAYMENTS & REVENUE',
      emoji: '💰',
      items: [
        { name: 'ERAs & Payments', icon: Receipt },
        { name: 'AI Denials Workbench', icon: Sparkles },
        { name: 'Appeals & Recons', icon: Scale },
        { name: 'Patient Billing', icon: CreditCard },
      ]
    },
    {
      title: 'PATIENT & ELIGIBILITY',
      emoji: '👤',
      items: [
        { name: 'Eligibility & Auth', icon: Shield },
      ]
    },
    {
      title: 'PAYERS & CONTRACTS',
      emoji: '🏢',
      items: [
        { name: 'Payers & Fee Schedules', icon: Building },
        { name: 'Enhanced Payers Portal', icon: Building },
      ]
    },
    {
      title: 'CODING & DOCS',
      emoji: '📋',
      items: [
        { name: 'Chart Coding', icon: FileText },
        { name: 'Code Library', icon: BookOpen },
        { name: 'Code Sets & Updates', icon: Database },
        { name: 'Batch Processing', icon: FolderOpen },
      ]
    },
    {
      title: 'ANALYTICS',
      emoji: '📊',
      items: [
        { name: 'Home', icon: Home },
        { name: 'Dashboard', icon: LayoutDashboard },
        { name: 'Reports & Analytics', icon: TrendingUp },
        { name: 'Analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'CONFIGURATION',
      emoji: '🔧',
      items: [
        { name: 'Rules & Scrubbing', icon: Filter },
        { name: 'Admin & Settings', icon: Settings },
        { name: 'Auth Testing', icon: Settings }, // Testing suite
      ]
    },
    {
      title: 'ENHANCED FEATURES',
      emoji: '⚡',
      items: [
        { name: 'Enhanced Prior Auth', icon: ShieldCheck },
        { name: 'Central Unit Calculator', icon: Calculator },
      ]
    },
  ];

  // Filter navigation groups based on user role
  const navigationGroups = allNavigationGroups
    .map(group => ({
      ...group,
      items: filterNavigationByRole(group.items, currentRole)
    }))
    .filter(group => group.items.length > 0); // Only show groups with accessible items

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header with Panaceon Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img 
            src={panaceonLogo} 
            alt="Panaceon" 
            className="h-16 w-16 object-contain"
          />
          <span className="font-semibold text-gray-900 text-lg">Panaceon</span>
        </div>
      </div>

      {/* Role Selector */}
      <div className="p-4">
        <RoleSelector currentRole={currentRole} onRoleChange={onRoleChange} availableRoles={userRoles} />
      </div>

      {/* Search - Increased height from py-2 to h-11 */}
      <div className="px-4 pb-4">
        <button
          onClick={onOpenSearch}
          className="w-full relative group"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search... (Press /)"
            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4] focus:border-transparent cursor-pointer"
            readOnly
          />
        </button>
      </div>

      {/* Navigation - Entity-based grouping */}
      <nav className="flex-1 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? 'mt-6' : ''}>
            {/* Section Header */}
            <div className="px-3 mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <span className="text-base">{group.emoji}</span>
                {group.title}
              </span>
            </div>
            
            {/* Section Items */}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => setActivePage(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                      activePage === item.name
                        ? 'bg-cyan-50 text-[#62d5e4] border-r-2 border-[#62d5e4]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-left">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            
            {/* Divider between sections (except last) */}
            {groupIndex < navigationGroups.length - 1 && (
              <div className="mt-6 border-t border-gray-200"></div>
            )}
          </div>
        ))}
      </nav>

      {/* Ottana AI Assistant */}
      <div className="p-4">
        <div className="bg-[rgba(178,235,242,1)] rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Ollama AI Assistant</h3>
          <p className="text-xs text-gray-700 mb-3">
            Your digital assistant is ready to help with coding and verification tasks.
          </p>
          <button className="w-full bg-[#62d5e4] text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-[#4bc5d6] transition-colors">
            Ask AI Assistant
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#62d5e4] to-[#4bc5d6] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName || userEmail || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail || ''}</p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </div>
    </div>
  );
}