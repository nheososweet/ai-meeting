import type { WbsProject, WbsAssignment, WbsFile, FolderPermission } from "@/lib/types/wbs"

// ══════════════════════════════════════════════════════════
// MOCK DATA: PROJECTS & CAMPAIGNS
// ══════════════════════════════════════════════════════════

export const mockProjects: WbsProject[] = [
  {
    id: "proj-1",
    name: "Số hóa tài liệu lưu trữ năm 2026",
    description: "Dự án số hóa toàn bộ tài liệu lưu trữ của cơ quan trong năm 2026",
    type: "project",
    status: "active",
    createdAt: "2026-01-10T08:00:00Z",
    createdBy: "user-1",
  },
  {
    id: "proj-2",
    name: "Chiến dịch truyền thông CĐS",
    description: "Chiến dịch truyền thông về chuyển đổi số quốc gia",
    type: "campaign",
    status: "active",
    createdAt: "2026-02-15T09:30:00Z",
    createdBy: "user-2",
  },
  {
    id: "proj-3",
    name: "Nâng cấp hạ tầng mạng",
    description: "Dự án nâng cấp hạ tầng mạng cho trung tâm dữ liệu",
    type: "project",
    status: "draft",
    createdAt: "2026-04-01T10:00:00Z",
    createdBy: "user-3",
  },
  {
    id: "proj-4",
    name: "Tổ chức Hội nghị Quốc tế",
    description: "Chiến dịch chuẩn bị cho Hội nghị Quốc tế vào tháng 10",
    type: "campaign",
    status: "active",
    createdAt: "2026-04-15T14:00:00Z",
    createdBy: "user-1",
  },
  {
    id: "proj-5",
    name: "Đào tạo nhân sự 2025",
    description: "Chương trình đào tạo nhân sự năm ngoái đã hoàn thành",
    type: "project",
    status: "archived",
    createdAt: "2025-01-10T08:00:00Z",
    createdBy: "user-4",
  },
]

// ══════════════════════════════════════════════════════════
// MOCK DATA: ASSIGNMENTS
// ══════════════════════════════════════════════════════════

export const mockAssignments: WbsAssignment[] = [
  {
    id: "task-1",
    projectId: "proj-1",
    name: "Scan tài liệu phòng Hành chính",
    assigneeIds: ["user-2", "user-5"], // assigned to 2 users
    status: "done",
    deadline: "2026-03-01T17:00:00Z",
    createdAt: "2026-01-11T08:00:00Z",
    statusHistory: [
      { from: "pending", to: "in_progress", changedBy: "user-2", changedAt: "2026-01-12T09:00:00Z", note: "Bắt đầu làm" },
      { from: "in_progress", to: "review", changedBy: "user-5", changedAt: "2026-02-28T16:00:00Z" },
      { from: "review", to: "done", changedBy: "user-1", changedAt: "2026-03-01T10:00:00Z", note: "Đã duyệt" },
    ],
  },
  {
    id: "task-2",
    projectId: "proj-1",
    name: "Nhập liệu metadata tài liệu Scan",
    assigneeIds: ["grp-thuky"], // assigned to a group
    status: "in_progress",
    deadline: "2026-05-30T17:00:00Z",
    createdAt: "2026-03-02T08:00:00Z",
    statusHistory: [
      { from: "pending", to: "in_progress", changedBy: "user-5", changedAt: "2026-03-05T08:00:00Z" },
    ],
  },
  {
    id: "task-3",
    projectId: "proj-2",
    name: "Thiết kế banner truyền thông",
    assigneeIds: ["user-7"],
    status: "review",
    deadline: "2026-05-10T17:00:00Z",
    createdAt: "2026-02-20T08:00:00Z",
    statusHistory: [
      { from: "pending", to: "in_progress", changedBy: "user-7", changedAt: "2026-02-21T09:00:00Z" },
      { from: "in_progress", to: "review", changedBy: "user-7", changedAt: "2026-05-02T16:00:00Z", note: "Chờ sếp duyệt" },
    ],
  },
  {
    id: "task-4",
    projectId: "proj-2",
    name: "Viết kịch bản video clip",
    assigneeIds: ["user-2", "user-5"],
    status: "pending",
    deadline: "2026-05-15T17:00:00Z",
    createdAt: "2026-05-01T08:00:00Z",
    statusHistory: [],
  },
  {
    id: "task-5",
    projectId: "proj-4",
    name: "Lên danh sách khách mời",
    assigneeIds: ["grp-vpcp"],
    status: "in_progress",
    deadline: "2026-06-01T17:00:00Z",
    createdAt: "2026-04-16T08:00:00Z",
    statusHistory: [
      { from: "pending", to: "in_progress", changedBy: "user-1", changedAt: "2026-04-20T09:00:00Z" },
    ],
  },
  {
    id: "task-6",
    projectId: "proj-4",
    name: "Dịch tài liệu hội nghị sang Tiếng Anh",
    assigneeIds: ["user-8"],
    status: "pending",
    deadline: "2026-05-20T17:00:00Z", // Quá hạn hoặc sắp tới
    createdAt: "2026-05-01T08:00:00Z",
    statusHistory: [],
  },
]

// ══════════════════════════════════════════════════════════
// MOCK DATA: FILES (AWS S3 Mock)
// ══════════════════════════════════════════════════════════

export const mockFiles: WbsFile[] = [
  {
    id: "file-1",
    projectId: "proj-1",
    name: "Bao_cao_khao_sat_so_hoa.pdf",
    size: 2500000, // 2.5 MB
    mimeType: "application/pdf",
    uploadedBy: "user-1",
    uploadedAt: "2026-01-12T09:30:00Z",
    s3Key: "proj-1/Bao_cao_khao_sat_so_hoa.pdf",
  },
  {
    id: "file-2",
    projectId: "proj-1",
    name: "Danh_sach_tai_lieu_Q1.xlsx",
    size: 150000, // 150 KB
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    uploadedBy: "user-2",
    uploadedAt: "2026-02-15T14:20:00Z",
    s3Key: "proj-1/Danh_sach_tai_lieu_Q1.xlsx",
  },
  {
    id: "file-3",
    projectId: "proj-2",
    name: "Video_intro_CDD.mp4",
    size: 45000000, // 45 MB
    mimeType: "video/mp4",
    uploadedBy: "user-7",
    uploadedAt: "2026-03-10T10:00:00Z",
    s3Key: "proj-2/Video_intro_CDD.mp4",
  },
  {
    id: "file-4",
    projectId: "proj-2",
    name: "Banner_Trang_Chu.png",
    size: 850000, // 850 KB
    mimeType: "image/png",
    uploadedBy: "user-7",
    uploadedAt: "2026-05-02T15:30:00Z",
    s3Key: "proj-2/Banner_Trang_Chu.png",
  },
  {
    id: "file-5",
    projectId: "proj-4",
    name: "Kich_ban_Hoi_nghi_v1.docx",
    size: 320000, // 320 KB
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    uploadedBy: "user-1",
    uploadedAt: "2026-04-20T08:45:00Z",
    s3Key: "proj-4/Kich_ban_Hoi_nghi_v1.docx",
  },
]

// ══════════════════════════════════════════════════════════
// MOCK DATA: FOLDER PERMISSIONS
// ══════════════════════════════════════════════════════════

export const mockFolderPermissions: FolderPermission[] = [
  {
    id: "fperm-1",
    folderId: "proj-1",
    folderName: "Dự án Số hóa tài liệu",
    targetType: "group",
    targetId: "grp-vpcp", // Nhóm VPCP
    permissions: ["read", "write"],
  },
  {
    id: "fperm-2",
    folderId: "proj-1",
    folderName: "Dự án Số hóa tài liệu",
    targetType: "user",
    targetId: "user-1", // Admin user
    permissions: ["read", "write", "delete"],
  },
  {
    id: "fperm-3",
    folderId: "proj-2",
    folderName: "Chiến dịch Truyền thông",
    targetType: "user",
    targetId: "user-7", // Đỗ Thị Lan
    permissions: ["read", "write"],
  },
  {
    id: "fperm-4",
    folderId: "proj-4",
    folderName: "Hội nghị Quốc tế",
    targetType: "group",
    targetId: "grp-bnv", // Nhóm BNV
    permissions: ["read"],
  },
]
