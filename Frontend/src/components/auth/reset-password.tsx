import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle2, XCircle, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const userId = searchParams.get('user_id');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate password on change
  useEffect(() => {
    const errors: string[] = [];

    if (newPassword.length > 0) {
      if (newPassword.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      if (newPassword.length > 12) {
        errors.push('Password must not exceed 12 characters');
      }
      if (!/[A-Z]/.test(newPassword)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(newPassword)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/\d/.test(newPassword)) {
        errors.push('Password must contain at least one number');
      }
    }

    if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    setValidationErrors(errors);
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !userId) {
      setStatus('error');
      setMessage('Invalid reset link. Token or user ID is missing.');
      return;
    }

    if (validationErrors.length > 0) {
      setStatus('error');
      setMessage('Please fix the validation errors before submitting.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          user_id: userId,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Your password has been successfully reset!');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Failed to reset password. The link may be invalid or expired.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setStatus('error');
      setMessage('An error occurred while resetting your password. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if link is valid
  if (!token || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-gray-600">
              This password reset link is invalid or incomplete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription className="text-center">
                The reset link is missing required information. Please request a new password reset link.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-[#62d5e4] rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Reset Password
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your new password below
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'success' ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 text-center">
                  {message}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600 text-center">
                You will be redirected to the login page in 3 seconds...
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Password Requirements:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className={newPassword.length >= 8 && newPassword.length <= 12 ? 'text-green-600' : ''}>
                    • 8-12 characters
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                    • At least one uppercase letter
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                    • At least one lowercase letter
                  </li>
                  <li className={/\d/.test(newPassword) ? 'text-green-600' : ''}>
                    • At least one number
                  </li>
                  {confirmPassword.length > 0 && (
                    <li className={newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}>
                      • Passwords must match
                    </li>
                  )}
                </ul>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && newPassword.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button
                  type="submit"
                  disabled={isLoading || validationErrors.length > 0 || !newPassword || !confirmPassword}
                  className="w-full bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </Button>

                <Button
                  type="button"
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Back to Login
                </Button>
              </div>

              <p className="text-sm text-gray-600 text-center">
                This reset link is valid for 48 hours from when it was sent.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
