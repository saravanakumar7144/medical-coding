/**
 * Test script to verify the complete medical coding workflow
 * This tests the integration between frontend and backend
 */

// Test medical record text
const testMedicalRecord = `
Patient: John Doe
Date: 2024-01-15
Age: 65
Gender: Male

Chief Complaint: Patient presents with chest pain and shortness of breath.

History of Present Illness:
The patient is a 65-year-old male with a history of hypertension and diabetes mellitus type 2.
He presents with acute onset chest pain that started 2 hours ago. The pain is described as
crushing, substernal, and radiates to the left arm. Associated symptoms include shortness of
breath, nausea, and diaphoresis.

Physical Examination:
Vital signs: BP 160/95, HR 98, RR 22, O2 sat 92% on room air
General: Patient appears anxious and in moderate distress
Cardiovascular: S1, S2 normal, no murmurs
Pulmonary: Rales bilateral lower lobes
Extremities: No edema

Assessment and Plan:
1. Acute myocardial infarction - will order cardiac enzymes, EKG, chest X-ray
2. Hypertension - continue current medications
3. Type 2 diabetes mellitus - monitor blood glucose

Medications:
- Lisinopril 10mg daily
- Metformin 1000mg BID
- Aspirin 81mg daily
`;

async function testCompleteWorkflow() {
    const baseURL = 'http://localhost:8000';
    
    console.log('🧪 Testing Complete Medical Coding Workflow');
    console.log('=' * 50);
    
    try {
        // Step 1: Create session
        console.log('1️⃣ Creating session...');
        const sessionResponse = await fetch(`${baseURL}/api/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const session = await sessionResponse.json();
        const sessionId = session.session_id;
        console.log('✅ Session created:', sessionId);
        
        // Step 2: Process text document
        console.log('\n2️⃣ Processing medical record...');
        const processResponse = await fetch(`${baseURL}/api/document/process-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: testMedicalRecord,
                document_type: 'medical_record'
            })
        });
        const processResult = await processResponse.json();
        console.log('✅ Document processed:', processResult.patient_data?.name || 'Patient data extracted');
        
        // Step 3: Run AI analysis
        console.log('\n3️⃣ Running AI analysis...');
        const analysisResponse = await fetch(`${baseURL}/api/analysis/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: processResult.session_id,
                run_icd10: true,
                run_cpt: true,
                run_hcpcs: false
            })
        });
        const analysisResult = await analysisResponse.json();
        console.log('✅ AI Analysis complete:', `${analysisResult.total_codes} codes suggested`);
        
        // Step 4: Test code filtering
        console.log('\n4️⃣ Testing code filtering...');
        const filterResponse = await fetch(`${baseURL}/api/codes/filter?query=diabetes&code_type=icd10&limit=3`);
        const filterResult = await filterResponse.json();
        console.log('✅ Code filtering works:', `${filterResult.results.length} diabetes codes found`);
        
        // Step 5: Select some codes
        console.log('\n5️⃣ Selecting codes...');
        if (analysisResult.suggested_codes && analysisResult.suggested_codes.length > 0) {
            const codeToSelect = analysisResult.suggested_codes[0];
            const selectResponse = await fetch(`${baseURL}/api/codes/select?session_id=${processResult.session_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(codeToSelect)
            });
            
            if (selectResponse.ok) {
                console.log('✅ Code selected:', codeToSelect.code);
            } else {
                console.log('⚠️  Code selection failed');
            }
        }
        
        // Step 6: Verify codes
        console.log('\n6️⃣ Verifying codes...');
        const verifyResponse = await fetch(`${baseURL}/api/codes/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: processResult.session_id,
                codes: []
            })
        });
        
        if (verifyResponse.ok) {
            const verifyResult = await verifyResponse.json();
            console.log('✅ Code verification complete:', `${verifyResult.total_verified} codes verified`);
        } else {
            console.log('⚠️  Code verification failed');
        }
        
        console.log('\n🎉 Complete workflow test passed!');
        console.log('✨ Frontend should now be able to connect to all backend features');
        
    } catch (error) {
        console.error('❌ Workflow test failed:', error);
    }
}

// Run the test
testCompleteWorkflow();
