#!/usr/bin/env python3
"""
Script to update Namecheap domain provider to use production API
"""

import sqlite3
import json
import sys

def update_to_production_api():
    # Get credentials from user
    print("=== Namecheap Production API Setup ===")
    print("You need to get these from your Namecheap account:")
    print("1. Go to https://www.namecheap.com/")
    print("2. Profile → Tools → Namecheap API Access")
    print("3. Enable API access and get your credentials")
    print()
    
    api_user = input("Enter your production API User: ").strip()
    api_key = input("Enter your production API Key: ").strip()
    username = input("Enter your Namecheap username: ").strip()
    client_ip = input("Enter your server IP address: ").strip()
    
    if not all([api_user, api_key, username, client_ip]):
        print("Error: All fields are required!")
        sys.exit(1)
    
    # Update database
    try:
        conn = sqlite3.connect('billing-backend/billing.db')
        cursor = conn.cursor()
        
        # Update provider to production
        settings = {
            "api_user": api_user,
            "client_ip": client_ip,
            "api_username": username
        }
        
        cursor.execute('''
        UPDATE domain_providers 
        SET is_sandbox = 0,
            api_url = 'https://api.namecheap.com/xml.response',
            api_key = ?,
            settings = ?
        WHERE id = '1cca8c27-8289-4ed8-b107-cdeddb830ff6'
        ''', (api_key, json.dumps(settings)))
        
        conn.commit()
        
        # Verify the update
        cursor.execute('SELECT name, is_sandbox, api_url FROM domain_providers WHERE id = "1cca8c27-8289-4ed8-b107-cdeddb830ff6"')
        result = cursor.fetchone()
        
        print("\n✅ Successfully updated to production API!")
        print(f"Provider: {result[0]}")
        print(f"Sandbox: {result[1]}")
        print(f"URL: {result[2]}")
        
        print("\n⚠️  Important: Make sure your IP address is whitelisted in Namecheap's API settings!")
        print("   Go to: Profile → Tools → Namecheap API Access → Manage IPs")
        
        conn.close()
        
    except Exception as e:
        print(f"Error updating database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_to_production_api()
