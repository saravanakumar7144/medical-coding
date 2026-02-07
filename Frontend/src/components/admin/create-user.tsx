import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserPlus, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateUserForm {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  phone_number: string;
  role: string;
}

export function CreateUser() {
  const { user, tokens } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateUserForm>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    employee_id: '',
    phone_number: '',
    role: 'coder',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Check if user is admin
  if (user?.activeRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Denied
            </CardTitle>
            <CardDescription className="text-gray-600">
              Only administrators can create users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    // Validate tenant_id exists (stored as organizationId in User type)
    if (!user?.organizationId) {
      setStatus('error');
      setMessage('Unable to create user: Tenant information is missing. Please log out and log back in.');
      setIsLoading(false);
      return;
    }

    // Generate a secure random password (8-12 characters with uppercase, lowercase, and number)
    const generatePassword = () => {
      const length = 10;
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';

      // Ensure at least one of each required type
      let password = '';
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];

      // Fill the rest randomly
      const allChars = uppercase + lowercase + numbers;
      for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }

      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    const temporaryPassword = generatePassword();

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          employee_id: formData.employee_id || undefined,
          phone_number: formData.phone_number || undefined,
          role: formData.role,
          tenant_id: user.organizationId,
          password: temporaryPassword, // Include generated password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(
          `User created successfully! An activation email with login credentials has been sent to ${formData.email}.`
        );

        // Reset form
        setFormData({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          employee_id: '',
          phone_number: '',
          role: 'coder',
        });
      } else {
        setStatus('error');

        // Handle validation errors (422) - array of error objects
        if (Array.isArray(data.detail)) {
          const errorMessages = data.detail.map((err: any) => {
            const field = err.loc?.[err.loc.length - 1] || 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          setMessage(`Validation error: ${errorMessages}`);
        } else if (typeof data.detail === 'string') {
          setMessage(data.detail);
        } else {
          setMessage('Failed to create user. Please check the form and try again.');
        }
      }
    } catch (error) {
      console.error('User creation error:', error);
      setStatus('error');
      setMessage('An error occurred while creating the user. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/admin-settings')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Settings
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#62d5e4] rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Create New User
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Add a new user to your organization. They will receive an activation email.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {status === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="first-name">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first-name"
                    type="text"
                    placeholder="Enter first name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="last-name">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last-name"
                    type="text"
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Employee ID */}
                <div className="space-y-2">
                  <Label htmlFor="employee-id">Employee ID</Label>
                  <Input
                    id="employee-id"
                    type="text"
                    placeholder="Enter employee ID (optional)"
                    value={formData.employee_id}
                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    placeholder="Enter phone number (optional)"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coder">Medical Coder</SelectItem>
                    <SelectItem value="billing">Billing Specialist</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Select the primary role for this user. They can be assigned additional roles later.
                </p>
              </div>

              {/* Important Notice */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Important:</strong> The user will receive an email with an activation link valid for 48 hours.
                  They must activate their account before they can log in. A temporary password will be included in the email.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isLoading ? 'Creating User...' : 'Create User & Send Activation Email'}
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate('/admin-settings')}
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
