# 📚 Knowledge Base PDF Location

## 📍 Where to Place Your Medical Coding PDFs

Place your medical coding knowledge base PDF files in this directory:

### Required PDF Files:
1. **`icd10.pdf`** - ICD-10 Diagnosis Codes Manual
2. **`cpt.pdf`** - CPT Procedure Codes Manual  
3. **`hcpcs.pdf`** - HCPCS Equipment/Supply Codes Manual

### Directory Structure:
```
knowledge_base_pdfs/
├── icd10.pdf      (ICD-10 manual - up to 4000+ pages)
├── cpt.pdf        (CPT manual - up to 4000+ pages)
└── hcpcs.pdf      (HCPCS manual - up to 4000+ pages)
```

### 📥 How to Obtain These PDFs:

#### ICD-10 Manual:
- **Official Source**: [WHO ICD-10 Website](https://www.who.int/standards/classifications/classification-of-diseases)
- **US Version**: [CMS ICD-10 Website](https://www.cms.gov/Medicare/Coding/ICD10)
- **Alternative**: Search for "ICD-10 Manual PDF download" on medical coding websites

#### CPT Manual:
- **Official Source**: [AMA CPT Website](https://www.ama-assn.org/practice-management/cpt)
- **Alternative**: Medical coding training websites and resources
- **Note**: CPT codes are copyrighted by AMA, use authorized sources

#### HCPCS Manual:
- **Official Source**: [CMS HCPCS Website](https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets)
- **Alternative**: Search for "HCPCS Level II Manual PDF" on medical coding websites

### 🔄 Automatic Processing:

Once you place the PDF files here, the system will automatically:

1. **Detect** the PDF files on startup
2. **Extract** text content from all pages
3. **Process** and chunk the content for optimal AI retrieval
4. **Convert** to JSON format for faster loading
5. **Create** vector embeddings for semantic search
6. **Cache** the processed data for subsequent runs

### ⚡ Performance Notes:

- **Large Files**: PDFs with 4000+ pages may take 10-30 minutes to process initially
- **Caching**: After first processing, subsequent startups will be much faster
- **Memory**: Large PDFs may require 8-16GB RAM during processing
- **Storage**: Processed JSON files will be ~10-20% of original PDF size

### 🛠️ Manual Processing:

If you want to manually process the PDFs:

```bash
# Navigate to project directory
cd "Medical Coding AI implementation"

# Run the knowledge base processor
python -c "
from medical_coding_ai.utils.knowledge_base_manager import KnowledgeBaseManager
manager = KnowledgeBaseManager()
manager.process_all_pdfs()
"
```

### 📊 Processed Output Location:

Processed knowledge base files will be saved to:
```
medical_coding_ai/data/knowledge_base/
├── icd10_processed.json
├── cpt_processed.json
├── hcpcs_processed.json
└── embeddings/
    ├── icd10_embeddings.faiss
    ├── cpt_embeddings.faiss
    └── hcpcs_embeddings.faiss
```

### 🚨 Important Notes:

1. **File Size**: Each PDF can be up to 4000+ pages (500MB+ each)
2. **Copyright**: Ensure you have proper licensing for these medical coding manuals
3. **Updates**: Replace PDFs here when new versions are released
4. **Backup**: Keep original PDFs as backup since processing modifies content for AI use

### 🔧 Configuration:

The system will automatically detect PDFs in this location. You can also manually configure paths in `medical_coding_ai/config.yaml`:

```yaml
knowledge_base:
  pdf_source_directory: "knowledge_base_pdfs"
  icd10_path: "knowledge_base_pdfs/icd10.pdf"
  cpt_path: "knowledge_base_pdfs/cpt.pdf"
  hcpcs_path: "knowledge_base_pdfs/hcpcs.pdf"
  auto_process_on_startup: true
  chunk_size: 1000
  chunk_overlap: 200
```

---

**🎯 Once you place the PDF files here, restart the application and it will automatically process them for AI use!**
