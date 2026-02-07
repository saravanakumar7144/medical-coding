import { useState } from 'react';
import { TrendingUp, Calendar, Target, Clock } from 'lucide-react';

export function StatsCards() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const stats = [
    {
      title: 'Total Charts',
      value: '42',
      subtitle: '+8% from last week',
      icon: TrendingUp,
      iconColor: 'text-[#62d5e4]',
      details: 'Daily average: 6 charts',
      trend: '+8%'
    },
    {
      title: 'Completed Today',
      value: '18',
      subtitle: '2 hours yesterday',
      icon: Calendar,
      iconColor: 'text-[#62d5e4]',
      details: 'Remaining: 24 charts',
      trend: '+12%'
    },
    {
      title: 'Avg. Accuracy',
      value: '94.2%',
      subtitle: '+0.1% from last month',
      icon: Target,
      iconColor: 'text-[#62d5e4]',
      details: 'Target: 95%',
      trend: '+0.1%'
    },
    {
      title: 'Avg. Time Per Chart',
      value: '8.2m',
      subtitle: '+0.3m from last month',
      icon: Clock,
      iconColor: 'text-orange-500',
      details: 'Target: 7.5m',
      trend: '+0.3m'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative"
          onMouseEnter={() => setHoveredCard(index)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
              <p className="text-2xl font-semibold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>
            <div className="ml-4">
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
          </div>
          
          {/* Hover tooltip */}
          {hoveredCard === index && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 text-white text-sm p-4 rounded-lg shadow-lg z-10">
              <div className="flex justify-between items-center">
                <span>{stat.details}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  stat.trend.includes('-') ? 'bg-red-100 text-red-700' : 'bg-[#62d5e4] bg-opacity-20 text-[#62d5e4]'
                }`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}