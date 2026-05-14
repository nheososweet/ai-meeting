import type { IamUser, IamRole, IamPermission, IamGroup } from "@/lib/types/iam"

// ══════════════════════════════════════════════════════════
// PERMISSIONS — Tree structure (2-3 levels)
// ══════════════════════════════════════════════════════════

export const mockPermissions: IamPermission[] = [
  {
    id: "perm-meeting",
    code: "meeting",
    label: "Quản lý cuộc họp",
    parentId: null,
    children: [
      { id: "perm-meeting-view", code: "meeting.view", label: "Xem cuộc họp", parentId: "perm-meeting" },
      { id: "perm-meeting-create", code: "meeting.create", label: "Tạo cuộc họp", parentId: "perm-meeting" },
      { id: "perm-meeting-edit", code: "meeting.edit", label: "Chỉnh sửa cuộc họp", parentId: "perm-meeting" },
      { id: "perm-meeting-delete", code: "meeting.delete", label: "Xóa cuộc họp", parentId: "perm-meeting" },
    ],
  },
  {
    id: "perm-iam-users",
    code: "iam.users",
    label: "Quản lý người dùng",
    parentId: null,
    children: [
      { id: "perm-iam-users-view", code: "iam.users.view", label: "Xem người dùng", parentId: "perm-iam-users" },
      { id: "perm-iam-users-create", code: "iam.users.create", label: "Tạo người dùng", parentId: "perm-iam-users" },
      { id: "perm-iam-users-edit", code: "iam.users.edit", label: "Chỉnh sửa người dùng", parentId: "perm-iam-users" },
      { id: "perm-iam-users-lock", code: "iam.users.lock", label: "Khóa/Mở khóa người dùng", parentId: "perm-iam-users" },
    ],
  },
  {
    id: "perm-iam-roles",
    code: "iam.roles",
    label: "Quản lý vai trò & phân quyền",
    parentId: null,
    children: [
      { id: "perm-iam-roles-view", code: "iam.roles.view", label: "Xem vai trò", parentId: "perm-iam-roles" },
      { id: "perm-iam-roles-manage", code: "iam.roles.manage", label: "Quản lý vai trò", parentId: "perm-iam-roles" },
    ],
  },
  {
    id: "perm-iam-groups",
    code: "iam.groups",
    label: "Quản lý nhóm",
    parentId: null,
    children: [
      { id: "perm-iam-groups-view", code: "iam.groups.view", label: "Xem nhóm", parentId: "perm-iam-groups" },
      { id: "perm-iam-groups-manage", code: "iam.groups.manage", label: "Quản lý nhóm", parentId: "perm-iam-groups" },
    ],
  },
  {
    id: "perm-system",
    code: "system",
    label: "Hệ thống",
    parentId: null,
    children: [
      { id: "perm-system-settings", code: "system.settings", label: "Cài đặt hệ thống", parentId: "perm-system" },
      { id: "perm-system-logs", code: "system.logs", label: "Xem nhật ký hệ thống", parentId: "perm-system" },
      { id: "perm-system-backup", code: "system.backup", label: "Sao lưu & phục hồi", parentId: "perm-system" },
    ],
  },
  {
    id: "perm-wbs",
    code: "wbs",
    label: "Quản lý Bảng dịch",
    parentId: null,
    children: [
      {
        id: "perm-wbs-projects",
        code: "wbs.projects",
        label: "Dự án & Chiến dịch",
        parentId: "perm-wbs",
        children: [
          { id: "perm-wbs-projects-view", code: "wbs.projects.view", label: "Xem dự án", parentId: "perm-wbs-projects" },
          { id: "perm-wbs-projects-manage", code: "wbs.projects.manage", label: "Quản lý dự án", parentId: "perm-wbs-projects" },
        ],
      },
      {
        id: "perm-wbs-assignments",
        code: "wbs.assignments",
        label: "Giao việc & Điều phối",
        parentId: "perm-wbs",
        children: [
          { id: "perm-wbs-assignments-view", code: "wbs.assignments.view", label: "Xem công việc", parentId: "perm-wbs-assignments" },
          { id: "perm-wbs-assignments-manage", code: "wbs.assignments.manage", label: "Quản lý giao việc", parentId: "perm-wbs-assignments" },
        ],
      },
      {
        id: "perm-wbs-files",
        code: "wbs.files",
        label: "Lưu trữ Đám mây",
        parentId: "perm-wbs",
        children: [
          { id: "perm-wbs-files-view", code: "wbs.files.view", label: "Xem tệp tin", parentId: "perm-wbs-files" },
          { id: "perm-wbs-files-upload", code: "wbs.files.upload", label: "Tải lên tệp tin", parentId: "perm-wbs-files" },
          { id: "perm-wbs-files-delete", code: "wbs.files.delete", label: "Xóa tệp tin", parentId: "perm-wbs-files" },
        ],
      },
      {
        id: "perm-wbs-storage",
        code: "wbs.storage",
        label: "Phân quyền thư mục",
        parentId: "perm-wbs",
        children: [
          { id: "perm-wbs-storage-view", code: "wbs.storage.view", label: "Xem quyền", parentId: "perm-wbs-storage" },
          { id: "perm-wbs-storage-manage", code: "wbs.storage.manage", label: "Quản lý quyền", parentId: "perm-wbs-storage" },
        ],
      },
    ],
  },
]
/** Flatten all permission codes from the tree */
export function flattenPermissionCodes(perms: IamPermission[]): string[] {
  const codes: string[] = []
  for (const p of perms) {
    codes.push(p.code)
    if (p.children) {
      codes.push(...flattenPermissionCodes(p.children))
    }
  }
  return codes
}

/** Flatten all permission IDs from the tree */
export function flattenPermissionIds(perms: IamPermission[]): string[] {
  const ids: string[] = []
  for (const p of perms) {
    ids.push(p.id)
    if (p.children) {
      ids.push(...flattenPermissionIds(p.children))
    }
  }
  return ids
}

const allPermissionIds = flattenPermissionIds(mockPermissions)

// ══════════════════════════════════════════════════════════
// ROLES
// ══════════════════════════════════════════════════════════

export const mockRoles: IamRole[] = [
  {
    id: "role-admin",
    name: "Admin",
    description: "Quản trị viên toàn quyền hệ thống",
    permissionIds: [...allPermissionIds],
  },
  {
    id: "role-supervisor",
    name: "Supervisor",
    description: "Giám sát viên — xem toàn bộ, quản lý cuộc họp",
    permissionIds: [
      "perm-meeting", "perm-meeting-view", "perm-meeting-create", "perm-meeting-edit", "perm-meeting-delete",
      "perm-iam-users", "perm-iam-users-view",
      "perm-iam-roles", "perm-iam-roles-view",
      "perm-iam-groups", "perm-iam-groups-view",
      "perm-wbs", "perm-wbs-projects", "perm-wbs-projects-view", "perm-wbs-projects-manage",
      "perm-wbs-assignments", "perm-wbs-assignments-view", "perm-wbs-assignments-manage",
      "perm-wbs-files", "perm-wbs-files-view", "perm-wbs-files-upload", "perm-wbs-files-delete",
      "perm-wbs-storage", "perm-wbs-storage-view", "perm-wbs-storage-manage",
    ],
  },
  {
    id: "role-editor",
    name: "Editor",
    description: "Biên tập viên — xem và chỉnh sửa cuộc họp",
    permissionIds: [
      "perm-meeting", "perm-meeting-view", "perm-meeting-create", "perm-meeting-edit",
      "perm-iam-users", "perm-iam-users-view",
      "perm-wbs", "perm-wbs-projects", "perm-wbs-projects-view",
      "perm-wbs-assignments", "perm-wbs-assignments-view", "perm-wbs-assignments-manage",
      "perm-wbs-files", "perm-wbs-files-view", "perm-wbs-files-upload",
    ],
  },
  {
    id: "role-viewer",
    name: "Viewer",
    description: "Chỉ xem — không có quyền quản trị",
    permissionIds: [
      "perm-meeting", "perm-meeting-view",
      "perm-wbs", "perm-wbs-projects", "perm-wbs-projects-view",
      "perm-wbs-assignments", "perm-wbs-assignments-view",
    ],
  },
]

// ══════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════

export const mockUsers: IamUser[] = [
  { id: "user-1", name: "Nguyễn Văn An", email: "an.nguyen@vpcp.gov.vn", status: "active", createdAt: "2026-01-15T08:00:00Z", roleIds: ["role-admin"], groupIds: ["grp-vpcp"] },
  { id: "user-2", name: "Trần Thị Bích", email: "bich.tran@vpcp.gov.vn", status: "active", createdAt: "2026-02-01T09:30:00Z", roleIds: ["role-editor"], groupIds: ["grp-thuky"] },
  { id: "user-3", name: "Lê Hoàng Cường", email: "cuong.le@vpcp.gov.vn", status: "locked", createdAt: "2026-02-10T10:00:00Z", roleIds: ["role-viewer"], groupIds: ["grp-cntt"] },
  { id: "user-4", name: "Phạm Minh Đức", email: "duc.pham@btc.gov.vn", status: "active", createdAt: "2026-02-20T08:15:00Z", roleIds: ["role-supervisor"], groupIds: ["grp-btc"] },
  { id: "user-5", name: "Hoàng Thị Hà", email: "ha.hoang@vpcp.gov.vn", status: "active", createdAt: "2026-03-05T14:00:00Z", roleIds: ["role-editor"], groupIds: ["grp-thuky"] },
  { id: "user-6", name: "Vũ Quốc Khánh", email: "khanh.vu@bnv.gov.vn", status: "locked", createdAt: "2026-03-12T07:45:00Z", roleIds: ["role-viewer"], groupIds: ["grp-bnv"] },
  { id: "user-7", name: "Đỗ Thị Lan", email: "lan.do@vpcp.gov.vn", status: "active", createdAt: "2026-03-25T11:00:00Z", roleIds: ["role-editor"], groupIds: ["grp-vpcp", "grp-cntt"] },
  { id: "user-8", name: "Bùi Văn Minh", email: "minh.bui@btc.gov.vn", status: "active", createdAt: "2026-04-01T08:30:00Z", roleIds: ["role-viewer"], groupIds: ["grp-btc"] },
  { id: "user-9", name: "Ngô Thanh Nhàn", email: "nhan.ngo@vpcp.gov.vn", status: "active", createdAt: "2026-04-10T09:00:00Z", roleIds: ["role-supervisor"], groupIds: ["grp-vpcp"] },
  { id: "user-10", name: "Lý Thị Phương", email: "phuong.ly@bnv.gov.vn", status: "locked", createdAt: "2026-04-18T16:00:00Z", roleIds: ["role-editor"], groupIds: ["grp-bnv"] },
]

// ══════════════════════════════════════════════════════════
// GROUPS — Tree structure (2 levels)
// ══════════════════════════════════════════════════════════

export const mockGroups: IamGroup[] = [
  {
    id: "grp-vpcp",
    name: "Văn phòng Chính phủ",
    description: "Nhóm tổng — Văn phòng Chính phủ",
    parentId: null,
    memberIds: ["user-1", "user-7", "user-9"],
    roleIds: ["role-editor"],
    children: [
      {
        id: "grp-thuky",
        name: "Ban Thư ký",
        description: "Ban thư ký — hỗ trợ văn phòng",
        parentId: "grp-vpcp",
        memberIds: ["user-2", "user-5"],
        roleIds: ["role-editor"],
        children: [],
      },
      {
        id: "grp-cntt",
        name: "Ban CNTT",
        description: "Ban công nghệ thông tin",
        parentId: "grp-vpcp",
        memberIds: ["user-3", "user-7"],
        roleIds: ["role-admin"],
        children: [],
      },
    ],
  },
  {
    id: "grp-btc",
    name: "Bộ Tài chính",
    description: "Nhóm Bộ Tài chính",
    parentId: null,
    memberIds: ["user-4", "user-8"],
    roleIds: ["role-supervisor"],
    children: [],
  },
  {
    id: "grp-bnv",
    name: "Bộ Nội vụ",
    description: "Nhóm Bộ Nội vụ",
    parentId: null,
    memberIds: ["user-6", "user-10"],
    roleIds: ["role-viewer"],
    children: [],
  },
]

// ══════════════════════════════════════════════════════════
// HELPER — Resolve effective permissions for a user
// ══════════════════════════════════════════════════════════

/** Get all permission codes a user effectively has (from direct roles + group roles) */
export function resolveEffectivePermissions(
  user: IamUser,
  roles: IamRole[],
  groups: IamGroup[],
  permissions: IamPermission[],
): string[] {
  const roleMap = new Map(roles.map((r) => [r.id, r]))
  const permIdToCode = new Map<string, string>()

  function mapPermissions(perms: IamPermission[]) {
    for (const p of perms) {
      permIdToCode.set(p.id, p.code)
      if (p.children) mapPermissions(p.children)
    }
  }
  mapPermissions(permissions)

  // Collect all role IDs: direct + from groups
  const allRoleIds = new Set(user.roleIds)

  function findGroupRoles(groupList: IamGroup[]) {
    for (const g of groupList) {
      if (user.groupIds.includes(g.id)) {
        for (const rid of g.roleIds) allRoleIds.add(rid)
      }
      if (g.children) findGroupRoles(g.children)
    }
  }
  findGroupRoles(groups)

  // Collect all permission codes
  const codes = new Set<string>()
  for (const rid of allRoleIds) {
    const role = roleMap.get(rid)
    if (role) {
      for (const pid of role.permissionIds) {
        const code = permIdToCode.get(pid)
        if (code) codes.add(code)
      }
    }
  }

  return Array.from(codes)
}
