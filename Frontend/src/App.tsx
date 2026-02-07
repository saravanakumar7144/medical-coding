import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { LoginPage } from './components/auth/login-page';
import { ForgotPassword } from './components/auth/forgot-password';
import { ActivateAccount } from './components/auth/activate-account';
import { ResetPassword } from './components/auth/reset-password';
import { RoleChooser } from './components/auth/role-chooser';
import { Sidebar } from './components/sidebar';
import { UserRole } from './types/auth';
import { hasPageAccess, getDefaultPage, PageId } from './types/role-permissions';
import { OperationalDashboard } from './components/operational-dashboard-simple';
import { EligibilityAuthorizations } from './components/eligibility-authorizations';
import { EnhancedSubmissionsAcknowledgments } from './components/enhanced-submissions-acknowledgments';
import { EnhancedERAsPaymentPosting } from './components/enhanced-eras-payment-posting';
import { EnhancedDenialsWorkbench } from './components/enhanced-denials-workbench';
import { AppealsReconsiderations } from './components/appeals-reconsiderations';
import { PatientBilling } from './components/patient-billing';
import { PayersPlansFeeSschedules } from './components/payers-plans-fee-schedules';
import { CodeSetsUpdates } from './components/code-sets-updates';
import { RulesScrubbing } from './components/rules-scrubbing';
import { EnhancedReportsAnalytics } from './components/enhanced-reports-analytics';
import { Dashboard } from './components/dashboard';
import { ChartCoding } from './components/chart-coding';
import { BatchProcessing } from './components/batch-processing';
import { CodeLibrary } from './components/code-library';
import { Analytics } from './components/analytics';
import { AdminSettings } from './components/admin-settings';
import { AiChatbot } from './components/ai-chatbot';
import { GatedClaimWorkspace } from './components/gated-claim-workspace';
import { EnhancedPayersPortal } from './components/enhanced-payers-portal';
import { RealTimeClaimStatus } from './components/real-time-claim-status';
import { EnhancedPriorAuth } from './components/enhanced-prior-auth';
import { CentralUnitCalculator } from './components/central-unit-calculator';
import { EnhancedCoderDashboard } from './components/role-dashboards/enhanced-coder-dashboard';
import { EnhancedBillerDashboard } from './components/role-dashboards/enhanced-biller-dashboard';
import { EnhancedManagerDashboard } from './components/role-dashboards/enhanced-manager-dashboard';
import { EnhancedExecutiveDashboard } from './components/role-dashboards/enhanced-executive-dashboard';
import { EnhancedAuditorDashboard } from './components/role-dashboards/enhanced-auditor-dashboard';
import { EnhancedAdminDashboard } from './components/role-dashboards/enhanced-admin-dashboard';
import { ClaimsInbox } from './components/claims-inbox';
import { QuickLinksBar } from './components/quick-links-bar';
import { GlobalSearch, SearchFacets } from './components/global-search';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './components/ui/dialog';
import { AuthTestingSuite } from './components/testing/auth-testing-suite';
import { CreateUser } from './components/admin/create-user';
import { LegalAcceptanceModal } from './components/legal/legal-acceptance-modal';
import { PatientManagement } from './components/claims/patient-management';
import { RevenueMetrics } from './components/claims/revenue-metrics';

// Page wrapper component to handle navigation handlers
function PageWrapper() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const userRole = user?.activeRole;

  // Check if user needs to accept legal terms
  useEffect(() => {
    if (user && (!user.termsAccepted || !user.privacyPolicyAccepted)) {
      setShowLegalModal(true);
    } else {
      setShowLegalModal(false);
    }
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    let gPressed = false;
    let gTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          navigate('/claim-workspace/new');
          return;
        }
      }

      if (e.key === 'g' || e.key === 'G') {
        if (!gPressed) {
          gPressed = true;
          gTimeout = setTimeout(() => { gPressed = false; }, 1000);
        }
        return;
      }

      if (gPressed) {
        clearTimeout(gTimeout);
        gPressed = false;

        switch (e.key.toLowerCase()) {
          case 'i':
            navigate('/claims-inbox');
            break;
          case 'a':
            navigate('/submissions-acks');
            break;
          case 'e':
            navigate('/eras-payments');
            break;
          case 'd':
            navigate('/denials-workbench');
            break;
          case 'r':
            navigate('/reports-analytics');
            break;
        }
      }

      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gTimeout) clearTimeout(gTimeout);
    };
  }, [isSearchOpen, navigate]);

  const handleQuickLinkNavigate = (pageId: string) => {
    const pageMap: Record<string, string> = {
      'claims-inbox': '/claims-inbox',
      'acknowledgments': '/submissions-acks',
      'eras': '/eras-payments',
      'denials': '/denials-workbench',
      'reports': '/reports-analytics',
      'search': 'search-modal',
      'new-claim': '/claim-workspace/new',
    };

    if (pageId === 'search-modal') {
      setIsSearchOpen(true);
    } else {
      navigate(pageMap[pageId] || `/${pageId}`);
    }
  };

  const handleSearch = (query: string, facets: SearchFacets) => {
    console.log('Search:', query, facets);
    setIsSearchOpen(false);
    navigate('/claims-inbox');
  };

  const handleNavigate = (pageId: string, claimId?: string, section?: string) => {
    if (pageId === 'Enhanced Claim Workspace' && claimId) {
      navigate(`/claim-workspace/${claimId}${section ? `?section=${section}` : ''}`);
    } else {
      // Map old page IDs to new routes
      const routeMap: Record<string, string> = {
        'Claims Inbox': '/claims-inbox',
        'Eligibility & Auth': '/eligibility-auth',
        'Submissions & Acks': '/submissions-acks',
        'ERAs & Payments': '/eras-payments',
        'AI Denials Workbench': '/denials-workbench',
        'Appeals & Recons': '/appeals-recons',
        'Patient Billing': '/patient-billing',
        'Payers & Fee Schedules': '/payers-fee-schedules',
        'Code Sets & Updates': '/code-sets-updates',
        'Rules & Scrubbing': '/rules-scrubbing',
        'Reports & Analytics': '/reports-analytics',
        'Dashboard': '/dashboard',
        'Chart Coding': '/chart-coding',
        'Batch Processing': '/batch-processing',
        'Code Library': '/code-library',
        'Analytics': '/analytics',
        'Admin & Settings': '/admin-settings',
        'Enhanced Payers Portal': '/payers-portal',
        'Real-Time Claim Status': '/claim-status',
        'Enhanced Prior Auth': '/prior-auth',
        'Central Unit Calculator': '/unit-calculator',
        'Patient Management': '/patients',
        'Revenue Metrics': '/revenue-metrics',
      };
      navigate(routeMap[pageId] || '/dashboard');
    }
  };

  const handleOpenClaim = (claimId: string, section?: string) => {
    navigate(`/claim-workspace/${claimId}${section ? `?section=${section}` : ''}`);
  };

  const handleOpenERA = (claimId: string) => {
    console.log('Open ERA for claim:', claimId);
    navigate('/eras-payments');
  };

  const handleOpenDenial = (claimId: string) => {
    console.log('Open Denial for claim:', claimId);
    navigate('/denials-workbench');
  };

  // Get current page from URL
  const getCurrentPage = () => {
    const path = window.location.pathname;
    const pageMap: Record<string, string> = {
      '/dashboard': 'Home',
      '/claims-inbox': 'Claims Inbox',
      '/eligibility-auth': 'Eligibility & Auth',
      '/submissions-acks': 'Submissions & Acks',
      '/eras-payments': 'ERAs & Payments',
      '/denials-workbench': 'AI Denials Workbench',
      '/appeals-recons': 'Appeals & Recons',
      '/patient-billing': 'Patient Billing',
      '/payers-fee-schedules': 'Payers & Fee Schedules',
      '/code-sets-updates': 'Code Sets & Updates',
      '/rules-scrubbing': 'Rules & Scrubbing',
      '/reports-analytics': 'Reports & Analytics',
      '/chart-coding': 'Chart Coding',
      '/batch-processing': 'Batch Processing',
      '/code-library': 'Code Library',
      '/analytics': 'Analytics',
      '/admin-settings': 'Admin & Settings',
      '/payers-portal': 'Enhanced Payers Portal',
      '/claim-status': 'Real-Time Claim Status',
      '/prior-auth': 'Enhanced Prior Auth',
      '/unit-calculator': 'Central Unit Calculator',
      '/auth-testing': 'Auth Testing',
      '/patients': 'Patient Management',
      '/revenue-metrics': 'Revenue Metrics',
    };
    if (path.startsWith('/claim-workspace')) return 'Enhanced Claim Workspace';
    return pageMap[path] || 'Home';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {showSidebar && (
        <Sidebar
          activePage={getCurrentPage()}
          setActivePage={(page) => handleNavigate(page)}
          currentRole={user?.activeRole || 'coder'}
          onRoleChange={(role) => {/* Role change handled in context */}}
          onOpenSearch={() => setIsSearchOpen(true)}
          userRoles={user?.roles}
          userName={user?.name}
          userEmail={user?.email}
          onLogout={async () => {
            await logout();
            navigate('/login');
          }}
        />
      )}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <QuickLinksBar
          onNavigate={handleQuickLinkNavigate}
          currentPage={getCurrentPage()}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
        />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            {/* Role-based home/dashboard */}
            <Route path="/dashboard" element={
              <>
                {userRole === 'coder' && <EnhancedCoderDashboard onNavigate={handleNavigate} />}
                {userRole === 'billing' && <EnhancedBillerDashboard onNavigate={handleNavigate} />}
                {userRole === 'manager' && <EnhancedManagerDashboard onNavigate={handleNavigate} />}
                {userRole === 'executive' && <EnhancedExecutiveDashboard onNavigate={handleNavigate} />}
                {userRole === 'auditor' && <EnhancedAuditorDashboard onNavigate={handleNavigate} />}
                {userRole === 'admin' && <EnhancedAdminDashboard onNavigate={handleNavigate} />}
                {!userRole && <OperationalDashboard />}
              </>
            } />

            {/* Claims Management */}
            <Route path="/claims-inbox" element={<ClaimsInbox onOpenClaim={handleOpenClaim} onOpenERA={handleOpenERA} onOpenDenial={handleOpenDenial} />} />
            <Route path="/eligibility-auth" element={<EligibilityAuthorizations />} />
            <Route path="/submissions-acks" element={<EnhancedSubmissionsAcknowledgments onOpenClaim={handleOpenClaim} />} />
            <Route path="/eras-payments" element={<EnhancedERAsPaymentPosting onOpenClaim={handleOpenClaim} />} />
            <Route path="/denials-workbench" element={<EnhancedDenialsWorkbench />} />
            <Route path="/appeals-recons" element={<AppealsReconsiderations />} />

            {/* Phase 8: EHR Integration & Claims Management */}
            <Route path="/patients" element={<PatientManagement />} />
            <Route path="/revenue-metrics" element={<RevenueMetrics />} />

            {/* Billing */}
            <Route path="/patient-billing" element={<PatientBilling />} />
            <Route path="/payers-fee-schedules" element={<PayersPlansFeeSschedules />} />

            {/* Configuration */}
            <Route path="/code-sets-updates" element={<CodeSetsUpdates />} />
            <Route path="/rules-scrubbing" element={<RulesScrubbing />} />

            {/* Analytics */}
            <Route path="/reports-analytics" element={<EnhancedReportsAnalytics userRole={userRole as "coder" | "manager" | "executive" | "biller" | undefined} />} />
            <Route path="/analytics" element={<Analytics />} />

            {/* Coding */}
            <Route path="/chart-coding" element={<ChartCoding />} />
            <Route path="/batch-processing" element={<BatchProcessing />} />
            <Route path="/code-library" element={<CodeLibrary />} />

            {/* Admin */}
            <Route path="/admin-settings" element={<AdminSettings />} />
            <Route path="/admin/create-user" element={<CreateUser />} />

            {/* Advanced Features */}
            <Route path="/claim-workspace/:claimId" element={<ClaimWorkspacePage onNavigate={handleNavigate} />} />
            <Route path="/payers-portal" element={<EnhancedPayersPortal />} />
            <Route path="/claim-status" element={<RealTimeClaimStatus />} />
            <Route path="/prior-auth" element={<EnhancedPriorAuth />} />
            <Route path="/unit-calculator" element={<CentralUnitCalculator onClose={() => navigate('/dashboard')} />} />

            {/* Testing */}
            <Route path="/auth-testing" element={<AuthTestingSuite />} />

            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
      <AiChatbot />

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">Search for claims, patients, and more.</DialogDescription>
          <GlobalSearch onSearch={handleSearch} onClose={() => setIsSearchOpen(false)} />
        </DialogContent>
      </Dialog>

      <LegalAcceptanceModal
        open={showLegalModal}
        onAccept={() => {
          setShowLegalModal(false);
          // Refresh user data to update legal acceptance status
          window.location.reload();
        }}
        onDecline={async () => {
          await logout();
          navigate('/login');
        }}
        userEmail={user?.email}
      />
    </div>
  );
}

// Claim workspace page component
function ClaimWorkspacePage({ onNavigate }: { onNavigate: (pageId: string) => void }) {
  const { claimId } = useParams<{ claimId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const section = searchParams.get('section') || undefined;

  return (
    <GatedClaimWorkspace
      claimId={claimId || 'demo-claim'}
      onClose={() => navigate('/claims-inbox')}
      initialSection={section}
    />
  );
}

// Protected route wrapper
function ProtectedLayout() {
  const { user, isAuthenticated, isLoading, changeRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#62d5e4] mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Multi-role user needs to choose role
  if (user && user.roles.length > 1 && !user.activeRole) {
    return <RoleChooser />;
  }

  return <PageWrapper />;
}

// Public route wrapper - redirects to dashboard if already authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#62d5e4] mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes - render elements directly to avoid nested Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword onBack={() => window.location.href = '/login'} />
            </PublicRoute>
          } />
          <Route path="/activate" element={<PublicRoute><ActivateAccount /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          {/* Protected routes */}
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
