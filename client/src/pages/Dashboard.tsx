import React, { useState, useEffect } from 'react';
import { ShieldIcon, ActivityIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { networkAPI } from '../services/api';
import { NetworkStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await networkAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'System Status',
      value: stats?.is_capturing ? 'Active' : 'Inactive',
      icon: ShieldIcon,
      color: stats?.is_capturing ? 'text-green-600' : 'text-gray-600',
      bgColor: stats?.is_capturing ? 'bg-green-100' : 'bg-gray-100',
    },
    {
      title: 'Packets Captured',
      value: stats?.stats?.total_packets?.toLocaleString() || '0',
      icon: ActivityIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Data Processed',
      value: `${((stats?.stats?.total_bytes || 0) / 1024 / 1024).toFixed(2)} MB`,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Recent Alerts',
      value: stats?.recent_alerts?.length || 0,
      icon: AlertTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Real-time overview of your intrusion detection system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
        {stats?.recent_alerts && stats.recent_alerts.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start">
                  <AlertTriangleIcon
                    className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'high'
                        ? 'text-red-600'
                        : alert.severity === 'medium'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                      {alert.src_ip && ` • Source: ${alert.src_ip}`}
                      {alert.dst_ip && ` • Destination: ${alert.dst_ip}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">No recent alerts</p>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Capture Status</span>
              <span className={`text-sm font-medium ${
                stats?.is_capturing ? 'text-green-600' : 'text-gray-600'
              }`}>
                {stats?.is_capturing ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Queue Size</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.queue_size || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Alerts</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.recent_alerts?.length || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="btn-primary w-full">
              Start Network Capture
            </button>
            <button className="btn-primary w-full">
              View Model Performance
            </button>
            <button className="btn-primary w-full">
              Export Statistics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
