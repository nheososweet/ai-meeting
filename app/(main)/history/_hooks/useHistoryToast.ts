import { toast } from "react-toastify";

export type ActionToastVariant = "info" | "success" | "error";

function detectToastVariant(message: string): ActionToastVariant {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("thất bại") ||
    normalized.includes("lỗi") ||
    normalized.includes("failed") ||
    normalized.includes("error")
  ) {
    return "error";
  }

  if (normalized.includes("thành công") || normalized.includes("success")) {
    return "success";
  }

  return "info";
}

export function useHistoryToast() {
  const showActionToast = (message: string, variant?: ActionToastVariant) => {
    const type = variant ?? detectToastVariant(message);
    const options = { autoClose: 3000 };

    switch (type) {
      case "success":
        toast.success(message, options);
        break;
      case "error":
        toast.error(message, options);
        break;
      case "info":
      default:
        toast.info(message, options);
        break;
    }
  };

  return {
    actionToast: null,
    showActionToast,
  };
}
