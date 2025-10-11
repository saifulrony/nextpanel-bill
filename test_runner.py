#!/usr/bin/env python3
"""
Quick test runner for the billing system
Tests basic functionality of all API endpoints
"""
import sys
import requests
from datetime import datetime
import json

BASE_URL = "http://localhost:8001"


def print_section(title):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_health_check():
    """Test health check endpoint"""
    print_section("Testing Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_auth_flow():
    """Test authentication flow"""
    print_section("Testing Authentication")
    
    try:
        # Register user
        print("1. Registering user...")
        register_data = {
            "email": f"testuser_{datetime.now().timestamp()}@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
            "company_name": "Test Company"
        }
        response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=register_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 201:
            print(f"   Response: {response.json()}")
            return False
        
        user_data = response.json()
        print(f"   User ID: {user_data['id']}")
        
        # Login
        print("\n2. Logging in...")
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   Response: {response.json()}")
            return False
        
        token_data = response.json()
        token = token_data["access_token"]
        print(f"   Token obtained: {token[:20]}...")
        
        # Get current user
        print("\n3. Getting current user info...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   User: {response.json()['email']}")
        
        return response.status_code == 200
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_plans():
    """Test plans endpoints"""
    print_section("Testing Plans")
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/plans/")
        print(f"Status: {response.status_code}")
        plans = response.json()
        print(f"Plans found: {len(plans)}")
        return response.status_code == 200
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_domain_check():
    """Test domain availability check"""
    print_section("Testing Domain Check")
    
    try:
        response = requests.post(f"{BASE_URL}/api/v1/domains/check", json={
            "domain_name": "example-test-domain.com"
        })
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  NextPanel Billing System - Quick Test Suite")
    print("="*60)
    
    results = {
        "Health Check": test_health_check(),
        "Authentication": test_auth_flow(),
        "Plans": test_plans(),
        "Domain Check": test_domain_check(),
    }
    
    # Print summary
    print_section("Test Summary")
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)

