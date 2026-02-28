import React from 'react';
import { ShieldIcon, ActivityIcon, BrainIcon, NetworkIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: ShieldIcon },
    { name: 'Model Training', id: 'training', icon: BrainIcon },
    { name: 'Network Capture', id: 'network', icon: NetworkIcon },
    { name: 'Live Monitor', id: 'monitor', icon: ActivityIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ShieldIcon className="h-8 w-8 text-primary-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Intrusion Detection System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="ml-2 text-sm text-gray-600">System Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    currentPage === item.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
