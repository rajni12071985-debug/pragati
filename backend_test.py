#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CamplinkAPITester:
    def __init__(self, base_url="https://student-portal-230.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.student_id = None
        self.team_id = None
        self.request_id = None

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

    def test_student_auth(self):
        """Test student authentication"""
        print("\n🔍 Testing Student Authentication...")
        
        # Test student login/registration with CSE branch
        success, response = self.run_test(
            "Student Login/Registration (CSE)",
            "POST",
            "auth/student",
            200,
            data={
                "name": "John Doe",
                "branch": "CSE",
                "year": "2023",
                "rollNumber": "2023BTCS001"
            }
        )
        
        if success and 'id' in response:
            self.student_id = response['id']
            print(f"   Student ID: {self.student_id}")
            return True
        return False

    def test_csd_branch_support(self):
        """Test CSD branch support in roll number validation"""
        print("\n🔍 Testing CSD Branch Support...")
        
        # Test CSD student creation with valid roll number
        success, response = self.run_test(
            "CSD Student Creation (Valid Roll Number)",
            "POST",
            "auth/student",
            200,
            data={
                "name": "Test CSD Student",
                "branch": "CSD",
                "year": "2025",
                "rollNumber": "2025BTCSD123"
            }
        )
        
        csd_student_id = None
        if success and 'id' in response:
            csd_student_id = response['id']
            print(f"   CSD Student ID: {csd_student_id}")
        
        # Test invalid CSD roll number format
        success, response = self.run_test(
            "CSD Student Creation (Invalid Roll Number)",
            "POST",
            "auth/student",
            400,
            data={
                "name": "Invalid CSD Student",
                "branch": "CSD", 
                "year": "2025",
                "rollNumber": "2025BTCSD12"  # Invalid - only 2 digits at end
            }
        )
        
        # Test another valid CSD roll number
        success, response = self.run_test(
            "CSD Student Creation (Another Valid Roll Number)",
            "POST",
            "auth/student",
            200,
            data={
                "name": "Another CSD Student",
                "branch": "CSD",
                "year": "2024",
                "rollNumber": "2024BTCSD456"
            }
        )
        
        return csd_student_id is not None

    def test_interests_management(self):
        """Test interests CRUD operations"""
        print("\n🔍 Testing Interests Management...")
        
        # Get interests
        success, response = self.run_test(
            "Get Interests",
            "GET",
            "interests",
            200
        )
        
        if not success:
            return False
            
        # Create new interest
        success, response = self.run_test(
            "Create Interest",
            "POST",
            "interests",
            200,
            data={"name": "Test Interest"}
        )
        
        interest_id = None
        if success and 'id' in response:
            interest_id = response['id']
        
        # Update student interests
        if self.student_id:
            success, _ = self.run_test(
                "Update Student Interests",
                "PUT",
                f"students/{self.student_id}/interests",
                200,
                data={
                    "studentId": self.student_id,
                    "interests": ["Dance", "Web Development"]
                }
            )
        
        # Delete test interest
        if interest_id:
            success, _ = self.run_test(
                "Delete Interest",
                "DELETE",
                f"interests/{interest_id}",
                200
            )
        
        return True

    def test_students_operations(self):
        """Test student operations"""
        print("\n🔍 Testing Student Operations...")
        
        if not self.student_id:
            self.log_test("Get Student by ID", False, "No student ID available")
            return False
        
        # Get student by ID
        success, _ = self.run_test(
            "Get Student by ID",
            "GET",
            f"students/{self.student_id}",
            200
        )
        
        # Get all students
        success, _ = self.run_test(
            "Get All Students",
            "GET",
            "students",
            200
        )
        
        # Get students with interest filter
        success, _ = self.run_test(
            "Get Students with Interest Filter",
            "GET",
            "students",
            200,
            params={"interests": "Dance,Web Development"}
        )
        
        return True

    def test_teams_operations(self):
        """Test team operations"""
        print("\n🔍 Testing Team Operations...")
        
        if not self.student_id:
            self.log_test("Create Team", False, "No student ID available")
            return False
        
        # Create team
        success, response = self.run_test(
            "Create Team",
            "POST",
            "teams",
            200,
            data={
                "name": "Test Team",
                "leaderId": self.student_id,
                "memberIds": [],
                "interests": ["Dance", "Web Development"]
            }
        )
        
        if success and 'id' in response:
            self.team_id = response['id']
            print(f"   Team ID: {self.team_id}")
        
        # Get all teams
        success, _ = self.run_test(
            "Get All Teams",
            "GET",
            "teams",
            200
        )
        
        # Search teams
        success, _ = self.run_test(
            "Search Teams",
            "GET",
            "teams",
            200,
            params={"search": "Test"}
        )
        
        # Get student teams
        success, _ = self.run_test(
            "Get Student Teams",
            "GET",
            f"teams/student/{self.student_id}",
            200
        )
        
        return True

    def test_team_requests(self):
        """Test team request operations"""
        print("\n🔍 Testing Team Request Operations...")
        
        if not self.team_id or not self.student_id:
            self.log_test("Create Join Request", False, "No team or student ID available")
            return False
        
        # Create second student for join request
        success, response = self.run_test(
            "Create Second Student",
            "POST",
            "auth/student",
            200,
            data={
                "name": "Test Student 2",
                "branch": "AI",
                "year": "2024",
                "rollNumber": "2024BTAI002"
            }
        )
        
        second_student_id = None
        if success and 'id' in response:
            second_student_id = response['id']
        
        if not second_student_id:
            return False
        
        # Create join request
        success, response = self.run_test(
            "Create Join Request",
            "POST",
            "team-requests",
            200,
            data={
                "teamId": self.team_id,
                "studentId": second_student_id
            }
        )
        
        if success and 'id' in response:
            self.request_id = response['id']
        
        # Get team requests
        success, _ = self.run_test(
            "Get Team Requests",
            "GET",
            f"team-requests/team/{self.team_id}",
            200
        )
        
        # Approve request
        if self.request_id:
            success, _ = self.run_test(
                "Approve Join Request",
                "POST",
                "team-requests/action",
                200,
                data={
                    "requestId": self.request_id,
                    "action": "approve"
                }
            )
        
        return True

    def test_admin_operations(self):
        """Test admin operations"""
        print("\n🔍 Testing Admin Operations...")
        
        # Admin login with correct password
        success, _ = self.run_test(
            "Admin Login (Correct Password)",
            "POST",
            "admin/login",
            200,
            data={"password": "AURORA"}
        )
        
        # Admin login with wrong password
        success, _ = self.run_test(
            "Admin Login (Wrong Password)",
            "POST",
            "admin/login",
            401,
            data={"password": "wrong"}
        )
        
        # Get admin students
        success, _ = self.run_test(
            "Admin Get Students",
            "GET",
            "admin/students",
            200
        )
        
        # Get admin teams
        success, _ = self.run_test(
            "Admin Get Teams",
            "GET",
            "admin/teams",
            200
        )
        
        # Get admin stats (including CSD count)
        success, response = self.run_test(
            "Admin Get Stats",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            print(f"   Total Students: {response.get('totalStudents', 0)}")
            print(f"   CSE Students: {response.get('cseStudents', 0)}")
            print(f"   AI Students: {response.get('aiStudents', 0)}")
            print(f"   CSD Students: {response.get('csdStudents', 0)}")
            
            # Verify CSD students count is included
            if 'csdStudents' in response:
                self.log_test("Admin Stats includes CSD count", True, f"CSD Students: {response['csdStudents']}")
            else:
                self.log_test("Admin Stats includes CSD count", False, "csdStudents field missing from response")
        
        return True

    def test_leave_application_system(self):
        """Test Leave Application System"""
        print("\n🔍 Testing Leave Application System...")
        
        # Create a student first for leave testing
        success, response = self.run_test(
            "Create Leave Test Student",
            "POST",
            "auth/student",
            200,
            data={
                "rollNumber": "2025BTCSD999",
                "name": "Leave Test Student",
                "branch": "CSD",
                "year": "2025"
            }
        )
        
        leave_student_id = None
        if success and 'id' in response:
            leave_student_id = response['id']
            print(f"   Leave Test Student ID: {leave_student_id}")
        
        if not leave_student_id:
            self.log_test("Leave Application System", False, "Failed to create test student")
            return False
        
        # Submit leave application
        success, response = self.run_test(
            "Submit Leave Application",
            "POST",
            "leave-applications",
            200,
            data={
                "studentId": leave_student_id,
                "reason": "Medical emergency",
                "fromDate": "2025-01-01",
                "toDate": "2025-01-05",
                "documentUrl": "https://example.com/medical.pdf"
            }
        )
        
        leave_id = None
        if success and 'id' in response:
            leave_id = response['id']
            print(f"   Leave Application ID: {leave_id}")
        
        # Get student leaves
        success, response = self.run_test(
            "Get Student Leaves",
            "GET",
            f"leave-applications/student/{leave_student_id}",
            200
        )
        
        # Get all leaves (admin)
        success, response = self.run_test(
            "Get All Leaves (Admin)",
            "GET",
            "admin/leave-applications",
            200
        )
        
        # Approve leave
        if leave_id:
            success, _ = self.run_test(
                "Approve Leave Application",
                "POST",
                "admin/leave-applications/action",
                200,
                data={
                    "leaveId": leave_id,
                    "action": "approve"
                }
            )
        
        # Create another leave for rejection test
        success, response = self.run_test(
            "Submit Second Leave Application",
            "POST",
            "leave-applications",
            200,
            data={
                "studentId": leave_student_id,
                "reason": "Personal work",
                "fromDate": "2025-02-01",
                "toDate": "2025-02-03",
                "documentUrl": "https://example.com/personal.pdf"
            }
        )
        
        second_leave_id = None
        if success and 'id' in response:
            second_leave_id = response['id']
        
        # Reject leave
        if second_leave_id:
            success, _ = self.run_test(
                "Reject Leave Application",
                "POST",
                "admin/leave-applications/action",
                200,
                data={
                    "leaveId": second_leave_id,
                    "action": "reject"
                }
            )
        
        return True

    def test_team_member_single_team_restriction(self):
        """Test Team Member Single Team Restriction"""
        print("\n🔍 Testing Team Member Single Team Restriction...")
        
        # Create a student for team restriction testing
        success, response = self.run_test(
            "Create Team Restriction Test Student",
            "POST",
            "auth/student",
            200,
            data={
                "rollNumber": "2025BTCSD888",
                "name": "Team Restriction Test Student",
                "branch": "CSD",
                "year": "2025"
            }
        )
        
        restriction_student_id = None
        if success and 'id' in response:
            restriction_student_id = response['id']
            print(f"   Restriction Test Student ID: {restriction_student_id}")
        
        if not restriction_student_id:
            self.log_test("Team Member Single Team Restriction", False, "Failed to create test student")
            return False
        
        # Create first team with this student as leader
        success, response = self.run_test(
            "Create First Team (Should Succeed)",
            "POST",
            "teams",
            200,
            data={
                "name": "First Team Alpha",
                "leaderId": restriction_student_id,
                "memberIds": [],
                "interests": ["Web Development"]
            }
        )
        
        first_team_id = None
        if success and 'id' in response:
            first_team_id = response['id']
            print(f"   First Team ID: {first_team_id}")
        
        # Try to create another team with the same student as leader - should FAIL
        success, response = self.run_test(
            "Create Second Team (Should Fail - Already in Team)",
            "POST",
            "teams",
            400,
            data={
                "name": "Second Team Beta",
                "leaderId": restriction_student_id,
                "memberIds": [],
                "interests": ["Backend"]
            }
        )
        
        # Verify the error message
        if not success:
            try:
                error_detail = response if isinstance(response, dict) else {}
                if "already in a team" in str(error_detail).lower():
                    self.log_test("Team Creation Restriction Error Message", True, "Correct error message returned")
                else:
                    self.log_test("Team Creation Restriction Error Message", False, f"Unexpected error: {error_detail}")
            except:
                self.log_test("Team Creation Restriction Error Message", True, "Request properly rejected")
        
        # Create another team with different leader for join request test
        success, response = self.run_test(
            "Create Another Student for Different Team",
            "POST",
            "auth/student",
            200,
            data={
                "rollNumber": "2025BTCSD777",
                "name": "Different Team Leader",
                "branch": "CSD",
                "year": "2025"
            }
        )
        
        different_leader_id = None
        if success and 'id' in response:
            different_leader_id = response['id']
        
        if different_leader_id:
            success, response = self.run_test(
                "Create Different Team",
                "POST",
                "teams",
                200,
                data={
                    "name": "Different Team Gamma",
                    "leaderId": different_leader_id,
                    "memberIds": [],
                    "interests": ["Java"]
                }
            )
            
            different_team_id = None
            if success and 'id' in response:
                different_team_id = response['id']
            
            # Try to send join request from the student who is already in a team - should FAIL
            if different_team_id:
                success, response = self.run_test(
                    "Send Join Request (Should Fail - Already in Team)",
                    "POST",
                    "team-requests",
                    400,
                    data={
                        "teamId": different_team_id,
                        "studentId": restriction_student_id
                    }
                )
                
                # Verify the error message
                if not success:
                    try:
                        error_detail = response if isinstance(response, dict) else {}
                        if "already in a team" in str(error_detail).lower():
                            self.log_test("Join Request Restriction Error Message", True, "Correct error message returned")
                        else:
                            self.log_test("Join Request Restriction Error Message", False, f"Unexpected error: {error_detail}")
                    except:
                        self.log_test("Join Request Restriction Error Message", True, "Request properly rejected")
        
        return True

    def test_unique_team_name_validation(self):
        """Test Unique Team Name Validation"""
        print("\n🔍 Testing Unique Team Name Validation...")
        
        # Create students for team name testing
        success, response = self.run_test(
            "Create Team Name Test Student 1",
            "POST",
            "auth/student",
            200,
            data={
                "rollNumber": "2025BTCSD666",
                "name": "Team Name Test Student 1",
                "branch": "CSD",
                "year": "2025"
            }
        )
        
        name_test_student1_id = None
        if success and 'id' in response:
            name_test_student1_id = response['id']
        
        success, response = self.run_test(
            "Create Team Name Test Student 2",
            "POST",
            "auth/student",
            200,
            data={
                "rollNumber": "2025BTCSD555",
                "name": "Team Name Test Student 2",
                "branch": "CSD",
                "year": "2025"
            }
        )
        
        name_test_student2_id = None
        if success and 'id' in response:
            name_test_student2_id = response['id']
        
        if not name_test_student1_id or not name_test_student2_id:
            self.log_test("Unique Team Name Validation", False, "Failed to create test students")
            return False
        
        # Create team with name "Test Team Alpha"
        success, response = self.run_test(
            "Create Team with Name 'Test Team Alpha'",
            "POST",
            "teams",
            200,
            data={
                "name": "Test Team Alpha",
                "leaderId": name_test_student1_id,
                "memberIds": [],
                "interests": ["C"]
            }
        )
        
        if not success:
            self.log_test("Unique Team Name Validation", False, "Failed to create first team")
            return False
        
        # Try to create another team with same name "Test Team Alpha" - should FAIL
        success, response = self.run_test(
            "Create Team with Duplicate Name (Should Fail)",
            "POST",
            "teams",
            400,
            data={
                "name": "Test Team Alpha",
                "leaderId": name_test_student2_id,
                "memberIds": [],
                "interests": ["Java"]
            }
        )
        
        # Verify the error message
        if not success:
            try:
                error_detail = response if isinstance(response, dict) else {}
                if "team name already exists" in str(error_detail).lower():
                    self.log_test("Duplicate Team Name Error Message", True, "Correct error message returned")
                else:
                    self.log_test("Duplicate Team Name Error Message", False, f"Unexpected error: {error_detail}")
            except:
                self.log_test("Duplicate Team Name Error Message", True, "Request properly rejected")
        
        # Try creating "TEST TEAM ALPHA" (case insensitive) - should also FAIL
        success, response = self.run_test(
            "Create Team with Case Variation (Should Fail)",
            "POST",
            "teams",
            400,
            data={
                "name": "TEST TEAM ALPHA",
                "leaderId": name_test_student2_id,
                "memberIds": [],
                "interests": ["Java"]
            }
        )
        
        # Verify the error message for case insensitive check
        if not success:
            try:
                error_detail = response if isinstance(response, dict) else {}
                if "team name already exists" in str(error_detail).lower():
                    self.log_test("Case Insensitive Team Name Error Message", True, "Correct error message returned")
                else:
                    self.log_test("Case Insensitive Team Name Error Message", False, f"Unexpected error: {error_detail}")
            except:
                self.log_test("Case Insensitive Team Name Error Message", True, "Request properly rejected")
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Camplink API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Run test suites
        self.test_student_auth()
        self.test_csd_branch_support()
        self.test_interests_management()
        self.test_students_operations()
        self.test_teams_operations()
        self.test_team_requests()
        self.test_admin_operations()
        
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
    tester = CamplinkAPITester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if results["success_rate"] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())