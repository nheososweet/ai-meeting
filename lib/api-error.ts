/**
 * Parse FastAPI/Pydantic validation errors (422 Unprocessable Entity)
 * format: { detail: [{ loc: ["body", "password"], msg: "...", type: "..." }] }
 */

const errorMap: Record<string, string> = {
  "string_too_short": "Độ dài quá ngắn",
  "string_too_long": "Độ dài quá lớn",
  "value_error.email": "Email không hợp lệ",
  "field_required": "Trường này là bắt buộc",
}

export function parseApiError(error: any): string {
  if (!error?.response) {
    return error?.message || "Không thể kết nối đến máy chủ"
  }

  const { data, status } = error.response

  // 1. Handle 401 Unauthorized
  if (status === 401) {
    return data?.detail || "Phiên làm việc hết hạn hoặc không hợp lệ"
  }

  // 2. Handle 403 Forbidden
  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này"
  }

  // 3. Handle 422 Unprocessable Entity (FastAPI Validation)
  if (status === 422 && data?.detail) {
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((err: any) => {
          const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : ""
          const translatedMsg = translateMessage(err.msg, err.type)
          
          // Map tên trường sang tiếng Việt nếu cần
          const fieldName = mapFieldName(field)
          
          return fieldName ? `${fieldName}: ${translatedMsg}` : translatedMsg
        })
        .join(". ")
    }
    
    if (typeof data.detail === "string") {
      return data.detail
    }
  }

  // 4. Handle generic detail message from backend
  if (data?.detail && typeof data.detail === "string") {
    return data.detail
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại sau."
}

function translateMessage(msg: string, type: string): string {
  // Ưu tiên map theo type từ Pydantic
  if (type && errorMap[type]) return errorMap[type]
  
  // Một số trường hợp msg tiếng Anh phổ biến
  if (msg.includes("at least")) return msg.replace("String should have at least", "Tối thiểu").replace("characters", "ký tự")
  if (msg.includes("at most")) return msg.replace("String should have at most", "Tối đa").replace("characters", "ký tự")
  
  return msg
}

function mapFieldName(field: string): string {
  const fields: Record<string, string> = {
    "password": "Mật khẩu",
    "email": "Email",
    "name": "Họ và tên",
    "username": "Tên đăng nhập",
    "role_id": "Vai trò",
    "company_id": "Công ty",
    "group_id": "Phòng ban",
  }
  return fields[field] || field
}
