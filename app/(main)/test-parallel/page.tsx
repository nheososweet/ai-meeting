"use client"

import React, { useState } from "react"
import axios from "axios"
import { getTokenFromStorage } from "@/lib/auth/storage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Play, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw,
  Layers,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiResult {
  endpoint: string
  status: "pending" | "success" | "error"
  duration: number | null
  statusCode: number | null
  dataSample: string
  error?: string
}

const TEST_ENDPOINTS = [
  "/org/companies",
  "/auth/users",
  "/org/permissions",
  "/org/roles",
  "/org/companies?page=1&page_size=1",
  "/auth/users?page=1&page_size=1",
]

const testAxios = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_PIPELINE_API_BASE_URL || "http://220.130.209.122:41432").replace(/\/$/, ""),
  // timeout: 1_500_000,
  headers: {
    accept: "application/json",
  },
})

testAxios.interceptors.request.use((config) => {
  const token = getTokenFromStorage()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default function TestParallelPage() {
  const [results, setResults] = useState<ApiResult[]>([])
  const [loading, setLoading] = useState(false)
  const [totalDuration, setTotalDuration] = useState<number | null>(null)
  const [mode, setMode] = useState<"parallel" | "sequential" | null>(null)

  const runParallelTest = async () => {
    setMode("parallel")
    setLoading(true)
    setTotalDuration(null)
    
    const initialResults: ApiResult[] = TEST_ENDPOINTS.map(url => ({
      endpoint: url,
      status: "pending",
      duration: null,
      statusCode: null,
      dataSample: ""
    }))
    setResults(initialResults)

    const startTime = performance.now()

    try {
      const promises = TEST_ENDPOINTS.map(async (url, index) => {
        const individualStart = performance.now()
        try {
          const response = await testAxios.get(url)
          const individualEnd = performance.now()
          
          setResults(prev => {
            const updated = [...prev]
            updated[index] = {
              ...updated[index],
              status: "success",
              duration: Math.round(individualEnd - individualStart),
              statusCode: response.status,
              dataSample: JSON.stringify(response.data).substring(0, 50) + "..."
            }
            return updated
          })
          return response
        } catch (error: any) {
          const individualEnd = performance.now()
          setResults(prev => {
            const updated = [...prev]
            updated[index] = {
              ...updated[index],
              status: "error",
              duration: Math.round(individualEnd - individualStart),
              statusCode: error.response?.status || 500,
              dataSample: "Error",
              error: error.message
            }
            return updated
          })
          throw error
        }
      })

      await Promise.allSettled(promises)
    } finally {
      const endTime = performance.now()
      setTotalDuration(Math.round(endTime - startTime))
      setLoading(false)
    }
  }

  const runSequentialTest = async () => {
    setMode("sequential")
    setLoading(true)
    setTotalDuration(null)

    const initialResults: ApiResult[] = TEST_ENDPOINTS.map(url => ({
      endpoint: url,
      status: "pending",
      duration: null,
      statusCode: null,
      dataSample: ""
    }))
    setResults(initialResults)

    const startTime = performance.now()

    try {
      for (let i = 0; i < TEST_ENDPOINTS.length; i++) {
        const url = TEST_ENDPOINTS[i]
        const individualStart = performance.now()
        
        try {
          const response = await testAxios.get(url)
          const individualEnd = performance.now()
          
          setResults(prev => {
            const updated = [...prev]
            updated[i] = {
              ...updated[i],
              status: "success",
              duration: Math.round(individualEnd - individualStart),
              statusCode: response.status,
              dataSample: JSON.stringify(response.data).substring(0, 50) + "..."
            }
            return updated
          })
        } catch (error: any) {
          const individualEnd = performance.now()
          setResults(prev => {
            const updated = [...prev]
            updated[i] = {
              ...updated[i],
              status: "error",
              duration: Math.round(individualEnd - individualStart),
              statusCode: error.response?.status || 500,
              dataSample: "Error",
              error: error.message
            }
            return updated
          })
        }
      }
    } finally {
      const endTime = performance.now()
      setTotalDuration(Math.round(endTime - startTime))
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          API Concurrency Tester
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Test and compare parallel vs sequential API calls using pure Axios. 
          Monitor performance, timing, and response integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Parallel Calls</h3>
              <p className="text-xs text-muted-foreground">Promise.all() logic</p>
            </div>
          </div>
          <Button 
            onClick={runParallelTest} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-11"
          >
            {loading && mode === "parallel" ? (
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Parallel Test
          </Button>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Sequential Calls</h3>
              <p className="text-xs text-muted-foreground">Await loop logic</p>
            </div>
          </div>
          <Button 
            onClick={runSequentialTest} 
            disabled={loading}
            variant="outline"
            className="w-full h-11 border-indigo-200 hover:bg-indigo-50"
          >
            {loading && mode === "sequential" ? (
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Run Sequential Test
          </Button>
        </div>
      </div>

      {totalDuration !== null && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Execution Time</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-black text-blue-400">{totalDuration}</span>
                <span className="text-xl font-medium text-slate-300">ms</span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="border-slate-700 text-slate-300 mb-2 capitalize">
                Mode: {mode}
              </Badge>
              <p className="text-xs text-slate-500">
                Processed {TEST_ENDPOINTS.length} API requests
              </p>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden animate-in fade-in duration-700">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-700">Request Logs</h2>
            <Badge variant="secondary" className="bg-slate-200 text-slate-700">
              {results.filter(r => r.status === "success").length} / {results.length} Success
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="hidden md:table-cell">Sample Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, i) => (
                <TableRow key={i} className="group transition-colors">
                  <TableCell className="font-mono text-xs text-blue-600 bg-slate-50/50">
                    {result.endpoint}
                  </TableCell>
                  <TableCell>
                    {result.status === "pending" && (
                      <div className="flex items-center gap-2 text-slate-400 italic text-sm">
                        <RefreshCcw className="w-3 h-3 animate-spin" /> Pending
                      </div>
                    )}
                    {result.status === "success" && (
                      <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </div>
                    )}
                    {result.status === "error" && (
                      <div className="flex items-center gap-2 text-rose-600 font-medium text-sm">
                        <XCircle className="w-4 h-4" /> Failed
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.statusCode ? (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          result.statusCode < 300 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-rose-600 border-rose-200 bg-rose-50"
                        )}
                      >
                        {result.statusCode}
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {result.duration ? (
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {result.duration}ms
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate text-xs text-slate-400 italic">
                    {result.dataSample || (result.error ? result.error : "-")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-12 p-8 rounded-3xl bg-blue-50 border border-blue-100 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">How it works</h2>
          <p className="text-blue-700/80 leading-relaxed">
            This tool uses <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-bold italic">axios</code> instances 
            without any global state management or cache layers (TanStack Query). 
            It demonstrates the performance benefits of HTTP request pipelining in the browser.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <img src="/next.svg" alt="Next.js" className="w-6 opacity-40" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <Zap className="w-6 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
