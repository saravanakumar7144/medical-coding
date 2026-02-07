"use client"

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"

function AnalyticsError() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-semibold">Unable to load analytics data</h2>
      <p>There was an error loading the analytics dashboard. Please try again later.</p>
    </div>
  )
}

function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-semibold">Loading analytics data...</h2>
      <div className="h-[400px] w-full animate-pulse bg-muted rounded-md"></div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
      </div>
      <div suppressHydrationWarning>
        <ErrorBoundary fallback={<AnalyticsError />}>
          <Suspense fallback={<AnalyticsLoading />}>
            <AnalyticsDashboard />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}
