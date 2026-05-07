import { pipelineApi } from "./pipeline-api"
import type { AuthMeResponse, UserRole, UserScope, Company, Group } from "@/lib/types/iam"

// ══════════════════════════════════════════════════════════
// B. Types & Interfaces
// ══════════════════════════════════════════════════════════

export interface PaginationMeta {
  page: number
  page_size: number
  total_pages: number
  total_items: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}


export interface CreateUserPayload {
  name: string
  email: string
  password?: string
  role_id: number
  company_id: number | null
  group_id: number | null
}

export interface UpdateUserPayload {
  name?: string
  password?: string
  role_id?: number
  company_id?: number | null
  group_id?: number | null
  permissions?: string[]
}

export interface Role {
  id: number
  name: string
  description: string
  created_at: string
  created_by: number | null
}

export interface CreateRolePayload {
  name: string
  description: string
}

export interface UpdateRolePayload {
  name: string
  description: string
}

export interface RolePermissionsResponse {
  role_id: number
  permissions: string[]
}

// ══════════════════════════════════════════════════════════
// C. IAM Service
// ══════════════════════════════════════════════════════════

export const iamService = {
  // ── Companies ───────────────────────────────────────────

  getCompanies: async (params?: {
    page?: number,
    page_size?: number,
    search?: string
  }): Promise<PaginatedResponse<Company>> => {
    // API GET /org/companies
    const { data } = await pipelineApi.get<PaginatedResponse<Company>>("/org/companies", {
      params
    })
    return data
  },

  createCompany: async (name: string): Promise<void> => {
    // API POST /org/companies?name=...
    await pipelineApi.post("/org/companies", null, { params: { name } })
  },

  updateCompany: async (companyId: number, name: string): Promise<void> => {
    // API PUT /org/companies/{company_id}
    await pipelineApi.put(`/org/companies/${companyId}`, { name })
  },

  deleteCompany: async (companyId: number): Promise<void> => {
    // API DELETE /org/companies/{company_id}
    await pipelineApi.delete(`/org/companies/${companyId}`)
  },

  // ── Groups ──────────────────────────────────────────────

  getGroups: async (companyId: number, params?: {
    page?: number,
    page_size?: number,
    search?: string
  }): Promise<PaginatedResponse<Group>> => {
    // API GET /org/companies/{company_id}/groups
    const { data } = await pipelineApi.get<PaginatedResponse<Group>>(`/org/companies/${companyId}/groups`, {
      params
    })
    return data
  },

  createGroup: async (companyId: number, name: string, parentId?: number | null): Promise<void> => {
    // API POST /org/companies/{company_id}/groups?name=...&parent_id=...
    await pipelineApi.post(`/org/companies/${companyId}/groups`, null, {
      params: { name, parent_id: parentId },
    })
  },

  updateGroup: async (groupId: number, name: string): Promise<void> => {
    // API PUT /org/groups/{group_id}
    await pipelineApi.put(`/org/groups/${groupId}`, { name })
  },

  // ── Users ───────────────────────────────────────────────

  getUsers: async (params?: {
    page?: number
    page_size?: number
    search?: string
    search_companyid?: number
    search_groupid?: number
  }): Promise<PaginatedResponse<AuthMeResponse>> => {
    // API GET /auth/users
    const { data } = await pipelineApi.get<PaginatedResponse<AuthMeResponse>>("/auth/users", {
      params,
    })
    return data
  },

  createUser: async (payload: CreateUserPayload): Promise<AuthMeResponse> => {
    // API POST /auth/users
    const { data } = await pipelineApi.post<AuthMeResponse>("/auth/users", payload)
    return data
  },

  updateUser: async (userId: number, payload: UpdateUserPayload): Promise<AuthMeResponse> => {
    // API PATCH /auth/users/{user_id}
    const { data } = await pipelineApi.patch<AuthMeResponse>(`/auth/users/${userId}`, payload)
    return data
  },

  deleteUser: async (userId: number): Promise<void> => {
    // API DELETE /auth/users/{user_id}
    await pipelineApi.delete(`/auth/users/${userId}`)
  },

  // ── Permissions ─────────────────────────────────────────

  getPermissions: async (): Promise<any> => {
    // API GET /org/permissions
    const { data } = await pipelineApi.get("/org/permissions")
    return data
  },

  getCompanyPermissions: async (companyId: number): Promise<string[]> => {
    const { data } = await pipelineApi.get<{ company_id: number; permissions: string[] }>(
      `/org/companies/${companyId}/permissions`
    )
    return data.permissions || []
  },

  assignCompanyPermissions: async (companyId: number, permissions: string[]): Promise<void> => {
    // API POST /org/companies/{company_id}/permissions
    await pipelineApi.post(`/org/companies/${companyId}/permissions`, permissions)
  },

  getGroupPermissions: async (groupId: number): Promise<string[]> => {
    const { data } = await pipelineApi.get<{ group_id: number; permissions: string[] }>(
      `/org/groups/${groupId}/permissions`
    )
    return data.permissions || []
  },

  assignGroupPermissions: async (groupId: number, permissions: string[]): Promise<void> => {
    // API POST /org/groups/{group_id}/permissions
    await pipelineApi.post(`/org/groups/${groupId}/permissions`, permissions)
  },

  getUserPermissions: async (userId: number): Promise<string[]> => {
    const { data } = await pipelineApi.get<{ user_id: number; permissions: string[] }>(
      `/org/users/${userId}/permissions`
    )
    return data.permissions || []
  },

  assignUserPermissions: async (userId: number, perms: string[]): Promise<void> => {
    // API POST /auth/users/{user_id}/permissions
    await pipelineApi.post(`/org/users/${userId}/permissions`, perms)
  },

  // --- Roles Management ---

  getRoles: async (params?: { page?: number; page_size?: number; search?: string }): Promise<PaginatedResponse<Role>> => {
    const { data } = await pipelineApi.get<PaginatedResponse<Role>>("/org/roles", { params })
    return data
  },

  createRole: async (payload: CreateRolePayload): Promise<Role> => {
    // The CURL shows name and description as query params
    const { data } = await pipelineApi.post<Role>("/org/roles", null, {
      params: { name: payload.name, description: payload.description }
    })
    return data
  },

  updateRole: async (roleId: number, payload: UpdateRolePayload): Promise<void> => {
    await pipelineApi.put(`/org/roles/${roleId}`, payload)
  },

  deleteRole: async (roleId: number): Promise<void> => {
    await pipelineApi.delete(`/org/roles/${roleId}`)
  },

  getRolePermissions: async (roleId: number): Promise<RolePermissionsResponse> => {
    const { data } = await pipelineApi.get<RolePermissionsResponse>(`/org/roles/${roleId}/permissions`)
    return data
  },

  assignRolePermissions: async (roleId: number, perms: string[]): Promise<void> => {
    await pipelineApi.post(`/org/roles/${roleId}/permissions`, perms)
  },
}
