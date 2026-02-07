import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle2, XCircle, Loader2, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const token = searchParams.get('token');
  const userId = searchParams.get('user_id');

  useEffect(() => {
    if (!token || !userId) {
      setStatus('error');
      setMessage('Invalid activation link. Token or user ID is missing.');
    }
  }, [token, userId]);

  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (pwd.length > 64) {
      return 'Password must not exceed 64 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/\d/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setValidationError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    setStatus('loading');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/auth/activate-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          user_id: userId,
          new_password: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Your account has been successfully activated!');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Failed to activate account. The link may be invalid or expired.');
      }
    } catch (error) {
      console.error('Activation error:', error);
      setStatus('error');
      setMessage('An error occurred while activating your account. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-[#62d5e4] rounded-full flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {status === 'form' && 'Set Your Password'}
            {status === 'loading' && 'Activating Account'}
            {status === 'success' && 'Activation Successful!'}
            {status === 'error' && 'Activation Failed'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {status === 'form' && 'Create a secure password for your account'}
            {status === 'loading' && 'Please wait...'}
            {status === 'success' && 'Your account is now active'}
            {status === 'error' && 'Something went wrong'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Welcome!</strong> Please set a secure password to activate your account.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {validationError && (
                <Alert variant="destructive">
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm text-gray-600">
                <p className="font-medium text-gray-900">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 8 characters long</li>
                  <li>Maximum 64 characters</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
                disabled={!password || !confirmPassword}
              >
                Activate Account & Set Password
              </Button>
            </form>
          )}

          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto text-[#62d5e4] animate-spin mb-4" />
              <p className="text-gray-600">
                Activating your account and setting your password...
              </p>
            </div>
          )}

          {status === 'success' && (
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
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <Alert variant="destructive">
                <AlertDescription className="text-center">
                  {message}
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 text-center">
                  Possible reasons:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>The activation link has expired (valid for 48 hours)</li>
                  <li>The link has already been used</li>
                  <li>The link is invalid or corrupted</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="flex-1"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => navigate('/forgot-password')}
                  className="flex-1 bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
                >
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
