import React, { useState, useEffect } from 'react';
import { UploadIcon, BrainIcon, CheckCircleIcon } from 'lucide-react';
import { datasetAPI, trainingAPI } from '../services/api';
import { DatasetInfo, ModelResults, FileInfo } from '../types';
import socketService from '../services/socket';

const ModelTraining: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [trainingResults, setTrainingResults] = useState<ModelResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchFiles();
    
    // Listen for training status updates
    socketService.on('training_status', (data: any) => {
      setTrainingStatus(data.message);
      if (data.status === 'completed') {
        setLoading(false);
        fetchModels();
      } else if (data.status === 'error') {
        setLoading(false);
      }
    });

    return () => {
      socketService.off('training_status', () => {});
    };
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await datasetAPI.listFiles();
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      await datasetAPI.uploadFile(file);
      await fetchFiles();
      setSelectedFile(file.name);
      setUploadProgress(100);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleLoadDataset = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const response = await datasetAPI.loadDataset(selectedFile);
      setDatasetInfo(response.data.info);
    } catch (error) {
      console.error('Failed to load dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModels = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setTrainingStatus('Initializing training...');
    try {
      await trainingAPI.trainModels(selectedFile);
    } catch (error) {
      console.error('Training failed:', error);
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await trainingAPI.getModels();
      if (response.data.models) {
        setTrainingResults(response.data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Model Training</h2>
        <p className="mt-1 text-sm text-gray-600">
          Train machine learning models on your intrusion detection dataset
        </p>
      </div>

      {/* File Upload Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dataset Upload</h3>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="btn-primary">Choose File</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </label>
              <p className="mt-2 text-sm text-gray-600">
                CSV files only. Max 50MB.
              </p>
            </div>
          </div>

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* File Selection */}
          {files.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dataset
              </label>
              <select
                className="input-field"
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                disabled={loading}
              >
                <option value="">Choose a file...</option>
                {files.map((file) => (
                  <option key={file.name} value={file.name}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleLoadDataset}
              disabled={!selectedFile || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Dataset
            </button>
            <button
              onClick={handleTrainModels}
              disabled={!selectedFile || !datasetInfo || loading}
              className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BrainIcon className="h-4 w-4 mr-2" />
              Train Models
            </button>
          </div>
        </div>
      </div>

      {/* Training Status */}
      {trainingStatus && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Status</h3>
          <div className="flex items-center">
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-3"></div>
            ) : (
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
            )}
            <p className="text-sm text-gray-700">{trainingStatus}</p>
          </div>
        </div>
      )}

      {/* Dataset Information */}
      {datasetInfo && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dataset Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Shape</p>
              <p className="text-lg font-semibold text-gray-900">
                {datasetInfo.shape[0]} rows × {datasetInfo.shape[1]} columns
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Features</p>
              <p className="text-lg font-semibold text-gray-900">
                {datasetInfo.columns.length - 1}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Target Classes</p>
              <p className="text-lg font-semibold text-gray-900">
                {Object.keys(datasetInfo.target_distribution).length}
              </p>
            </div>
          </div>
          
          {/* Target Distribution */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Target Distribution</h4>
            <div className="space-y-2">
              {Object.entries(datasetInfo.target_distribution).map(([label, count]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Training Results */}
      {trainingResults && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Results</h3>
          <div className="space-y-4">
            {Object.entries(trainingResults).map(([modelName, results]) => (
              <div key={modelName} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">{modelName}</h4>
                  <span className="text-sm font-semibold text-green-600">
                    {(results.accuracy * 100).toFixed(2)}% Accuracy
                  </span>
                </div>
                
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {results.report && Object.entries(results.report).map(([label, metrics]: [string, any]) => {
                    if (label === 'accuracy' || label === 'macro avg' || label === 'weighted avg') return null;
                    return (
                      <div key={label} className="bg-gray-50 rounded p-2">
                        <p className="text-xs font-medium text-gray-600">{label}</p>
                        <p className="text-sm font-bold text-gray-900">
                          {(metrics.f1_score * 100).toFixed(1)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelTraining;
