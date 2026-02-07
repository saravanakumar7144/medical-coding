"use client"

import React, { useState } from "react"
import { Calendar, Download, Filter, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample data for productivity metrics
const productivityData = [
  { name: "Week 1", charts: 120, target: 140 },
  { name: "Week 2", charts: 145, target: 140 },
  { name: "Week 3", charts: 132, target: 140 },
  { name: "Week 4", charts: 158, target: 140 },
]

// Sample data for accuracy metrics
const accuracyData = [
  { name: "Week 1", accuracy: 92, benchmark: 90 },
  { name: "Week 2", accuracy: 94, benchmark: 90 },
  { name: "Week 3", accuracy: 91, benchmark: 90 },
  { name: "Week 4", accuracy: 95, benchmark: 90 },
]

// Sample data for revenue metrics
const revenueData = [
  { name: "Week 1", actual: 45000, potential: 52000 },
  { name: "Week 2", actual: 48000, potential: 53000 },
  { name: "Week 3", actual: 47000, potential: 51000 },
  { name: "Week 4", actual: 51000, potential: 54000 },
]

// Sample data for coding distribution
const codingDistributionData = [
  { name: "Circulatory", value: 35 },
  { name: "Respiratory", value: 20 },
  { name: "Endocrine", value: 15 },
  { name: "Musculoskeletal", value: 10 },
  { name: "Other", value: 20 },
]

// Sample data for coder performance
const coderPerformanceData = [
  { name: "Dr. Johnson", charts: 45, accuracy: 94, revenue: 18500 },
  { name: "Dr. Martinez", charts: 38, accuracy: 92, revenue: 15200 },
  { name: "Dr. Wilson", charts: 32, accuracy: 95, revenue: 14800 },
  { name: "Dr. Thompson", charts: 41, accuracy: 91, revenue: 16900 },
  { name: "Dr. Garcia", charts: 36, accuracy: 93, revenue: 15500 },
]

// Sample data for compliance issues
const complianceIssuesData = [
  { issue: "Missing modifiers", count: 12, impact: "$2,400" },
  { issue: "Upcoding", count: 5, impact: "$3,500" },
  { issue: "Unbundling", count: 8, impact: "$1,800" },
  { issue: "Documentation gaps", count: 15, impact: "$4,200" },
  { issue: "Medical necessity", count: 7, impact: "$2,100" },
]

// Colors for pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState("month")
  const [isLoaded, setIsLoaded] = useState(false)
  
  React.useEffect(() => {
    // This ensures the component is only rendered client-side
    setIsLoaded(true)
  }, [])

  // Only render the component on the client to avoid hydration issues
  if (!isLoaded) {
    return <div className="h-[400px] w-full animate-pulse bg-muted rounded-md"></div>
  }

  return (
    <div className="space-y-4" suppressHydrationWarning>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Charts Coded</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">555</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">93.2%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$191,000</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95.8%</div>
            <p className="text-xs text-muted-foreground">+1.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="productivity">
        <TabsList>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="productivity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Coding Volume</CardTitle>
                <CardDescription>Charts coded vs. target</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ChartContainer
                  config={{
                    charts: {
                      label: "Charts Coded",
                      color: "hsl(var(--chart-1))",
                    },
                    target: {
                      label: "Target",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                >
                    <BarChart data={productivityData} width={500} height={250} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="charts" fill="var(--color-charts)" />
                      <Bar dataKey="target" fill="var(--color-target)" />
                    </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coder Performance</CardTitle>
                <CardDescription>Charts coded by coder</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Coder</TableHead>
                      <TableHead className="text-right">Charts</TableHead>
                      <TableHead className="text-right">Accuracy</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coderPerformanceData.map((coder) => (
                      <TableRow key={coder.name}>
                        <TableCell className="font-medium">{coder.name}</TableCell>
                        <TableCell className="text-right">{coder.charts}</TableCell>
                        <TableCell className="text-right">{coder.accuracy}%</TableCell>
                        <TableCell className="text-right">${coder.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Coding Accuracy</CardTitle>
                <CardDescription>Accuracy percentage vs. benchmark</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ChartContainer
                  config={{
                    accuracy: {
                      label: "Accuracy",
                      color: "hsl(var(--chart-1))",
                    },
                    benchmark: {
                      label: "Benchmark",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                >
                  <LineChart data={accuracyData} width={500} height={250} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[85, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="var(--color-accuracy)" strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      stroke="var(--color-benchmark)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diagnosis Distribution</CardTitle>
                <CardDescription>Distribution of coding categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ChartContainer
                  config={{
                    circulatory: {
                      label: "Circulatory",
                      color: COLORS[0],
                    },
                    respiratory: {
                      label: "Respiratory",
                      color: COLORS[1],
                    },
                    endocrine: {
                      label: "Endocrine",
                      color: COLORS[2],
                    },
                    musculoskeletal: {
                      label: "Musculoskeletal",
                      color: COLORS[3],
                    },
                    other: {
                      label: "Other",
                      color: COLORS[4],
                    },
                  }}
                >
                                      <PieChart width={500} height={250}>
                      {codingDistributionData && codingDistributionData.length > 0 ? (
                        <Pie
                          data={codingDistributionData}
                          cx={250}
                          cy={120}
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {codingDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      ) : (
                        <text x={250} y={120} textAnchor="middle" dominantBaseline="middle">
                          No data available
                        </text>
                      )}
                      <Tooltip />
                    </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analysis</CardTitle>
                <CardDescription>Actual vs. potential revenue</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ChartContainer
                  config={{
                    actual: {
                      label: "Actual Revenue",
                      color: "hsl(var(--chart-1))",
                    },
                    potential: {
                      label: "Potential Revenue",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                >
                    <BarChart data={revenueData} width={500} height={250} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="actual" fill="var(--color-actual)" />
                      <Bar dataKey="potential" fill="var(--color-potential)" />
                    </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Opportunities</CardTitle>
                <CardDescription>Potential additional revenue by addressing issues</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Revenue Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceIssuesData.map((issue) => (
                      <TableRow key={issue.issue}>
                        <TableCell className="font-medium">{issue.issue}</TableCell>
                        <TableCell className="text-right">{issue.count}</TableCell>
                        <TableCell className="text-right">{issue.impact}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Issues</CardTitle>
                <CardDescription>Top compliance issues by frequency</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ChartContainer
                  config={{
                    count: {
                      label: "Issue Count",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                >
                    <BarChart
                      data={complianceIssuesData}
                      width={500}
                      height={250}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="issue" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--color-count)" />
                    </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Trends</CardTitle>
                <CardDescription>Compliance score over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Compliance trend data visualization will be implemented here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
