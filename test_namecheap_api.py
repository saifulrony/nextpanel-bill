#!/usr/bin/env python3
"""
Test Namecheap API Connection
This script tests if your Namecheap API credentials work.
"""

import os
import requests
import xml.etree.ElementTree as ET
from urllib.parse import urlencode

# Load from environment or set manually here for testing
NAMECHEAP_API_USER = os.getenv('NAMECHEAP_API_USER', 'YOUR_USERNAME')
NAMECHEAP_API_KEY = os.getenv('NAMECHEAP_API_KEY', 'YOUR_API_KEY')
NAMECHEAP_USERNAME = os.getenv('NAMECHEAP_USERNAME', 'YOUR_USERNAME')
NAMECHEAP_CLIENT_IP = os.getenv('NAMECHEAP_CLIENT_IP', 'YOUR_IP')
NAMECHEAP_SANDBOX = os.getenv('NAMECHEAP_SANDBOX', 'true').lower() == 'true'

# API URLs
SANDBOX_URL = "https://api.sandbox.namecheap.com/xml.response"
PRODUCTION_URL = "https://api.namecheap.com/xml.response"

API_URL = SANDBOX_URL if NAMECHEAP_SANDBOX else PRODUCTION_URL

def test_connection():
    """Test basic API connection"""
    print("=" * 60)
    print("🔍 Testing Namecheap API Connection")
    print("=" * 60)
    print(f"Environment: {'SANDBOX (Free Testing)' if NAMECHEAP_SANDBOX else 'PRODUCTION'}")
    print(f"API URL: {API_URL}")
    print(f"Username: {NAMECHEAP_API_USER}")
    print(f"Client IP: {NAMECHEAP_CLIENT_IP}")
    print()
    
    # Check if credentials are set
    if NAMECHEAP_API_USER == 'YOUR_USERNAME':
        print("❌ ERROR: Please set your Namecheap credentials first!")
        print()
        print("Edit this file or set environment variables:")
        print("  export NAMECHEAP_API_USER='your_username'")
        print("  export NAMECHEAP_API_KEY='your_api_key'")
        print("  export NAMECHEAP_USERNAME='your_username'")
        print("  export NAMECHEAP_CLIENT_IP='your_ip'")
        print()
        return False
    
    # Test 1: Check domain availability
    print("Test 1: Checking domain availability...")
    try:
        params = {
            'ApiUser': NAMECHEAP_API_USER,
            'ApiKey': NAMECHEAP_API_KEY,
            'UserName': NAMECHEAP_USERNAME,
            'ClientIp': NAMECHEAP_CLIENT_IP,
            'Command': 'namecheap.domains.check',
            'DomainList': 'google.com,test-domain-12345.com'
        }
        
        response = requests.get(API_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            # Parse XML response
            root = ET.fromstring(response.text)
            
            # Check for errors
            errors = root.findall('.//{http://api.namecheap.com/xml.response}Errors')
            if errors and len(errors) > 0:
                error_text = errors[0].find('.//{http://api.namecheap.com/xml.response}Error').text
                print(f"❌ API Error: {error_text}")
                return False
            
            # Parse domain check results
            domains = root.findall('.//{http://api.namecheap.com/xml.response}DomainCheckResult')
            
            if domains:
                print("✅ API Connection Successful!")
                print()
                print("Domain Check Results:")
                for domain in domains:
                    domain_name = domain.get('Domain')
                    available = domain.get('Available')
                    print(f"  • {domain_name}: {'✅ Available' if available == 'true' else '❌ Not Available'}")
                
                print()
                return True
            else:
                print("❌ Unexpected response format")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Connection timeout. Check your internet connection.")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_specific_domain(domain):
    """Check if a specific domain is available"""
    print(f"\n🔍 Checking availability for: {domain}")
    
    try:
        params = {
            'ApiUser': NAMECHEAP_API_USER,
            'ApiKey': NAMECHEAP_API_KEY,
            'UserName': NAMECHEAP_USERNAME,
            'ClientIp': NAMECHEAP_CLIENT_IP,
            'Command': 'namecheap.domains.check',
            'DomainList': domain
        }
        
        response = requests.get(API_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            root = ET.fromstring(response.text)
            domain_result = root.find('.//{http://api.namecheap.com/xml.response}DomainCheckResult')
            
            if domain_result is not None:
                available = domain_result.get('Available') == 'true'
                premium = domain_result.get('IsPremiumName') == 'true'
                
                if available:
                    print(f"✅ {domain} is AVAILABLE!")
                    if premium:
                        print(f"⭐ This is a premium domain")
                else:
                    print(f"❌ {domain} is already registered")
                
                return available
        
        return None
        
    except Exception as e:
        print(f"❌ Error checking domain: {e}")
        return None

def get_pricing():
    """Get domain pricing"""
    print("\n💰 Getting domain pricing...")
    
    try:
        params = {
            'ApiUser': NAMECHEAP_API_USER,
            'ApiKey': NAMECHEAP_API_KEY,
            'UserName': NAMECHEAP_USERNAME,
            'ClientIp': NAMECHEAP_CLIENT_IP,
            'Command': 'namecheap.users.getPricing',
            'ProductType': 'DOMAIN',
            'ActionName': 'REGISTER'
        }
        
        response = requests.get(API_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            root = ET.fromstring(response.text)
            
            # Check for errors
            errors = root.findall('.//{http://api.namecheap.com/xml.response}Errors')
            if errors and len(errors) > 0:
                print("⚠️  Pricing info not available in sandbox mode")
                print("   (This is normal - pricing works in production)")
                return
            
            print("✅ Pricing retrieved successfully")
            # In production, you would parse and display pricing here
            
    except Exception as e:
        print(f"⚠️  Could not get pricing: {e}")
        print("   (This is normal in sandbox mode)")

if __name__ == "__main__":
    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║       Namecheap API Test Script                          ║")
    print("║       Testing your credentials and connectivity          ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()
    
    # Run connection test
    success = test_connection()
    
    if success:
        print()
        print("=" * 60)
        print("🎉 SUCCESS! Your Namecheap API is working!")
        print("=" * 60)
        print()
        
        # Test checking a specific domain
        print("Let's try checking a domain...")
        test_domain = input("Enter a domain to check (or press Enter for 'mydomain123.com'): ").strip()
        if not test_domain:
            test_domain = "mydomain123.com"
        
        check_specific_domain(test_domain)
        
        # Try getting pricing
        get_pricing()
        
        print()
        print("=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("  1. ✅ Your API credentials work!")
        print("  2. 🚀 Ready to integrate into billing system")
        print("  3. 💻 Run: python3 integrate_namecheap.py")
        print()
    else:
        print()
        print("=" * 60)
        print("❌ API Connection Failed")
        print("=" * 60)
        print()
        print("Troubleshooting:")
        print("  1. Check your credentials are correct")
        print("  2. Verify your IP is whitelisted in Namecheap")
        print("  3. Make sure API access is enabled")
        print("  4. Wait a few minutes and try again")
        print()
        print("See NAMECHEAP_SETUP_GUIDE.md for detailed instructions")
        print()

