import { useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  FileText,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Checkbox } from './ui/checkbox';

interface AcknowledgmentItem {
  id: string;
  claimId: string;
  patientName: string;
  patientMRN: string;
  payer: string;
  accountNumber: string;
  dos: string;
  submittedDate: string;
  responseDate: string;
  status: 'rejected_ch' | 'rejected_payer' | 'accepted' | 'pending';
  rejectCode?: string;
  rejectReason?: string;
  billedAmount: number;
  category: 'clearinghouse' | 'payer';
}

interface EnhancedSubmissionsAcknowledgmentsProps {
  onOpenClaim?: (claimId: string, section?: string) => void;
}

// Mock data - Clearinghouse rejections
const mockCHRejections: AcknowledgmentItem[] = [
  {
    id: 'ACK-CH-001',
    claimId: 'CLM-2024-1001',
    patientName: 'Sarah Johnson',
    patientMRN: 'PT-88291',
    payer: 'Medicare',
    accountNumber: 'ACC-2024-001',
    dos: '10/15/24',
    submittedDate: '10/16/24',
    responseDate: '10/16/24',
    status: 'rejected_ch',
    rejectCode: 'AAA02',
    rejectReason: 'Invalid/Missing Provider Identifier - NPI required in Box 24J',
    billedAmount: 450.0,
    category: 'clearinghouse',
  },
  {
    id: 'ACK-CH-002',
    claimId: 'CLM-2024-1015',
    patientName: 'Robert Chen',
    patientMRN: 'PT-88305',
    payer: 'Blue Cross Blue Shield',
    accountNumber: 'ACC-2024-015',
    dos: '10/14/24',
    submittedDate: '10/15/24',
    responseDate: '10/15/24',
    status: 'rejected_ch',
    rejectCode: 'AAA10',
    rejectReason: 'Invalid Date of Service - Future date not allowed',
    billedAmount: 325.0,
    category: 'clearinghouse',
  },
  {
    id: 'ACK-CH-003',
    claimId: 'CLM-2024-1023',
    patientName: 'Maria Garcia',
    patientMRN: 'PT-88312',
    payer: 'Aetna',
    accountNumber: 'ACC-2024-023',
    dos: '10/13/24',
    submittedDate: '10/14/24',
    responseDate: '10/14/24',
    status: 'rejected_ch',
    rejectCode: 'AAA57',
    rejectReason: 'Missing/Invalid Diagnosis Code - Primary diagnosis required',
    billedAmount: 580.0,
    category: 'clearinghouse',
  },
];

// Mock data - Payer rejections
const mockPayerRejections: AcknowledgmentItem[] = [
  {
    id: 'ACK-PAY-001',
    claimId: 'CLM-2024-1002',
    patientName: 'Michael Chen',
    patientMRN: 'PT-88292',
    payer: 'Blue Cross Blue Shield',
    accountNumber: 'ACC-2024-002',
    dos: '10/14/24',
    submittedDate: '10/15/24',
    responseDate: '10/18/24',
    status: 'rejected_payer',
    rejectCode: 'CO-16',
    rejectReason: 'Claim/service lacks information or has submission/billing error(s)',
    billedAmount: 1250.0,
    category: 'payer',
  },
  {
    id: 'ACK-PAY-002',
    claimId: 'CLM-2024-1012',
    patientName: 'Jennifer Lee',
    patientMRN: 'PT-88302',
    payer: 'UnitedHealthcare',
    accountNumber: 'ACC-2024-012',
    dos: '10/12/24',
    submittedDate: '10/13/24',
    responseDate: '10/17/24',
    status: 'rejected_payer',
    rejectCode: 'CO-22',
    rejectReason: 'Payment adjusted - This care may be covered by another payer',
    billedAmount: 890.0,
    category: 'payer',
  },
  {
    id: 'ACK-PAY-003',
    claimId: 'CLM-2024-1019',
    patientName: 'David Martinez',
    patientMRN: 'PT-88309',
    payer: 'Cigna',
    accountNumber: 'ACC-2024-019',
    dos: '10/11/24',
    submittedDate: '10/12/24',
    responseDate: '10/16/24',
    status: 'rejected_payer',
    rejectCode: 'CO-45',
    rejectReason: 'Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement',
    billedAmount: 675.0,
    category: 'payer',
  },
];

export function EnhancedSubmissionsAcknowledgments({
  onOpenClaim,
}: EnhancedSubmissionsAcknowledgmentsProps) {
  const [activeTab, setActiveTab] = useState<'ch' | 'payer'>('ch');
  const [groupByDate, setGroupByDate] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const currentData = activeTab === 'ch' ? mockCHRejections : mockPayerRejections;

  const groupedData = useMemo(() => {
    if (!groupByDate) return { ungrouped: currentData };

    const groups: Record<string, AcknowledgmentItem[]> = {};
    currentData.forEach((item) => {
      const date = item.responseDate;
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [currentData, groupByDate]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(currentData.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    }
  };

  const handleBulkResubmit = () => {
    console.log('Bulk resubmit:', selectedItems);
    // Implementation would resubmit selected items
  };

  const handleExportCSV = () => {
    console.log('Export CSV:', selectedItems.length > 0 ? selectedItems : currentData);
    // Implementation would export data
  };

  const handleOpenClaim = (claimId: string) => {
    // Deep-link to acknowledgments section
    onOpenClaim?.(claimId, 'acknowledgments');
  };

  const renderAckRow = (item: AcknowledgmentItem) => {
    const isSelected = selectedItems.includes(item.id);

    return (
      <TableRow key={item.id} className={isSelected ? 'bg-cyan-50' : ''}>
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
          />
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{item.patientName}</div>
            <div className="text-sm text-gray-500">{item.patientMRN}</div>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <div>{item.payer}</div>
            <div className="text-sm text-gray-500">{item.accountNumber}</div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div>DOS: {item.dos}</div>
            <div className="text-gray-500">Sub: {item.submittedDate}</div>
            <div className="text-gray-500">Resp: {item.responseDate}</div>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            className={
              item.status === 'rejected_ch'
                ? 'bg-red-100 text-red-700'
                : 'bg-orange-100 text-orange-700'
            }
            variant="secondary"
          >
            {item.status === 'rejected_ch' ? 'Rejected (CH)' : 'Rejected (Payer)'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="max-w-sm">
            <div className="text-sm font-medium text-red-700">{item.rejectCode}</div>
            <div className="text-xs text-gray-600">{item.rejectReason}</div>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="font-medium">${item.billedAmount.toFixed(2)}</div>
        </TableCell>
        <TableCell>
          <Button
            size="sm"
            onClick={() => handleOpenClaim(item.claimId)}
            className="bg-[#62d5e4] hover:bg-[#4fc5d4]"
          >
            <FileText className="w-4 h-4 mr-1" />
            Fix
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Submissions & Acknowledgments</h1>
        <p className="text-gray-600 mt-2">
          999/277CA acknowledgments and rejections from clearinghouse and payers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">247</div>
            <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
              <span>↑ 12%</span>
              <span className="text-gray-500">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>CH Rejections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{mockCHRejections.length}</div>
            <div className="text-sm text-gray-500 mt-1">
              {((mockCHRejections.length / 247) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Payer Rejections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{mockPayerRejections.length}</div>
            <div className="text-sm text-gray-500 mt-1">
              {((mockPayerRejections.length / 247) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Acceptance Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">97.6%</div>
            <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
              <span>↑ 2.3%</span>
              <span className="text-gray-500">improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="group-by-date"
              checked={groupByDate}
              onCheckedChange={setGroupByDate}
            />
            <Label htmlFor="group-by-date" className="text-sm cursor-pointer">
              Group by Response Date
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <>
              <span className="text-sm text-gray-600">{selectedItems.length} selected</span>
              <Button variant="outline" size="sm" onClick={handleBulkResubmit}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Bulk Resubmit
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'ch' | 'payer')}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="ch">
            <XCircle className="w-4 h-4 mr-2" />
            Rejected—Clearinghouse ({mockCHRejections.length})
          </TabsTrigger>
          <TabsTrigger value="payer">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Rejected—Payer ({mockPayerRejections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {groupByDate ? (
            // Grouped view
            <div className="space-y-6">
              {Object.entries(groupedData).map(([date, items]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded">
                    <Calendar className="w-4 h-4" />
                    Response Date: {date} ({items.length} items)
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={items.every((item) => selectedItems.includes(item.id))}
                              onCheckedChange={(checked) => {
                                items.forEach((item) =>
                                  handleSelectItem(item.id, checked as boolean)
                                );
                              }}
                            />
                          </TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Payer / Account</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reject Reason</TableHead>
                          <TableHead className="text-right">Billed</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>{items.map((item) => renderAckRow(item))}</TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Regular view
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={currentData.every((item) => selectedItems.includes(item.id))}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Payer / Account</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reject Reason</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.length > 0 ? (
                    currentData.map((item) => renderAckRow(item))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <div>No rejections in this category</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Quick Tip</p>
              <p className="text-sm text-blue-700 mt-1">
                Click the <strong>"Fix"</strong> button to open the claim workspace directly at
                the acknowledgments section. AI Copilot will suggest probable fixes for common
                reject codes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
