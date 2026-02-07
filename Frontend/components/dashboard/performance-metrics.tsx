"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer } from "@/components/ui/chart"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Bar,
  BarChart,
} from "recharts"

// Sample data for performance metrics
const codingVolumeData = [
  { date: "Mon", charts: 12 },
  { date: "Tue", charts: 18 },
  { date: "Wed", charts: 15 },
  { date: "Thu", charts: 22 },
  { date: "Fri", charts: 20 },
  { date: "Sat", charts: 8 },
  { date: "Sun", charts: 5 },
]

const accuracyData = [
  { date: "Mon", accuracy: 92 },
  { date: "Tue", accuracy: 94 },
  { date: "Wed", accuracy: 91 },
  { date: "Thu", accuracy: 95 },
  { date: "Fri", accuracy: 93 },
  { date: "Sat", accuracy: 96 },
  { date: "Sun", accuracy: 94 },
]

const timePerChartData = [
  { date: "Mon", minutes: 9.5 },
  { date: "Tue", minutes: 8.2 },
  { date: "Wed", minutes: 8.7 },
  { date: "Thu", minutes: 7.9 },
  { date: "Fri", minutes: 8.1 },
  { date: "Sat", minutes: 8.5 },
  { date: "Sun", minutes: 9.2 },
]

const coderPerformanceData = [
  { name: "Dr. Johnson", charts: 45, accuracy: 94, avgTime: 7.8 },
  { name: "Dr. Martinez", charts: 38, accuracy: 92, avgTime: 8.5 },
  { name: "Dr. Wilson", charts: 32, accuracy: 95, avgTime: 9.2 },
  { name: "Dr. Thompson", charts: 41, accuracy: 91, avgTime: 8.1 },
]

export function PerformanceMetrics() {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="by-coder">By Coder</TabsTrigger>
        <TabsTrigger value="trends">Trends</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Coding Volume</CardTitle>
              <CardDescription>Charts coded per day</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer
                config={{
                  charts: {
                    label: "Charts",
                    color: "hsl(var(--chart-1))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={codingVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="charts" fill="var(--color-charts)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accuracy</CardTitle>
              <CardDescription>Coding accuracy percentage</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer
                config={{
                  accuracy: {
                    label: "Accuracy",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[85, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="accuracy" stroke="var(--color-accuracy)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Per Chart</CardTitle>
              <CardDescription>Average minutes per chart</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer
                config={{
                  minutes: {
                    label: "Minutes",
                    color: "hsl(var(--chart-3))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timePerChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[5, 12]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="minutes" stroke="var(--color-minutes)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="by-coder">
        <Card>
          <CardHeader>
            <CardTitle>Coder Performance</CardTitle>
            <CardDescription>Comparison of coder metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ChartContainer
                config={{
                  charts: {
                    label: "Charts Coded",
                    color: "hsl(var(--chart-1))",
                  },
                  accuracy: {
                    label: "Accuracy (%)",
                    color: "hsl(var(--chart-2))",
                  },
                  avgTime: {
                    label: "Avg. Time (min)",
                    color: "hsl(var(--chart-3))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coderPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="charts" fill="var(--color-charts)" />
                    <Bar dataKey="accuracy" fill="var(--color-accuracy)" />
                    <Bar dataKey="avgTime" fill="var(--color-avgTime)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="trends">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>30-day rolling averages</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-12">Trend data visualization will be implemented here</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
