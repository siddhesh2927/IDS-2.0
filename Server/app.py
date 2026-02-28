from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import json
from datetime import datetime
import threading
import time
from ml_models import IntrusionDetectionModels
from network_capture import NetworkCapture

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'intrusion_detection_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global instances
ml_system = IntrusionDetectionModels()
network_capture = NetworkCapture()

# Store network_capture reference in ml_system for ML predictions
network_capture.ml_models = ml_system

@app.route('/')
def index():
    return jsonify({
        'message': 'Intrusion Detection System API',
        'version': '1.0.0',
        'endpoints': {
            'dataset': '/api/dataset',
            'train': '/api/train',
            'predict': '/api/predict',
            'models': '/api/models',
            'network': '/api/network',
            'stats': '/api/stats'
        }
    })

@app.route('/api/dataset/load', methods=['POST'])
def load_dataset():
    """Load dataset for training"""
    try:
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'Filename is required'}), 400
        
        filepath = os.path.join('uploads', filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': f'File {filename} not found in uploads directory'}), 404
        
        # Load dataset
        df = ml_system.load_dataset(filepath)
        
        # Get dataset info
        dataset_info = {
            'shape': df.shape,
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'target_distribution': df[ml_system.target_column].value_counts().to_dict() if ml_system.target_column in df.columns else {},
            'sample_data': df.head().to_dict('records')
        }
        
        return jsonify({
            'success': True,
            'message': f'Dataset {filename} loaded successfully',
            'info': dataset_info
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/train', methods=['POST'])
def train_models():
    """Train ML models"""
    try:
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'Filename is required'}), 400
        
        filepath = os.path.join('uploads', filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': f'File {filename} not found'}), 404
        
        # Load and preprocess data
        df = ml_system.load_dataset(filepath)
        X, y = ml_system.preprocess_data(df)
        
        # Train models
        socketio.emit('training_status', {'status': 'started', 'message': 'Starting model training...'})
        
        results = ml_system.train_models(X, y)
        
        # Save models
        ml_system.save_models()
        
        # Prepare results for response
        training_results = {}
        for model_name, model_data in results.items():
            training_results[model_name] = {
                'accuracy': float(model_data['accuracy']),
                'report': model_data['report'],
                'confusion_matrix': model_data['confusion_matrix']
            }
        
        socketio.emit('training_status', {'status': 'completed', 'message': 'Model training completed!'})
        
        return jsonify({
            'success': True,
            'message': 'Models trained successfully',
            'results': training_results
        })
        
    except Exception as e:
        socketio.emit('training_status', {'status': 'error', 'message': str(e)})
        return jsonify({'error': str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    """Get information about trained models"""
    try:
        # Try to load models if not already loaded
        if not ml_system.models:
            try:
                ml_system.load_models()
            except:
                return jsonify({'error': 'No trained models found'}), 404
        
        model_info = ml_system.get_model_info()
        
        return jsonify({
            'success': True,
            'models': model_info,
            'feature_columns': ml_system.feature_columns
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    """Make prediction using trained models"""
    try:
        data = request.get_json()
        features = data.get('features')
        model_name = data.get('model', 'RandomForest')
        
        if not features:
            return jsonify({'error': 'Features are required'}), 400
        
        # Make prediction
        result = ml_system.predict(features, model_name)
        
        return jsonify({
            'success': True,
            'prediction': result['prediction'],
            'probability': float(result['probability']),
            'all_probabilities': result['all_probabilities']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/interfaces', methods=['GET'])
def get_network_interfaces():
    """Get available network interfaces"""
    try:
        interfaces = network_capture.get_network_interfaces()
        return jsonify({
            'success': True,
            'interfaces': interfaces
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/start', methods=['POST'])
def start_network_capture():
    """Start network capture"""
    try:
        data = request.get_json()
        interface = data.get('interface')
        
        success = network_capture.start_capture(interface)
        
        if success:
            # Start stats broadcasting
            threading.Thread(target=broadcast_stats, daemon=True).start()
            
            return jsonify({
                'success': True,
                'message': 'Network capture started'
            })
        else:
            return jsonify({'error': 'Failed to start capture'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/stop', methods=['POST'])
def stop_network_capture():
    """Stop network capture"""
    try:
        success = network_capture.stop_capture()
        
        return jsonify({
            'success': True,
            'message': 'Network capture stopped'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/stats', methods=['GET'])
def get_network_stats():
    """Get network capture statistics"""
    try:
        stats = network_capture.get_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/alerts/clear', methods=['POST'])
def clear_alerts():
    """Clear network alerts"""
    try:
        network_capture.clear_alerts()
        return jsonify({
            'success': True,
            'message': 'Alerts cleared'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload file to uploads directory"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file
        filename = file.filename
        filepath = os.path.join('uploads', filename)
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'message': f'File {filename} uploaded successfully',
            'filename': filename
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    """List files in uploads directory"""
    try:
        files = []
        if os.path.exists('uploads'):
            for filename in os.listdir('uploads'):
                filepath = os.path.join('uploads', filename)
                if os.path.isfile(filepath):
                    files.append({
                        'name': filename,
                        'size': os.path.getsize(filepath),
                        'modified': datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
                    })
        
        return jsonify({
            'success': True,
            'files': files
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def broadcast_stats():
    """Broadcast network stats via WebSocket"""
    while network_capture.is_capturing:
        try:
            stats = network_capture.get_stats()
            socketio.emit('network_stats', stats)
            time.sleep(1)  # Broadcast every second
        except Exception as e:
            print(f"Error broadcasting stats: {e}")
            break

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    emit('connected', {'message': 'Connected to Intrusion Detection System'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    
    # Create models directory if it doesn't exist
    if not os.path.exists('models'):
        os.makedirs('models')
    
    print("🚀 Starting Intrusion Detection System...")
    print("📡 Backend API running on http://localhost:5000")
    print("🌐 WebSocket server ready")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
