import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription } from '../ui/alert';
import { TermsAndConditions, TERMS_CONTENT } from './terms-and-conditions';
import { PrivacyPolicy, PRIVACY_CONTENT } from './privacy-policy';
import { AlertCircle, FileText, Shield } from 'lucide-react';

interface LegalAcceptanceModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline?: () => void;
  userEmail?: string;
}

export function LegalAcceptanceModal({
  open,
  onAccept,
  onDecline,
  userEmail
}: LegalAcceptanceModalProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      setError('You must accept both the Terms and Conditions and the Privacy Policy to continue.');
      return;
    }

    try {
      // Call API to record acceptance
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/api/auth/accept-legal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          terms_accepted: true,
          privacy_policy_accepted: true,
          terms_version: TERMS_CONTENT.version,
          privacy_policy_version: PRIVACY_CONTENT.version
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record legal acceptance');
      }

      const data = await response.json();
      console.log('Legal acceptance recorded:', data);

      onAccept();
    } catch (error) {
      console.error('Error recording legal acceptance:', error);
      setError('Failed to record your acceptance. Please try again.');
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      setError('You must accept the Terms and Conditions and Privacy Policy to use this platform.');
    }
  };

  const canAccept = acceptedTerms && acceptedPrivacy;

  return (
    <>
      {/* Main Acceptance Dialog */}
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#62d5e4]" />
              Legal Agreement Required
            </DialogTitle>
            <DialogDescription className="text-base">
              Before using the Panaceon Medical Coding Platform, you must review and accept our legal terms.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Important:</strong> This platform handles Protected Health Information (PHI) and is HIPAA compliant.
                Please read the terms carefully before accepting.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="accept-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => {
                    setAcceptedTerms(checked as boolean);
                    setError('');
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="accept-terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I have read and accept the{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-semibold text-[#62d5e4] hover:text-[#52c5d4]"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTerms(true);
                      }}
                    >
                      Terms and Conditions
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Version {TERMS_CONTENT.version} • Last updated {TERMS_CONTENT.lastUpdated}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTerms(true)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>

              {/* Privacy Policy Checkbox */}
              <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="accept-privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={(checked) => {
                    setAcceptedPrivacy(checked as boolean);
                    setError('');
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="accept-privacy"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I have read and accept the{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-semibold text-[#62d5e4] hover:text-[#52c5d4]"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPrivacy(true);
                      }}
                    >
                      Privacy Policy
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Version {PRIVACY_CONTENT.version} • Last updated {PRIVACY_CONTENT.lastUpdated}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrivacy(true)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-900">What happens when you accept:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You agree to comply with all terms and conditions</li>
                <li>You acknowledge our data privacy and security practices</li>
                <li>You consent to our use of cookies and tracking technologies</li>
                <li>Your acceptance is recorded with a timestamp for compliance</li>
                <li>You can review these documents anytime in your profile settings</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleDecline}
            >
              Decline & Logout
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!canAccept}
              className="bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
            >
              Accept & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms and Conditions Full View Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="sr-only">Terms and Conditions</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="px-6 pb-6">
              <TermsAndConditions />
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 pb-6">
            <Button
              onClick={() => {
                setAcceptedTerms(true);
                setShowTerms(false);
              }}
              className="bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
            >
              I Accept the Terms and Conditions
            </Button>
            <Button variant="outline" onClick={() => setShowTerms(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Full View Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="sr-only">Privacy Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="px-6 pb-6">
              <PrivacyPolicy />
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 pb-6">
            <Button
              onClick={() => {
                setAcceptedPrivacy(true);
                setShowPrivacy(false);
              }}
              className="bg-[#62d5e4] hover:bg-[#52c5d4] text-white"
            >
              I Accept the Privacy Policy
            </Button>
            <Button variant="outline" onClick={() => setShowPrivacy(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
