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



@app.route('/api/models', methods=['GET'])
def get_models():
    """Get information about trained models"""
    try:
        # Try to load models if not already loaded
        if not ml_system.models:
            try:
                ml_system.load_models()
            except Exception as load_err:
                print(f"Error loading models: {load_err}")
                return jsonify({
                    'error': 'No trained models found. Please run the train_model.py script to train models manually.'
                }), 404
        
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
