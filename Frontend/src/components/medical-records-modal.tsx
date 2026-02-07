import { useState } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Lock,
  Unlock,
  Download,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Input } from './ui/input';

interface MedicalRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientMRN: string;
  claimId: string;
}

interface AccessLogEntry {
  id: string;
  user: string;
  role: string;
  accessTime: string;
  duration: string;
  action: string;
}

interface MedicalDocument {
  id: string;
  type: string;
  date: string;
  provider: string;
  description: string;
}

// Mock access log
const mockAccessLog: AccessLogEntry[] = [
  {
    id: 'LOG-001',
    user: 'Dr. Sarah Johnson',
    role: 'Medical Coder',
    accessTime: '10/23/24 09:15 AM',
    duration: '5 min',
    action: 'Viewed medical notes',
  },
  {
    id: 'LOG-002',
    user: 'Michael Chen',
    role: 'Billing Specialist',
    accessTime: '10/22/24 02:30 PM',
    duration: '3 min',
    action: 'Downloaded claim form',
  },
  {
    id: 'LOG-003',
    user: 'Jennifer Martinez',
    role: 'Manager',
    accessTime: '10/21/24 11:45 AM',
    duration: '7 min',
    action: 'Audit review',
  },
];

// Mock documents
const mockDocuments: MedicalDocument[] = [
  {
    id: 'DOC-001',
    type: 'Progress Note',
    date: '10/15/24',
    provider: 'Dr. Williams',
    description: 'Office visit - Type 2 Diabetes management',
  },
  {
    id: 'DOC-002',
    type: 'Lab Results',
    date: '10/15/24',
    provider: 'LabCorp',
    description: 'HbA1c, Lipid panel, Metabolic panel',
  },
  {
    id: 'DOC-003',
    type: 'CMS-1500',
    date: '10/16/24',
    provider: 'Billing Dept',
    description: 'Submitted claim form',
  },
];

export function MedicalRecordsModal({
  isOpen,
  onClose,
  patientName,
  patientMRN,
  claimId,
}: MedicalRecordsModalProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [phiMasked, setPhiMasked] = useState(true);
  const [password, setPassword] = useState('');
  const [accessStartTime] = useState(new Date());

  const handleUnlock = () => {
    // In real implementation, this would verify credentials
    if (password === 'demo') {
      setIsUnlocked(true);
      // Log access attempt
      console.log('Medical records accessed:', {
        user: 'Current User',
        patient: patientMRN,
        claim: claimId,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleClose = () => {
    const duration = Math.floor((new Date().getTime() - accessStartTime.getTime()) / 1000 / 60);
    console.log('Medical records session ended. Duration:', duration, 'minutes');
    setIsUnlocked(false);
    setPassword('');
    setPhiMasked(true);
    onClose();
  };

  const maskPHI = (text: string) => {
    if (!phiMasked) return text;
    return '●●●●●●●●';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-8">
        {/* High-Security Banner */}
        <div className="bg-red-600 text-white px-6 py-4 -mx-8 -mt-8 mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">HIGH SECURITY AREA</span>
                <Badge className="bg-red-800 text-white" variant="secondary">
                  PHI Protected
                </Badge>
              </div>
              <p className="text-sm text-red-100 mt-1">
                Access to Protected Health Information - All activity is logged and monitored for
                HIPAA compliance
              </p>
            </div>
            {isUnlocked && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPhiMasked(!phiMasked)}
                className="text-white hover:bg-red-700"
              >
                {phiMasked ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Unmask PHI
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Mask PHI
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <DialogHeader className="pb-4 border-b border-gray-200 mb-6">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Medical Records Access
          </DialogTitle>
          <DialogDescription>
            Patient: <span className="font-medium">{patientName}</span> (
            {maskPHI(patientMRN)}) | Claim: {claimId}
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          // Access Gate
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Authentication Required</h3>
                <p className="text-sm text-gray-600">
                  Enter your credentials to access protected health information
                </p>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>HIPAA Compliance Notice:</strong> Unauthorized access to medical records
                  is prohibited. All access attempts are logged with user identity, timestamp, and
                  duration.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Demo: Use password "demo" to unlock
                  </p>
                </div>

                <Button
                  onClick={handleUnlock}
                  disabled={!password}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock Medical Records
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>Your access will be logged as:</p>
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  <div>User: Dr. Sarah Johnson (Current User)</div>
                  <div>Role: Medical Coder</div>
                  <div>Time: {new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Medical Records Content
          <Tabs defaultValue="documents" className="flex-1 flex flex-col">
            <TabsList>
              <TabsTrigger value="documents">Medical Documents</TabsTrigger>
              <TabsTrigger value="access-log">Access Log</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="flex-1 overflow-y-auto space-y-6">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Badge variant="outline">{doc.type}</Badge>
                        </TableCell>
                        <TableCell>{doc.date}</TableCell>
                        <TableCell>{phiMasked ? maskPHI(doc.provider) : doc.provider}</TableCell>
                        <TableCell className="max-w-md">
                          {phiMasked ? maskPHI(doc.description) : doc.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Sample Medical Note (Masked) */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Progress Note - 10/15/24</h4>
                  <Badge className="bg-blue-100 text-blue-700" variant="secondary">
                    {phiMasked ? 'PHI Masked' : 'PHI Visible'}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm bg-gray-50 p-4 rounded font-mono">
                  <p>
                    <strong>Chief Complaint:</strong>{' '}
                    {phiMasked ? maskPHI('Diabetes follow-up') : 'Diabetes follow-up'}
                  </p>
                  <p>
                    <strong>HPI:</strong>{' '}
                    {phiMasked
                      ? maskPHI('Patient reports...')
                      : 'Patient reports good glucose control with current regimen...'}
                  </p>
                  <p>
                    <strong>Assessment:</strong>{' '}
                    {phiMasked ? maskPHI('E11.9') : 'E11.9 - Type 2 Diabetes Mellitus'}
                  </p>
                  <p>
                    <strong>Plan:</strong>{' '}
                    {phiMasked ? maskPHI('Continue current...') : 'Continue current medications...'}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access-log" className="flex-1 overflow-y-auto">
              <div className="space-y-6">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Audit Trail:</strong> All access to this patient's records is logged
                    for HIPAA compliance. Records are retained for 7 years.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Access Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockAccessLog.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {entry.user}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.role}</Badge>
                          </TableCell>
                          <TableCell>{entry.accessTime}</TableCell>
                          <TableCell>{entry.duration}</TableCell>
                          <TableCell className="text-sm text-gray-600">{entry.action}</TableCell>
                        </TableRow>
                      ))}
                      {/* Current session */}
                      <TableRow className="bg-green-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Dr. Sarah Johnson (You)</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700" variant="secondary">
                            Medical Coder
                          </Badge>
                        </TableCell>
                        <TableCell>{accessStartTime.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700" variant="secondary">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-green-700">
                          Current session
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Footer with session info */}
        {isUnlocked && (
          <div className="border-t pt-4 -mx-6 px-6 -mb-6 pb-6 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Session started: {accessStartTime.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>HIPAA Compliant</span>
                </div>
              </div>
              <Button onClick={handleClose} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Close & End Session
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
