import { createTestWidget } from './test-widget-template';

export const TwoFactorTests = createTestWidget(
  '2FA Tests',
  '26 tests covering two-factor authentication setup and verification',
  [
    // Setup Flow (8 tests)
    { id: '2fa-1', name: 'Enable 2FA from settings', category: 'Setup Flow' },
    { id: '2fa-2', name: 'QR code generated', category: 'Setup Flow' },
    { id: '2fa-3', name: 'Secret key displayed', category: 'Setup Flow' },
    { id: '2fa-4', name: 'Backup codes generated', category: 'Setup Flow' },
    { id: '2fa-5', name: 'Verification required to enable', category: 'Setup Flow' },
    { id: '2fa-6', name: 'Cannot skip verification', category: 'Setup Flow' },
    { id: '2fa-7', name: 'Download backup codes', category: 'Setup Flow' },
    { id: '2fa-8', name: 'MFA flag set on success', category: 'Setup Flow' },

    // Verification (8 tests)
    { id: '2fa-9', name: '6-digit code required', category: 'Verification' },
    { id: '2fa-10', name: 'Valid code accepted', category: 'Verification' },
    { id: '2fa-11', name: 'Invalid code rejected', category: 'Verification' },
    { id: '2fa-12', name: 'Expired code rejected', category: 'Verification' },
    { id: '2fa-13', name: 'Backup code works once', category: 'Verification' },
    { id: '2fa-14', name: 'Used backup code invalidated', category: 'Verification' },
    { id: '2fa-15', name: 'Rate limiting on attempts', category: 'Verification' },
    { id: '2fa-16', name: 'Lockout after failures', category: 'Verification' },

    // Login with 2FA (6 tests)
    { id: '2fa-17', name: '2FA prompt after password', category: 'Login with 2FA' },
    { id: '2fa-18', name: 'Remember device option', category: 'Login with 2FA' },
    { id: '2fa-19', name: 'Trusted device bypasses 2FA', category: 'Login with 2FA' },
    { id: '2fa-20', name: 'Untrusted device requires 2FA', category: 'Login with 2FA' },
    { id: '2fa-21', name: 'Failed 2FA blocks login', category: 'Login with 2FA' },
    { id: '2fa-22', name: 'Use backup code option shown', category: 'Login with 2FA' },

    // Management (4 tests)
    { id: '2fa-23', name: 'Disable 2FA requires password', category: 'Management' },
    { id: '2fa-24', name: 'Regenerate backup codes', category: 'Management' },
    { id: '2fa-25', name: 'View trusted devices', category: 'Management' },
    { id: '2fa-26', name: 'Revoke trusted device', category: 'Management' },
  ]
);
