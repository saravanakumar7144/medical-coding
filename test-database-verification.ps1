# Database Verification Script
# Run this after backend has been running for 60+ seconds

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Verification - Patient Count" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Count Epic patients
Write-Host "Test 1: Counting Epic patients..." -ForegroundColor Yellow
docker exec multitenant-postgres psql -U admin -d multitenant_db -c "SELECT COUNT(*) as total_patients FROM patients WHERE source_ehr='epic';"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Verification - Patient Details" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 2: View patient details with gender
Write-Host "Test 2: Viewing patient details (first 5)..." -ForegroundColor Yellow
docker exec multitenant-postgres psql -U admin -d multitenant_db -c "SELECT first_name, last_name, gender, date_of_birth, source_ehr, last_synced_at FROM patients WHERE source_ehr='epic' ORDER BY last_synced_at DESC LIMIT 5;"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Verification - Encounters" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 3: Count encounters
Write-Host "Test 3: Counting Epic encounters..." -ForegroundColor Yellow
docker exec multitenant-postgres psql -U admin -d multitenant_db -c "SELECT COUNT(*) as total_encounters FROM encounters WHERE source_ehr='epic';"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Verification - Gender Validation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 4: Verify gender values are correct (M, F, O, U)
Write-Host "Test 4: Checking gender values are valid (M/F/O/U)..." -ForegroundColor Yellow
docker exec multitenant-postgres psql -U admin -d multitenant_db -c "SELECT gender, COUNT(*) as count FROM patients WHERE source_ehr='epic' GROUP BY gender;"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Verification - Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Expected Results:" -ForegroundColor Green
Write-Host "  - Patient count: > 0 (should be 3-7 patients)" -ForegroundColor Green
Write-Host "  - Gender values: Only M or F (single letters)" -ForegroundColor Green
Write-Host "  - Last synced: Recent timestamps" -ForegroundColor Green
Write-Host "  - Name/gender match: Male names with M, Female names with F" -ForegroundColor Green
