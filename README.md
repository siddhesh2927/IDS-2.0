# 🛡️ Intrusion Detection System

A modern, full-stack network intrusion detection system with React frontend and Python backend, featuring real-time threat detection and machine learning capabilities.

## 🚀 Features

- **🤖 Machine Learning**: Train models on local datasets (CICIDS2017 recommended)
- **🌐 Real-time Detection**: Live network monitoring and threat detection
- **📊 Live Dashboard**: WebSocket streaming of alerts and statistics
- **🎯 Modern UI**: React with TailwindCSS and shadcn/ui components
- **⚡ Fast API**: Python Flask backend with ML capabilities

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- pip and npm

## 🛠️ Installation

### Backend Setup
```bash
cd Server
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd Client
npm install
npm start
```

## 📁 Dataset Setup

1. Download CICIDS2017 dataset: https://www.kaggle.com/datasets/cic/cicids2017
2. Place CSV file in: `Server/uploads/cicids2017.csv`
3. Access the web interface at http://localhost:3000

## 🎯 Quick Start

1. **Start Backend**: `python Server/app.py`
2. **Start Frontend**: `npm start` (in Client directory)
3. **Train Models**: Go to Model Training page → Load Dataset → Train
4. **Live Detection**: Go to Network Capture page → Start Capture

## 📊 Architecture

```
├── Server/                 # Python Flask Backend
│   ├── app.py             # Main Flask application
│   ├── ml_models.py       # Machine learning models
│   ├── network_capture.py # Network packet capture
│   └── uploads/           # Dataset storage
└── Client/                # React Frontend
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   └── services/      # API services
    └── public/
```

## 🔧 Technologies

- **Frontend**: React, TailwindCSS, shadcn/ui, Chart.js
- **Backend**: Python, Flask, Scikit-learn, Pandas, NumPy
- **Real-time**: WebSockets, Socket.IO
- **ML**: Random Forest, SVM, Neural Networks

## 📈 Supported Attacks

- DoS/DDoS attacks
- Port scanning
- Web attacks
- Botnet activities
- Infiltration attempts

## 🚨 Alert System

Real-time alerts for:
- Suspicious network traffic
- Anomaly detection
- Known attack patterns
- Threshold violations

## 📝 License

MIT License - feel free to use and modify!
