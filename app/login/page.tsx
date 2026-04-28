"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User, Lock, Eye, EyeOff, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("cddh");
  const [password, setPassword] = useState("12345678");
  const [captcha, setCaptcha] = useState("");

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/vpcp-ui/element/bg.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={100}
          unoptimized
        />
      </div>

      {/* Login Card */}
      <div className="relative z-20 w-full max-w-[480px] mx-4">
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-10 md:p-12 border border-white/40">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="relative w-24 h-24 mb-6 transition-transform hover:scale-105 duration-300">
              <Image
                src="/vpcp-ui/element/quoc_huy.png"
                alt="Quốc Huy"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-primary text-xl font-extrabold leading-tight uppercase tracking-wider">
              HỆ THỐNG BIÊN TẬP VÀ TỔNG HỢP CUỘC HỌP THÔNG MINH
            </h1>
          </div>

          {/* Form */}
          <form className="space-y-7" onSubmit={(e) => e.preventDefault()}>
            {/* Username */}
            <div className="relative group">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <User size={20} />
              </div>
              <Input
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-8 h-12 border-x-0 border-t-0 border-b border-gray-200 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-all font-medium text-gray-800 placeholder:text-gray-400"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <Lock size={20} />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-8 pr-10 h-12 border-x-0 border-t-0 border-b border-gray-200 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-all font-medium text-gray-800 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Captcha */}
            <div className="space-y-3">
              <div className="flex gap-4 items-end">
                <div className="relative flex-1 group">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                    <LayoutGrid size={20} />
                  </div>
                  <Input
                    type="text"
                    placeholder="Nhập mã kiểm tra"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    className="pl-8 h-12 border-x-0 border-t-0 border-b border-gray-200 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-all font-medium text-gray-800 placeholder:text-gray-400"
                  />
                </div>
                <div className="bg-[#F2F2F2] h-12 px-6 flex items-center justify-center rounded-md border border-gray-200 select-none shadow-inner">
                  <span className="font-mono text-xl tracking-[0.3em] font-black text-gray-700 italic drop-shadow-sm">MVWHJH</span>
                </div>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Đổi mã kiểm tra
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg rounded-lg shadow-lg shadow-accent/30 transition-all active:scale-[0.98]"
            >
              Đăng nhập
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm font-bold text-gray-500 hover:text-primary transition-colors"
              >
                Quên mật khẩu
              </button>
            </div>

            {/* VNConnect Button */}
            {/* <Button
              variant="outline"
              className="w-full h-12 border-2 border-accent text-accent hover:bg-accent/10 font-bold text-lg rounded-lg transition-all active:scale-[0.98]"
            >
              Đăng nhập với VNConnect
            </Button> */}
          </form>
        </div>
      </div>

      {/* Footer / Credits */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-20 text-gray-500/50 text-xs font-medium">
        © 2026 AI Meeting. Tất cả quyền được bảo lưu.
      </div>
    </div>
  );
}
