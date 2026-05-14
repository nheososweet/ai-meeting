"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ShieldAlertIcon } from "lucide-react"

export function AccessDenied403() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">


      <div className="max-w-md space-y-4 relative z-20">
        <div className="inline-flex items-center justify-center rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive uppercase tracking-widest mb-2 border border-destructive/20">
          <ShieldAlertIcon className="mr-1.5 size-3.5" /> Error 403
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Truy cập bị từ chối
        </h1>

        <p className="text-muted-foreground leading-relaxed">
          Tài khoản của bạn hiện không có đủ quyền hạn để truy cập vào tính năng này.
          Vui lòng liên hệ quản trị viên hệ thống nếu bạn tin rằng đây là một sự nhầm lẫn.
        </p>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="default" size="lg" className="px-8 shadow-lg shadow-primary/20">
            <Link href="/dashboard">
              Quay về Trang chủ
            </Link>
          </Button>

          <Button asChild variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
            <Link href="/support" className="flex items-center">
              <ChevronLeftIcon className="mr-1.5 size-4" /> Liên hệ hỗ trợ
            </Link>
          </Button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="fixed top-1/4 left-1/4 size-64 bg-primary/5 blur-[120px] -z-10 rounded-full" />
      <div className="fixed bottom-1/4 right-1/4 size-96 bg-amber-500/5 blur-[150px] -z-10 rounded-full" />
    </div>
  )
}
