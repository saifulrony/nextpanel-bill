#!/usr/bin/env python3
"""
Simple Plugin Server for NextPanel Billing
Serves plugin files for download and installation
"""

import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes

class PluginServerHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.plugins_dir = os.path.join(os.path.dirname(__file__), 'plugins')
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/':
            self.send_plugin_list()
        elif path.startswith('/download/'):
            self.send_plugin_file(path)
        elif path == '/api/plugins':
            self.send_plugin_api()
        else:
            self.send_error(404, "Not Found")
    
    def send_plugin_list(self):
        """Send HTML page with plugin list"""
        plugins = self.get_available_plugins()
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>NextPanel Plugin Server</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .plugin {{ border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 5px; }}
                .plugin h3 {{ margin-top: 0; color: #333; }}
                .download {{ background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block; }}
                .download:hover {{ background: #005a87; }}
            </style>
        </head>
        <body>
            <h1>NextPanel Plugin Server</h1>
            <p>Available plugins for download:</p>
            
            {self.generate_plugin_html(plugins)}
            
            <hr>
            <p><strong>API Endpoints:</strong></p>
            <ul>
                <li><a href="/api/plugins">/api/plugins</a> - JSON API with plugin metadata</li>
                <li><a href="/download/PLUGIN_ID/VERSION">/download/PLUGIN_ID/VERSION</a> - Download plugin file</li>
            </ul>
        </body>
        </html>
        """
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def send_plugin_api(self):
        """Send JSON API with plugin metadata"""
        plugins = self.get_available_plugins()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(plugins, indent=2).encode())
    
    def send_plugin_file(self, path):
        """Send plugin file for download"""
        # Extract plugin ID and version from path like /download/ai_chatbot/1.0.0
        parts = path.split('/')
        if len(parts) < 4:
            self.send_error(400, "Invalid download path")
            return
        
        plugin_id = parts[2]
        version = parts[3]
        
        # Construct filename
        filename = f"{plugin_id}_v{version}.zip"
        filepath = os.path.join(self.plugins_dir, filename)
        
        if not os.path.exists(filepath):
            self.send_error(404, f"Plugin file not found: {filename}")
            return
        
        # Send file
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/zip')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            self.send_error(500, f"Error reading file: {str(e)}")
    
    def get_available_plugins(self):
        """Get list of available plugins"""
        plugins = []
        
        if not os.path.exists(self.plugins_dir):
            return plugins
        
        for filename in os.listdir(self.plugins_dir):
            if filename.endswith('.zip'):
                # Parse filename like "ai_chatbot_v1.0.0.zip"
                name_part = filename[:-4]  # Remove .zip
                if '_v' in name_part:
                    plugin_id = name_part.split('_v')[0]
                    version = name_part.split('_v')[1]
                    
                    filepath = os.path.join(self.plugins_dir, filename)
                    file_size = os.path.getsize(filepath)
                    
                    plugins.append({
                        'id': plugin_id,
                        'name': plugin_id.replace('_', ' ').title(),
                        'version': version,
                        'filename': filename,
                        'size': file_size,
                        'download_url': f'/download/{plugin_id}/{version}',
                        'description': self.get_plugin_description(plugin_id)
                    })
        
        return plugins
    
    def get_plugin_description(self, plugin_id):
        """Get plugin description based on ID"""
        descriptions = {
            'ai_chatbot': 'AI-powered customer support chatbot with natural language processing',
            'analytics': 'Advanced analytics and reporting dashboard',
            'backup': 'Automated backup and restore system',
            'monitoring': 'System monitoring and alerting tools'
        }
        return descriptions.get(plugin_id, f'{plugin_id.replace("_", " ").title()} plugin')
    
    def generate_plugin_html(self, plugins):
        """Generate HTML for plugin list"""
        if not plugins:
            return "<p>No plugins available.</p>"
        
        html = ""
        for plugin in plugins:
            size_mb = plugin['size'] / (1024 * 1024)
            html += f"""
            <div class="plugin">
                <h3>{plugin['name']} v{plugin['version']}</h3>
                <p>{plugin['description']}</p>
                <p><strong>Size:</strong> {size_mb:.2f} MB</p>
                <a href="{plugin['download_url']}" class="download">Download Plugin</a>
            </div>
            """
        
        return html
    
    def log_message(self, format, *args):
        """Override to reduce log noise"""
        pass

def run_server(port=8080):
    """Run the plugin server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, PluginServerHandler)
    
    print(f"🚀 NextPanel Plugin Server running on port {port}")
    print(f"📁 Serving plugins from: {os.path.join(os.path.dirname(__file__), 'plugins')}")
    print(f"🌐 Web interface: http://localhost:{port}")
    print(f"📡 API endpoint: http://localhost:{port}/api/plugins")
    print("Press Ctrl+C to stop")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run_server(port)
