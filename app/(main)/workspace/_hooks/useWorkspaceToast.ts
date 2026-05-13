import { toast } from "react-toastify";
import { useRef } from "react";

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

export function useWorkspaceToast() {
  const showActionToast = (
    message: string,
    variant?: ActionToastVariant,
    duration?: number,
  ) => {
    const type = variant ?? detectToastVariant(message);
    const options = {
      autoClose: duration ?? 3000,
    };

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

  const hideActionToast = () => {
    toast.dismiss();
  };

  return {
    actionToast: null, // Keep for compatibility but it's now handled by react-toastify
    showActionToast,
    hideActionToast,
  };
}
