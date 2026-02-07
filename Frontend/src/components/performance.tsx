import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';

const codingVolumeData = [
  { day: 'Mon', value: 12 },
  { day: 'Tue', value: 16 },
  { day: 'Wed', value: 14 },
  { day: 'Thu', value: 19 },
  { day: 'Fri', value: 17 },
  { day: 'Sat', value: 8 },
  { day: 'Sun', value: 6 },
];

const accuracyData = [
  { day: 'Mon', value: 92 },
  { day: 'Tue', value: 89 },
  { day: 'Wed', value: 94 },
  { day: 'Thu', value: 96 },
  { day: 'Fri', value: 93 },
  { day: 'Sat', value: 95 },
  { day: 'Sun', value: 91 },
];

const timePerChartData = [
  { day: 'Mon', value: 8.5 },
  { day: 'Tue', value: 7.8 },
  { day: 'Wed', value: 8.2 },
  { day: 'Thu', value: 8.8 },
  { day: 'Fri', value: 7.5 },
  { day: 'Sat', value: 8.9 },
  { day: 'Sun', value: 9.2 },
];

export function Performance() {
  const [activeSubTab, setActiveSubTab] = useState('Overview');
  const subTabs = ['Overview', 'By Coder', 'Trends'];

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {/* Sub-tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {subTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeSubTab === tab
                  ? 'border-[#62d5e4] text-[#62d5e4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coding Volume Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="pb-4 border-b border-gray-200 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Coding Volume</h3>
            <p className="text-sm text-gray-600 mt-1">Charts coded per day</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={codingVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Bar dataKey="value" fill="#62d5e4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accuracy Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="pb-4 border-b border-gray-200 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Accuracy</h3>
            <p className="text-sm text-gray-600 mt-1">Coding accuracy percentage</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  domain={[85, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Per Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Per Chart</h3>
          <p className="text-sm text-gray-600 mb-4">Average minutes per chart</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timePerChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  domain={[7, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}