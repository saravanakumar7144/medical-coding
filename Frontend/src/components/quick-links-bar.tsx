import { 
  FileText, 
  CheckCircle, 
  DollarSign, 
  AlertTriangle, 
  Search,
  PlusCircle,
  BarChart3,
  Settings,
  PanelLeft,
  PanelLeftClose
} from "lucide-react";
import { Button } from "./ui/button";

interface QuickLinksBarProps {
  onNavigate: (page: string) => void;
  currentPage?: string;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
}

const quickLinks = [
  { id: "claims-inbox", label: "Claims Inbox", icon: FileText, shortcut: "G I" },
  { id: "acknowledgments", label: "Acks", icon: CheckCircle, shortcut: "G A" },
  { id: "eras", label: "ERA", icon: DollarSign, shortcut: "G E" },
  { id: "denials", label: "Denials", icon: AlertTriangle, shortcut: "G D" },
  { id: "reports", label: "Reports", icon: BarChart3, shortcut: "G R" },
] as const;

export function QuickLinksBar({ onNavigate, currentPage, showSidebar = true, onToggleSidebar }: QuickLinksBarProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between gap-6">
        {/* Quick Links */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Button - Increased size */}
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="mr-2 hover:bg-gray-100 h-10 w-10 p-0"
              title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
            >
              {showSidebar ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeft className="w-5 h-5" />
              )}
            </Button>
          )}
          
          <span className="text-sm font-medium text-gray-500 mr-1">Quick Links:</span>
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPage === link.id;
            
            return (
              <Button
                key={link.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onNavigate(link.id)}
                className={`h-10 gap-2 ${isActive ? "bg-[#62d5e4] hover:bg-[#4fc5d4]" : ""}`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Button>
            );
          })}
        </div>

        {/* Action Buttons - Increased spacing */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("search")}
            className="gap-2 h-10"
          >
            <Search className="w-4 h-4" />
            Search
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-xs text-gray-600">
              /
            </kbd>
          </Button>
          
          <Button
            size="sm"
            onClick={() => onNavigate("new-claim")}
            className="bg-[#62d5e4] hover:bg-[#4fc5d4] gap-2 h-10"
          >
            <PlusCircle className="w-4 h-4" />
            Fresh Claim
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-cyan-300 bg-cyan-100 px-1.5 font-mono text-xs text-cyan-800">
              N
            </kbd>
          </Button>
        </div>
      </div>

      {/* Keyboard shortcuts hint - Better spacing */}
      <div className="mt-3 text-xs text-gray-400 flex items-center gap-6">
        <span className="font-medium">Keyboard shortcuts:</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">/</kbd> Search</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">N</kbd> New claim</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">G+A</kbd> Acknowledgments</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">G+E</kbd> ERA</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">G+D</kbd> Denials</span>
      </div>
    </div>
  );
}