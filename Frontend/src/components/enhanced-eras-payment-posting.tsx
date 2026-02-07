import { useState, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  Eye,
  RefreshCw,
  PlusCircle,
  Check,
  Clock,
  FileText,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface ERAItem {
  id: string;
  claimId: string;
  patientName: string;
  patientMRN: string;
  payer: string;
  accountNumber: string;
  dos: string;
  checkNumber: string;
  checkDate: string;
  billedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  deductible: number;
  copay: number;
  coinsurance: number;
  patientResponsibility: number;
  status: 'posted' | 'exception' | 'pending';
  mismatchCategory?:
    | 'incorrect_amount'
    | 'duplicate'
    | 'paid_to_other_office'
    | 'paid_to_different_account'
    | null;
  mismatchNote?: string;
}

interface RefundItem {
  id: string;
  claimId: string;
  patientName: string;
  payer: string;
  overpaymentAmount: number;
  reason: string;
  checkNumber: string;
  checkDate: string;
  refundDate?: string;
  status: 'pending' | 'initiated' | 'completed';
  createdDate: string;
}

interface EnhancedERAsPaymentPostingProps {
  onOpenClaim?: (claimId: string, section?: string) => void;
}

// Mock ERA data
const mockERAs: ERAItem[] = [
  {
    id: 'ERA-001',
    claimId: 'CLM-2024-1007',
    patientName: 'Amanda Brown',
    patientMRN: 'PT-88297',
    payer: 'Blue Cross Blue Shield',
    accountNumber: 'ACC-2024-007',
    dos: '10/09/24',
    checkNumber: 'CHK-789456',
    checkDate: '10/20/24',
    billedAmount: 780.0,
    allowedAmount: 780.0,
    paidAmount: 780.0,
    deductible: 0,
    copay: 0,
    coinsurance: 0,
    patientResponsibility: 0,
    status: 'posted',
  },
  {
    id: 'ERA-002',
    claimId: 'CLM-2024-1004',
    patientName: 'David Martinez',
    patientMRN: 'PT-88294',
    payer: 'UnitedHealthcare',
    accountNumber: 'ACC-2024-004',
    dos: '10/12/24',
    checkNumber: 'CHK-789457',
    checkDate: '10/19/24',
    billedAmount: 650.0,
    allowedAmount: 450.0,
    paidAmount: 400.0,
    deductible: 30.0,
    copay: 20.0,
    coinsurance: 0,
    patientResponsibility: 50.0,
    status: 'exception',
    mismatchCategory: 'paid_to_different_account',
    mismatchNote: 'Payment credited to wrong patient account',
  },
  {
    id: 'ERA-003',
    claimId: 'CLM-2024-1005',
    patientName: 'Jennifer Lee',
    patientMRN: 'PT-88295',
    payer: 'Cigna',
    accountNumber: 'ACC-2024-005',
    dos: '10/11/24',
    checkNumber: 'CHK-789458',
    checkDate: '10/18/24',
    billedAmount: 325.0,
    allowedAmount: 275.0,
    paidAmount: 255.0,
    deductible: 10.0,
    copay: 20.0,
    coinsurance: 0,
    patientResponsibility: 20.0,
    status: 'posted',
  },
  {
    id: 'ERA-004',
    claimId: 'CLM-2024-1025',
    patientName: 'Thomas Wilson',
    patientMRN: 'PT-88315',
    payer: 'Medicare',
    accountNumber: 'ACC-2024-025',
    dos: '10/08/24',
    checkNumber: 'CHK-789459',
    checkDate: '10/17/24',
    billedAmount: 450.0,
    allowedAmount: 380.0,
    paidAmount: 350.0,
    deductible: 15.0,
    copay: 15.0,
    coinsurance: 0,
    patientResponsibility: 30.0,
    status: 'exception',
    mismatchCategory: 'incorrect_amount',
    mismatchNote: 'Expected $380, received $350. Potential underpayment.',
  },
];

// Mock refund data
const mockRefunds: RefundItem[] = [
  {
    id: 'REF-001',
    claimId: 'CLM-2024-0987',
    patientName: 'Susan Parker',
    payer: 'Aetna',
    overpaymentAmount: 75.0,
    reason: 'Duplicate payment on same DOS',
    checkNumber: 'CHK-789123',
    checkDate: '10/12/24',
    refundDate: '10/22/24',
    status: 'completed',
    createdDate: '10/13/24',
  },
  {
    id: 'REF-002',
    claimId: 'CLM-2024-1018',
    patientName: 'Kevin Zhang',
    payer: 'Blue Cross Blue Shield',
    overpaymentAmount: 120.0,
    reason: 'Paid to wrong provider',
    checkNumber: 'CHK-789234',
    checkDate: '10/15/24',
    status: 'initiated',
    createdDate: '10/16/24',
  },
  {
    id: 'REF-003',
    claimId: 'CLM-2024-1029',
    patientName: 'Rachel Kim',
    payer: 'UnitedHealthcare',
    overpaymentAmount: 50.0,
    reason: 'Incorrect contractual adjustment applied',
    checkNumber: 'CHK-789345',
    checkDate: '10/18/24',
    status: 'pending',
    createdDate: '10/19/24',
  },
];

export function EnhancedERAsPaymentPosting({ onOpenClaim }: EnhancedERAsPaymentPostingProps) {
  const [activeTab, setActiveTab] = useState<'eras' | 'refunds'>('eras');
  const [groupByDate, setGroupByDate] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [newRefund, setNewRefund] = useState({
    claimId: '',
    patientName: '',
    payer: '',
    amount: '',
    reason: '',
  });

  const eraData = mockERAs;
  const refundData = mockRefunds;

  const groupedERAs = useMemo(() => {
    if (!groupByDate) return { ungrouped: eraData };

    const groups: Record<string, ERAItem[]> = {};
    eraData.forEach((item) => {
      const date = item.checkDate;
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [eraData, groupByDate]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const items = activeTab === 'eras' ? eraData : refundData;
      setSelectedItems(items.map((item) => item.id));
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

  const handleBulkPost = () => {
    console.log('Bulk post ERAs:', selectedItems);
  };

  const handleExportCSV = () => {
    console.log('Export CSV');
  };

  const handleCreateRefund = () => {
    console.log('Create refund:', newRefund);
    setIsRefundModalOpen(false);
    setNewRefund({ claimId: '', patientName: '', payer: '', amount: '', reason: '' });
  };

  const getMismatchBadge = (category?: string | null) => {
    if (!category) return null;

    const badges = {
      incorrect_amount: { label: 'Incorrect Amount', color: 'bg-orange-100 text-orange-700' },
      duplicate: { label: 'Duplicate', color: 'bg-red-100 text-red-700' },
      paid_to_other_office: {
        label: 'Paid to Other Office',
        color: 'bg-purple-100 text-purple-700',
      },
      paid_to_different_account: {
        label: 'Wrong Account',
        color: 'bg-yellow-100 text-yellow-700',
      },
    };

    const badge = badges[category as keyof typeof badges];
    if (!badge) return null;

    return (
      <Badge className={badge.color} variant="secondary">
        {badge.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      posted: { label: 'Posted', color: 'bg-green-100 text-green-700' },
      exception: { label: 'Exception', color: 'bg-orange-100 text-orange-700' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
      initiated: { label: 'Initiated', color: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
    };

    const badge = badges[status as keyof typeof badges];
    return (
      <Badge className={badge.color} variant="secondary">
        {badge.label}
      </Badge>
    );
  };

  const renderERARow = (item: ERAItem) => {
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
            <div className="text-gray-500">Check: {item.checkNumber}</div>
            <div className="text-gray-500">Date: {item.checkDate}</div>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-gray-500">Billed:</span> ${item.billedAmount.toFixed(2)}
            </div>
            <div>
              <span className="text-gray-500">Allowed:</span> ${item.allowedAmount.toFixed(2)}
            </div>
            <div className="font-medium">
              <span className="text-gray-500">Paid:</span> ${item.paidAmount.toFixed(2)}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="space-y-1 text-sm">
            {item.deductible > 0 && (
              <div>
                <span className="text-gray-500">Ded:</span> ${item.deductible.toFixed(2)}
              </div>
            )}
            {item.copay > 0 && (
              <div>
                <span className="text-gray-500">Copay:</span> ${item.copay.toFixed(2)}
              </div>
            )}
            {item.coinsurance > 0 && (
              <div>
                <span className="text-gray-500">Coins:</span> ${item.coinsurance.toFixed(2)}
              </div>
            )}
            {item.patientResponsibility > 0 && (
              <div className="font-medium text-[#62d5e4]">
                <span className="text-gray-500">Pt Resp:</span> $
                {item.patientResponsibility.toFixed(2)}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-2">
            {getStatusBadge(item.status)}
            {item.mismatchCategory && getMismatchBadge(item.mismatchCategory)}
          </div>
        </TableCell>
        <TableCell>
          {item.status === 'exception' ? (
            <Button
              size="sm"
              onClick={() => onOpenClaim?.(item.claimId, 'era')}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Review
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onOpenClaim?.(item.claimId, 'era')}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderRefundRow = (item: RefundItem) => {
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
            <div className="text-sm text-gray-500">{item.claimId}</div>
          </div>
        </TableCell>
        <TableCell>{item.payer}</TableCell>
        <TableCell className="text-right">
          <div className="font-medium text-red-600">${item.overpaymentAmount.toFixed(2)}</div>
        </TableCell>
        <TableCell>
          <div className="max-w-xs">
            <div className="text-sm">{item.reason}</div>
            <div className="text-xs text-gray-500 mt-1">
              Check: {item.checkNumber} ({item.checkDate})
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div>Created: {item.createdDate}</div>
            {item.refundDate && <div className="text-gray-500">Refunded: {item.refundDate}</div>}
          </div>
        </TableCell>
        <TableCell>{getStatusBadge(item.status)}</TableCell>
        <TableCell>
          {item.status === 'pending' && (
            <Button size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Process
            </Button>
          )}
          {item.status === 'completed' && (
            <Button size="sm" variant="ghost" disabled>
              <Check className="w-4 h-4 mr-1" />
              Done
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">ERAs & Payment Posting</h1>
        <p className="text-gray-600 mt-2">
          Electronic remittance advice and payment reconciliation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockERAs.length}</div>
            <div className="text-sm text-gray-500 mt-1">This week</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Posted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {mockERAs.filter((e) => e.status === 'posted').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {(
                (mockERAs.filter((e) => e.status === 'posted').length / mockERAs.length) *
                100
              ).toFixed(0)}
              % completion
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Exceptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {mockERAs.filter((e) => e.status === 'exception').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">Require review</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Posted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${mockERAs.reduce((sum, e) => sum + e.paidAmount, 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Payment received</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activeTab === 'eras' && (
            <div className="flex items-center gap-2">
              <Switch
                id="group-by-date"
                checked={groupByDate}
                onCheckedChange={setGroupByDate}
              />
              <Label htmlFor="group-by-date" className="text-sm cursor-pointer">
                Group by Check Date
              </Label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && activeTab === 'eras' && (
            <>
              <span className="text-sm text-gray-600">{selectedItems.length} selected</span>
              <Button variant="outline" size="sm" onClick={handleBulkPost}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Bulk Post
              </Button>
            </>
          )}
          {activeTab === 'refunds' && (
            <Button
              size="sm"
              onClick={() => setIsRefundModalOpen(true)}
              className="bg-[#62d5e4] hover:bg-[#4fc5d4]"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Refund
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'eras' | 'refunds')}
      >
        <TabsList className="w-full justify-start">
          <TabsTrigger value="eras">
            <DollarSign className="w-4 h-4 mr-2" />
            ERA Details ({mockERAs.length})
          </TabsTrigger>
          <TabsTrigger value="refunds">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refunds ({mockRefunds.length})
          </TabsTrigger>
        </TabsList>

        {/* ERA Tab */}
        <TabsContent value="eras" className="mt-4">
          {groupByDate ? (
            <div className="space-y-6">
              {Object.entries(groupedERAs).map(([date, items]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded">
                    <Calendar className="w-4 h-4" />
                    Check Date: {date} ({items.length} ERAs)
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox />
                          </TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Payer / Account</TableHead>
                          <TableHead>Check Info</TableHead>
                          <TableHead className="text-right">Amounts</TableHead>
                          <TableHead className="text-right">Policy Breakdown</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>{items.map((item) => renderERARow(item))}</TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={eraData.every((item) => selectedItems.includes(item.id))}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Payer / Account</TableHead>
                    <TableHead>Check Info</TableHead>
                    <TableHead className="text-right">Amounts</TableHead>
                    <TableHead className="text-right">Policy Breakdown</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{eraData.map((item) => renderERARow(item))}</TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={refundData.every((item) => selectedItems.includes(item.id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Patient / Claim</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead className="text-right">Refund Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundData.length > 0 ? (
                  refundData.map((item) => renderRefundRow(item))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <div>No refunds to process</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Refund Modal */}
      <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Refund Request</DialogTitle>
            <DialogDescription>
              Generate a refund request for overpayment or duplicate payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Claim ID</Label>
              <Input
                placeholder="CLM-2024-XXXX"
                value={newRefund.claimId}
                onChange={(e) => setNewRefund({ ...newRefund, claimId: e.target.value })}
              />
            </div>

            <div>
              <Label>Patient Name</Label>
              <Input
                placeholder="Patient name"
                value={newRefund.patientName}
                onChange={(e) => setNewRefund({ ...newRefund, patientName: e.target.value })}
              />
            </div>

            <div>
              <Label>Payer</Label>
              <Input
                placeholder="Payer name"
                value={newRefund.payer}
                onChange={(e) => setNewRefund({ ...newRefund, payer: e.target.value })}
              />
            </div>

            <div>
              <Label>Refund Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newRefund.amount}
                onChange={(e) => setNewRefund({ ...newRefund, amount: e.target.value })}
              />
            </div>

            <div>
              <Label>Reason</Label>
              <Textarea
                placeholder="Describe the reason for refund..."
                value={newRefund.reason}
                onChange={(e) => setNewRefund({ ...newRefund, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRefund}
              className="bg-[#62d5e4] hover:bg-[#4fc5d4]"
            >
              Create Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
