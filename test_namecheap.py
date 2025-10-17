#!/usr/bin/env python3
"""
Test script for Namecheap API connection
"""
import asyncio
import httpx
import xml.etree.ElementTree as ET
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_namecheap_api():
    """Test Namecheap API with sample credentials"""
    
    # Sample credentials - replace with your actual values
    api_user = "your_api_username"
    api_key = "your_api_key"
    username = "your_api_username"  # Usually same as api_user
    client_ip = "127.0.0.1"
    
    base_url = "https://api.sandbox.namecheap.com/xml.response"
    
    params = {
        'ApiUser': api_user,
        'ApiKey': api_key,
        'UserName': username,
        'Command': 'namecheap.users.getPricing',
        'ClientIp': client_ip,
        'ProductType': 'DOMAIN',
        'ActionName': 'REGISTER',
        'ProductName': 'com'
    }
    
    try:
        async with httpx.AsyncClient() as client:
            logger.info(f"Testing Namecheap API with URL: {base_url}")
            logger.info(f"Parameters: {params}")
            
            response = await client.get(base_url, params=params)
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response text: {response.text}")
            
            if response.status_code == 200:
                # Parse XML response
                try:
                    root = ET.fromstring(response.text)
                    status = root.get('Status')
                    logger.info(f"API Status: {status}")
                    
                    if status == 'ERROR':
                        errors = root.findall('Errors/Error')
                        for error in errors:
                            logger.error(f"API Error: {error.text}")
                    else:
                        logger.info("API call successful!")
                        
                except ET.ParseError as e:
                    logger.error(f"Failed to parse XML: {e}")
            else:
                logger.error(f"HTTP error: {response.status_code}")
                
    except Exception as e:
        logger.error(f"Request failed: {e}")

if __name__ == "__main__":
    print("Namecheap API Test Script")
    print("=" * 50)
    print("Please update the credentials in the script before running")
    print("You can find your Namecheap API credentials at:")
    print("https://www.namecheap.com/support/api/")
    print("=" * 50)
    
    # Uncomment the line below to run the test
    # asyncio.run(test_namecheap_api())
