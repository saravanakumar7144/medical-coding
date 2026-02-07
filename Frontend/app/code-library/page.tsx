import { CodeLibrary } from "@/components/code-library/code-library"

export default function CodeLibraryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Code Library & Reference</h1>
      </div>
      <CodeLibrary />
    </div>
  )
}
