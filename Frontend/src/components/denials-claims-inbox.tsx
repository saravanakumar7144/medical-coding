import { useState, useMemo } from "react";
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
import { PatientClaimDetails } from "./patient-claim-details";

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

interface DenialsClaimsInboxProps {
  onOpenClaim: (claimId: string, section?: string) => void;
  onOpenDenial?: (claimId: string) => void;
}

// Mock data - focused on denials
const mockDenials: ClaimInboxItem[] = [
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
  {
    id: "CLM-2024-001",
    patientName: "John Smith",
    patientId: "PT-88201",
    payer: "Medicare Part B",
    dos: "10/15/24",
    submittedDate: "10/16/24",
    accountNumber: "ACC-2024-101",
    status: "denied",
    billedAmount: 325.0,
    allowedAmount: 0,
    balance: 325.0,
    denialCode: "CO-59",
    denialReason: "Procedure incidental to primary",
    priority: "medium",
  },
  {
    id: "CLM-2024-002",
    patientName: "Maria Garcia",
    patientId: "PT-88202",
    payer: "Blue Cross Blue Shield",
    dos: "10/12/24",
    submittedDate: "10/13/24",
    accountNumber: "ACC-2024-102",
    status: "denied",
    billedAmount: 1850.0,
    allowedAmount: 0,
    balance: 1850.0,
    denialCode: "CO-197",
    denialReason: "Precertification/authorization absent",
    priority: "urgent",
  },
  {
    id: "CLM-2024-003",
    patientName: "Robert Wilson",
    patientId: "PT-88203",
    payer: "UnitedHealthcare",
    dos: "10/10/24",
    submittedDate: "10/11/24",
    accountNumber: "ACC-2024-103",
    status: "denied",
    billedAmount: 485.0,
    allowedAmount: 0,
    balance: 485.0,
    denialCode: "CO-16",
    denialReason: "Claim lacks information or has submission/billing error(s)",
    priority: "high",
  },
];

export function DenialsClaimsInbox({ onOpenClaim, onOpenDenial }: DenialsClaimsInboxProps) {
  const [groupByDate, setGroupByDate] = useState(false);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [selectedPatientClaim, setSelectedPatientClaim] = useState<string | null>(null);

  const filteredClaims = mockDenials;

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
      <Badge className={badge.color} variant="outline">
        {badge.label}
      </Badge>
    );
  };

  const handleBulkResubmit = () => {
    console.log("Bulk resubmit:", selectedClaims);
  };

  const handleBulkAssign = () => {
    console.log("Bulk assign:", selectedClaims);
  };

  const handleExportCSV = () => {
    console.log("Export CSV:", selectedClaims.length > 0 ? selectedClaims : filteredClaims);
  };

  const renderClaimRow = (claim: ClaimInboxItem) => {
    const isSelected = selectedClaims.includes(claim.id);
    const reason = claim.denialReason;
    const code = claim.denialCode;

    return (
      <TableRow 
        key={claim.id} 
        className={`${isSelected ? "bg-cyan-50" : ""} hover:bg-gray-50 cursor-pointer transition-colors`}
        onClick={() => setSelectedPatientClaim(claim.id)}
      >
        <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectClaim(claim.id, checked as boolean)}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {getPriorityBadge(claim.priority)}
            <div>
              <div className="font-medium">{claim.patientName}</div>
              <div className="text-sm text-gray-500">{claim.patientId}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <div>{claim.payer}</div>
            <div className="text-sm text-gray-500">{claim.accountNumber}</div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div>DOS: {claim.dos}</div>
            <div className="text-gray-500">Sub: {claim.submittedDate}</div>
          </div>
        </TableCell>
        <TableCell>
          {reason && (
            <div className="max-w-xs">
              <div className="text-sm font-medium text-red-700">{code}</div>
              <div className="text-xs text-gray-600 truncate">{reason}</div>
            </div>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-gray-500">Billed:</span> ${claim.billedAmount.toFixed(2)}
            </div>
            <div className="text-sm font-medium">
              <span className="text-gray-500">Balance:</span> ${claim.balance.toFixed(2)}
            </div>
          </div>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPatientClaim(claim.id);
              }}
              className="bg-[#62d5e4] hover:bg-[#4fc5d4]"
            >
              <FileText className="w-4 h-4 mr-1" />
              Open
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPatientClaim(claim.id);
                }}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload/View Claim Form
                </DropdownMenuItem>
                {onOpenDenial && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onOpenDenial(claim.id);
                  }}>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Open Denial Workspace
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Denials Inbox</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredClaims.length} denied claims requiring attention
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
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="group-by-date-denials"
              checked={groupByDate}
              onCheckedChange={setGroupByDate}
            />
            <Label htmlFor="group-by-date-denials" className="text-sm cursor-pointer">
              Group by Date
            </Label>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Table */}
      {groupByDate ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(groupedClaims).map(([date, claims]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded">
                <Calendar className="w-4 h-4" />
                {date} ({claims.length} claims)
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={claims.every((c) => selectedClaims.includes(c.id))}
                          onCheckedChange={(checked) => {
                            claims.forEach((c) =>
                              handleSelectClaim(c.id, checked as boolean)
                            );
                          }}
                        />
                      </TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Payer / Account</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Denial Reason</TableHead>
                      <TableHead className="text-right">Amounts</TableHead>
                      <TableHead>Actions</TableHead>
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
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredClaims.every((c) => selectedClaims.includes(c.id))}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Payer / Account</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Denial Reason</TableHead>
                <TableHead className="text-right">Amounts</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.length > 0 ? (
                filteredClaims.map((claim) => renderClaimRow(claim))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <div>No denials found</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Patient Claim Details Modal */}
      {selectedPatientClaim && (
        <PatientClaimDetails
          claimId={selectedPatientClaim}
          onClose={() => setSelectedPatientClaim(null)}
          onOpenDenial={(claimId) => {
            setSelectedPatientClaim(null);
            if (onOpenDenial) {
              onOpenDenial(claimId);
            }
          }}
        />
      )}
    </div>
  );
}