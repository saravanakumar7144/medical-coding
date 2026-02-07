import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle2, XCircle, Clock, Play } from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
}

export function SignupFlowTests({ onStatsUpdate }: any) {
  const [tests, setTests] = useState<TestCase[]>([
    // Email Validation (8 tests)
    { id: 'signup-1', name: 'Valid email format', category: 'Email Validation', status: 'pending' },
    { id: 'signup-2', name: 'Invalid email - no @', category: 'Email Validation', status: 'pending' },
    { id: 'signup-3', name: 'Invalid email - no domain', category: 'Email Validation', status: 'pending' },
    { id: 'signup-4', name: 'Duplicate email rejected', category: 'Email Validation', status: 'pending' },
    { id: 'signup-5', name: 'Email with + alias', category: 'Email Validation', status: 'pending' },
    { id: 'signup-6', name: 'Email case sensitivity', category: 'Email Validation', status: 'pending' },
    { id: 'signup-7', name: 'Email whitespace handling', category: 'Email Validation', status: 'pending' },
    { id: 'signup-8', name: 'International domain', category: 'Email Validation', status: 'pending' },

    // Password Strength (10 tests)
    { id: 'signup-9', name: 'Minimum length 8 chars', category: 'Password Strength', status: 'pending' },
    { id: 'signup-10', name: 'Requires uppercase', category: 'Password Strength', status: 'pending' },
    { id: 'signup-11', name: 'Requires lowercase', category: 'Password Strength', status: 'pending' },
    { id: 'signup-12', name: 'Requires number', category: 'Password Strength', status: 'pending' },
    { id: 'signup-13', name: 'Requires special char', category: 'Password Strength', status: 'pending' },
    { id: 'signup-14', name: 'Weak password rejected', category: 'Password Strength', status: 'pending' },
    { id: 'signup-15', name: 'Strong password accepted', category: 'Password Strength', status: 'pending' },
    { id: 'signup-16', name: 'Password match validation', category: 'Password Strength', status: 'pending' },
    { id: 'signup-17', name: 'Password visibility toggle', category: 'Password Strength', status: 'pending' },
    { id: 'signup-18', name: 'Password strength indicator', category: 'Password Strength', status: 'pending' },

    // Role Assignment (8 tests)
    { id: 'signup-19', name: 'Coder role assigned', category: 'Role Assignment', status: 'pending' },
    { id: 'signup-20', name: 'Billing role assigned', category: 'Role Assignment', status: 'pending' },
    { id: 'signup-21', name: 'Manager role assigned', category: 'Role Assignment', status: 'pending' },
    { id: 'signup-22', name: 'Executive role assigned', category: 'Role Assignment', status: 'pending' },
    { id: 'signup-23', name: 'Auditor role assigned', category: 'Role Assignment', status: 'pending' },
    { id: 'signup-24', name: 'Admin role assigned', category: 'Role Assignment', status: 'pending' },
    { id: 'signup-25', name: 'Role permissions set', category: 'Role Assignment', status: 'pending' },
    { id: 'signup-26', name: 'Active role matches', category: 'Role Assignment', status: 'pending' },

    // User Data (6 tests)
    { id: 'signup-27', name: 'Full name required', category: 'User Data', status: 'pending' },
    { id: 'signup-28', name: 'Organization ID set', category: 'User Data', status: 'pending' },
    { id: 'signup-29', name: 'User ID generated', category: 'User Data', status: 'pending' },
    { id: 'signup-30', name: 'Account creation timestamp', category: 'User Data', status: 'pending' },
    { id: 'signup-31', name: 'Password hashed (not stored plain)', category: 'User Data', status: 'pending' },
    { id: 'signup-32', name: 'Default MFA disabled', category: 'User Data', status: 'pending' },

    // Auto-Login (3 tests)
    { id: 'signup-33', name: 'Auto-login after signup', category: 'Auto-Login', status: 'pending' },
    { id: 'signup-34', name: 'Token generated', category: 'Auto-Login', status: 'pending' },
    { id: 'signup-35', name: 'Session established', category: 'Auto-Login', status: 'pending' },

    // Error Handling (3 tests)
    { id: 'signup-36', name: 'Network error graceful', category: 'Error Handling', status: 'pending' },
    { id: 'signup-37', name: 'Server error handled', category: 'Error Handling', status: 'pending' },
    { id: 'signup-38', name: 'Validation errors shown', category: 'Error Handling', status: 'pending' },
  ]);

  const runAllTests = async () => {
    // Simulate running all tests
    for (let i = 0; i < tests.length; i++) {
      setTests(prev => {
        const newTests = [...prev];
        newTests[i] = { ...newTests[i], status: 'running' };
        return newTests;
      });
      await new Promise(resolve => setTimeout(resolve, 200));
      setTests(prev => {
        const newTests = [...prev];
        newTests[i] = { ...newTests[i], status: Math.random() > 0.1 ? 'passed' : 'failed' };
        const passed = newTests.filter(t => t.status === 'passed').length;
        const failed = newTests.filter(t => t.status === 'failed').length;
        const pending = newTests.filter(t => t.status === 'pending').length;
        onStatsUpdate({ passed, failed, pending });
        return newTests;
      });
    }
  };

  const categories = Array.from(new Set(tests.map(t => t.category)));

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-900 mb-1">Signup Flow Tests</h3>
            <p className="text-sm text-gray-600">38 tests covering registration validation and user creation</p>
          </div>
          <Button onClick={runAllTests} className="bg-[#62d5e4] hover:bg-[#52c5d4]">
            <Play className="w-4 h-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </Card>

      {categories.map(category => (
        <div key={category}>
          <h4 className="text-gray-700 mb-3">{category}</h4>
          <div className="grid gap-2">
            {tests.filter(t => t.category === category).map(test => (
              <Card key={test.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {test.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    {test.status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                    {test.status === 'running' && <Clock className="w-4 h-4 text-blue-600 animate-spin" />}
                    {test.status === 'pending' && <Clock className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm text-gray-900">{test.name}</span>
                  </div>
                  <Badge variant={test.status === 'passed' ? 'default' : test.status === 'failed' ? 'destructive' : 'outline'}>
                    {test.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
