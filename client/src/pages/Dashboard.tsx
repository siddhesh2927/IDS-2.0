import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldIcon, ActivityIcon, AlertTriangleIcon, CheckCircleIcon, PlayIcon, SquareIcon } from 'lucide-react';
import { networkAPI } from '../services/api';
import { NetworkStats } from '../types';
import socketService from '../services/socket';

interface DashboardProps {
  onPageChange?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingAction = useRef(false);

  const fetchStats = useCallback(async () => {
    if (pendingAction.current) return;
    try {
      const response = await networkAPI.getStats();
      setStats(response.data);
      setIsCapturing(response.data.is_capturing);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Connect socket for real-time updates
    socketService.connect();

    const handleNetworkStats = (data: NetworkStats) => {
      setStats(data);
      if (!pendingAction.current) {
        setIsCapturing(data.is_capturing);
      }
    };

    socketService.on('network_stats', handleNetworkStats);

    // Initial fetch
    fetchStats();
    const interval = setInterval(fetchStats, 3000);

    return () => {
      socketService.off('network_stats', handleNetworkStats);
      clearInterval(interval);
    };
  }, [fetchStats]);

  const handleStartCapture = async () => {
    setCaptureLoading(true);
    setError(null);
    pendingAction.current = true;
    setIsCapturing(true);
    try {
      await networkAPI.startCapture();
    } catch (err: any) {
      setIsCapturing(false);
      setError(err?.response?.data?.error || 'Failed to start capture. Run backend as Administrator.');
    } finally {
      setCaptureLoading(false);
      setTimeout(() => { pendingAction.current = false; }, 3000);
    }
  };

  const handleStopCapture = async () => {
    setCaptureLoading(true);
    setError(null);
    pendingAction.current = true;
    setIsCapturing(false);
    try {
      await networkAPI.stopCapture();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to stop capture.');
    } finally {
      setCaptureLoading(false);
      setTimeout(() => { pendingAction.current = false; }, 3000);
    }
  };

  const statCards = [
    {
      title: 'System Status',
      value: isCapturing ? 'Active' : 'Inactive',
      icon: ShieldIcon,
      color: isCapturing ? 'text-green-600' : 'text-gray-600',
      bgColor: isCapturing ? 'bg-green-100' : 'bg-gray-100',
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

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {/* Capture Status Banner */}
      <div className={`p-4 rounded-lg border flex items-center justify-between ${isCapturing
        ? 'bg-green-50 border-green-200'
        : 'bg-gray-50 border-gray-200'
        }`}>
        <div className="flex items-center space-x-3">
          <div className={`h-3 w-3 rounded-full ${isCapturing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium text-gray-700">
            {isCapturing ? '🟢 Real-time packet capture is ACTIVE' : '⚪ Capture is not running'}
          </span>
        </div>
        {!isCapturing ? (
          <button
            onClick={handleStartCapture}
            disabled={captureLoading}
            className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            {captureLoading ? 'Starting...' : 'Start Capture'}
          </button>
        ) : (
          <button
            onClick={handleStopCapture}
            disabled={captureLoading}
            className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SquareIcon className="h-4 w-4 mr-2" />
            {captureLoading ? 'Stopping...' : 'Stop Capture'}
          </button>
        )}
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
                className={`p-3 rounded-lg border ${alert.severity === 'high'
                  ? 'bg-red-50 border-red-200'
                  : alert.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                  }`}
              >
                <div className="flex items-start">
                  <AlertTriangleIcon
                    className={`h-5 w-5 mt-0.5 ${alert.severity === 'high'
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
            {!isCapturing && (
              <p className="text-xs text-gray-400 mt-1">Start capture above to begin monitoring</p>
            )}
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
              <span className={`text-sm font-medium ${isCapturing ? 'text-green-600' : 'text-gray-600'}`}>
                {isCapturing ? '🟢 Running' : '⚪ Stopped'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Capture Mode</span>
              <span className="text-sm font-medium text-blue-600">Real-time (Scapy)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Queue Size</span>
              <span className="text-sm font-medium text-gray-900">{stats?.queue_size || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Alerts</span>
              <span className="text-sm font-medium text-gray-900">{stats?.recent_alerts?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Bytes</span>
              <span className="text-sm font-medium text-gray-900">
                {((stats?.stats?.total_bytes || 0) / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {!isCapturing ? (
              <button
                onClick={handleStartCapture}
                disabled={captureLoading}
                className="btn-success w-full disabled:opacity-50"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {captureLoading ? 'Starting...' : 'Start Network Capture'}
              </button>
            ) : (
              <button
                onClick={handleStopCapture}
                disabled={captureLoading}
                className="btn-danger w-full disabled:opacity-50"
              >
                <SquareIcon className="h-4 w-4 mr-2" />
                {captureLoading ? 'Stopping...' : 'Stop Network Capture'}
              </button>
            )}
            <a href="/network" className="btn-primary w-full block text-center">
              View Network Details
            </a>
            <button
              onClick={() => onPageChange && onPageChange('models')}
              className="btn-primary w-full block text-center"
            >
              View Model Performance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
