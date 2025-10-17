# Namecheap API Setup Guide

## Getting Your Namecheap API Credentials

### 1. Enable API Access
1. Log in to your Namecheap account
2. Go to **Profile** → **Tools** → **API Access**
3. Click **"Enable API Access"**
4. Accept the terms and conditions

### 2. Get Your API Credentials
1. Go to **Profile** → **Tools** → **API Access**
2. You'll see:
   - **API User**: Your API username (different from your account username)
   - **API Key**: Your API key
   - **Username**: Usually the same as API User

### 3. Whitelist Your IP Address
1. In the API Access section, add your server's IP address
2. **Important**: Namecheap only allows API calls from whitelisted IPs
3. For testing, you can use `127.0.0.1` or your current public IP

### 4. Configure in the System
When adding a Namecheap provider:

- **API Username**: Enter your Namecheap API User
- **API Key**: Enter your Namecheap API Key  
- **API Secret**: Can be left empty or same as API Key
- **API URL**: `https://api.sandbox.namecheap.com/xml.response` (for testing)
- **Sandbox Mode**: Enable for testing, disable for production

### 5. Common Issues

#### "Invalid API User" Error
- Check that you're using the correct API User (not your account username)
- Ensure API access is enabled in your Namecheap account

#### "Invalid API Key" Error  
- Verify your API Key is correct
- Make sure there are no extra spaces or characters

#### "Invalid Client IP" Error
- Add your server's IP address to the whitelist in Namecheap
- For local testing, use `127.0.0.1`

#### "Unknown error" Response
- Usually indicates invalid credentials
- Double-check all API credentials
- Ensure your IP is whitelisted

### 6. Testing
1. Use sandbox mode first: `https://api.sandbox.namecheap.com/xml.response`
2. Test with a simple domain check
3. Once working, switch to production: `https://api.namecheap.com/xml.response`

### 7. Production Setup
- Disable sandbox mode
- Use production API URL
- Ensure your production server IP is whitelisted
- Test thoroughly before going live

## Need Help?
- Namecheap API Documentation: https://www.namecheap.com/support/api/
- Namecheap Support: https://www.namecheap.com/support/