import { pipelineApi } from "./pipeline-api"
import type { LoginResponse, AuthMeResponse } from "@/lib/types/iam"

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await pipelineApi.post<LoginResponse>("/auth/login", {
      email,
      password,
    })
    return data
  },

  getMe: async (): Promise<AuthMeResponse> => {
    const { data } = await pipelineApi.get<AuthMeResponse>("/auth/me")
    return data
  },

  logout: async (): Promise<void> => {
    // Gọi API logout, server sẽ xử lý vô hiệu hóa token hiện tại
    await pipelineApi.post("/auth/logout")
  },
}
