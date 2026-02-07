import { useState } from "react";
import { Search, Filter, X, Calendar, DollarSign, FileText, User } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

export interface SearchFacets {
  name?: string;
  dos?: string; // Date of Service (MM/DD/YY)
  billedAmount?: string;
  accountNumber?: string;
  serialNumber?: string;
  invoiceNumber?: string;
}

interface GlobalSearchProps {
  onSearch: (query: string, facets: SearchFacets) => void;
  onClose?: () => void;
}

export function GlobalSearch({ onSearch, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [facets, setFacets] = useState<SearchFacets>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearch = () => {
    onSearch(query, facets);
  };

  const handleClearFacet = (key: keyof SearchFacets) => {
    setFacets((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleClearAll = () => {
    setQuery("");
    setFacets({});
  };

  const activeFacetCount = Object.keys(facets).filter(
    (key) => facets[key as keyof SearchFacets]
  ).length;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      onClose?.();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Search by patient name, claim ID, or any keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="pr-10"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filters Popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFacetCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFacetCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Search Filters</h4>
                {activeFacetCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs h-7"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Patient Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Patient Name
                </Label>
                <Input
                  placeholder="e.g., Smith, John"
                  value={facets.name || ""}
                  onChange={(e) => setFacets({ ...facets, name: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Date of Service */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Date of Service (MM/DD/YY)
                </Label>
                <Input
                  placeholder="e.g., 10/15/24"
                  value={facets.dos || ""}
                  onChange={(e) => setFacets({ ...facets, dos: e.target.value })}
                  maxLength={8}
                  className="h-11"
                />
              </div>

              {/* Billed Amount */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Billed Amount
                </Label>
                <Input
                  placeholder="e.g., 500.00"
                  value={facets.billedAmount || ""}
                  onChange={(e) => setFacets({ ...facets, billedAmount: e.target.value })}
                  type="number"
                  step="0.01"
                  className="h-11"
                />
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Account Number
                </Label>
                <Input
                  placeholder="e.g., ACC-2024-001"
                  value={facets.accountNumber || ""}
                  onChange={(e) => setFacets({ ...facets, accountNumber: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Serial Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Serial Number
                </Label>
                <Input
                  placeholder="e.g., SN-12345"
                  value={facets.serialNumber || ""}
                  onChange={(e) => setFacets({ ...facets, serialNumber: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Invoice Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Invoice Number
                </Label>
                <Input
                  placeholder="e.g., INV-2024-456"
                  value={facets.invoiceNumber || ""}
                  onChange={(e) => setFacets({ ...facets, invoiceNumber: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch} className="bg-[#62d5e4] hover:bg-[#4fc5d4]">
          Search
        </Button>
      </div>

      {/* Active Filters */}
      {activeFacetCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-xs text-gray-500">Active filters:</span>
          {Object.entries(facets).map(
            ([key, value]) =>
              value && (
                <Badge key={key} variant="secondary" className="gap-1">
                  {key === "name" && "Name"}
                  {key === "dos" && "DOS"}
                  {key === "billedAmount" && "Amount"}
                  {key === "accountNumber" && "Account"}
                  {key === "serialNumber" && "Serial"}
                  {key === "invoiceNumber" && "Invoice"}
                  : {value}
                  <button
                    onClick={() => handleClearFacet(key as keyof SearchFacets)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )
          )}
        </div>
      )}
    </div>
  );
}