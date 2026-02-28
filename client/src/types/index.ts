export interface DatasetInfo {
  shape: [number, number];
  columns: string[];
  dtypes: Record<string, string>;
  missing_values: Record<string, number>;
  target_distribution: Record<string, number>;
  sample_data: Record<string, any>[];
}

export interface ModelResults {
  [modelName: string]: {
    accuracy: number;
    report: Record<string, any>;
    confusion_matrix: number[][];
  };
}

export interface NetworkInterface {
  name: string;
  ip: string;
  netmask: string;
}

export interface NetworkStats {
  is_capturing: boolean;
  stats: {
    total_packets: number;
    total_bytes: number;
    [key: string]: any;
  };
  recent_alerts: Alert[];
  queue_size: number;
}

export interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  src_ip?: string;
  dst_ip?: string;
  port?: number;
  size?: number;
  port_count?: number;
  ml_result?: any;
}

export interface TrainingStatus {
  status: 'started' | 'completed' | 'error';
  message: string;
}

export interface ModelInfo {
  [modelName: string]: {
    accuracy: number;
    report: Record<string, any>;
  };
}

export interface FileInfo {
  name: string;
  size: number;
  modified: string;
}

export interface PredictionResult {
  prediction: string | number;
  probability: number;
  all_probabilities: number[];
}
