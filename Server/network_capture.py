import scapy.all as scapy
import psutil
import threading
import time
import json
from datetime import datetime
import pandas as pd
import numpy as np
from collections import defaultdict, deque
import socket
import struct

class NetworkCapture:
    def __init__(self):
        self.is_capturing = False
        self.capture_thread = None
        self.packet_queue = deque(maxlen=1000)
        self.stats = defaultdict(int)
        self.alerts = []
        self.interface = None
        self.ml_models = None
        self.thresholds = {
            'packets_per_second': 1000,
            'bytes_per_second': 1000000,
            'suspicious_ports': [22, 23, 80, 443, 3389, 1433, 3306],
            'connection_threshold': 100
        }
        
    def get_network_interfaces(self):
        """Get available network interfaces"""
        interfaces = []
        for interface, sniffer in psutil.net_if_addrs().items():
            if sniffer:
                for addr in sniffer:
                    if addr.family == socket.AF_INET:
                        interfaces.append({
                            'name': interface,
                            'ip': addr.address,
                            'netmask': addr.netmask
                        })
                        break
        return interfaces
    
    def extract_packet_features(self, packet):
        """Extract features from network packet"""
        features = {}
        
        try:
            # Basic packet info
            features['timestamp'] = datetime.now().timestamp()
            features['packet_size'] = len(packet)
            
            # IP layer features
            if packet.haslayer(scapy.IP):
                ip_layer = packet[scapy.IP]
                features['src_ip'] = ip_layer.src
                features['dst_ip'] = ip_layer.dst
                features['protocol'] = ip_layer.proto
                features['ttl'] = ip_layer.ttl
                features['ip_len'] = ip_layer.len
                features['ip_id'] = ip_layer.id
                features['ip_flags'] = ip_layer.flags
                
                # Transport layer features
                if packet.haslayer(scapy.TCP):
                    tcp_layer = packet[scapy.TCP]
                    features['src_port'] = tcp_layer.sport
                    features['dst_port'] = tcp_layer.dport
                    features['tcp_flags'] = str(tcp_layer.flags)
                    features['tcp_seq'] = tcp_layer.seq
                    features['tcp_ack'] = tcp_layer.ack
                    features['tcp_window'] = tcp_layer.window
                    
                elif packet.haslayer(scapy.UDP):
                    udp_layer = packet[scapy.UDP]
                    features['src_port'] = udp_layer.sport
                    features['dst_port'] = udp_layer.dport
                    features['udp_len'] = udp_layer.len
                    
                # Calculate additional features
                features['src_dst_ratio'] = 1.0 if features['src_ip'] == features['dst_ip'] else 0.0
                features['is_private_src'] = self._is_private_ip(features.get('src_ip', ''))
                features['is_private_dst'] = self._is_private_ip(features.get('dst_ip', ''))
                features['port_category'] = self._categorize_port(features.get('dst_port', 0))
                
        except Exception as e:
            print(f"Error extracting features: {e}")
            return None
            
        return features
    
    def _is_private_ip(self, ip):
        """Check if IP is private"""
        try:
            parts = ip.split('.')
            if len(parts) != 4:
                return False
            return (parts[0] == '10' or 
                   (parts[0] == '172' and 16 <= int(parts[1]) <= 31) or
                   (parts[0] == '192' and parts[1] == '168'))
        except:
            return False
    
    def _categorize_port(self, port):
        """Categorize port number"""
        if port == 0:
            return 'null'
        elif port < 1024:
            return 'well_known'
        elif port < 49152:
            return 'registered'
        else:
            return 'dynamic'
    
    def detect_anomalies(self, packet_features):
        """Detect anomalies in packet"""
        alerts = []
        
        if not packet_features:
            return alerts
        
        # High packet rate detection
        current_time = time.time()
        recent_packets = [p for p in self.packet_queue 
                         if current_time - p.get('timestamp', 0) < 1.0]
        
        if len(recent_packets) > self.thresholds['packets_per_second']:
            alerts.append({
                'type': 'high_packet_rate',
                'severity': 'medium',
                'message': f"High packet rate detected: {len(recent_packets)} packets/sec",
                'timestamp': datetime.now().isoformat(),
                'src_ip': packet_features.get('src_ip'),
                'dst_ip': packet_features.get('dst_ip')
            })
        
        # Suspicious port detection
        dst_port = packet_features.get('dst_port', 0)
        if dst_port in self.thresholds['suspicious_ports']:
            alerts.append({
                'type': 'suspicious_port',
                'severity': 'low',
                'message': f"Connection to suspicious port {dst_port}",
                'timestamp': datetime.now().isoformat(),
                'src_ip': packet_features.get('src_ip'),
                'dst_ip': packet_features.get('dst_ip'),
                'port': dst_port
            })
        
        # Port scan detection
        src_ip = packet_features.get('src_ip')
        if src_ip:
            recent_src_packets = [p for p in self.packet_queue 
                                if p.get('src_ip') == src_ip and 
                                current_time - p.get('timestamp', 0) < 10.0]
            unique_dst_ports = len(set(p.get('dst_port', 0) for p in recent_src_packets))
            
            if unique_dst_ports > 50:
                alerts.append({
                    'type': 'port_scan',
                    'severity': 'high',
                    'message': f"Port scan detected from {src_ip}: {unique_dst_ports} ports",
                    'timestamp': datetime.now().isoformat(),
                    'src_ip': src_ip,
                    'port_count': unique_dst_ports
                })
        
        # Large packet detection
        packet_size = packet_features.get('packet_size', 0)
        if packet_size > 8000:  # Unusually large packets
            alerts.append({
                'type': 'large_packet',
                'severity': 'medium',
                'message': f"Large packet detected: {packet_size} bytes",
                'timestamp': datetime.now().isoformat(),
                'src_ip': packet_features.get('src_ip'),
                'dst_ip': packet_features.get('dst_ip'),
                'size': packet_size
            })
        
        return alerts
    
    def ml_predict(self, packet_features):
        """Use ML models to predict if packet is malicious"""
        if not self.ml_models or not packet_features:
            return None
        
        try:
            # Convert features to ML format
            ml_features = self._prepare_ml_features(packet_features)
            
            # Get predictions from all models
            predictions = {}
            for model_name in ['RandomForest', 'SVM', 'NeuralNetwork']:
                try:
                    pred = self.ml_models.predict(ml_features, model_name)
                    predictions[model_name] = pred
                except:
                    continue
            
            # Ensemble prediction (majority vote)
            if predictions:
                malicious_votes = sum(1 for pred in predictions.values() 
                                    if pred.get('prediction') in ['attack', 'malicious', 'anomaly'])
                
                if malicious_votes >= 2:  # Majority vote
                    return {
                        'is_malicious': True,
                        'confidence': max(pred.get('probability', 0) for pred in predictions.values()),
                        'predictions': predictions
                    }
            
            return {
                'is_malicious': False,
                'confidence': 0.0,
                'predictions': predictions
            }
            
        except Exception as e:
            print(f"ML prediction error: {e}")
            return None
    
    def _prepare_ml_features(self, packet_features):
        """Prepare packet features for ML prediction"""
        # This would need to match the training data format
        # For now, return a simplified feature set
        ml_features = {
            'packet_size': packet_features.get('packet_size', 0),
            'protocol': packet_features.get('protocol', 0),
            'ttl': packet_features.get('ttl', 0),
            'src_port': packet_features.get('src_port', 0),
            'dst_port': packet_features.get('dst_port', 0),
            'tcp_window': packet_features.get('tcp_window', 0),
            'src_dst_ratio': packet_features.get('src_dst_ratio', 0),
            'is_private_src': int(packet_features.get('is_private_src', False)),
            'is_private_dst': int(packet_features.get('is_private_dst', False)),
        }
        
        return ml_features
    
    def packet_handler(self, packet):
        """Handle captured packets"""
        if not self.is_capturing:
            return
        
        # Extract features
        features = self.extract_packet_features(packet)
        if features:
            # Add to queue
            self.packet_queue.append(features)
            
            # Update stats
            self.stats['total_packets'] += 1
            self.stats['total_bytes'] += features.get('packet_size', 0)
            
            # Detect anomalies
            alerts = self.detect_anomalies(features)
            self.alerts.extend(alerts)
            
            # ML prediction
            ml_result = self.ml_predict(features)
            if ml_result and ml_result.get('is_malicious'):
                self.alerts.append({
                    'type': 'ml_detection',
                    'severity': 'high',
                    'message': f"ML model detected malicious traffic with {ml_result.get('confidence', 0):.2f} confidence",
                    'timestamp': datetime.now().isoformat(),
                    'src_ip': features.get('src_ip'),
                    'dst_ip': features.get('dst_ip'),
                    'ml_result': ml_result
                })
    
    def start_capture(self, interface=None):
        """Start packet capture"""
        if self.is_capturing:
            return False
        
        self.interface = interface
        self.is_capturing = True
        
        def capture_worker():
            try:
                print(f"🟢 Starting real packet capture on interface: {interface or 'default'}")
                scapy.sniff(
                    iface=interface if interface else None,
                    prn=self.packet_handler,
                    store=False,
                    stop_filter=lambda p: not self.is_capturing  # Stops loop when is_capturing = False
                )
            except Exception as e:
                print(f"Capture error: {e}")
            finally:
                self.is_capturing = False  # Always ensure flag is reset after thread exits
                print("🔴 Packet capture stopped.")
        
        self.capture_thread = threading.Thread(target=capture_worker, daemon=True)
        self.capture_thread.start()
        
        return True
    
    def stop_capture(self):
        """Stop packet capture"""
        self.is_capturing = False  # This triggers stop_filter in capture_worker
        if self.capture_thread and self.capture_thread.is_alive():
            self.capture_thread.join(timeout=5)
        return True
    
    def get_stats(self):
        """Get capture statistics"""
        return {
            'is_capturing': self.is_capturing,
            'stats': dict(self.stats),
            'recent_alerts': self.alerts[-10:],  # Last 10 alerts
            'queue_size': len(self.packet_queue)
        }
    
    def clear_alerts(self):
        """Clear alerts"""
        self.alerts.clear()
        return True
