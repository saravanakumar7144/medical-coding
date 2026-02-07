import { StatsCards } from './stats-cards';
import { TabNavigation } from './tab-navigation';
import { WorkQueue } from './work-queue';
import { AISuggestions } from './ai-suggestions';
import { Performance } from './performance';
import { Alerts } from './alerts';

interface DashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Dashboard({ activeTab, setActiveTab }: DashboardProps) {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Work Queue':
        return <WorkQueue />;
      case 'AI Suggestions':
        return <AISuggestions />;
      case 'Performance':
        return <Performance />;
      case 'Alerts':
        return <Alerts />;
      default:
        return <WorkQueue />;
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              All
            </button>
            <button className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
              Urgent
            </button>
            <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors">
              High Dollar
            </button>
            <button className="px-3 py-1 text-sm text-yellow-600 hover:text-yellow-700 border border-yellow-200 rounded-md hover:bg-yellow-50 transition-colors">
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-8 py-6">
        <StatsCards />
      </div>

      {/* Tab Navigation */}
      <div className="px-8">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}