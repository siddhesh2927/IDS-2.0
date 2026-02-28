import React, { useState, useEffect } from 'react';
import { ActivityIcon, AlertTriangleIcon, ShieldIcon, TrendingUpIcon } from 'lucide-react';
import { networkAPI } from '../services/api';
import { NetworkStats } from '../types';
import socketService from '../services/socket';

const LiveMonitor: React.FC = () => {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alertHistory, setAlertHistory] = useState<any[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    socketService.connect();
    setIsConnected(socketService.isConnected());

    // Listen for real-time updates
    socketService.on('network_stats', (data: NetworkStats) => {
      setStats(data);
      
      // Update alert history
      if (data.recent_alerts && data.recent_alerts.length > 0) {
        setAlertHistory(prev => {
          const newAlerts = data.recent_alerts.filter(alert => 
            !prev.some(existing => existing.timestamp === alert.timestamp)
          );
          return [...newAlerts, ...prev].slice(0, 50); // Keep last 50 alerts
        });
      }
    });

    // Initial data fetch
    fetchStats();

    return () => {
      socketService.off('network_stats', () => {});
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await networkAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getAlertsByType = () => {
    if (!alertHistory.length) return {};
    
    const alertsByType = alertHistory.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return alertsByType;
  };

  const getAlertsBySeverity = () => {
    if (!alertHistory.length) return { high: 0, medium: 0, low: 0 };
    
    return alertHistory.reduce(
      (acc, alert) => {
        acc[alert.severity]++;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  };

  const alertsByType = getAlertsByType();
  const alertsBySeverity = getAlertsBySeverity();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Live Monitor</h2>
        <p className="mt-1 text-sm text-gray-600">
          Real-time monitoring of network activity and security alerts
        </p>
      </div>

      {/* Connection Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isConnected ? 'Connected to real-time feed' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <ActivityIcon className="h-4 w-4 mr-1" />
            Live updates every second
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ActivityIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Packets</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.stats?.total_packets?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Data Processed</p>
              <p className="text-2xl font-bold text-gray-900">
                {((stats?.stats?.total_bytes || 0) / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {alertHistory.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <ShieldIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {alertsBySeverity.high}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Types */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Types</h3>
          <div className="space-y-3">
            {Object.entries(alertsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {type.replace('_', ' ')}
                </span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(Number(count) / alertHistory.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{Number(count)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Severity Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">High</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(alertsBySeverity.high / alertHistory.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-red-600">{alertsBySeverity.high}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Medium</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${(alertsBySeverity.medium / alertHistory.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-yellow-600">{alertsBySeverity.medium}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Low</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(alertsBySeverity.low / alertHistory.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-blue-600">{alertsBySeverity.low}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Alert Feed */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Alert Feed</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alertHistory.length > 0 ? (
            alertHistory.map((alert, index) => (
              <div
                key={`${alert.timestamp}-${index}`}
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
                    className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                      alert.severity === 'high'
                        ? 'text-red-600'
                        : alert.severity === 'medium'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                      {alert.src_ip && ` • ${alert.src_ip}`}
                      {alert.dst_ip && ` → ${alert.dst_ip}`}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <ShieldIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-sm text-gray-600">No alerts detected</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.is_capturing ? 'Monitoring network traffic...' : 'Start capture to begin monitoring'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Graph Placeholder */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Packet Activity</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Real-time packet activity graph</p>
            <p className="text-xs text-gray-500 mt-1">
              Current: {stats?.stats?.total_packets || 0} packets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
