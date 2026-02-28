import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dataset API
export const datasetAPI = {
  loadDataset: (filename: string) => 
    api.post('/dataset/load', { filename }),
  
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  listFiles: () => api.get('/files'),
};

// Training API
export const trainingAPI = {
  trainModels: (filename: string) => 
    api.post('/train', { filename }),
  
  getModels: () => api.get('/models'),
  
  predict: (features: any, model: string = 'RandomForest') =>
    api.post('/predict', { features, model }),
};

// Network API
export const networkAPI = {
  getInterfaces: () => api.get('/network/interfaces'),
  
  startCapture: (interfaceName?: string) =>
    api.post('/network/start', { interface: interfaceName }),
  
  stopCapture: () => api.post('/network/stop'),
  
  getStats: () => api.get('/network/stats'),
  
  clearAlerts: () => api.post('/network/alerts/clear'),
};

export default api;
