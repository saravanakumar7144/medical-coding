import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  MoreVertical,
  Download,
  Users,
  RefreshCw,
  XCircle,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export type ClaimInboxStatus =
  | "submitted"
  | "processing"
  | "accepted"
  | "rejected_ch"
  | "rejected_payer"
  | "denied"
  | "era_exception"
  | "ready_to_bill";

export interface ClaimInboxItem {
  id: string;
  patientName: string;
  patientId: string;
  payer: string;
  dos: string; // Date of Service
  submittedDate: string;
  accountNumber: string;
  invoiceNumber?: string;
  status: ClaimInboxStatus;
  billedAmount: number;
  allowedAmount?: number;
  balance: number;
  rejectReason?: string;
  rejectCode?: string;
  denialCode?: string;
  denialReason?: string;
  priority?: "urgent" | "high" | "medium" | "low";
}

interface ClaimsInboxProps {
  onOpenClaim: (claimId: string, section?: string) => void;
  onOpenERA?: (claimId: string) => void;
  onOpenDenial?: (claimId: string) => void;
}

// Mock data
const mockClaims: ClaimInboxItem[] = [
  {
    id: "CLM-2024-1001",
    patientName: "Sarah Johnson",
    patientId: "PT-88291",
    payer: "Medicare",
    dos: "10/15/24",
    submittedDate: "10/16/24",
    accountNumber: "ACC-2024-001",
    invoiceNumber: "INV-45678",
    status: "rejected_ch",
    billedAmount: 450.0,
    allowedAmount: 0,
    balance: 450.0,
    rejectCode: "AAA02",
    rejectReason: "Invalid/Missing Provider Identifier",
    priority: "urgent",
  },
  {
    id: "CLM-2024-1002",
    patientName: "Michael Chen",
    patientId: "PT-88292",
    payer: "Blue Cross Blue Shield",
    dos: "10/14/24",
    submittedDate: "10/15/24",
    accountNumber: "ACC-2024-002",
    status: "rejected_payer",
    billedAmount: 1250.0,
    allowedAmount: 0,
    balance: 1250.0,
    rejectCode: "CO-16",
    rejectReason: "Claim/service lacks information or has submission/billing error(s)",
    priority: "high",
  },
  {
    id: "CLM-2024-1003",
    patientName: "Emily Rodriguez",
    patientId: "PT-88293",
    payer: "Aetna",
    dos: "10/13/24",
    submittedDate: "10/14/24",
    accountNumber: "ACC-2024-003",
    status: "denied",
    billedAmount: 875.5,
    allowedAmount: 0,
    balance: 875.5,
    denialCode: "CO-197",
    denialReason: "Precertification/authorization/notification absent",
    priority: "high",
  },
  {
    id: "CLM-2024-1004",
    patientName: "David Martinez",
    patientId: "PT-88294",
    payer: "UnitedHealthcare",
    dos: "10/12/24",
    submittedDate: "10/13/24",
    accountNumber: "ACC-2024-004",
    status: "era_exception",
    billedAmount: 650.0,
    allowedAmount: 450.0,
    balance: 200.0,
    rejectReason: "Payment amount mismatch - Paid to different account",
    priority: "medium",
  },
  {
    id: "CLM-2024-1005",
    patientName: "Jennifer Lee",
    patientId: "PT-88295",
    payer: "Cigna",
    dos: "10/11/24",
    submittedDate: "10/12/24",
    accountNumber: "ACC-2024-005",
    status: "ready_to_bill",
    billedAmount: 325.0,
    allowedAmount: 275.0,
    balance: 50.0,
    priority: "low",
  },
  {
    id: "CLM-2024-1006",
    patientName: "Robert Williams",
    patientId: "PT-88296",
    payer: "Medicare",
    dos: "10/10/24",
    submittedDate: "10/11/24",
    accountNumber: "ACC-2024-006",
    status: "processing",
    billedAmount: 2100.0,
    allowedAmount: 0,
    balance: 2100.0,
    priority: "medium",
  },
  {
    id: "CLM-2024-1007",
    patientName: "Amanda Brown",
    patientId: "PT-88297",
    payer: "Blue Cross Blue Shield",
    dos: "10/09/24",
    submittedDate: "10/10/24",
    accountNumber: "ACC-2024-007",
    status: "accepted",
    billedAmount: 780.0,
    allowedAmount: 780.0,
    balance: 0,
    priority: "low",
  },
  {
    id: "CLM-2024-1008",
    patientName: "James Wilson",
    patientId: "PT-88298",
    payer: "Aetna",
    dos: "10/08/24",
    submittedDate: "10/09/24",
    accountNumber: "ACC-2024-008",
    status: "denied",
    billedAmount: 1450.0,
    allowedAmount: 0,
    balance: 1450.0,
    denialCode: "CO-11",
    denialReason: "Diagnosis inconsistent with procedure",
    priority: "urgent",
  },
];

export function ClaimsInbox({ onOpenClaim, onOpenERA, onOpenDenial }: ClaimsInboxProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [groupByDate, setGroupByDate] = useState(false);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);

  // API state
  const [claims, setClaims] = useState<ClaimInboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch claims from API
  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${apiUrl}/api/claims/claims?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Map API response to ClaimInboxItem format
        const mappedClaims: ClaimInboxItem[] = data.map((claim: any) => ({
          id: claim.claim_id,
          patientName: `${claim.patient_first_name || ''} ${claim.patient_last_name || ''}`.trim() || 'N/A',
          patientId: claim.patient_id,
          payer: claim.payer_name || 'Unknown',
          dos: claim.service_date_from ? new Date(claim.service_date_from).toLocaleDateString() : 'N/A',
          submittedDate: claim.submission_date ? new Date(claim.submission_date).toLocaleDateString() : 'N/A',
          accountNumber: claim.claim_number,
          invoiceNumber: claim.claim_number,
          status: mapClaimStatus(claim.claim_status, claim.is_denied),
          billedAmount: claim.total_charge_amount || 0,
          allowedAmount: claim.paid_amount || 0,
          balance: (claim.total_charge_amount || 0) - (claim.paid_amount || 0),
          rejectReason: claim.is_denied ? 'See denial management' : undefined,
          denialReason: claim.is_denied ? 'See denial management' : undefined,
          priority: claim.is_denied ? 'urgent' : 'medium',
        }));
        setClaims(mappedClaims);
      } else {
        setError('Failed to load claims');
        // Fallback to mockClaims on error
        setClaims(mockClaims);
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError('Failed to connect to API');
      // Fallback to mockClaims on error
      setClaims(mockClaims);
    } finally {
      setLoading(false);
    }
  };

  // Map API claim status to ClaimInboxStatus
  const mapClaimStatus = (apiStatus: string, isDenied: boolean): ClaimInboxStatus => {
    if (isDenied) return 'denied';
    switch (apiStatus) {
      case 'Submitted': return 'submitted';
      case 'Accepted': return 'accepted';
      case 'Rejected': return 'rejected_payer';
      case 'Paid': return 'accepted';
      case 'Ready': return 'ready_to_bill';
      default: return 'processing';
    }
  };

  const filteredClaims = useMemo(() => {
    switch (activeTab) {
      case "needs-attention":
        return claims.filter(
          (c) =>
            c.status === "rejected_ch" ||
            c.status === "rejected_payer" ||
            c.status === "denied" ||
            c.status === "era_exception"
        );
      case "rejected-ch":
        return claims.filter((c) => c.status === "rejected_ch");
      case "rejected-payer":
        return claims.filter((c) => c.status === "rejected_payer");
      case "denials":
        return claims.filter((c) => c.status === "denied");
      case "era-exceptions":
        return claims.filter((c) => c.status === "era_exception");
      case "ready-to-bill":
        return claims.filter((c) => c.status === "ready_to_bill");
      default:
        return claims;
    }
  }, [activeTab, claims]);

  const groupedClaims = useMemo(() => {
    if (!groupByDate) return { ungrouped: filteredClaims };

    const groups: Record<string, ClaimInboxItem[]> = {};
    filteredClaims.forEach((claim) => {
      const date = claim.submittedDate;
      if (!groups[date]) groups[date] = [];
      groups[date].push(claim);
    });
    return groups;
  }, [filteredClaims, groupByDate]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClaims(filteredClaims.map((c) => c.id));
    } else {
      setSelectedClaims([]);
    }
  };

  const handleSelectClaim = (claimId: string, checked: boolean) => {
    if (checked) {
      setSelectedClaims([...selectedClaims, claimId]);
    } else {
      setSelectedClaims(selectedClaims.filter((id) => id !== claimId));
    }
  };

  const getStatusBadge = (status: ClaimInboxStatus) => {
    const badges = {
      submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700" },
      processing: { label: "Processing", color: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", color: "bg-green-100 text-green-700" },
      rejected_ch: { label: "Rejected (CH)", color: "bg-red-100 text-red-700" },
      rejected_payer: { label: "Rejected (Payer)", color: "bg-orange-100 text-orange-700" },
      denied: { label: "Denied", color: "bg-red-100 text-red-700" },
      era_exception: { label: "ERA Exception", color: "bg-purple-100 text-purple-700" },
      ready_to_bill: { label: "Ready to Bill", color: "bg-cyan-100 text-cyan-700" },
    };

    const badge = badges[status];
    return (
      <Badge className={`${badge.color} h-7 px-3`} variant="secondary">
        {badge.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;

    const badges = {
      urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
      high: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200" },
      medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      low: { label: "Low", color: "bg-gray-100 text-gray-700 border-gray-200" },
    };

    const badge = badges[priority as keyof typeof badges];
    return (
      <Badge className={`${badge.color} h-7 px-3`} variant="outline">
        {badge.label}
      </Badge>
    );
  };

  const handleBulkResubmit = () => {
    console.log("Bulk resubmit:", selectedClaims);
    // Implementation would go here
  };

  const handleBulkAssign = () => {
    console.log("Bulk assign:", selectedClaims);
    // Implementation would go here
  };

  const handleExportCSV = () => {
    console.log("Export CSV:", selectedClaims.length > 0 ? selectedClaims : filteredClaims);
    // Implementation would go here
  };

  const renderClaimRow = (claim: ClaimInboxItem) => {
    const isSelected = selectedClaims.includes(claim.id);
    const reason = claim.rejectReason || claim.denialReason;
    const code = claim.rejectCode || claim.denialCode;

    // Determine which section to deep-link to based on status
    const getSectionAnchor = () => {
      if (claim.status === "rejected_ch" || claim.status === "rejected_payer") {
        return "acknowledgments";
      }
      if (claim.status === "denied") {
        return "denials";
      }
      if (claim.status === "era_exception") {
        return "era";
      }
      return undefined;
    };

    return (
      <TableRow key={claim.id} className={`h-16 ${isSelected ? "bg-cyan-50" : "hover:bg-gray-50 transition-colors"}`}>
        <TableCell className="w-12 px-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectClaim(claim.id, checked as boolean)}
            className="w-5 h-5"
          />
        </TableCell>
        <TableCell className="px-4 py-4">
          <div className="flex items-center gap-3">
            {getPriorityBadge(claim.priority)}
            <div>
              <div className="font-medium">{claim.patientName}</div>
              <div className="text-sm text-gray-500">{claim.patientId}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-4">
          <div>
            <div>{claim.payer}</div>
            <div className="text-sm text-gray-500">{claim.accountNumber}</div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-4">
          <div className="text-sm">
            <div>DOS: {claim.dos}</div>
            <div className="text-gray-500">Sub: {claim.submittedDate}</div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-4">{getStatusBadge(claim.status)}</TableCell>
        <TableCell className="px-4 py-4">
          {reason && (
            <div className="max-w-xs">
              <div className="text-sm font-medium text-red-700">{code}</div>
              <div className="text-xs text-gray-600 truncate">{reason}</div>
            </div>
          )}
        </TableCell>
        <TableCell className="text-right px-4 py-4">
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-gray-500">Billed:</span> ${claim.billedAmount.toFixed(2)}
            </div>
            {claim.allowedAmount !== undefined && claim.allowedAmount > 0 && (
              <div className="text-sm">
                <span className="text-gray-500">Allowed:</span> $
                {claim.allowedAmount.toFixed(2)}
              </div>
            )}
            <div className="text-sm font-medium">
              <span className="text-gray-500">Balance:</span> ${claim.balance.toFixed(2)}
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onOpenClaim(claim.id, getSectionAnchor())}
              className="bg-[#62d5e4] hover:bg-[#4fc5d4] h-9"
            >
              <FileText className="w-4 h-4 mr-1" />
              Open Claim
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenClaim(claim.id)}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload/View Claim Form
                </DropdownMenuItem>
                {claim.status === "era_exception" && onOpenERA && (
                  <DropdownMenuItem onClick={() => onOpenERA(claim.id)}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Open ERA
                  </DropdownMenuItem>
                )}
                {claim.status === "denied" && onOpenDenial && (
                  <DropdownMenuItem onClick={() => onOpenDenial(claim.id)}>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Open Denial
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Claims Inbox</h1>
          <p className="text-sm text-gray-600">
            Unified view of all claims requiring attention
          </p>
        </div>

        {/* Bulk Actions */}
        {selectedClaims.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedClaims.length} selected</span>
            <Button variant="outline" size="sm" onClick={handleBulkResubmit}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Bulk Resubmit
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkAssign}>
              <Users className="w-4 h-4 mr-2" />
              Bulk Assign
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Switch
              id="group-by-date"
              checked={groupByDate}
              onCheckedChange={setGroupByDate}
            />
            <Label htmlFor="group-by-date" className="text-sm font-medium cursor-pointer">
              Group by Date
            </Label>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-10">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">All ({claims.length})</TabsTrigger>
          <TabsTrigger value="needs-attention">
            Needs Attention (
            {
              claims.filter(
                (c) =>
                  c.status === "rejected_ch" ||
                  c.status === "rejected_payer" ||
                  c.status === "denied" ||
                  c.status === "era_exception"
              ).length
            }
            )
          </TabsTrigger>
          <TabsTrigger value="rejected-ch">
            Rejected—Clearinghouse (
            {claims.filter((c) => c.status === "rejected_ch").length})
          </TabsTrigger>
          <TabsTrigger value="rejected-payer">
            Rejected—Payer ({claims.filter((c) => c.status === "rejected_payer").length})
          </TabsTrigger>
          <TabsTrigger value="denials">
            Denials ({claims.filter((c) => c.status === "denied").length})
          </TabsTrigger>
          <TabsTrigger value="era-exceptions">
            ERA Exceptions ({claims.filter((c) => c.status === "era_exception").length})
          </TabsTrigger>
          <TabsTrigger value="ready-to-bill">
            Ready to Bill ({claims.filter((c) => c.status === "ready_to_bill").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {groupByDate ? (
            // Grouped view
            <div className="space-y-6">
              {Object.entries(groupedClaims).map(([date, claims]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded">
                    <Calendar className="w-4 h-4" />
                    {date} ({claims.length} claims)
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <Table>
                      <TableHeader className="bg-gray-50 sticky top-0">
                        <TableRow className="h-12">
                          <TableHead className="w-12 px-4">
                            <Checkbox
                              checked={claims.every((c) => selectedClaims.includes(c.id))}
                              onCheckedChange={(checked) => {
                                claims.forEach((c) =>
                                  handleSelectClaim(c.id, checked as boolean)
                                );
                              }}
                              className="w-5 h-5"
                            />
                          </TableHead>
                          <TableHead className="px-4 font-semibold">Patient</TableHead>
                          <TableHead className="px-4 font-semibold">Payer / Account</TableHead>
                          <TableHead className="px-4 font-semibold">Dates</TableHead>
                          <TableHead className="px-4 font-semibold">Status</TableHead>
                          <TableHead className="px-4 font-semibold">Reason</TableHead>
                          <TableHead className="text-right px-4 font-semibold">Amounts</TableHead>
                          <TableHead className="px-4 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claims.map((claim) => renderClaimRow(claim))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Regular view
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0">
                  <TableRow className="h-12">
                    <TableHead className="w-12 px-4">
                      <Checkbox
                        checked={filteredClaims.every((c) => selectedClaims.includes(c.id))}
                        onCheckedChange={handleSelectAll}
                        className="w-5 h-5"
                      />
                    </TableHead>
                    <TableHead className="px-4 font-semibold">Patient</TableHead>
                    <TableHead className="px-4 font-semibold">Payer / Account</TableHead>
                    <TableHead className="px-4 font-semibold">Dates</TableHead>
                    <TableHead className="px-4 font-semibold">Status</TableHead>
                    <TableHead className="px-4 font-semibold">Reason</TableHead>
                    <TableHead className="text-right px-4 font-semibold">Amounts</TableHead>
                    <TableHead className="px-4 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.length > 0 ? (
                    filteredClaims.map((claim) => renderClaimRow(claim))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <div>No claims in this category</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}