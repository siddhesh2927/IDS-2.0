import React, { useState, useEffect } from 'react';
import { PlayIcon, SquareIcon, NetworkIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { networkAPI } from '../services/api';
import { NetworkInterface, NetworkStats } from '../types';
import socketService from '../services/socket';

const NetworkCapture: React.FC = () => {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInterfaces();
    
    // Listen for network stats updates
    socketService.on('network_stats', (data: NetworkStats) => {
      setStats(data);
      setIsCapturing(data.is_capturing);
    });

    return () => {
      socketService.off('network_stats', () => {});
    };
  }, []);

  useEffect(() => {
    // Fetch initial stats
    fetchStats();
    const interval = setInterval(fetchStats, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchInterfaces = async () => {
    try {
      const response = await networkAPI.getInterfaces();
      setInterfaces(response.data.interfaces);
      if (response.data.interfaces.length > 0) {
        setSelectedInterface(response.data.interfaces[0].name);
      }
    } catch (error) {
      console.error('Failed to fetch interfaces:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await networkAPI.getStats();
      setStats(response.data);
      setIsCapturing(response.data.is_capturing);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleStartCapture = async () => {
    setLoading(true);
    try {
      await networkAPI.startCapture(selectedInterface || undefined);
      setIsCapturing(true);
    } catch (error) {
      console.error('Failed to start capture:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopCapture = async () => {
    setLoading(true);
    try {
      await networkAPI.stopCapture();
      setIsCapturing(false);
    } catch (error) {
      console.error('Failed to stop capture:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAlerts = async () => {
    try {
      await networkAPI.clearAlerts();
      await fetchStats();
    } catch (error) {
      console.error('Failed to clear alerts:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Network Capture</h2>
        <p className="mt-1 text-sm text-gray-600">
          Monitor network traffic and detect intrusions in real-time
        </p>
      </div>

      {/* Control Panel */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Capture Control</h3>
        
        <div className="space-y-4">
          {/* Interface Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Network Interface
            </label>
            <select
              className="input-field"
              value={selectedInterface}
              onChange={(e) => setSelectedInterface(e.target.value)}
              disabled={isCapturing}
            >
              {interfaces.map((iface) => (
                <option key={iface.name} value={iface.name}>
                  {iface.name} - {iface.ip}
                </option>
              ))}
            </select>
          </div>

          {/* Control Buttons */}
          <div className="flex space-x-4">
            {!isCapturing ? (
              <button
                onClick={handleStartCapture}
                disabled={loading || !selectedInterface}
                className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start Capture
              </button>
            ) : (
              <button
                onClick={handleStopCapture}
                disabled={loading}
                className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SquareIcon className="h-4 w-4 mr-2" />
                Stop Capture
              </button>
            )}
            
            <button
              onClick={handleClearAlerts}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Alerts
            </button>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${isCapturing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isCapturing ? 'Capturing traffic...' : 'Capture stopped'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <NetworkIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Packets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.stats.total_packets?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Processed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((stats.stats.total_bytes || 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Queue Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.queue_size || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.recent_alerts?.length || '0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {stats?.recent_alerts && stats.recent_alerts.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.recent_alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start">
                  <AlertTriangleIcon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="mt-1 text-xs opacity-75">
                      <p>{new Date(alert.timestamp).toLocaleString()}</p>
                      {alert.src_ip && <p>Source: {alert.src_ip}</p>}
                      {alert.dst_ip && <p>Destination: {alert.dst_ip}</p>}
                      {alert.port && <p>Port: {alert.port}</p>}
                      {alert.size && <p>Size: {alert.size} bytes</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Alerts State */}
      {stats?.recent_alerts && stats.recent_alerts.length === 0 && (
        <div className="card">
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">No alerts detected</p>
            <p className="text-xs text-gray-500 mt-1">
              {isCapturing ? 'Monitoring network traffic...' : 'Start capture to begin monitoring'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkCapture;
