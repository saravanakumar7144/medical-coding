"""
Medical Coding AI Models
Import all SQLAlchemy models to register them with Base.metadata
"""

# Import all models so SQLAlchemy can discover them
from .tenant_models import Tenant, EnrollmentTier
from .user_models import User, PasswordReset, RefreshToken, PasswordHistory, AuditLog
from .session_models import UserSession
from .medical_models import MedicalCodeParseResult
from .settings_models import TenantAISettings, TenantSecuritySettings, BackupRecord
from .security_models import SecurityEvent, LoginAttempt
from .ehr_models import (
    Patient,
    InsurancePayer,
    PatientInsurance,
    Encounter,
    EncounterDiagnosis,
    EncounterProcedure,
    Claim,
    ClaimLineItem,
    ClaimDenial,
    ClearinghouseTransaction,
    ClaimNote,
    RemittanceAdvice,
    ERALineItem,
    # EHR Polling Models
    EHRConnection,
    SyncState,
    ICD10Code,
    CPTCode,
    ClearinghouseConnection,
)

__all__ = [
    'Tenant',
    'EnrollmentTier',
    'User',
    'PasswordReset',
    'RefreshToken',
    'PasswordHistory',
    'AuditLog',
    'UserSession',
    'MedicalCodeParseResult',
    'Patient',
    'InsurancePayer',
    'PatientInsurance',
    'Encounter',
    'EncounterDiagnosis',
    'EncounterProcedure',
    'Claim',
    'ClaimLineItem',
    'ClaimDenial',
    'ClearinghouseTransaction',
    'ClaimNote',
    'RemittanceAdvice',
    'ERALineItem',
    # EHR Polling Models
    'EHRConnection',
    'SyncState',
    'ICD10Code',
    'CPTCode',
    'ClearinghouseConnection',
    # Settings Models
    'TenantAISettings',
    'TenantSecuritySettings',
    'BackupRecord',
    # Security Models
    'SecurityEvent',
    'LoginAttempt',
]
