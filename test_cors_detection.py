#!/usr/bin/env python3
"""
Test script to check what CORS origins will be detected
"""
import socket

def get_allowed_origins():
    """Get allowed CORS origins"""
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ]
    
    try:
        hostname = socket.gethostname()
        print(f"Hostname: {hostname}")
        
        local_ips = socket.gethostbyname_ex(hostname)[2]
        print(f"Detected IPs: {local_ips}")
        
        for ip in local_ips:
            if not ip.startswith('127.'):
                for port in [3000, 3001, 3002]:
                    allowed_origins.append(f"http://{ip}:{port}")
                    
    except Exception as e:
        print(f"Error: {e}")
    
    return allowed_origins

if __name__ == "__main__":
    origins = get_allowed_origins()
    print("\nAllowed CORS Origins:")
    for origin in origins:
        print(f"  - {origin}")

