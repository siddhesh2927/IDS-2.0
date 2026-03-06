import React, { useState, useEffect } from 'react';
import { BrainIcon, CheckCircleIcon, BarChartIcon, TrendingUpIcon, ShieldIcon, AlertCircleIcon, ChevronRightIcon } from 'lucide-react';
import { trainingAPI } from '../services/api';

interface MetricReport {
    [key: string]: {
        precision: number;
        recall: number;
        'f1-score': number;
        support: number;
    } | number;
}

interface ModelMetrics {
    accuracy: number;
    report: MetricReport;
    confusion_matrix: number[][];
}

interface ModelsData {
    [key: string]: ModelMetrics;
}

const Models: React.FC = () => {
    const [models, setModels] = useState<ModelsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            setLoading(true);
            const response = await trainingAPI.getModels();
            if (response.data.success) {
                setModels(response.data.models);
                const firstModel = Object.keys(response.data.models)[0];
                if (firstModel) setSelectedModel(firstModel);
            } else {
                setError(response.data.error || 'Failed to fetch models');
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to connect to backend. Please ensure models are trained.');
        } finally {
            setLoading(false);
        }
    };

    const renderClassificationReport = (report: MetricReport) => {
        const classes = Object.keys(report).filter(k => k !== 'accuracy' && k !== 'macro avg' && k !== 'weighted avg');

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precision</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recall</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F1-Score</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Support</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {classes.map((className) => {
                            const metrics = report[className] as any;
                            return (
                                <tr key={className} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{className}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{(metrics.precision * 100).toFixed(1)}%</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{(metrics.recall * 100).toFixed(1)}%</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{(metrics['f1-score'] * 100).toFixed(1)}%</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{metrics.support}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderConfusionMatrix = (matrix: number[][]) => {
        return (
            <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Confusion Matrix</p>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))` }}>
                    {matrix.flat().map((val, i) => {
                        const max = Math.max(...matrix.flat());
                        const intensity = val / max;
                        return (
                            <div
                                key={i}
                                className="aspect-square flex items-center justify-center text-xs font-bold rounded"
                                style={{
                                    backgroundColor: `rgba(79, 70, 229, ${0.1 + intensity * 0.9})`,
                                    color: intensity > 0.5 ? 'white' : 'black'
                                }}
                            >
                                {val}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600 animate-pulse">Analyzing Model Architecture...</p>
            </div>
        );
    }

    if (error || !models) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 shadow-sm">
                    <AlertCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Model Performance Data Unavailable</h2>
                    <p className="text-gray-600 mb-6">{error || 'Please train the models first to see performance metrics.'}</p>
                    <button
                        onClick={fetchModels}
                        className="btn-primary"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const currentMetrics = selectedModel ? models[selectedModel] : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Machine Learning Performance</h2>
                    <p className="mt-2 text-lg text-gray-600 max-w-2xl">
                        Detailed evaluation metrics for the intrusion detection models trained on the CICIDS2017 dataset.
                    </p>
                </div>
                <div className="flex items-center space-x-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    {Object.keys(models).map((modelName) => (
                        <button
                            key={modelName}
                            onClick={() => setSelectedModel(modelName)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${selectedModel === modelName
                                ? 'bg-primary-600 text-white shadow-md transform scale-105'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {modelName}
                        </button>
                    ))}
                </div>
            </div>

            {currentMetrics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Metrics Card */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-primary-600 to-indigo-700 p-8 text-white">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <BrainIcon className="h-8 w-8 text-white" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-primary-100 text-sm font-medium uppercase tracking-wider">Model Accuracy</p>
                                        <p className="text-5xl font-black mt-1">{(currentMetrics.accuracy * 100).toFixed(2)}%</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-8">
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <p className="text-xs text-primary-100 font-medium">Precision</p>
                                        <p className="text-xl font-bold">{((currentMetrics.report['weighted avg'] as any).precision * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <p className="text-xs text-primary-100 font-medium">Recall</p>
                                        <p className="text-xl font-bold">{((currentMetrics.report['weighted avg'] as any).recall * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <p className="text-xs text-primary-100 font-medium">F1-Score</p>
                                        <p className="text-xl font-bold">{((currentMetrics.report['weighted avg'] as any)['f1-score'] * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <TrendingUpIcon className="h-5 w-5 mr-3 text-primary-600" />
                                    Classification Report
                                </h3>
                                {renderClassificationReport(currentMetrics.report)}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Cards */}
                    <div className="space-y-8">
                        {/* Confusion Matrix Card */}
                        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <ShieldIcon className="h-5 w-5 mr-3 text-primary-600" />
                                Detection Matrix
                            </h3>
                            {renderConfusionMatrix(currentMetrics.confusion_matrix)}
                            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                                The heatmap above visualizes the model's ability to distinguish between normal traffic and various attack types.
                            </p>
                        </div>

                        {/* Insights Card */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-indigo-100 shadow-sm">
                            <h3 className="text-lg font-bold text-indigo-900 mb-4">Model Insights</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="h-6 w-6 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold mr-3 mt-0.5">1</div>
                                    <p className="text-sm text-indigo-800">High precision indicates a low false positive rate for this model.</p>
                                </li>
                                <li className="flex items-start">
                                    <div className="h-6 w-6 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold mr-3 mt-0.5">2</div>
                                    <p className="text-sm text-indigo-800">The model excels at identifying {Object.keys(currentMetrics.report).find(k => k !== 'accuracy' && k !== 'macro avg' && k !== 'weighted avg' && (currentMetrics.report[k] as any).recall > 0.95) || 'standard'} traffic patterns.</p>
                                </li>
                                <li className="flex items-start">
                                    <div className="h-6 w-6 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold mr-3 mt-0.5">3</div>
                                    <p className="text-sm text-indigo-800">Training completed using 80/20 data split for validation.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Models;
