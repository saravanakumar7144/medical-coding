import { BatchProcessing } from "@/components/batch-processing/batch-processing"

export default function BatchProcessingPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Batch Processing</h1>
      </div>
      <BatchProcessing />
    </div>
  )
}
