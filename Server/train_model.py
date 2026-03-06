import os
import sys
from ml_models import IntrusionDetectionModels

def train_manual():
    print("🚀 Starting manual model training process...")

    # Initialize the model system
    ml_system = IntrusionDetectionModels()

    # The dataset to train on
    dataset_filename = 'cicids2017.csv'
    filepath = os.path.join('uploads', dataset_filename)

    if not os.path.exists(filepath):
        print(f"❌ Error: Dataset file '{dataset_filename}' not found in the 'uploads' directory.")
        print("Please ensure the dataset file is placed at:", os.path.abspath(filepath))
        sys.exit(1)

    print(f"📊 Loading dataset from {filepath}...")
    try:
        df = ml_system.load_dataset(filepath)
        print(f"✅ Dataset loaded successfully. Shape: {df.shape}")
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        sys.exit(1)

    print("⚙️  Preprocessing data...")
    try:
        X, y = ml_system.preprocess_data(df)
        print("✅ Data preprocessing complete.")
    except Exception as e:
        print(f"❌ Error preprocessing data: {e}")
        sys.exit(1)

    print("🤖 Training models (this may take a while depending on the dataset)...")
    try:
        results = ml_system.train_models(X, y)
        print("\n✅ Training complete! Results:")
        for model_name, model_data in results.items():
            print(f"   - {model_name}: Accuracy = {model_data['accuracy']:.4f}")
    except Exception as e:
        print(f"❌ Error training models: {e}")
        sys.exit(1)

    print("\n💾 Saving trained models...")
    try:
        ml_system.save_models('models')
        print("✅ Models saved successfully in the 'models' directory.")
    except Exception as e:
        print(f"❌ Error saving models: {e}")
        sys.exit(1)

    print("\n🎉 Manual model training finished successfully!")

if __name__ == '__main__':
    train_manual()
