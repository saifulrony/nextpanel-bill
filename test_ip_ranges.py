#!/usr/bin/env python3
"""
Test script to check IP range formats for Namecheap
"""
import ipaddress

def test_ip_ranges():
    """Test different IP range formats"""
    
    # Your current IP
    current_ip = "103.55.145.125"
    
    print("IP Range Options for Namecheap Whitelist")
    print("=" * 50)
    print(f"Your current IP: {current_ip}")
    print()
    
    # Option 1: Full subnet
    print("Option 1: Full Subnet (103.55.145.0/24)")
    print("Covers: 103.55.145.0 to 103.55.145.255")
    print("Total IPs: 256")
    print()
    
    # Option 2: Specific range
    print("Option 2: Specific Range (103.55.145.120/29)")
    print("Covers: 103.55.145.120 to 103.55.145.127")
    print("Total IPs: 8")
    print()
    
    # Option 3: Medium range
    print("Option 3: Medium Range (103.55.145.0/28)")
    print("Covers: 103.55.145.0 to 103.55.145.15")
    print("Total IPs: 16")
    print()
    
    # Check if your IPs are covered
    print("IP Coverage Check:")
    print("-" * 30)
    
    ranges_to_test = [
        ("103.55.145.0/24", "Full subnet"),
        ("103.55.145.120/29", "Specific range"),
        ("103.55.145.0/28", "Medium range")
    ]
    
    test_ips = ["103.55.145.123", "103.55.145.125"]
    
    for cidr, description in ranges_to_test:
        network = ipaddress.IPv4Network(cidr)
        print(f"\n{description} ({cidr}):")
        for ip in test_ips:
            if ipaddress.IPv4Address(ip) in network:
                print(f"  ✅ {ip} - COVERED")
            else:
                print(f"  ❌ {ip} - NOT COVERED")

if __name__ == "__main__":
    test_ip_ranges()
