"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { CloudUploadIcon, FileIcon, Loader2Icon, XIcon } from "lucide-react"

interface FileUploadZoneProps {
  onUploadComplete: (file: File) => void
}

export function FileUploadZone({ onUploadComplete }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const simulateUpload = (file: File) => {
    setUploadingFile(file)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setUploadingFile(null)
            setProgress(0)
            onUploadComplete(file)
          }, 500)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) simulateUpload(file)
    },
    [onUploadComplete]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) simulateUpload(file)
  }

  if (uploadingFile) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex w-full max-w-sm items-center gap-4 rounded-md border border-border/60 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Loader2Icon className="size-5 animate-spin text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                {uploadingFile.name}
              </p>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border/80 bg-card hover:bg-muted/30"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
        onChange={handleFileChange}
      />
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <CloudUploadIcon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        Kéo thả tệp vào đây hoặc <span className="text-primary">chọn tệp</span>
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Hỗ trợ tài liệu (PDF, Word, Excel) và Multi-media (Video, Audio, Ảnh)
      </p>
    </div>
  )
}
