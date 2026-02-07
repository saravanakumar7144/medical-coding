#!/usr/bin/env python3
"""
Comprehensive API Testing Script for Medical Coding FastAPI Application
This script tests all endpoints systematically to ensure everything works perfectly.
"""

import requests
import json
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_session_id = None
        self.results = {}
        self.test_document_text = """
        Patient: John Doe
        Date: 2024-01-15
        
        Chief Complaint: Patient presents with chest pain and shortness of breath.
        
        History of Present Illness:
        The patient is a 65-year-old male with a history of hypertension and diabetes mellitus type 2.
        He presents with acute onset chest pain that started 2 hours ago. The pain is described as 
        crushing, substernal, and radiates to the left arm. Associated symptoms include shortness of 
        breath, nausea, and diaphoresis.
        
        Physical Examination:
        Vital signs: BP 160/95, HR 98, RR 22, O2 sat 92% on room air
        General: Patient appears anxious and in mild distress
        Cardiovascular: Regular rate and rhythm, no murmurs
        Pulmonary: Bilateral crackles at lung bases
        
        Assessment and Plan:
        1. Acute myocardial infarction - EKG shows ST elevation in leads II, III, aVF
        2. Hypertension - continue current medications
        3. Diabetes mellitus type 2 - check glucose levels
        
        Procedures:
        - EKG performed
        - Chest X-ray obtained
        - Cardiac catheterization planned
        
        Discharge medications:
        - Aspirin 81mg daily
        - Metoprolol 50mg twice daily
        - Lisinopril 10mg daily
        """
    
    def print_test_header(self, test_name):
        print(f"\n{'='*60}")
        print(f"🧪 TESTING: {test_name}")
        print(f"{'='*60}")
    
    def print_result(self, endpoint, method, status, response_data=None, error=None):
        status_emoji = "✅" if status else "❌"
        print(f"{status_emoji} {method} {endpoint}")
        
        if status and response_data:
            print(f"   📊 Response: {json.dumps(response_data, indent=2)[:200]}...")
        elif error:
            print(f"   ❌ Error: {error}")
        print()
    
    def test_health_endpoints(self):
        """Test health and system status endpoints"""
        self.print_test_header("HEALTH & SYSTEM STATUS")
        
        # Test health check
        try:
            response = self.session.get(f"{BASE_URL}/health")
            success = response.status_code == 200
            self.print_result("/health", "GET", success, 
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['health'] = success
        except Exception as e:
            self.print_result("/health", "GET", False, error=str(e))
            self.results['health'] = False
        
        # Test system status
        try:
            response = self.session.get(f"{API_BASE}/system/status")
            success = response.status_code == 200
            self.print_result("/api/system/status", "GET", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['system_status'] = success
        except Exception as e:
            self.print_result("/api/system/status", "GET", False, error=str(e))
            self.results['system_status'] = False
    
    def test_session_management(self):
        """Test session management endpoints"""
        self.print_test_header("SESSION MANAGEMENT")
        
        # Create session
        try:
            response = self.session.post(f"{API_BASE}/sessions")
            success = response.status_code == 200
            if success:
                self.test_session_id = response.json()['session_id']
            self.print_result("/api/sessions", "POST", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['create_session'] = success
        except Exception as e:
            self.print_result("/api/sessions", "POST", False, error=str(e))
            self.results['create_session'] = False
        
        if self.test_session_id:
            # Get session info
            try:
                response = self.session.get(f"{API_BASE}/sessions/{self.test_session_id}")
                success = response.status_code == 200
                self.print_result(f"/api/sessions/{self.test_session_id}", "GET", success,
                                response.json() if success else None,
                                f"Status: {response.status_code}" if not success else None)
                self.results['get_session'] = success
            except Exception as e:
                self.print_result(f"/api/sessions/{self.test_session_id}", "GET", False, error=str(e))
                self.results['get_session'] = False
    
    def test_document_processing(self):
        """Test document processing endpoints"""
        self.print_test_header("DOCUMENT PROCESSING")
        
        # Test text processing
        try:
            payload = {
                "text": self.test_document_text,
                "document_type": "medical_record"
            }
            response = self.session.post(f"{API_BASE}/document/process-text", 
                                       json=payload)
            success = response.status_code == 200
            if success and not self.test_session_id:
                self.test_session_id = response.json()['session_id']
            self.print_result("/api/document/process-text", "POST", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['process_text'] = success
        except Exception as e:
            self.print_result("/api/document/process-text", "POST", False, error=str(e))
            self.results['process_text'] = False
        
        # Test file upload (create a temporary test file)
        try:
            test_file_content = self.test_document_text.encode('utf-8')
            files = {'file': ('test_medical_record.txt', test_file_content, 'text/plain')}
            response = self.session.post(f"{API_BASE}/document/upload", files=files)
            success = response.status_code == 200
            self.print_result("/api/document/upload", "POST", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['upload_document'] = success
        except Exception as e:
            self.print_result("/api/document/upload", "POST", False, error=str(e))
            self.results['upload_document'] = False
    
    def test_ai_analysis(self):
        """Test AI analysis endpoints"""
        self.print_test_header("AI ANALYSIS")
        
        if not self.test_session_id:
            print("❌ No session ID available for analysis testing")
            self.results['ai_analysis'] = False
            return
        
        try:
            payload = {
                "session_id": self.test_session_id,
                "run_icd10": True,
                "run_cpt": True,
                "run_hcpcs": False
            }
            response = self.session.post(f"{API_BASE}/analysis/run", json=payload)
            success = response.status_code == 200
            self.print_result("/api/analysis/run", "POST", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}, Response: {response.text[:200]}" if not success else None)
            self.results['ai_analysis'] = success
            
            if success:
                analysis_data = response.json()
                print(f"   📊 Found {analysis_data.get('total_codes', 0)} suggested codes")
                
        except Exception as e:
            self.print_result("/api/analysis/run", "POST", False, error=str(e))
            self.results['ai_analysis'] = False
    
    def test_code_search(self):
        """Test code search endpoints"""
        self.print_test_header("CODE SEARCH")
        
        # Test code search
        try:
            payload = {
                "query": "diabetes",
                "code_type": "icd10"
            }
            response = self.session.post(f"{API_BASE}/codes/search", json=payload)
            success = response.status_code == 200
            self.print_result("/api/codes/search", "POST", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['code_search'] = success
            
            if success:
                search_data = response.json()
                print(f"   📊 Found {search_data.get('total_results', 0)} search results")
                
        except Exception as e:
            self.print_result("/api/codes/search", "POST", False, error=str(e))
            self.results['code_search'] = False
    
    def test_code_management(self):
        """Test code management endpoints"""
        self.print_test_header("CODE MANAGEMENT")
        
        if not self.test_session_id:
            print("❌ No session ID available for code management testing")
            self.results['code_management'] = False
            return
        
        # Test manual code addition
        try:
            # Add a manual code
            response = self.session.post(f"{API_BASE}/codes/select", 
                                       params={"session_id": self.test_session_id},
                                       json={
                                           "code": "E11.9",
                                           "description": "Type 2 diabetes mellitus without complications",
                                           "type": "ICD-10",
                                           "confidence": 0.95,
                                           "reasoning": "Test code selection",
                                           "source": "manual_test"
                                       })
            success = response.status_code == 200
            self.print_result("/api/codes/select", "POST", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}, Response: {response.text}" if not success else None)
            self.results['select_code'] = success
        except Exception as e:
            self.print_result("/api/codes/select", "POST", False, error=str(e))
            self.results['select_code'] = False
        
        # Test manual code addition via dedicated endpoint
        try:
            payload = {
                "session_id": self.test_session_id,
                "code": "99214",
                "description": "Office visit, established patient, moderate complexity",
                "code_type": "CPT",
                "confidence": 0.9
            }
            response = self.session.post(f"{API_BASE}/codes/manual-add", json=payload)
            success = response.status_code == 200
            self.print_result("/api/codes/manual-add", "POST", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}, Response: {response.text}" if not success else None)
            self.results['manual_add_code'] = success
        except Exception as e:
            self.print_result("/api/codes/manual-add", "POST", False, error=str(e))
            self.results['manual_add_code'] = False
        
        # Test getting selected codes
        try:
            response = self.session.get(f"{API_BASE}/codes/selected/{self.test_session_id}")
            success = response.status_code == 200
            self.print_result(f"/api/codes/selected/{self.test_session_id}", "GET", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['get_selected_codes'] = success
            
            if success:
                selected_data = response.json()
                print(f"   📊 Currently selected: {selected_data.get('total_selected', 0)} codes")
                
        except Exception as e:
            self.print_result(f"/api/codes/selected/{self.test_session_id}", "GET", False, error=str(e))
            self.results['get_selected_codes'] = False
    
    def test_code_verification(self):
        """Test code verification endpoints"""
        self.print_test_header("CODE VERIFICATION")
        
        if not self.test_session_id:
            print("❌ No session ID available for verification testing")
            self.results['code_verification'] = False
            return
        
        # Test code verification
        try:
            payload = {
                "session_id": self.test_session_id,
                "codes": [
                    {
                        "code": "E11.9",
                        "description": "Type 2 diabetes mellitus without complications",
                        "type": "ICD-10",
                        "confidence": 0.95
                    }
                ]
            }
            response = self.session.post(f"{API_BASE}/codes/verify", json=payload)
            success = response.status_code == 200
            self.print_result("/api/codes/verify", "POST", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}, Response: {response.text[:200]}" if not success else None)
            self.results['verify_codes'] = success
            
            if success:
                verification_data = response.json()
                print(f"   📊 Verified {verification_data.get('total_verified', 0)} codes")
                
        except Exception as e:
            self.print_result("/api/codes/verify", "POST", False, error=str(e))
            self.results['verify_codes'] = False
        
        # Test getting verification results
        try:
            response = self.session.get(f"{API_BASE}/codes/verification/{self.test_session_id}")
            success = response.status_code == 200
            self.print_result(f"/api/codes/verification/{self.test_session_id}", "GET", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['get_verification_results'] = success
        except Exception as e:
            self.print_result(f"/api/codes/verification/{self.test_session_id}", "GET", False, error=str(e))
            self.results['get_verification_results'] = False
    
    def test_export_functionality(self):
        """Test export endpoints"""
        self.print_test_header("EXPORT FUNCTIONALITY")
        
        if not self.test_session_id:
            print("❌ No session ID available for export testing")
            self.results['export'] = False
            return
        
        # Test CSV export
        try:
            response = self.session.get(f"{API_BASE}/export/{self.test_session_id}/csv")
            success = response.status_code == 200
            self.print_result(f"/api/export/{self.test_session_id}/csv", "GET", success,
                            {"content_type": response.headers.get("content-type")} if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['export_csv'] = success
        except Exception as e:
            self.print_result(f"/api/export/{self.test_session_id}/csv", "GET", False, error=str(e))
            self.results['export_csv'] = False
        
        # Test JSON export
        try:
            response = self.session.get(f"{API_BASE}/export/{self.test_session_id}/json")
            success = response.status_code == 200
            self.print_result(f"/api/export/{self.test_session_id}/json", "GET", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['export_json'] = success
        except Exception as e:
            self.print_result(f"/api/export/{self.test_session_id}/json", "GET", False, error=str(e))
            self.results['export_json'] = False
    
    def test_knowledge_base(self):
        """Test knowledge base endpoints"""
        self.print_test_header("KNOWLEDGE BASE MANAGEMENT")
        
        # Test knowledge base status
        try:
            response = self.session.get(f"{API_BASE}/knowledge-base/status")
            success = response.status_code == 200
            self.print_result("/api/knowledge-base/status", "GET", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['kb_status'] = success
        except Exception as e:
            self.print_result("/api/knowledge-base/status", "GET", False, error=str(e))
            self.results['kb_status'] = False
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        self.print_test_header("ROOT ENDPOINT")
        
        try:
            response = self.session.get(f"{BASE_URL}/")
            success = response.status_code == 200
            self.print_result("/", "GET", success,
                            response.json() if success else None,
                            f"Status: {response.status_code}" if not success else None)
            self.results['root'] = success
        except Exception as e:
            self.print_result("/", "GET", False, error=str(e))
            self.results['root'] = False
    
    def test_complete_workflow(self):
        """Test complete workflow from document upload to export"""
        self.print_test_header("COMPLETE WORKFLOW TEST")
        
        workflow_success = True
        workflow_session_id = None
        
        try:
            # Step 1: Create session
            print("🔄 Step 1: Creating session...")
            response = self.session.post(f"{API_BASE}/sessions")
            if response.status_code == 200:
                workflow_session_id = response.json()['session_id']
                print(f"✅ Session created: {workflow_session_id}")
            else:
                print(f"❌ Failed to create session: {response.status_code}")
                workflow_success = False
            
            # Step 2: Process document
            if workflow_success:
                print("🔄 Step 2: Processing document...")
                payload = {
                    "text": self.test_document_text,
                    "document_type": "medical_record"
                }
                response = self.session.post(f"{API_BASE}/document/process-text", json=payload)
                if response.status_code == 200:
                    workflow_session_id = response.json()['session_id']  # Update with returned session ID
                    print("✅ Document processed successfully")
                else:
                    print(f"❌ Failed to process document: {response.status_code}")
                    workflow_success = False
            
            # Step 3: Run AI analysis
            if workflow_success:
                print("🔄 Step 3: Running AI analysis...")
                payload = {
                    "session_id": workflow_session_id,
                    "run_icd10": True,
                    "run_cpt": True,
                    "run_hcpcs": False
                }
                response = self.session.post(f"{API_BASE}/analysis/run", json=payload)
                if response.status_code == 200:
                    analysis_data = response.json()
                    print(f"✅ AI analysis completed: {analysis_data.get('total_codes', 0)} codes suggested")
                else:
                    print(f"❌ Failed AI analysis: {response.status_code}, {response.text[:100]}")
                    workflow_success = False
            
            # Step 4: Add a manual code
            if workflow_success:
                print("🔄 Step 4: Adding manual code...")
                payload = {
                    "session_id": workflow_session_id,
                    "code": "I21.9",
                    "description": "Acute myocardial infarction, unspecified",
                    "code_type": "ICD-10",
                    "confidence": 0.95
                }
                response = self.session.post(f"{API_BASE}/codes/manual-add", json=payload)
                if response.status_code == 200:
                    print("✅ Manual code added successfully")
                else:
                    print(f"❌ Failed to add manual code: {response.status_code}")
                    workflow_success = False
            
            # Step 5: Get selected codes
            if workflow_success:
                print("🔄 Step 5: Getting selected codes...")
                response = self.session.get(f"{API_BASE}/codes/selected/{workflow_session_id}")
                if response.status_code == 200:
                    selected_data = response.json()
                    print(f"✅ Retrieved {selected_data.get('total_selected', 0)} selected codes")
                else:
                    print(f"❌ Failed to get selected codes: {response.status_code}")
                    workflow_success = False
            
            # Step 6: Verify codes
            if workflow_success:
                print("🔄 Step 6: Verifying codes...")
                payload = {
                    "session_id": workflow_session_id,
                    "codes": []  # Will use session's selected codes
                }
                response = self.session.post(f"{API_BASE}/codes/verify", json=payload)
                if response.status_code == 200:
                    verification_data = response.json()
                    print(f"✅ Code verification completed: {verification_data.get('total_verified', 0)} codes verified")
                else:
                    print(f"❌ Failed code verification: {response.status_code}, {response.text[:100]}")
                    workflow_success = False
            
            # Step 7: Export results
            if workflow_success:
                print("🔄 Step 7: Exporting results...")
                response = self.session.get(f"{API_BASE}/export/{workflow_session_id}/json")
                if response.status_code == 200:
                    export_data = response.json()
                    print(f"✅ Export completed: {export_data.get('total_codes', 0)} codes exported")
                else:
                    print(f"❌ Failed export: {response.status_code}")
                    workflow_success = False
            
            self.results['complete_workflow'] = workflow_success
            
        except Exception as e:
            print(f"❌ Workflow error: {str(e)}")
            self.results['complete_workflow'] = False
    
    def print_final_summary(self):
        """Print final test summary"""
        self.print_test_header("FINAL TEST SUMMARY")
        
        total_tests = len(self.results)
        passed_tests = sum(1 for result in self.results.values() if result)
        failed_tests = total_tests - passed_tests
        
        print(f"📊 **TEST RESULTS SUMMARY**")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print(f"\n📋 **DETAILED RESULTS:**")
        for test_name, result in self.results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {status} - {test_name}")
        
        if failed_tests == 0:
            print(f"\n🎉 **ALL TESTS PASSED!** 🎉")
            print(f"The Medical Coding FastAPI is working perfectly!")
            print(f"Ready for NextJS integration! 🚀")
        else:
            print(f"\n⚠️  **SOME TESTS FAILED**")
            print(f"Please review the failed tests above.")
        
        return failed_tests == 0
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Comprehensive API Testing...")
        print(f"🕐 Test started at: {datetime.now()}")
        
        # Run all test categories
        self.test_health_endpoints()
        self.test_session_management()
        self.test_document_processing()
        self.test_ai_analysis()
        self.test_code_search()
        self.test_code_management()
        self.test_code_verification()
        self.test_export_functionality()
        self.test_knowledge_base()
        self.test_root_endpoint()
        self.test_complete_workflow()
        
        # Print final summary
        all_passed = self.print_final_summary()
        
        print(f"\n🕐 Test completed at: {datetime.now()}")
        return all_passed

def main():
    """Main function to run the API tests"""
    tester = APITester()
    
    # Check if the API is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ API is not responding correctly. Please ensure the FastAPI server is running.")
            return False
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to API. Please ensure the FastAPI server is running on http://localhost:8000")
        return False
    
    print("✅ API is responding. Starting comprehensive tests...")
    
    # Run all tests
    return tester.run_all_tests()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
