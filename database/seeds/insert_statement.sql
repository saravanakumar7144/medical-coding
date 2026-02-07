-- ============================================
-- 1. INSERT TENANTS
-- ============================================

INSERT INTO tenants (
    tenant_id,
    tenant_name,
    company_name,
    enrollment_tier,
    contact_email_encrypted,
    contact_phone_encrypted,
    address_encrypted,
    city,
    state,
    country,
    postal_code_encrypted,
    baa_signed,
    baa_signed_date,
    baa_document_url,
    hipaa_compliant,
    data_encryption_enabled,
    max_users,
    max_storage_gb,
    settings,
    security_settings,
    timezone,
    language,
    is_active,
    is_trial,
    trial_ends_at,
    data_retention_days,
    onboarding_completed,
    website
) VALUES
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'metro_medical_center',
    'Metro Medical Center LLC',
    'gold',
    encrypt_data('admin@metromedical.com', 'encryption_key_123'),
    encrypt_data('+1-555-0101', 'encryption_key_123'),
    encrypt_data('123 Healthcare Ave', 'encryption_key_123'),
    'Boston',
    'MA',
    'US',
    encrypt_data('02115', 'encryption_key_123'),
    true,
    '2024-01-15',
    'https://s3.amazonaws.com/baa-documents/metro-medical-baa.pdf',
    true,
    true,
    100,
    500,
    '{"theme": "blue", "auto_logout_minutes": 30, "default_language": "en"}'::jsonb,
    '{"mfa_required": true, "password_expiry_days": 90, "session_timeout_minutes": 30, "ip_whitelist": ["192.168.1.0/24"]}'::jsonb,
    'America/New_York',
    'en',
    true,
    false,
    NULL,
    2555,
    true,
    'https://metromedical.com'
),
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'sunrise_clinic',
    'Sunrise Clinic Inc',
    'silver',
    encrypt_data('contact@sunriseclinic.com', 'encryption_key_123'),
    encrypt_data('+1-555-0102', 'encryption_key_123'),
    encrypt_data('456 Wellness Street', 'encryption_key_123'),
    'Miami',
    'FL',
    'US',
    encrypt_data('33101', 'encryption_key_123'),
    true,
    '2024-02-01',
    'https://s3.amazonaws.com/baa-documents/sunrise-clinic-baa.pdf',
    true,
    true,
    25,
    100,
    '{"theme": "green", "auto_logout_minutes": 20, "default_language": "en"}'::jsonb,
    '{"mfa_required": true, "password_expiry_days": 60, "session_timeout_minutes": 20, "ip_whitelist": ["10.0.1.0/24"]}'::jsonb,
    'America/New_York',
    'en',
    true,
    false,
    NULL,
    2555,
    true,
    'https://sunriseclinic.com'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================
-- 2. INSERT SUBSCRIPTIONS
-- ============================================

WITH tier_ids AS (
    SELECT tier_id, tier_name FROM enrollment_tiers
)
INSERT INTO subscriptions (
    subscription_id,
    tenant_id,
    tier_id,
    start_date,
    end_date,
    status,
    billing_cycle,
    amount_paid,
    currency,
    payment_method,
    payment_reference,
    payment_gateway,
    auto_renew,
    next_billing_date
)
SELECT
    '33333333-3333-3333-3333-333333333333'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    tier_id,
    '2024-01-01'::date,
    '2024-12-31'::date,
    'active',
    'yearly',
    3999.99,
    'USD',
    'credit_card',
    'ch_1ABCdefGHIjkLmNoPQRSTU',
    'stripe',
    true,
    '2024-12-31'::date
FROM tier_ids WHERE tier_name = 'gold'

UNION ALL

SELECT
    '44444444-4444-4444-4444-444444444444'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    tier_id,
    '2024-02-01',
    '2024-08-01',
    'active',
    'monthly',
    149.99,
    'USD',
    'bank_transfer',
    'inv_789xyz123',
    'stripe',
    true,
    '2024-03-01'
FROM tier_ids WHERE tier_name = 'silver'

ON CONFLICT (subscription_id) DO NOTHING;

-- ============================================
-- 3. INSERT USERS
-- ============================================

-- Alternative: Use the exact roles from your current constraint
-- ============================================
-- 3. INSERT USERS (Using currently allowed roles)
-- ============================================

INSERT INTO users (
    user_id,
    tenant_id,
    username,
    email_encrypted,
    email_hash,
    password_hash,
    first_name_encrypted,
    last_name_encrypted,
    phone_encrypted,
    role,
    permissions,
    timezone,
    language,
    is_active,
    email_verified,
    last_login_at,
    mfa_enabled,
    hipaa_training_completed,
    hipaa_training_date,
    privacy_policy_accepted,
    privacy_policy_accepted_at,
    password_changed_at,
    password_expires_at
) VALUES
(
    '55555555-5555-5555-5555-555555555555'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'admin.metro',
    encrypt_data('admin@metromedical.com', 'encryption_key_123'),
    encode(digest('admin@metromedical.com', 'sha256'), 'hex'),
    crypt('SecurePass123!', gen_salt('bf')),
    encrypt_data('John', 'encryption_key_123'),
    encrypt_data('Smith', 'encryption_key_123'),
    encrypt_data('+1-555-1001', 'encryption_key_123'),
    'super_admin', -- This should be allowed
    '{"all_permissions": true, "manage_users": true, "view_reports": true}'::jsonb,
    'America/New_York',
    'en',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    true,
    true,
    '2024-01-20',
    true,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '80 days'
),
(
    '77777777-7777-7777-7777-777777777777'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'admin.sunrise',
    encrypt_data('admin@sunriseclinic.com', 'encryption_key_123'),
    encode(digest('admin@sunriseclinic.com', 'sha256'), 'hex'),
    crypt('SunrisePass123!', gen_salt('bf')),
    encrypt_data('Maria', 'encryption_key_123'),
    encrypt_data('Garcia', 'encryption_key_123'),
    encrypt_data('+1-555-2001', 'encryption_key_123'),
    'admin',
    '{"manage_users": true, "view_reports": true, "billing_access": true}'::jsonb,
    'America/New_York',
    'en',
    true,
    true,
    CURRENT_TIMESTAMP - INTERVAL '3 hours',
    true,
    true,
    '2024-02-05',
    true,
    CURRENT_TIMESTAMP - INTERVAL '20 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '85 days'
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 4. INSERT USER SESSIONS
-- ============================================

INSERT INTO user_sessions (
    session_id,
    user_id,
    tenant_id,
    session_token_hash,
    refresh_token_hash,
    ip_address_encrypted,
    user_agent_encrypted,
    device_info,
    geolocation,
    is_active,
    expires_at,
    mfa_verified
) VALUES
(
    '99999999-9999-9999-9999-999999999999'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    encode(digest('session_token_abc123', 'sha256'), 'hex'),
    encode(digest('refresh_token_xyz789', 'sha256'), 'hex'),
    encrypt_data('192.168.1.100', 'encryption_key_123'),
    encrypt_data('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'encryption_key_123'),
    '{"device_type": "desktop", "browser": "Chrome", "os": "Windows 10"}'::jsonb,
    '{"city": "Boston", "region": "MA", "country": "US"}'::jsonb,
    true,
    CURRENT_TIMESTAMP + INTERVAL '8 hours',
    true
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '77777777-7777-7777-7777-777777777777'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    encode(digest('session_token_def456', 'sha256'), 'hex'),
    encode(digest('refresh_token_uvw123', 'sha256'), 'hex'),
    encrypt_data('10.0.1.50', 'encryption_key_123'),
    encrypt_data('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'encryption_key_123'),
    '{"device_type": "laptop", "browser": "Safari", "os": "macOS"}'::jsonb,
    '{"city": "Miami", "region": "FL", "country": "US"}'::jsonb,
    true,
    CURRENT_TIMESTAMP + INTERVAL '6 hours',
    true
)
ON CONFLICT (session_id) DO NOTHING;

-- ============================================
-- 5. INSERT TENANT USAGE
-- ============================================

INSERT INTO tenant_usage (
    usage_id,
    tenant_id,
    usage_date,
    active_users_count,
    storage_used_bytes,
    api_calls_count,
    phi_access_count,
    failed_login_attempts,
    successful_logins,
    mfa_challenges,
    audit_log_entries,
    daily_metrics
) VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    CURRENT_DATE,
    2,
    5368709120,
    1250,
    45,
    2,
    15,
    15,
    89,
    '{"patient_records_accessed": 45, "medical_codes_generated": 23, "reports_exported": 3}'::jsonb
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    CURRENT_DATE,
    2,
    2147483648,
    780,
    28,
    1,
    12,
    12,
    67,
    '{"patient_records_accessed": 28, "medical_codes_generated": 15, "reports_exported": 2}'::jsonb
)
ON CONFLICT (usage_id) DO NOTHING;

-- ============================================
-- 6. INSERT AUDIT LOGS
-- ============================================

INSERT INTO audit_logs (
    log_id,
    tenant_id,
    user_id,
    action_type,
    action_category,
    entity_type,
    entity_id,
    phi_accessed,
    pii_accessed,
    data_classification,
    old_values_hash,
    new_values_hash,
    performed_by,
    ip_address_encrypted,
    user_agent_encrypted,
    request_id,
    api_endpoint,
    http_method,
    status,
    retention_until
) VALUES
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'USER_LOGIN',
    'authentication',
    'user',
    '55555555-5555-5555-5555-555555555555'::uuid,
    false,
    true,
    'pii',
    NULL,
    md5('login_success'::TEXT),
    'admin.metro',
    encrypt_data('192.168.1.100', 'encryption_key_123'),
    encrypt_data('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'encryption_key_123'),
    '11111111-1111-1111-1111-111111111119'::uuid,
    '/api/v1/auth/login',
    'POST',
    'success',
    CURRENT_DATE + INTERVAL '7 years'
)
ON CONFLICT (log_id) DO NOTHING;



-- ============================================
-- 8. INSERT BREACH NOTIFICATIONS
-- ============================================

INSERT INTO breach_notifications (
    breach_id,
    tenant_id,
    incident_type,
    severity,
    description,
    affected_records_count,
    phi_compromised,
    pii_compromised,
    discovered_at,
    occurred_at,
    status,
    assigned_to
) VALUES
(
    '22222222-2222-2222-2222-222222222223'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Unauthorized Access Attempt',
    'medium',
    'Multiple failed login attempts from suspicious IP address detected',
    0,
    false,
    false,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days 2 hours',
    'resolved',
    '55555555-5555-5555-5555-555555555555'::uuid
)
ON CONFLICT (breach_id) DO NOTHING;

-- ============================================
-- 9. INSERT MEDICAL CODE PARSE RESULTS
-- ============================================

INSERT INTO medical_code_parse_result (
    medical_code_parse_id,
    user_id,
    parse_result,
    is_draft
) VALUES
(
    '44444444-4444-4444-4444-444444444445'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '{
        "patient_id": "55555555-5555-5555-5555-555555555556",
        "medical_codes": [
            {"code": "J45.909", "desc": "Unspecified asthma, uncomplicated", "category": "ICD-10"},
            {"code": "Z00.00", "desc": "Encounter for general adult medical examination without abnormal findings", "category": "ICD-10"},
            {"code": "87880", "desc": "Infectious agent detection by nucleic acid (DNA or RNA); not otherwise specified, direct probe technique", "category": "CPT"}
        ],
        "confidence_score": 0.87,
        "parsed_at": "2024-01-20T14:45:00Z"
    }'::jsonb,
    true
)
ON CONFLICT (medical_code_parse_id) DO NOTHING;

-- ============================================
-- 10. INSERT PATIENTS
-- ============================================

INSERT INTO patients (
    patient_id,
    tenant_id,
    mrn,
    mrn_hash,
    first_name_encrypted,
    last_name_encrypted,
    date_of_birth_encrypted,
    gender_encrypted,
    ssn_encrypted,
    email_encrypted,
    email_hash,
    phone_primary_encrypted,
    address_line1_encrypted,
    city_encrypted,
    state_encrypted,
    zip_code_encrypted,
    country,
    emergency_contact_name_encrypted,
    emergency_contact_phone_encrypted,
    preferred_language,
    insurance_provider_encrypted,
    insurance_policy_number_encrypted,
    blood_type_encrypted,
    allergies_encrypted,
    chronic_conditions_encrypted,
    hipaa_consent_signed,
    hipaa_consent_date,
    data_sharing_consent,
    created_by,
    updated_by
) VALUES
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'MRN-2024-001',
    encode(digest('MRN-2024-001', 'sha256'), 'hex'),
    encrypt_data('Robert', 'encryption_key_123'),
    encrypt_data('Wilson', 'encryption_key_123'),
    encrypt_data('1978-03-15', 'encryption_key_123'),
    encrypt_data('Male', 'encryption_key_123'),
    encrypt_data('123-45-6789', 'encryption_key_123'),
    encrypt_data('robert.wilson@example.com', 'encryption_key_123'),
    encode(digest('robert.wilson@example.com', 'sha256'), 'hex'),
    encrypt_data('+1-555-3001', 'encryption_key_123'),
    encrypt_data('789 Oak Street', 'encryption_key_123'),
    encrypt_data('Boston', 'encryption_key_123'),
    encrypt_data('MA', 'encryption_key_123'),
    encrypt_data('02116', 'encryption_key_123'),
    'US',
    encrypt_data('Jennifer Wilson', 'encryption_key_123'),
    encrypt_data('+1-555-3002', 'encryption_key_123'),
    'en',
    encrypt_data('Blue Cross Blue Shield', 'encryption_key_123'),
    encrypt_data('BCBS-12345678', 'encryption_key_123'),
    encrypt_data('O+', 'encryption_key_123'),
    encrypt_data('["Penicillin", "Shellfish"]', 'encryption_key_123'),
    encrypt_data('["Hypertension", "Type 2 Diabetes"]', 'encryption_key_123'),
    true,
    '2024-01-10',
    true,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid
),
(
    '55555555-5555-5555-5555-555555555556'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'MRN-SUN-2024-001',
    encode(digest('MRN-SUN-2024-001', 'sha256'), 'hex'),
    encrypt_data('Lisa', 'encryption_key_123'),
    encrypt_data('Martinez', 'encryption_key_123'),
    encrypt_data('1985-07-22', 'encryption_key_123'),
    encrypt_data('Female', 'encryption_key_123'),
    encrypt_data('987-65-4321', 'encryption_key_123'),
    encrypt_data('lisa.martinez@example.com', 'encryption_key_123'),
    encode(digest('lisa.martinez@example.com', 'sha256'), 'hex'),
    encrypt_data('+1-555-4001', 'encryption_key_123'),
    encrypt_data('456 Palm Avenue', 'encryption_key_123'),
    encrypt_data('Miami', 'encryption_key_123'),
    encrypt_data('FL', 'encryption_key_123'),
    encrypt_data('33109', 'encryption_key_123'),
    'US',
    encrypt_data('Carlos Martinez', 'encryption_key_123'),
    encrypt_data('+1-555-4002', 'encryption_key_123'),
    'en',
    encrypt_data('Aetna', 'encryption_key_123'),
    encrypt_data('AET-98765432', 'encryption_key_123'),
    encrypt_data('A-', 'encryption_key_123'),
    encrypt_data('["Aspirin", "Latex"]', 'encryption_key_123'),
    encrypt_data('["Asthma", "Seasonal Allergies"]', 'encryption_key_123'),
    true,
    '2024-02-05',
    true,
    '77777777-7777-7777-7777-777777777777'::uuid,
    '77777777-7777-7777-7777-777777777777'::uuid
)
ON CONFLICT (patient_id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check what data was inserted
SELECT 'Tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients
UNION ALL
SELECT 'Medical Code Results', COUNT(*) FROM medical_code_parse_result
UNION ALL
SELECT 'Audit Logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'User Sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'Tenant Usage', COUNT(*) FROM tenant_usage
UNION ALL
SELECT 'Data Access Logs', COUNT(*) FROM data_access_logs
UNION ALL
SELECT 'Breach Notifications', COUNT(*) FROM breach_notifications
ORDER BY table_name;