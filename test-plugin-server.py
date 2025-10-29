#!/usr/bin/env python3

import requests
import json

def test_plugin_server():
    print("=== TESTING PLUGIN SERVER ===")
    
    # Test plugin server API
    try:
        response = requests.get("http://localhost:8080/api/plugins", timeout=5)
        print(f"Plugin server status: {response.status_code}")
        if response.status_code == 200:
            plugins = response.json()
            print(f"Available plugins: {json.dumps(plugins, indent=2)}")
        else:
            print(f"Plugin server error: {response.text}")
    except Exception as e:
        print(f"Plugin server connection failed: {e}")
    
    # Test plugin download
    try:
        response = requests.get("http://localhost:8080/download/ai_chatbot/1.0.0", timeout=10)
        print(f"Plugin download status: {response.status_code}")
        if response.status_code == 200:
            print(f"Plugin file size: {len(response.content)} bytes")
        else:
            print(f"Plugin download error: {response.text}")
    except Exception as e:
        print(f"Plugin download failed: {e}")

if __name__ == "__main__":
    test_plugin_server()
