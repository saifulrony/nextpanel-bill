# NextPanel Plugin Server

A simple HTTP server for hosting and distributing NextPanel Billing plugins.

## Features

- 🌐 **Web Interface**: Browse available plugins
- 📡 **REST API**: JSON API for plugin metadata
- 📦 **Download System**: Direct plugin file downloads
- 🔄 **Version Management**: Support for multiple plugin versions
- 🚀 **Easy Deployment**: Simple Python HTTP server

## Quick Start

### 1. Start the Plugin Server

```bash
cd plugin-server
python3 server.py 8080
```

The server will start on port 8080 and serve plugins from the `plugins/` directory.

### 2. Access the Web Interface

- **Web Interface**: http://localhost:8080
- **API Endpoint**: http://localhost:8080/api/plugins
- **Download URL**: http://localhost:8080/download/{plugin_id}/{version}

### 3. Add Plugins

Simply place plugin ZIP files in the `plugins/` directory:

```
plugins/
├── ai_chatbot_v1.0.0.zip
├── analytics_v2.1.0.zip
└── backup_v1.5.0.zip
```

## API Endpoints

### GET /api/plugins

Returns JSON list of available plugins:

```json
[
  {
    "id": "ai_chatbot",
    "name": "Ai Chatbot",
    "version": "1.0.0",
    "filename": "ai_chatbot_v1.0.0.zip",
    "size": 11361,
    "download_url": "/download/ai_chatbot/1.0.0",
    "description": "AI-powered customer support chatbot"
  }
]
```

### GET /download/{plugin_id}/{version}

Downloads the plugin ZIP file directly.

## Plugin File Naming

Plugins must follow this naming convention:
```
{plugin_id}_v{version}.zip
```

Examples:
- `ai_chatbot_v1.0.0.zip`
- `analytics_v2.1.0.zip`
- `backup_v1.5.0.zip`

## Configuration

### Environment Variables

- `PLUGIN_SERVER_URL`: URL of the plugin server (default: http://localhost:8080)

### NextPanel Configuration

Update your NextPanel configuration to use the remote plugin server:

```python
# In plugin_config.py
SOURCE = PluginSource.REMOTE
REMOTE_PLUGINS_URL = "http://localhost:8080"
```

## Production Deployment

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY . .

EXPOSE 8080
CMD ["python3", "server.py", "8080"]
```

### Using Nginx

```nginx
server {
    listen 80;
    server_name plugins.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Using Cloud Storage

You can also host plugins on cloud storage services:

- **AWS S3**: Use S3 URLs for plugin downloads
- **Google Cloud Storage**: Direct download URLs
- **CDN**: For faster global distribution

## Plugin Development

### Creating a Plugin

1. Create a plugin directory structure:
```
my_plugin/
├── metadata.json
├── backend/
│   ├── __init__.py
│   ├── routes.py
│   └── models.py
├── frontend/
│   └── pages/
│       └── my-plugin/
│           └── page.tsx
└── migrations/
    ├── up.sql
    └── down.sql
```

2. Create `metadata.json`:
```json
{
  "id": "my_plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Plugin description",
  "category": "productivity",
  "price": 0,
  "icon": "🔧",
  "backend": {
    "routes": ["/api/v1/my-plugin/*"]
  },
  "frontend": {
    "routes": ["/my-plugin"]
  }
}
```

3. Package as ZIP:
```bash
cd my_plugin
zip -r ../my_plugin_v1.0.0.zip .
```

4. Upload to plugin server:
```bash
cp my_plugin_v1.0.0.zip plugin-server/plugins/
```

## Security Considerations

- 🔒 **HTTPS**: Use HTTPS in production
- 🔐 **Authentication**: Add API key authentication for downloads
- 🛡️ **Validation**: Validate plugin files before serving
- 📝 **Logging**: Monitor download activity
- 🔍 **Scanning**: Scan plugins for malware

## Monitoring

The server logs all requests. Monitor for:
- Download patterns
- Error rates
- Plugin popularity
- Server performance

## Troubleshooting

### Common Issues

1. **Plugin not found**: Check filename format and directory
2. **Download fails**: Verify file permissions and server access
3. **API errors**: Check JSON format and plugin metadata

### Logs

The server logs all requests. Check for:
- 404 errors (missing plugins)
- 500 errors (server issues)
- Download patterns

## License

This plugin server is part of NextPanel Billing and follows the same license terms.
