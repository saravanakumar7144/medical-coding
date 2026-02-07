import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LoginFlowTests } from './login-flow-tests';
import { SignupFlowTests } from './signup-flow-tests';
import { RoleSwitchingTests } from './role-switching-tests';
import { PermissionTests } from './permission-tests';
import { TokenRefreshTests } from './token-refresh-tests';
import { SessionTimeoutTests } from './session-timeout-tests';
import { MultiRoleTests } from './multi-role-tests';
import { SSOFlowTests } from './sso-flow-tests';
import { TwoFactorTests } from './two-factor-tests';
import { Card } from '../ui/card';
import { FlaskConical, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface TestStats {
  total: number;
  passed: number;
  failed: number;
  pending: number;
}

export function AuthTestingSuite() {
  const [stats, setStats] = useState<Record<string, TestStats>>({
    login: { total: 42, passed: 0, failed: 0, pending: 42 },
    signup: { total: 38, passed: 0, failed: 0, pending: 38 },
    roleSwitching: { total: 35, passed: 0, failed: 0, pending: 35 },
    permissions: { total: 48, passed: 0, failed: 0, pending: 48 },
    tokenRefresh: { total: 28, passed: 0, failed: 0, pending: 28 },
    sessionTimeout: { total: 32, passed: 0, failed: 0, pending: 32 },
    multiRole: { total: 36, passed: 0, failed: 0, pending: 36 },
    sso: { total: 30, passed: 0, failed: 0, pending: 30 },
    twoFactor: { total: 26, passed: 0, failed: 0, pending: 26 },
  });

  const totalTests = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const totalPassed = Object.values(stats).reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = Object.values(stats).reduce((sum, s) => sum + s.failed, 0);
  const totalPending = Object.values(stats).reduce((sum, s) => sum + s.pending, 0);

  const updateStats = (category: string, newStats: Partial<TestStats>) => {
    setStats(prev => ({
      ...prev,
      [category]: { ...prev[category], ...newStats }
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">Authentication Testing Suite</h1>
            <p className="text-gray-600">
              Comprehensive test coverage for RBAC, auth flows, and security features
            </p>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl text-gray-900 mt-1">{totalTests}</p>
              </div>
              <FlaskConical className="w-8 h-8 text-gray-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-2xl text-green-600 mt-1">{totalPassed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl text-red-600 mt-1">{totalFailed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl text-yellow-600 mt-1">{totalPending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Test Tabs */}
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-9 mb-6">
          <TabsTrigger value="login" className="text-xs">
            Login
            <span className="ml-1 text-xs">({stats.login.total})</span>
          </TabsTrigger>
          <TabsTrigger value="signup" className="text-xs">
            Signup
            <span className="ml-1 text-xs">({stats.signup.total})</span>
          </TabsTrigger>
          <TabsTrigger value="roleSwitching" className="text-xs">
            Roles
            <span className="ml-1 text-xs">({stats.roleSwitching.total})</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="text-xs">
            Permissions
            <span className="ml-1 text-xs">({stats.permissions.total})</span>
          </TabsTrigger>
          <TabsTrigger value="tokenRefresh" className="text-xs">
            Tokens
            <span className="ml-1 text-xs">({stats.tokenRefresh.total})</span>
          </TabsTrigger>
          <TabsTrigger value="sessionTimeout" className="text-xs">
            Session
            <span className="ml-1 text-xs">({stats.sessionTimeout.total})</span>
          </TabsTrigger>
          <TabsTrigger value="multiRole" className="text-xs">
            Multi-Role
            <span className="ml-1 text-xs">({stats.multiRole.total})</span>
          </TabsTrigger>
          <TabsTrigger value="sso" className="text-xs">
            SSO
            <span className="ml-1 text-xs">({stats.sso.total})</span>
          </TabsTrigger>
          <TabsTrigger value="twoFactor" className="text-xs">
            2FA
            <span className="ml-1 text-xs">({stats.twoFactor.total})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginFlowTests onStatsUpdate={(s) => updateStats('login', s)} />
        </TabsContent>

        <TabsContent value="signup">
          <SignupFlowTests onStatsUpdate={(s: Partial<TestStats>) => updateStats('signup', s)} />
        </TabsContent>

        <TabsContent value="roleSwitching">
          <RoleSwitchingTests onStatsUpdate={(s) => updateStats('roleSwitching', s)} />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionTests onStatsUpdate={(s) => updateStats('permissions', s)} />
        </TabsContent>

        <TabsContent value="tokenRefresh">
          <TokenRefreshTests onStatsUpdate={(s) => updateStats('tokenRefresh', s)} />
        </TabsContent>

        <TabsContent value="sessionTimeout">
          <SessionTimeoutTests onStatsUpdate={(s) => updateStats('sessionTimeout', s)} />
        </TabsContent>

        <TabsContent value="multiRole">
          <MultiRoleTests onStatsUpdate={(s) => updateStats('multiRole', s)} />
        </TabsContent>

        <TabsContent value="sso">
          <SSOFlowTests onStatsUpdate={(s) => updateStats('sso', s)} />
        </TabsContent>

        <TabsContent value="twoFactor">
          <TwoFactorTests onStatsUpdate={(s) => updateStats('twoFactor', s)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
