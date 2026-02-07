"use client"

import { useRef, ReactNode } from "react"
import { Button } from "./button"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  className?: string
  children: ReactNode
}

export function FileUpload({ onFileSelect, disabled, className, children }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={className}
        variant="outline"
      >
        {children}
      </Button>
    </>
  )
}