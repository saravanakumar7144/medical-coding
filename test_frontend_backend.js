// Simple test script to verify backend API endpoints
async function testAPI() {
    const baseURL = 'http://localhost:8000';
    
    console.log('Testing Medical Coding API...');
    
    try {
        // Test health endpoint
        console.log('\n1. Testing health endpoint...');
        const healthResponse = await fetch(`${baseURL}/health`);
        const health = await healthResponse.json();
        console.log('✅ Health:', health);
        
        // Test system status
        console.log('\n2. Testing system status...');
        const statusResponse = await fetch(`${baseURL}/api/system/status`);
        const status = await statusResponse.json();
        console.log('✅ System Status:', status);
        
        // Test create session
        console.log('\n3. Testing create session...');
        const sessionResponse = await fetch(`${baseURL}/api/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const session = await sessionResponse.json();
        console.log('✅ Session created:', session);
        
        // Test filter codes endpoint
        console.log('\n4. Testing filter codes...');
        const filterResponse = await fetch(`${baseURL}/api/codes/filter?query=diabetes&code_type=all&limit=5`);
        const filtered = await filterResponse.json();
        console.log('✅ Filtered codes:', filtered);
        
        // Test knowledge base stats
        console.log('\n5. Testing knowledge base stats...');
        const statsResponse = await fetch(`${baseURL}/api/codes/knowledge-base/stats`);
        const stats = await statsResponse.json();
        console.log('✅ KB Stats:', stats);
        
        console.log('\n🎉 All API tests passed!');
        
    } catch (error) {
        console.error('❌ API test failed:', error);
    }
}

// Run the test if running in Node.js
if (typeof require !== 'undefined') {
    // For Node.js (requires node-fetch)
    const fetch = require('node-fetch');
    testAPI();
} else {
    // For browser
    testAPI();
}
