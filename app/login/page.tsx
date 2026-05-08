"use client";

import React, { useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setTokenInStorage, setCachedAuthUser } from "@/lib/auth/storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { mapAuthUser } from "@/lib/auth/auth-context";
import { parseApiError } from "@/lib/api-error";

function LoginContent() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/meeting";
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async () => {
      // 1. Gọi API login
      const loginData = await authService.login(email, password);
      // 2. Lưu token ngay lập tức để Axios interceptor có thể dùng
      setTokenInStorage(loginData.access_token);
      // 3. Gọi API getMe để xác thực token và lấy thông tin user
      const userData = await authService.getMe();
      return userData;
    },
    onSuccess: (userData) => {
      // Lưu thẳng data user vào Global Cache của React Query
      // Để khi sang trang /workspace, AuthContext dùng được ngay mà không cần call lại /me
      const mappedUser = mapAuthUser(userData);
      queryClient.setQueryData(["auth", "me"], mappedUser);
      // Lưu vào localStorage cho lần refresh sau
      setCachedAuthUser(mappedUser);

      // Đã lấy được user info thành công -> chuyển hướng
      router.push(callbackUrl);
    },
    onError: (error: any) => {
      const msg = parseApiError(error);
      setErrorMsg(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    loginMutation.mutate();
  };

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

          {/* Server Error Message */}
          {errorMsg && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form className="space-y-7" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-1">
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Mail size={20} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email đăng nhập"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="pl-8 h-12 border-x-0 border-t-0 border-b border-gray-200 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-all font-medium text-gray-800 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Lock size={20} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
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
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg rounded-lg shadow-lg shadow-accent/30 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
