import { api } from '@/lib/api'

export default function TestPage() {
  const testConnection = async () => {
    try {
      console.log('Testing health check...')
      const health = await api.healthCheck()
      console.log('Health check result:', health)
      
      console.log('Testing session creation...')
      const session = await api.createSession()
      console.log('Session created:', session)
      
      console.log('Testing text processing...')
      const result = await api.processText('Patient: John Smith\nID: P-123\nDOB: 01/01/1980\nChief Complaint: Test')
      console.log('Text processing result:', result)
      
    } catch (error) {
      console.error('Test failed:', error)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      <button 
        onClick={testConnection}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test API Connection
      </button>
      <p className="mt-4 text-sm text-gray-600">Check browser console for results</p>
    </div>
  )
}
