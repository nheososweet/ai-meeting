import { useEffect, useRef, useState } from "react";

export type ActionToastVariant = "info" | "success" | "error";

export type ActionToastState = {
  message: string;
  variant: ActionToastVariant;
};

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
  const [actionToast, setActionToast] = useState<ActionToastState | null>(
    null,
  );
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showActionToast = (message: string, variant?: ActionToastVariant) => {
    setActionToast({
      message,
      variant: variant ?? detectToastVariant(message),
    });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setActionToast(null);
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return {
    actionToast,
    showActionToast,
  };
}
