"use client"

import { useState } from "react"
import { Bookmark, BookmarkPlus, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample code data
const codeData = {
  icd10: [
    { code: "I20.9", description: "Angina pectoris, unspecified", category: "Circulatory" },
    {
      code: "I21.3",
      description: "ST elevation (STEMI) myocardial infarction of unspecified site",
      category: "Circulatory",
    },
    { code: "I10", description: "Essential (primary) hypertension", category: "Circulatory" },
    { code: "E11.9", description: "Type 2 diabetes mellitus without complications", category: "Endocrine" },
    { code: "E78.5", description: "Hyperlipidemia, unspecified", category: "Endocrine" },
    { code: "J44.9", description: "Chronic obstructive pulmonary disease, unspecified", category: "Respiratory" },
    { code: "J45.909", description: "Unspecified asthma, uncomplicated", category: "Respiratory" },
    { code: "K21.9", description: "Gastro-esophageal reflux disease without esophagitis", category: "Digestive" },
  ],
  cpt: [
    { code: "99223", description: "Initial hospital care, comprehensive", category: "E/M" },
    { code: "99232", description: "Subsequent hospital care, expanded problem focused", category: "E/M" },
    { code: "99213", description: "Office/outpatient visit, established patient", category: "E/M" },
    { code: "93000", description: "Electrocardiogram, routine with interpretation and report", category: "Cardiology" },
    { code: "93306", description: "Echocardiography, complete", category: "Cardiology" },
    { code: "71045", description: "X-ray, chest, single view", category: "Radiology" },
    { code: "71046", description: "X-ray, chest, 2 views", category: "Radiology" },
  ],
  hcpcs: [
    { code: "G0008", description: "Administration of influenza virus vaccine", category: "Immunization" },
    { code: "G0009", description: "Administration of pneumococcal vaccine", category: "Immunization" },
    {
      code: "G0101",
      description: "Cervical or vaginal cancer screening; pelvic and clinical breast examination",
      category: "Screening",
    },
    {
      code: "G0105",
      description: "Colorectal cancer screening; colonoscopy on individual at high risk",
      category: "Screening",
    },
  ],
}

// Sample favorites
const favoriteCodes = [
  { code: "I10", description: "Essential (primary) hypertension", type: "ICD-10" },
  { code: "E11.9", description: "Type 2 diabetes mellitus without complications", type: "ICD-10" },
  { code: "99213", description: "Office/outpatient visit, established patient", type: "CPT" },
  { code: "G0008", description: "Administration of influenza virus vaccine", type: "HCPCS" },
]

// Sample guidelines
const guidelines = [
  {
    title: "CMS ICD-10-CM Official Guidelines",
    description: "Official coding guidelines for ICD-10-CM diagnosis coding",
    source: "CMS",
    updated: "October 1, 2023",
  },
  {
    title: "CPT Assistant",
    description: "Monthly publication with CPT coding guidance and updates",
    source: "AMA",
    updated: "May 15, 2023",
  },
  {
    title: "Medicare Claims Processing Manual",
    description: "Guidelines for processing Medicare claims",
    source: "CMS",
    updated: "April 1, 2023",
  },
  {
    title: "Local Coverage Determination (LCD) - Diabetes",
    description: "Medicare coverage and documentation requirements for diabetes testing and treatment",
    source: "Medicare Administrative Contractor",
    updated: "March 15, 2023",
  },
  {
    title: "Coding Clinic for ICD-10-CM/PCS",
    description: "Official advice for ICD-10 coding questions",
    source: "AHA",
    updated: "Q1 2023",
  },
]

export function CodeLibrary() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filterCodes = (codes: any[], category: string) => {
    return codes.filter(
      (code) =>
        (searchTerm === "" ||
          code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          code.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (category === "all" || code.category === category),
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Code Search</CardTitle>
              <CardDescription>Search for ICD-10, CPT, and HCPCS codes</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search codes or descriptions..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Circulatory">Circulatory</SelectItem>
                  <SelectItem value="Respiratory">Respiratory</SelectItem>
                  <SelectItem value="Endocrine">Endocrine</SelectItem>
                  <SelectItem value="Digestive">Digestive</SelectItem>
                  <SelectItem value="E/M">E/M</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Radiology">Radiology</SelectItem>
                  <SelectItem value="Immunization">Immunization</SelectItem>
                  <SelectItem value="Screening">Screening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="icd10">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="icd10"
                className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-3 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                ICD-10
              </TabsTrigger>
              <TabsTrigger
                value="cpt"
                className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-3 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                CPT
              </TabsTrigger>
              <TabsTrigger
                value="hcpcs"
                className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-3 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                HCPCS
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 py-3 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Favorites
              </TabsTrigger>
            </TabsList>
            <TabsContent value="icd10" className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[100px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterCodes(codeData.icd10, selectedCategory).map((code) => (
                    <TableRow key={code.code}>
                      <TableCell className="font-medium">{code.code}</TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>{code.category}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <BookmarkPlus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filterCodes(codeData.icd10, selectedCategory).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No codes found matching your search criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="cpt" className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[100px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterCodes(codeData.cpt, selectedCategory).map((code) => (
                    <TableRow key={code.code}>
                      <TableCell className="font-medium">{code.code}</TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>{code.category}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <BookmarkPlus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filterCodes(codeData.cpt, selectedCategory).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No codes found matching your search criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="hcpcs" className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[100px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterCodes(codeData.hcpcs, selectedCategory).map((code) => (
                    <TableRow key={code.code}>
                      <TableCell className="font-medium">{code.code}</TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>{code.category}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <BookmarkPlus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filterCodes(codeData.hcpcs, selectedCategory).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No codes found matching your search criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="favorites" className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[100px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {favoriteCodes
                    .filter(
                      (code) =>
                        searchTerm === "" ||
                        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        code.description.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((code) => (
                      <TableRow key={code.code}>
                        <TableCell className="font-medium">{code.code}</TableCell>
                        <TableCell>{code.description}</TableCell>
                        <TableCell>{code.type}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coding Guidelines & References</CardTitle>
          <CardDescription>Access official coding guidelines and references</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guidelines.map((guideline) => (
              <Card key={guideline.title} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{guideline.title}</CardTitle>
                  <CardDescription>{guideline.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{guideline.source}</Badge>
                      <span className="text-xs text-muted-foreground">Updated: {guideline.updated}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
