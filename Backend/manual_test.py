#!/usr/bin/env python3
"""
Manual API Validation Script
This script tests the complete medical coding workflow step by step
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def test_complete_medical_coding_workflow():
    """Test the complete medical coding workflow"""
    print("🏥 MEDICAL CODING AI - COMPLETE WORKFLOW TEST")
    print("=" * 60)
    
    session = requests.Session()
    
    # Sample medical record
    medical_text = """
    Patient: Jane Smith
    Date: 2024-08-05
    
    Chief Complaint: Patient presents with chest pain and difficulty breathing.
    
    History of Present Illness:
    67-year-old female with history of hypertension and type 2 diabetes mellitus.
    She presents with acute onset chest pain that started 3 hours ago. 
    Pain is described as crushing, substernal, radiating to left arm.
    Associated with shortness of breath, nausea, and sweating.
    
    Physical Examination:
    Vital signs: BP 170/100, HR 102, RR 24, O2 sat 90% on room air
    General: Patient appears anxious and in moderate distress
    Cardiovascular: Irregular rhythm, S3 gallop present
    Pulmonary: Bilateral rales at lung bases
    
    Assessment and Plan:
    1. Acute ST-elevation myocardial infarction - EKG shows ST elevation in leads V2-V6
    2. Acute heart failure with pulmonary edema
    3. Hypertensive crisis
    4. Type 2 diabetes mellitus - monitor glucose levels
    
    Procedures Performed:
    - 12-lead EKG
    - Chest X-ray
    - Echocardiogram
    - Cardiac catheterization with PCI
    - Stent placement in LAD
    
    Medications:
    - Aspirin 325mg
    - Clopidogrel 75mg
    - Metoprolol 25mg BID
    - Lisinopril 5mg daily
    - Atorvastatin 80mg daily
    """
    
    # Step 1: Check system health
    print("🔍 Step 1: Checking system health...")
    try:
        response = session.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ System healthy: {health_data['status']}")
            print(f"   Components: {health_data['components']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Step 2: Get system status
    print("\n📊 Step 2: Getting system status...")
    try:
        response = session.get(f"{API_BASE}/system/status")
        if response.status_code == 200:
            status_data = response.json()
            print(f"✅ Ollama status: {status_data['ollama_status']}")
            print(f"   Model: {status_data['model_name']}")
            print(f"   Knowledge bases: {status_data['knowledge_bases']}")
        else:
            print(f"❌ System status failed: {response.status_code}")
    except Exception as e:
        print(f"❌ System status error: {e}")
    
    # Step 3: Process medical document
    print("\n📄 Step 3: Processing medical document...")
    try:
        payload = {
            "text": medical_text,
            "document_type": "medical_record"
        }
        response = session.post(f"{API_BASE}/document/process-text", json=payload)
        if response.status_code == 200:
            doc_data = response.json()
            session_id = doc_data['session_id']
            print(f"✅ Document processed successfully")
            print(f"   Session ID: {session_id}")
            print(f"   Text length: {doc_data['text_length']} characters")
        else:
            print(f"❌ Document processing failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Document processing error: {e}")
        return False
    
    # Step 4: Run AI analysis
    print("\n🤖 Step 4: Running AI analysis...")
    try:
        payload = {
            "session_id": session_id,
            "run_icd10": True,
            "run_cpt": True,
            "run_hcpcs": False
        }
        response = session.post(f"{API_BASE}/analysis/run", json=payload)
        if response.status_code == 200:
            analysis_data = response.json()
            suggested_codes = analysis_data['suggested_codes']
            print(f"✅ AI analysis completed")
            print(f"   Found {len(suggested_codes)} suggested codes:")
            
            # Display suggested codes
            for i, code in enumerate(suggested_codes[:5]):  # Show first 5
                confidence = int((code.get('confidence', 0) * 100))
                print(f"     {i+1}. {code['code']} - {code['description'][:50]}... ({confidence}%)")
        else:
            print(f"❌ AI analysis failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ AI analysis error: {e}")
        return False
    
    # Step 5: Search for additional codes
    print("\n🔍 Step 5: Searching for additional codes...")
    try:
        payload = {
            "query": "myocardial infarction",
            "code_type": "icd10"
        }
        response = session.post(f"{API_BASE}/codes/search", json=payload)
        if response.status_code == 200:
            search_data = response.json()
            search_results = search_data['results']
            print(f"✅ Code search completed")
            print(f"   Found {len(search_results)} results for 'myocardial infarction':")
            
            # Display search results
            for i, code in enumerate(search_results[:3]):  # Show first 3
                relevance = int((code.get('relevance_score', 0) * 100))
                print(f"     {i+1}. {code['code']} - {code['description'][:50]}... ({relevance}%)")
        else:
            print(f"❌ Code search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Code search error: {e}")
    
    # Step 6: Add manual codes
    print("\n✏️ Step 6: Adding manual codes...")
    try:
        # Add a manual ICD-10 code
        payload = {
            "session_id": session_id,
            "code": "I21.01",
            "description": "ST elevation myocardial infarction involving left anterior descending coronary artery",
            "code_type": "ICD-10",
            "confidence": 0.95
        }
        response = session.post(f"{API_BASE}/codes/manual-add", json=payload)
        if response.status_code == 200:
            print("✅ Manual ICD-10 code added: I21.01")
        else:
            print(f"❌ Failed to add manual code: {response.status_code}")
        
        # Add a manual CPT code
        payload = {
            "session_id": session_id,
            "code": "92928",
            "description": "Percutaneous transcatheter placement of intracoronary stent(s)",
            "code_type": "CPT",
            "confidence": 0.90
        }
        response = session.post(f"{API_BASE}/codes/manual-add", json=payload)
        if response.status_code == 200:
            print("✅ Manual CPT code added: 92928")
        else:
            print(f"❌ Failed to add manual CPT code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Manual code addition error: {e}")
    
    # Step 7: Get selected codes
    print("\n📋 Step 7: Getting selected codes...")
    try:
        response = session.get(f"{API_BASE}/codes/selected/{session_id}")
        if response.status_code == 200:
            selected_data = response.json()
            selected_codes = selected_data['selected_codes']
            print(f"✅ Retrieved {len(selected_codes)} selected codes:")
            
            for i, code in enumerate(selected_codes):
                confidence = int((code.get('confidence', 0) * 100))
                print(f"     {i+1}. {code['code']} ({code['type']}) - {code['description'][:50]}... ({confidence}%)")
        else:
            print(f"❌ Failed to get selected codes: {response.status_code}")
    except Exception as e:
        print(f"❌ Get selected codes error: {e}")
    
    # Step 8: Verify codes
    print("\n✅ Step 8: Verifying codes...")
    try:
        payload = {
            "session_id": session_id,
            "codes": []  # Will use session's selected codes
        }
        response = session.post(f"{API_BASE}/codes/verify", json=payload)
        if response.status_code == 200:
            verification_data = response.json()
            verification_results = verification_data['verification_results']
            print(f"✅ Code verification completed")
            print(f"   Verified {len(verification_results)} codes:")
            
            for i, result in enumerate(verification_results):
                status = result.get('status', 'unknown')
                confidence = int(result.get('verification_confidence', 0))
                print(f"     {i+1}. {result['code']} - Status: {status.upper()} ({confidence}%)")
        else:
            print(f"❌ Code verification failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Code verification error: {e}")
    
    # Step 9: Export results
    print("\n📤 Step 9: Exporting results...")
    try:
        # Export as JSON
        response = session.get(f"{API_BASE}/export/{session_id}/json")
        if response.status_code == 200:
            export_data = response.json()
            print(f"✅ JSON export successful")
            print(f"   Total codes exported: {export_data.get('total_codes', 0)}")
            print(f"   Export timestamp: {export_data.get('export_timestamp', 'N/A')}")
        else:
            print(f"❌ JSON export failed: {response.status_code}")
        
        # Export as CSV
        response = session.get(f"{API_BASE}/export/{session_id}/csv")
        if response.status_code == 200:
            csv_data = response.json()
            print(f"✅ CSV export successful")
            print(f"   Content type: {csv_data.get('content_type', 'N/A')}")
        else:
            print(f"❌ CSV export failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Export error: {e}")
    
    # Step 10: Get knowledge base status
    print("\n📚 Step 10: Checking knowledge base status...")
    try:
        response = session.get(f"{API_BASE}/knowledge-base/status")
        if response.status_code == 200:
            kb_data = response.json()
            print(f"✅ Knowledge base status retrieved:")
            for kb_type, info in kb_data['knowledge_bases'].items():
                print(f"     {info['name']}: {info['status']} (PDF: {'✅' if info['pdf_exists'] else '❌'}, Processed: {'✅' if info['processed'] else '❌'})")
        else:
            print(f"❌ Knowledge base status failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Knowledge base status error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 COMPLETE WORKFLOW TEST FINISHED!")
    print("🚀 Medical Coding AI FastAPI is ready for NextJS integration!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    test_complete_medical_coding_workflow()
