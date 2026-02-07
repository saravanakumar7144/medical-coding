const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PatientData {
  id?: string;
  name?: string;
  dob?: string;
  gender?: string;
  visitDate?: string;
  provider?: string;
  chiefComplaint?: string;
  vitalSigns?: {
    bp?: string;
    pulse?: string;
    resp?: string;
    temp?: string;
    height?: string;
    weight?: string;
    bmi?: string;
  };
  history?: string;
  examination?: string;
  assessment?: string;
  plan?: string;
  text?: string;
}

export interface MedicalCode {
  code: string;
  description: string;
  type: 'ICD-10' | 'CPT' | 'HCPCS';
  confidence?: number;
  reasoning?: string;
  source: string;  // Required field for backend compatibility
  notes?: string;
  text_chunk?: string;
}

export interface AnalysisResult {
  session_id: string;
  suggested_codes: MedicalCode[];
  analysis_results: any;
  total_codes: number;
}

export interface VerificationResult {
  code: string;
  status: 'valid' | 'warning' | 'error';
  message: string;
  recommendation?: string;
  confidence?: number;
}

export interface SessionData {
  session_id: string;
  created_at: string;
  document_processed: boolean;
  patient_data?: PatientData;
  selected_codes?: MedicalCode[];
  verification_results?: VerificationResult[];
}

export class MedicalCodingAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication headers with JWT token from localStorage
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    }
  }

  /**
   * Get authentication headers for FormData requests (no Content-Type)
   */
  private getAuthHeadersForFormData(): HeadersInit {
    const token = localStorage.getItem("access_token")
    return {
      "Authorization": `Bearer ${token}`,
    }
  }

  // Session management
  async createSession(): Promise<{ session_id: string; created_at: string }> {
    try {
      console.log(`Making request to: ${this.baseUrl}/api/sessions`);
      
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        mode: 'cors',
      });
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Create session error response: ${errorText}`);
        throw new Error(`Failed to create session: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Create session success:', data);
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<SessionData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get session: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  // Document processing
  async uploadDocument(file: File, sessionId?: string): Promise<{
    session_id: string;
    filename: string;
    text_length: number;
    processed: boolean;
    patient_data: PatientData;
  }> {
    try {
      console.log(`Making upload request to: ${this.baseUrl}/api/document/upload`);
      
      const formData = new FormData();
      formData.append('file', file);
      if (sessionId) {
        formData.append('session_id', sessionId);
      }

      const response = await fetch(`${this.baseUrl}/api/document/upload`, {
        method: 'POST',
        headers: this.getAuthHeadersForFormData(),
        mode: 'cors',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upload error response: ${errorText}`);
        throw new Error(`Failed to upload document: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload success:', data);
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async processText(text: string): Promise<{
    session_id: string;
    text_length: number;
    processed: boolean;
    patient_data: PatientData;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/document/process-text`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        mode: 'cors',
        body: JSON.stringify({
          text,
          document_type: 'medical_record',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to process text: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error processing text:', error);
      throw error;
    }
  }

  // Analysis
  async runAnalysis(sessionId: string, options: {
    run_icd10?: boolean;
    run_cpt?: boolean;
    run_hcpcs?: boolean;
  } = {}): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analysis/run`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId,
          run_icd10: options.run_icd10 ?? true,
          run_cpt: options.run_cpt ?? true,
          run_hcpcs: options.run_hcpcs ?? false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to run analysis: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error running analysis:', error);
      throw error;
    }
  }

  // Code search
  async searchCodes(query: string, codeType: string = 'all'): Promise<{
    query: string;
    code_type: string;
    results: MedicalCode[];
    total_results: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/codes/search`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          query,
          code_type: codeType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to search codes: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error searching codes:', error);
      throw error;
    }
  }

  // Enhanced code filtering from knowledge base
  async filterCodes(query: string = '', codeType: string = 'all', limit: number = 50): Promise<{
    query: string;
    code_type: string;
    results: MedicalCode[];
    total_results: number;
    total_available: number;
  }> {
    try {
      const params = new URLSearchParams({
        query,
        code_type: codeType,
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/api/codes/filter?${params}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to filter codes: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error filtering codes:', error);
      throw error;
    }
  }

  // Get knowledge base statistics
  async getKnowledgeBaseStats(): Promise<{
    knowledge_base_stats: {
      icd10_processed: number;
      icd10_sample: number;
      cpt_sample: number;
      total: number;
    };
    files_available: {
      icd10_processed: boolean;
      icd10_sample: boolean;
      cpt_sample: boolean;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/codes/knowledge-base/stats`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get knowledge base stats: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting knowledge base stats:', error);
      throw error;
    }
  }

  // Code management
  async selectCode(sessionId: string, code: MedicalCode): Promise<void> {
    try {
      // Ensure the code has all required fields
      const codeWithDefaults = {
        code: code.code,
        description: code.description,
        type: code.type,
        confidence: code.confidence || 0.5,
        reasoning: code.reasoning || '',
        source: code.source || code.type || 'manual'
      };

      console.log('Selecting code:', codeWithDefaults);

      const response = await fetch(`${this.baseUrl}/api/codes/select?session_id=${sessionId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        mode: 'cors',
        body: JSON.stringify(codeWithDefaults),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Select code error response:', errorText);
        throw new Error(`Failed to select code: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error selecting code:', error);
      throw error;
    }
  }

  async addManualCode(sessionId: string, code: string, description: string, codeType: string, confidence: number = 0.9): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/codes/manual-add`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId,
          code,
          description,
          code_type: codeType,
          confidence,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add manual code: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error adding manual code:', error);
      throw error;
    }
  }

  async getSelectedCodes(sessionId: string): Promise<{
    session_id: string;
    selected_codes: MedicalCode[];
    total_selected: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/codes/selected/${sessionId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get selected codes: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting selected codes:', error);
      throw error;
    }
  }

  async removeSelectedCode(sessionId: string, code: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/codes/selected/${sessionId}/${code}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove selected code: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error removing selected code:', error);
      throw error;
    }
  }

  // Code verification
  async verifyCodes(sessionId: string, codes: MedicalCode[]): Promise<{
    session_id: string;
    verification_results: VerificationResult[];
    total_verified: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/codes/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId,
          codes,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to verify codes: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error verifying codes:', error);
      throw error;
    }
  }

  async getVerificationResults(sessionId: string): Promise<{
    session_id: string;
    verification_results: VerificationResult[];
    total_verified: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/codes/verification/${sessionId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get verification results: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting verification results:', error);
      throw error;
    }
  }

  // System status
  async getSystemStatus(): Promise<{
    ollama_status: string;
    model_name: string;
    knowledge_bases: any;
    total_sessions: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/system/status`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get system status: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting system status:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    components: Record<string, boolean>;
  }> {
    try {
      console.log(`Making health check request to: ${this.baseUrl}/health`);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.getAuthHeaders(),
      });

      console.log(`Health check response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Health check error response: ${errorText}`);
        throw new Error(`Health check failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Health check success:', data);
      return data;
    } catch (error) {
      console.error('Error in health check:', error);
      throw error;
    }
  }

  // Simple test endpoint
  async testConnection(): Promise<{
    status: string;
    message: string;
    timestamp: string;
    server: string;
    version: string;
  }> {
    try {
      console.log(`Making test connection request to: ${this.baseUrl}/api/test`);
      
      const response = await fetch(`${this.baseUrl}/api/test`, {
        headers: this.getAuthHeaders(),
      });

      console.log(`Test connection response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Test connection error response: ${errorText}`);
        throw new Error(`Test connection failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Test connection success:', data);
      return data;
    } catch (error) {
      console.error('Error in test connection:', error);
      throw error;
    }
  }

  // Export methods
  async exportCsv(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/export/csv/${sessionId}`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to export CSV: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `medical_codes_${sessionId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }

  async exportExcel(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/export/excel/${sessionId}`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to export Excel: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `medical_codes_${sessionId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const api = new MedicalCodingAPI();
