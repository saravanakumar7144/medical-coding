import { createTestWidget } from './test-widget-template';

export const SessionTimeoutTests = createTestWidget(
  'Session Timeout Tests',
  '32 tests covering idle detection, session expiry, and re-authentication',
  [
    // Idle Detection (8 tests)
    { id: 'session-1', name: 'Idle time tracked', category: 'Idle Detection' },
    { id: 'session-2', name: 'Mouse movement resets idle', category: 'Idle Detection' },
    { id: 'session-3', name: 'Keyboard input resets idle', category: 'Idle Detection' },
    { id: 'session-4', name: 'API calls reset idle', category: 'Idle Detection' },
    { id: 'session-5', name: 'Warning shown before timeout', category: 'Idle Detection' },
    { id: 'session-6', name: '15-minute idle timeout', category: 'Idle Detection' },
    { id: 'session-7', name: '2-minute warning before timeout', category: 'Idle Detection' },
    { id: 'session-8', name: 'Multiple tabs sync idle state', category: 'Idle Detection' },

    // Timeout Warnings (8 tests)
    { id: 'session-9', name: 'Warning modal appears', category: 'Timeout Warnings' },
    { id: 'session-10', name: 'Countdown timer shown', category: 'Timeout Warnings' },
    { id: 'session-11', name: 'Extend session button works', category: 'Timeout Warnings' },
    { id: 'session-12', name: 'Logout now button works', category: 'Timeout Warnings' },
    { id: 'session-13', name: 'Activity extends session', category: 'Timeout Warnings' },
    { id: 'session-14', name: 'Warning dismisses on activity', category: 'Timeout Warnings' },
    { id: 'session-15', name: 'Sound/notification optional', category: 'Timeout Warnings' },
    { id: 'session-16', name: 'Warning persists across tabs', category: 'Timeout Warnings' },

    // Session Expiry (8 tests)
    { id: 'session-17', name: 'Auto logout on expiry', category: 'Session Expiry' },
    { id: 'session-18', name: 'Tokens cleared on expiry', category: 'Session Expiry' },
    { id: 'session-19', name: 'Redirect to login on expiry', category: 'Session Expiry' },
    { id: 'session-20', name: 'Unsaved work warning', category: 'Session Expiry' },
    { id: 'session-21', name: 'Session reason logged', category: 'Session Expiry' },
    { id: 'session-22', name: 'Message explains expiry', category: 'Session Expiry' },
    { id: 'session-23', name: 'Return URL preserved', category: 'Session Expiry' },
    { id: 'session-24', name: 'Can log back in immediately', category: 'Session Expiry' },

    // Re-authentication (8 tests)
    { id: 'session-25', name: 'Re-auth modal appears', category: 'Re-authentication' },
    { id: 'session-26', name: 'Password-only re-auth', category: 'Re-authentication' },
    { id: 'session-27', name: 'Successful re-auth continues session', category: 'Re-authentication' },
    { id: 'session-28', name: 'Failed re-auth logs out', category: 'Re-authentication' },
    { id: 'session-29', name: 'Re-auth extends token', category: 'Re-authentication' },
    { id: 'session-30', name: 'Re-auth preserves state', category: 'Re-authentication' },
    { id: 'session-31', name: 'Cancel re-auth logs out', category: 'Re-authentication' },
    { id: 'session-32', name: 'Re-auth timeout limit', category: 'Re-authentication' },
  ]
);
