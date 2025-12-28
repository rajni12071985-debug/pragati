#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CSDFocusedTester:
    def __init__(self, base_url="https://student-portal-230.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_csd_roll_number_validation(self):
        """Test CSD roll number validation specifically"""
        print("\n🔍 Testing CSD Roll Number Validation...")
        
        # Test valid CSD roll number formats
        valid_roll_numbers = [
            "2025BTCSD123",
            "2024BTCSD456", 
            "2023BTCSD789",
            "2026BTCSD001"
        ]
        
        for i, roll_number in enumerate(valid_roll_numbers):
            success, response = self.run_test(
                f"Valid CSD Roll Number: {roll_number}",
                "POST",
                "auth/student",
                200,
                data={
                    "name": f"CSD Student {i+1}",
                    "branch": "CSD",
                    "year": roll_number[:4],
                    "rollNumber": roll_number
                }
            )
        
        # Test invalid CSD roll number formats
        invalid_roll_numbers = [
            "2025BTCSD12",    # Too few digits at end
            "2025BTCSD1234",  # Too many digits at end
            "25BTCSD123",     # Too few year digits
            "2025CSDBT123",   # Wrong format
            "2025BTCS123",    # Wrong branch code
            "2025BTCSD",      # Missing digits at end
        ]
        
        for roll_number in invalid_roll_numbers:
            success, response = self.run_test(
                f"Invalid CSD Roll Number: {roll_number}",
                "POST",
                "auth/student",
                400,
                data={
                    "name": "Invalid CSD Student",
                    "branch": "CSD",
                    "year": "2025",
                    "rollNumber": roll_number
                }
            )

    def test_admin_login_aurora(self):
        """Test admin login with AURORA password"""
        print("\n🔍 Testing Admin Login with AURORA Password...")
        
        # Test correct password
        success, response = self.run_test(
            "Admin Login with AURORA",
            "POST",
            "admin/login",
            200,
            data={"password": "AURORA"}
        )
        
        # Test wrong password
        success, response = self.run_test(
            "Admin Login with Wrong Password",
            "POST",
            "admin/login",
            401,
            data={"password": "WRONG"}
        )

    def test_admin_stats_csd_count(self):
        """Test admin stats includes CSD count"""
        print("\n🔍 Testing Admin Stats CSD Count...")
        
        success, response = self.run_test(
            "Admin Stats Endpoint",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            print(f"   📊 Stats Response:")
            print(f"   Total Students: {response.get('totalStudents', 0)}")
            print(f"   CSE Students: {response.get('cseStudents', 0)}")
            print(f"   AI Students: {response.get('aiStudents', 0)}")
            print(f"   CSD Students: {response.get('csdStudents', 0)}")
            
            # Verify all required fields are present
            required_fields = ['totalStudents', 'cseStudents', 'aiStudents', 'csdStudents']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Admin Stats has all branch counts", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Admin Stats has all branch counts", True, "All branch counts present")
                
            # Verify CSD count is a number
            csd_count = response.get('csdStudents')
            if isinstance(csd_count, int) and csd_count >= 0:
                self.log_test("CSD Students count is valid", True, f"CSD count: {csd_count}")
            else:
                self.log_test("CSD Students count is valid", False, f"Invalid CSD count: {csd_count}")

    def run_focused_tests(self):
        """Run focused tests for CSD functionality"""
        print("🚀 Starting CSD Focused Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Run specific test suites
        self.test_csd_roll_number_validation()
        self.test_admin_login_aurora()
        self.test_admin_stats_csd_count()
        
        # Print summary
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    tester = CSDFocusedTester()
    results = tester.run_focused_tests()
    
    # Save results to file
    with open('/app/csd_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if results["success_rate"] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())