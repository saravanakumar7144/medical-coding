import { ChartCodingWorkspace } from "@/components/chart-coding/workspace-polished"

export default function ChartCodingPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Chart Coding Workspace</h1>
      </div>
      <ChartCodingWorkspace />
    </div>
  )
}
