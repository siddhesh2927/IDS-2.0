import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import pickle
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class IntrusionDetectionModels:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = []
        self.target_column = 'Label'
        
    def load_dataset(self, filepath):
        """Load and preprocess the dataset"""
        try:
            # Load dataset
            df = pd.read_csv(filepath)
            
            # Clean column names (remove leading/trailing spaces)
            df.columns = df.columns.str.strip()
            
            # Basic preprocessing
            df = df.dropna()
            
            # Replace infinite values with NaN, then drop those rows too
            df = df.replace([np.inf, -np.inf], np.nan)
            df = df.dropna()
            
            # Convert timestamp if exists
            if 'Timestamp' in df.columns:
                df['Timestamp'] = pd.to_datetime(df['Timestamp'], errors='coerce')
                df = df.dropna(subset=['Timestamp'])
            
            # Identify categorical and numerical columns
            categorical_cols = df.select_dtypes(include=['object']).columns
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            
            # Handle categorical variables
            for col in categorical_cols:
                if col != self.target_column:
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
                    self.encoders[col] = le
            
            # Store feature columns (exclude target)
            self.feature_columns = [col for col in df.columns if col != self.target_column]
            
            return df
            
        except Exception as e:
            raise Exception(f"Error loading dataset: {str(e)}")
    
    def preprocess_data(self, df):
        """Preprocess the data for training"""
        try:
            # Separate features and target
            X = df[self.feature_columns]
            y = df[self.target_column]
            
            # Handle missing values
            X = X.fillna(X.mean())
            
            # Encode target variable if it's categorical
            if y.dtype == 'object':
                le = LabelEncoder()
                y = le.fit_transform(y)
                self.encoders['target'] = le
            
            return X, y
            
        except Exception as e:
            raise Exception(f"Error preprocessing data: {str(e)}")
    
    def train_models(self, X, y):
        """Train multiple ML models"""
        try:
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            self.scalers['standard'] = scaler
            
            results = {}
            
            # 1. Random Forest
            print("Training Random Forest...")
            rf = RandomForestClassifier(n_estimators=100, random_state=42)
            rf.fit(X_train_scaled, y_train)
            rf_pred = rf.predict(X_test_scaled)
            rf_accuracy = accuracy_score(y_test, rf_pred)
            results['RandomForest'] = {
                'model': rf,
                'accuracy': rf_accuracy,
                'report': classification_report(y_test, rf_pred, output_dict=True),
                'confusion_matrix': confusion_matrix(y_test, rf_pred).tolist()
            }
            
            # 2. SVM
            print("Training SVM...")
            svm = SVC(kernel='rbf', random_state=42, probability=True)
            svm.fit(X_train_scaled, y_train)
            svm_pred = svm.predict(X_test_scaled)
            svm_accuracy = accuracy_score(y_test, svm_pred)
            results['SVM'] = {
                'model': svm,
                'accuracy': svm_accuracy,
                'report': classification_report(y_test, svm_pred, output_dict=True),
                'confusion_matrix': confusion_matrix(y_test, svm_pred).tolist()
            }
            
            # 3. Neural Network
            print("Training Neural Network...")
            nn = MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=500, random_state=42)
            nn.fit(X_train_scaled, y_train)
            nn_pred = nn.predict(X_test_scaled)
            nn_accuracy = accuracy_score(y_test, nn_pred)
            results['NeuralNetwork'] = {
                'model': nn,
                'accuracy': nn_accuracy,
                'report': classification_report(y_test, nn_pred, output_dict=True),
                'confusion_matrix': confusion_matrix(y_test, nn_pred).tolist()
            }
            
            # Store models
            self.models = results
            
            return results
            
        except Exception as e:
            raise Exception(f"Error training models: {str(e)}")
    
    def save_models(self, model_dir="models"):
        """Save trained models"""
        try:
            if not os.path.exists(model_dir):
                os.makedirs(model_dir)
            
            # Save each model
            for model_name, model_data in self.models.items():
                model_path = os.path.join(model_dir, f"{model_name.lower()}_model.pkl")
                with open(model_path, 'wb') as f:
                    pickle.dump(model_data['model'], f)
            
            # Save scalers and encoders
            with open(os.path.join(model_dir, "scalers.pkl"), 'wb') as f:
                pickle.dump(self.scalers, f)
            with open(os.path.join(model_dir, "encoders.pkl"), 'wb') as f:
                pickle.dump(self.encoders, f)
            
            # Save feature columns
            with open(os.path.join(model_dir, "features.pkl"), 'wb') as f:
                pickle.dump(self.feature_columns, f)
                
            return True
            
        except Exception as e:
            raise Exception(f"Error saving models: {str(e)}")
    
    def load_models(self, model_dir="models"):
        """Load trained models"""
        try:
            # Load scalers and encoders
            with open(os.path.join(model_dir, "scalers.pkl"), 'rb') as f:
                self.scalers = pickle.load(f)
            with open(os.path.join(model_dir, "encoders.pkl"), 'rb') as f:
                self.encoders = pickle.load(f)
            with open(os.path.join(model_dir, "features.pkl"), 'rb') as f:
                self.feature_columns = pickle.load(f)
            
            # Load models
            model_files = {
                'RandomForest': 'randomforest_model.pkl',
                'SVM': 'svm_model.pkl',
                'NeuralNetwork': 'neuralnetwork_model.pkl'
            }
            
            for model_name, filename in model_files.items():
                model_path = os.path.join(model_dir, filename)
                if os.path.exists(model_path):
                    with open(model_path, 'rb') as f:
                        self.models[model_name] = pickle.load(f)
            
            return True
            
        except Exception as e:
            raise Exception(f"Error loading models: {str(e)}")
    
    def predict(self, data, model_name='RandomForest'):
        """Make predictions using trained model"""
        try:
            if model_name not in self.models:
                raise Exception(f"Model {model_name} not found")
            
            model = self.models[model_name]
            
            # Preprocess input data
            if isinstance(data, dict):
                data = pd.DataFrame([data])
            
            # Ensure correct feature order
            data = data[self.feature_columns]
            
            # Handle categorical encoding
            for col, encoder in self.encoders.items():
                if col in data.columns and col != 'target':
                    data[col] = encoder.transform(data[col].astype(str))
            
            # Scale features
            scaler = self.scalers['standard']
            data_scaled = scaler.transform(data)
            
            # Make prediction
            prediction = model.predict(data_scaled)[0]
            probability = model.predict_proba(data_scaled)[0]
            
            # Decode prediction if needed
            if 'target' in self.encoders:
                prediction = self.encoders['target'].inverse_transform([prediction])[0]
            
            return {
                'prediction': prediction,
                'probability': probability.max(),
                'all_probabilities': probability.tolist()
            }
            
        except Exception as e:
            raise Exception(f"Error making prediction: {str(e)}")
    
    def get_model_info(self):
        """Get information about trained models"""
        info = {}
        for model_name, model_data in self.models.items():
            if isinstance(model_data, dict) and 'accuracy' in model_data:
                info[model_name] = {
                    'accuracy': model_data['accuracy'],
                    'report': model_data['report']
                }
        return info
