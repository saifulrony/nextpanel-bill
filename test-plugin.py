#!/usr/bin/env python3

import zipfile
import json
import os

def test_plugin_zip():
    zip_path = "/home/saiful/nextpanel-bill/plugin-server/plugins/ai_chatbot_v1.0.0.zip"
    
    print("=== TESTING PLUGIN ZIP FILE ===")
    print(f"ZIP file exists: {os.path.exists(zip_path)}")
    
    if not os.path.exists(zip_path):
        print("❌ ZIP file does not exist!")
        return
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            print(f"✅ ZIP file is valid")
            print(f"Files in ZIP:")
            for file_info in zip_ref.filelist:
                print(f"  - {file_info.filename}")
            
            # Test metadata.json
            try:
                metadata_content = zip_ref.read('metadata.json').decode('utf-8')
                metadata = json.loads(metadata_content)
                print(f"✅ Metadata is valid JSON")
                print(f"Metadata: {json.dumps(metadata, indent=2)}")
            except Exception as e:
                print(f"❌ Metadata error: {e}")
            
            # Test frontend files
            frontend_files = [f for f in zip_ref.namelist() if f.startswith('frontend/')]
            print(f"Frontend files: {frontend_files}")
            
    except Exception as e:
        print(f"❌ ZIP file error: {e}")

if __name__ == "__main__":
    test_plugin_zip()
