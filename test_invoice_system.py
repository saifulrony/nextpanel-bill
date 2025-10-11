#!/usr/bin/env python3
"""
Test script for the comprehensive invoice system
Tests all major invoice features
"""
import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8001/api/v1"
TEST_USER = {
    "email": "invoice_test@example.com",
    "password": "TestPass123!",
    "full_name": "Invoice Test User",
    "company_name": "Test Company Inc."
}

class InvoiceSystemTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.invoice_id = None
        
    def print_section(self, title):
        print(f"\n{'='*60}")
        print(f"{title}")
        print(f"{'='*60}")
    
    def register_user(self):
        self.print_section("1. Registering Test User")
        try:
            response = requests.post(
                f"{BASE_URL}/auth/register",
                json=TEST_USER
            )
            if response.status_code == 201:
                print(f"✓ User registered successfully")
                # Now login to get token
                return self.login_user()
            elif response.status_code == 400 and "already registered" in response.text.lower():
                # User already exists, try to login
                print("  User already exists, logging in...")
                return self.login_user()
            else:
                print(f"✗ Registration failed: {response.status_code}")
                print(f"  Response: {response.text}")
                # Try to login anyway
                return self.login_user()
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            # Try to login anyway
            return self.login_user()
    
    def login_user(self):
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={
                    "email": TEST_USER["email"],
                    "password": TEST_USER["password"]
                }
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data['access_token']
                print(f"✓ Login successful")
                return True
            else:
                print(f"✗ Login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_create_invoice(self):
        self.print_section("2. Creating Invoice with Multiple Line Items")
        
        invoice_data = {
            "items": [
                {
                    "description": "Web Hosting - Basic Plan",
                    "quantity": 1,
                    "amount": 29.99,
                    "unit_price": 29.99
                },
                {
                    "description": "SSL Certificate",
                    "quantity": 1,
                    "amount": 15.00,
                    "unit_price": 15.00
                },
                {
                    "description": "Domain Registration (.com)",
                    "quantity": 2,
                    "amount": 12.99,
                    "unit_price": 12.99
                }
            ],
            "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "tax_rate": 8.5,
            "discount_percent": 10,
            "currency": "USD",
            "notes": "Thank you for your business!",
            "terms": "Payment due within 30 days",
            "payment_instructions": "Pay via bank transfer or credit card",
            "is_recurring": False,
            "send_email": False
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/invoices/",
                headers=self.get_headers(),
                json=invoice_data
            )
            
            if response.status_code == 201:
                invoice = response.json()
                self.invoice_id = invoice['id']
                print(f"✓ Invoice created successfully")
                print(f"  Invoice Number: {invoice['invoice_number']}")
                print(f"  Subtotal: ${invoice['subtotal']:.2f}")
                print(f"  Discount: -${invoice['discount_amount']:.2f}")
                print(f"  Tax: ${invoice['tax']:.2f}")
                print(f"  Total: ${invoice['total']:.2f}")
                print(f"  Amount Due: ${invoice['amount_due']:.2f}")
                return True
            else:
                print(f"✗ Failed to create invoice: {response.status_code}")
                print(f"  Response: {response.text}")
                return False
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    def test_list_invoices(self):
        self.print_section("3. Listing Invoices")
        
        try:
            response = requests.get(
                f"{BASE_URL}/invoices/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                invoices = response.json()
                print(f"✓ Retrieved {len(invoices)} invoice(s)")
                for inv in invoices[:3]:  # Show first 3
                    print(f"  - {inv['invoice_number']}: ${inv['total']:.2f} ({inv['status']})")
                return True
            else:
                print(f"✗ Failed to list invoices: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    def test_get_invoice_details(self):
        self.print_section("4. Getting Invoice Details")
        
        if not self.invoice_id:
            print("✗ No invoice ID available")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/invoices/{self.invoice_id}",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                invoice = response.json()
                print(f"✓ Retrieved invoice details")
                print(f"  Invoice Number: {invoice['invoice_number']}")
                print(f"  Status: {invoice['status']}")
                print(f"  Items Count: {len(invoice['items'])}")
                return True
            else:
                print(f"✗ Failed to get invoice: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    def test_invoice_stats(self):
        self.print_section("5. Getting Invoice Statistics")
        
        try:
            response = requests.get(
                f"{BASE_URL}/invoices/stats/summary",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                stats = response.json()
                print(f"✓ Retrieved invoice statistics")
                print(f"  Total Invoiced: ${stats['total_invoiced']:.2f}")
                print(f"  Total Paid: ${stats['total_paid']:.2f}")
                print(f"  Total Outstanding: ${stats['total_outstanding']:.2f}")
                print(f"  Open Invoices: {stats['open_invoices']}")
                print(f"  Paid Invoices: {stats['paid_invoices']}")
                return True
            else:
                print(f"✗ Failed to get stats: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    def test_partial_payment(self):
        self.print_section("6. Recording Partial Payment")
        
        if not self.invoice_id:
            print("✗ No invoice ID available")
            return False
        
        payment_data = {
            "amount": 25.00,
            "payment_method": "bank_transfer",
            "notes": "First partial payment"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/invoices/{self.invoice_id}/partial-payment",
                headers=self.get_headers(),
                json=payment_data
            )
            
            if response.status_code == 200:
                invoice = response.json()
                print(f"✓ Partial payment recorded")
                print(f"  Amount Paid: ${invoice['amount_paid']:.2f}")
                print(f"  Amount Due: ${invoice['amount_due']:.2f}")
                print(f"  Status: {invoice['status']}")
                return True
            else:
                print(f"✗ Failed to record payment: {response.status_code}")
                print(f"  Response: {response.text}")
                return False
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    def test_invoice_filters(self):
        self.print_section("7. Testing Invoice Filters")
        
        try:
            # Filter by status
            response = requests.get(
                f"{BASE_URL}/invoices/",
                headers=self.get_headers(),
                params={"status": "open"}
            )
            
            if response.status_code == 200:
                invoices = response.json()
                print(f"✓ Filtered invoices by status")
                print(f"  Found {len(invoices)} open invoice(s)")
                return True
            else:
                print(f"✗ Failed to filter invoices: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    def test_create_recurring_invoice(self):
        self.print_section("8. Creating Recurring Invoice")
        
        invoice_data = {
            "items": [
                {
                    "description": "Monthly Server Hosting",
                    "quantity": 1,
                    "amount": 99.99,
                    "unit_price": 99.99
                }
            ],
            "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "tax_rate": 8.5,
            "currency": "USD",
            "is_recurring": True,
            "recurring_interval": "monthly",
            "notes": "Recurring monthly hosting invoice",
            "send_email": False
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/invoices/",
                headers=self.get_headers(),
                json=invoice_data
            )
            
            if response.status_code == 201:
                invoice = response.json()
                print(f"✓ Recurring invoice created")
                print(f"  Invoice Number: {invoice['invoice_number']}")
                print(f"  Is Recurring: {invoice['is_recurring']}")
                print(f"  Interval: {invoice['recurring_interval']}")
                return True
            else:
                print(f"✗ Failed to create recurring invoice: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    def test_aging_report(self):
        self.print_section("9. Getting Aging Report")
        
        try:
            response = requests.get(
                f"{BASE_URL}/invoices/stats/aging-report",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                report = response.json()
                print(f"✓ Retrieved aging report")
                print(f"  Current (not due): ${report['current']:.2f}")
                print(f"  1-30 days overdue: ${report['1_30_days']:.2f}")
                print(f"  31-60 days overdue: ${report['31_60_days']:.2f}")
                print(f"  61-90 days overdue: ${report['61_90_days']:.2f}")
                print(f"  90+ days overdue: ${report['90_plus_days']:.2f}")
                print(f"  Total Outstanding: ${report['total_outstanding']:.2f}")
                return True
            else:
                print(f"✗ Failed to get aging report: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        print("\n" + "="*60)
        print("COMPREHENSIVE INVOICE SYSTEM TEST")
        print("="*60)
        
        results = []
        
        # Run tests
        results.append(("Register/Login User", self.register_user()))
        
        if self.token:
            results.append(("Create Invoice", self.test_create_invoice()))
            results.append(("List Invoices", self.test_list_invoices()))
            results.append(("Get Invoice Details", self.test_get_invoice_details()))
            results.append(("Invoice Statistics", self.test_invoice_stats()))
            results.append(("Partial Payment", self.test_partial_payment()))
            results.append(("Invoice Filters", self.test_invoice_filters()))
            results.append(("Recurring Invoice", self.test_create_recurring_invoice()))
            results.append(("Aging Report", self.test_aging_report()))
        
        # Summary
        self.print_section("TEST SUMMARY")
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✓ PASS" if result else "✗ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\nResults: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 All tests passed! Invoice system is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")
        
        return passed == total


if __name__ == "__main__":
    tester = InvoiceSystemTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)

