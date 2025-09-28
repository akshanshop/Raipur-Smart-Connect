import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  categoryCounts: Array<{ category: string; count: number }>;
  priorityDistribution: Array<{ priority: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  monthlyTrends: Array<{ month: string; count: number }>;
  responseTimeAnalytics: {
    average: number;
    fastest: number;
    slowest: number;
  };
}

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

export default function AnalyticsDashboard() {
  const [viewType, setViewType] = useState<'personal' | 'city'>('personal');

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: [`/api/analytics/complaints?personal=${viewType === 'personal'}`],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-white squircle-container p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 squircle-16 w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 squircle-16 mb-4"></div>
          <div className="h-32 bg-gray-200 squircle-16"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white squircle-container p-6">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white squircle-container p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Civic Analytics Dashboard</h2>
          <div className="flex bg-gray-100 squircle-16 p-1">
            <button
              onClick={() => setViewType('personal')}
              className={`px-4 py-2 squircle-16 text-sm font-medium transition-all ${
                viewType === 'personal'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setViewType('city')}
              className={`px-4 py-2 squircle-16 text-sm font-medium transition-all ${
                viewType === 'city'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              City-wide
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 squircle-container p-4 border border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 squircle-16">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.responseTimeAnalytics.average}h</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 squircle-container p-4 border border-green-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 squircle-16">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Fastest Resolution</p>
                <p className="text-2xl font-bold text-green-900">{analytics.responseTimeAnalytics.fastest}h</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 squircle-container p-4 border border-orange-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-600 squircle-16">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Slowest Resolution</p>
                <p className="text-2xl font-bold text-orange-900">{analytics.responseTimeAnalytics.slowest}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white squircle-container p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.categoryCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white squircle-container p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.priorityDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ priority, percent }) => `${priority} ${(percent * 100).toFixed(0)}%`}
              >
                {analytics.priorityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white squircle-container p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
              >
                {analytics.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white squircle-container p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 squircle-container p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white squircle-container p-4">
            <h4 className="font-medium text-gray-900 mb-2">Most Common Category</h4>
            <p className="text-sm text-gray-600">
              {analytics.categoryCounts.length > 0 && 
                `${analytics.categoryCounts[0].category} accounts for most complaints`
              }
            </p>
          </div>
          <div className="bg-white squircle-container p-4">
            <h4 className="font-medium text-gray-900 mb-2">Resolution Efficiency</h4>
            <p className="text-sm text-gray-600">
              Response times are {analytics.responseTimeAnalytics.average < 3 ? 'excellent' : 
                analytics.responseTimeAnalytics.average < 6 ? 'good' : 'needs improvement'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}