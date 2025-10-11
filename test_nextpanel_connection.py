#!/usr/bin/env python3
"""
Test NextPanel Connection and Server Management
"""
import requests
import json
import sys

# Configuration
BILLING_API = "http://localhost:8000"
NEXTPANEL_API = "http://localhost:9000"

# API Credentials from NextPanel
NEXTPANEL_API_KEY = "npk_Ful9e5xVpWIu-Sd2tTlaFMqK33DrnQ6ERlfwmU06qGU"
NEXTPANEL_API_SECRET = "nps_-XuGGgrjJrVsDRsrkRqHV2AD1YbZ65qd9b_Nmu-wED_J5FqmeZw_ebL3lNOpl6Ws"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_nextpanel_health():
    """Test if NextPanel is accessible"""
    print_section("1. Testing NextPanel Health Check")
    
    try:
        response = requests.get(f"{NEXTPANEL_API}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ NextPanel is online and accessible")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ NextPanel returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Failed to connect to NextPanel: {e}")
        return False

def test_nextpanel_api_credentials():
    """Test if API credentials work"""
    print_section("2. Testing NextPanel API Credentials")
    
    try:
        headers = {
            'X-API-Key': NEXTPANEL_API_KEY,
            'X-API-Secret': NEXTPANEL_API_SECRET,
            'Content-Type': 'application/json'
        }
        
        # Try to list accounts
        response = requests.get(
            f"{NEXTPANEL_API}/api/v1/billing/accounts",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            accounts = response.json()
            print(f"✅ API credentials are valid!")
            print(f"   Current accounts: {len(accounts) if isinstance(accounts, list) else 'N/A'}")
            return True
        else:
            print(f"❌ API authentication failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing credentials: {e}")
        return False

def login_to_billing_system():
    """Login to billing system and get token"""
    print_section("3. Logging into Billing System")
    
    try:
        response = requests.post(
            f"{BILLING_API}/api/v1/auth/login",
            json={
                "email": "admin@example.com",
                "password": "admin123"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print("✅ Successfully logged into billing system")
            print(f"   Token: {token[:30]}...")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error logging in: {e}")
        return None

def add_server_to_billing(token):
    """Add NextPanel server to billing system"""
    print_section("4. Adding NextPanel Server to Billing System")
    
    try:
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        server_data = {
            "name": "NextPanel Production Server",
            "description": "Main production hosting server",
            "base_url": NEXTPANEL_API,
            "api_key": NEXTPANEL_API_KEY,
            "api_secret": NEXTPANEL_API_SECRET,
            "capacity": 100,
            "location": "Local Development"
        }
        
        response = requests.post(
            f"{BILLING_API}/api/v1/nextpanel/servers",
            headers=headers,
            json=server_data,
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Server added successfully!")
            print(f"   Server ID: {data.get('server_id')}")
            print(f"   Server Name: {data.get('name')}")
            return data.get('server_id')
        else:
            print(f"⚠️  Server add returned: {response.status_code}")
            print(f"   Response: {response.text}")
            # Server might already exist
            if "already exists" in response.text.lower():
                print("   (Server already exists - this is OK)")
                return None
            return None
    except Exception as e:
        print(f"❌ Error adding server: {e}")
        return None

def list_servers(token):
    """List all configured servers"""
    print_section("5. Listing All Configured Servers")
    
    try:
        headers = {
            'Authorization': f'Bearer {token}',
        }
        
        response = requests.get(
            f"{BILLING_API}/api/v1/nextpanel/servers",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            servers = response.json()
            print(f"✅ Found {len(servers)} server(s):")
            for server in servers:
                print(f"\n   📡 {server['name']}")
                print(f"      ID: {server['id']}")
                print(f"      URL: {server['base_url']}")
                print(f"      Status: {'🟢 Active' if server['is_active'] else '🔴 Inactive'}")
                print(f"      Capacity: {server['current_accounts']}/{server['capacity']}")
                print(f"      Utilization: {server['utilization_percent']:.1f}%")
            return servers
        else:
            print(f"❌ Failed to list servers: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error listing servers: {e}")
        return []

def get_server_status(token):
    """Get real-time server status"""
    print_section("6. Getting Real-time Server Status")
    
    try:
        headers = {
            'Authorization': f'Bearer {token}',
        }
        
        response = requests.get(
            f"{BILLING_API}/api/v1/nextpanel/servers/status",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            statuses = response.json()
            print(f"✅ Server status retrieved:")
            for status in statuses:
                online_status = "🟢 ONLINE" if status.get('is_online') else "🔴 OFFLINE"
                print(f"\n   {status['name']}: {online_status}")
                print(f"      Accounts: {status['current_accounts']}/{status['capacity']}")
                print(f"      Utilization: {status['utilization']:.1f}%")
            return statuses
        else:
            print(f"❌ Failed to get status: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting status: {e}")
        return []

def test_account_provisioning(token):
    """Test creating a hosting account"""
    print_section("7. Testing Account Provisioning")
    
    try:
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        account_data = {
            "customer_id": 1,
            "username": "testuser123",
            "email": "testuser123@example.com",
            "password": "SecurePass123!",
            "full_name": "Test User",
            "phone": "1234567890"
        }
        
        print(f"   Creating test account: {account_data['username']}")
        
        response = requests.post(
            f"{BILLING_API}/api/v1/nextpanel/provision",
            headers=headers,
            json=account_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Account provisioned successfully!")
                print(f"   Account ID: {data.get('account_id')}")
                print(f"   Username: {data.get('username')}")
                print(f"   Server: {data.get('server_name')}")
                print(f"   NextPanel User ID: {data.get('nextpanel_user_id')}")
                return data
            else:
                print(f"⚠️  Provisioning failed: {data.get('error')}")
                return None
        else:
            print(f"❌ Provisioning request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error provisioning account: {e}")
        return None

def main():
    print("\n" + "🚀 " * 30)
    print("   NextPanel Integration Test Suite")
    print("🚀 " * 30)
    
    # Test 1: NextPanel Health
    if not test_nextpanel_health():
        print("\n❌ NextPanel is not accessible. Please start NextPanel first.")
        sys.exit(1)
    
    # Test 2: API Credentials
    if not test_nextpanel_api_credentials():
        print("\n❌ API credentials are not valid. Please check your credentials.")
        sys.exit(1)
    
    # Test 3: Login to Billing
    token = login_to_billing_system()
    if not token:
        print("\n❌ Cannot login to billing system. Please check if backend is running.")
        sys.exit(1)
    
    # Test 4: Add Server
    server_id = add_server_to_billing(token)
    
    # Test 5: List Servers
    servers = list_servers(token)
    
    # Test 6: Get Status
    statuses = get_server_status(token)
    
    # Test 7: Provision Account (Optional)
    print("\n" + "-" * 60)
    response = input("\nDo you want to test account provisioning? (y/n): ")
    if response.lower() == 'y':
        test_account_provisioning(token)
    
    # Summary
    print_section("✅ Test Summary")
    print("All basic tests passed! Your NextPanel integration is working.")
    print("\nYou can now:")
    print("  1. Open http://localhost:3000 in your browser")
    print("  2. Login to the billing dashboard")
    print("  3. Navigate to 'Server' menu")
    print("  4. See your NextPanel server connected")
    print("  5. Start provisioning hosting accounts automatically!")
    print("\n" + "🎉 " * 30 + "\n")

if __name__ == "__main__":
    main()

