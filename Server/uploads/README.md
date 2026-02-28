# 📁 Uploads Directory

This directory contains datasets for training the intrusion detection models.

## 🎯 Recommended Dataset

### **CICIDS2017** - Best Choice for Training
- **Download**: https://www.kaggle.com/datasets/cic/cicids2017
- **File**: Any day's CSV (Monday recommended)
- **Rename to**: `cicids2017.csv`

## 📋 File Requirements

- **Format**: CSV files only
- **Size**: Max 50MB
- **Required Columns**: 
  - Network features (ports, protocols, packet sizes, etc.)
  - Target/Label column for classification

## 🚀 Quick Setup

1. **Download Dataset**:
   ```
   Go to: https://www.kaggle.com/datasets/cic/cicids2017
   Download: Monday-WorkingHours.pcap_ISCX.csv
   ```

2. **Place File Here**:
   ```
   Rename to: cicids2017.csv
   Move to this uploads folder
   ```

3. **Train Models**:
   - Open web interface: http://localhost:3000
   - Go to Model Training page
   - Select cicids2017.csv
   - Click "Load Dataset" → "Train Models"

## 📊 Dataset Features

The system expects network traffic data with:
- Source/Destination IPs
- Port numbers
- Protocol information
- Packet sizes
- Timing information
- Attack/Normal labels

## 🔧 Supported File Types

- `.csv` - Comma-separated values
- `.xlsx` - Excel files (converted to CSV)
- `.xls` - Legacy Excel files

## ⚠️ Important Notes

- Files are automatically processed for ML training
- Large files may take time to load
- Ensure your dataset has both features and labels
- The system handles categorical encoding automatically
