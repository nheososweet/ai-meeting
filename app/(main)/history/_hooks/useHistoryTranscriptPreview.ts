import { useMemo, useState } from "react";
import axios from "axios";

import type { PipelineRecord } from "@/services/pipeline-records.service";

type UseHistoryTranscriptPreviewParams = {
  records?: PipelineRecord[];
  showActionToast: (message: string) => void;
};

export function useHistoryTranscriptPreview({
  records,
  showActionToast,
}: UseHistoryTranscriptPreviewParams) {
  const [previewTranscriptByRecord, setPreviewTranscriptByRecord] = useState<
    Record<number, string>
  >({});
  const [loadingTranscriptRecordId, setLoadingTranscriptRecordId] = useState<
    number | null
  >(null);
  const [previewTranscriptRecordId, setPreviewTranscriptRecordId] = useState<
    number | null
  >(null);

  const activeTranscriptRecord = useMemo(() => {
    if (!previewTranscriptRecordId) {
      return null;
    }

    return records?.find((record) => record.id === previewTranscriptRecordId) ?? null;
  }, [previewTranscriptRecordId, records]);

  async function copyTextWithToast(text: string, successMessage: string) {
    const normalizedText = text.trim();

    if (!normalizedText) {
      showActionToast("Không có nội dung để copy.");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(normalizedText);
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = normalizedText;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      } else {
        throw new Error("Clipboard API unavailable");
      }

      showActionToast(successMessage);
    } catch {
      showActionToast("Copy thất bại, vui lòng thử lại.");
    }
  }

  function handleCopyTranscriptPreview() {
    if (!previewTranscriptRecordId) {
      return;
    }

    const content = previewTranscriptByRecord[previewTranscriptRecordId] ?? "";
    void copyTextWithToast(content, "Đã copy transcript.");
  }

  async function handlePreviewTranscript(record: PipelineRecord) {
    if (previewTranscriptRecordId === record.id) {
      setPreviewTranscriptRecordId(null);
      return;
    }

    setPreviewTranscriptRecordId(record.id);

    if (previewTranscriptByRecord[record.id]) {
      return;
    }

    setLoadingTranscriptRecordId(record.id);

    try {
      const response = await axios.get<string>(record.transcribeUrl, {
        responseType: "text",
        timeout: 60_000,
      });

      setPreviewTranscriptByRecord((prev) => ({
        ...prev,
        [record.id]: response.data ?? "",
      }));
    } catch {
      setPreviewTranscriptByRecord((prev) => ({
        ...prev,
        [record.id]: "Không đọc được nội dung transcript từ link hiện tại.",
      }));
    } finally {
      setLoadingTranscriptRecordId(null);
    }
  }

  function closeTranscriptPreview() {
    setPreviewTranscriptRecordId(null);
  }

  return {
    previewTranscriptByRecord,
    loadingTranscriptRecordId,
    previewTranscriptRecordId,
    activeTranscriptRecord,
    handlePreviewTranscript,
    handleCopyTranscriptPreview,
    closeTranscriptPreview,
  };
}
