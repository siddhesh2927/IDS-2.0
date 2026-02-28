import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ModelTraining from './pages/ModelTraining';
import NetworkCapture from './pages/NetworkCapture';
import LiveMonitor from './pages/LiveMonitor';
import socketService from './services/socket';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Connect to WebSocket on app start
  React.useEffect(() => {
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'training':
        return <ModelTraining />;
      case 'network':
        return <NetworkCapture />;
      case 'monitor':
        return <LiveMonitor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
