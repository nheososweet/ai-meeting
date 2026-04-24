import { useEffect, useRef, useState } from "react";

import { formatFileSize } from "@/app/(main)/workspace/_lib/format-utils";
import { MAX_UPLOAD_SIZE_BYTES } from "@/app/(main)/workspace/_lib/pipeline-constants";
import { isSupportedAudioFile } from "@/app/(main)/workspace/_lib/validation";
import type { MeetingRecord } from "@/lib/types/meeting";

type UseWorkspaceUploadParams = {
  busyProcessing: boolean;
  initialMeeting: MeetingRecord;
  setActiveMeeting: React.Dispatch<React.SetStateAction<MeetingRecord>>;
  onResetPipelineSteps: () => void;
  onResetFailedStep: () => void;
  onResetProgress: () => void;
  onSetNotice: (message: string) => void;
};

export function useWorkspaceUpload({
  busyProcessing,
  initialMeeting,
  setActiveMeeting,
  onResetPipelineSteps,
  onResetFailedStep,
  onResetProgress,
  onSetNotice,
}: UseWorkspaceUploadParams) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSizeBytes, setSelectedFileSizeBytes] = useState<
    number | null
  >(null);
  const [selectedFileDurationSecond, setSelectedFileDurationSecond] = useState<
    number | null
  >(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadDragCountRef = useRef(0);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  useEffect(() => {
    if (!filePreviewUrl) {
      return;
    }

    const audio = new Audio(filePreviewUrl);

    const handleLoadedMetadata = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }

      setSelectedFileDurationSecond(Math.max(1, Math.round(audio.duration)));
    };

    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [filePreviewUrl]);

  function clearUploadState() {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }

    setSelectedFile(null);
    setSelectedFileName(null);
    setSelectedFileSizeBytes(null);
    setSelectedFileDurationSecond(null);
    setFilePreviewUrl(null);
    setUploadWarning(null);
    setIsDraggingUpload(false);
    uploadDragCountRef.current = 0;

    onResetProgress();
    onResetPipelineSteps();
    onResetFailedStep();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function applySelectedFile(file: File) {
    if (!isSupportedAudioFile(file)) {
      clearUploadState();
      setUploadWarning(
        "Định dạng không hỗ trợ. Chỉ nhận WAV, MP3, WebM hoặc OGG.",
      );
      onSetNotice("File không hợp lệ, vui lòng chọn tệp audio đúng định dạng.");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      clearUploadState();
      setUploadWarning(
        `File quá lớn. Giới hạn hiện tại là ${formatFileSize(MAX_UPLOAD_SIZE_BYTES)}.`,
      );
      onSetNotice("File vượt ngưỡng tải lên, vui lòng chọn file nhỏ hơn.");
      return;
    }

    setUploadWarning(null);

    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setSelectedFileSizeBytes(file.size);
    setSelectedFileDurationSecond(null);
    setFilePreviewUrl(nextPreviewUrl);

    onResetProgress();
    onSetNotice(`Đã chọn tệp ${file.name}. Nhấn xử lý để bắt đầu pipeline.`);

    setActiveMeeting((prev) => ({
      ...prev,
      title: `Phiên xử lý ${file.name}`,
      fileName: file.name,
      inputSource: "upload",
      processingStatus: "idle",
      emailStatus: "not_sent",
      rawTranscript: initialMeeting.rawTranscript,
      refinedTranscript: initialMeeting.refinedTranscript,
      segments: [],
      speakerSummaries: [],
      minutes: initialMeeting.minutes,
      speakerCount: 0,
      crmStatus: "idle",
      evaluation: undefined,
    }));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    applySelectedFile(file);
  }

  function handleUploadDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    uploadDragCountRef.current += 1;
    setIsDraggingUpload(true);
  }

  function handleUploadDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingUpload(true);
  }

  function handleUploadDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    uploadDragCountRef.current = Math.max(0, uploadDragCountRef.current - 1);

    if (uploadDragCountRef.current === 0) {
      setIsDraggingUpload(false);
    }
  }

  function handleUploadDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    uploadDragCountRef.current = 0;
    setIsDraggingUpload(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    applySelectedFile(file);
  }

  function handleClearSelectedFile() {
    if (busyProcessing) {
      return;
    }

    clearUploadState();
    onSetNotice("Đã xóa tệp đã chọn. Bạn có thể tải tệp mới.");

    setActiveMeeting((prev) => ({
      ...prev,
      title: "Phiên mới chưa xử lý",
      fileName: "Chưa có tệp nguồn",
      inputSource: "upload",
      processingStatus: "idle",
      rawTranscript: initialMeeting.rawTranscript,
      refinedTranscript: initialMeeting.refinedTranscript,
      segments: [],
      speakerSummaries: [],
      minutes: initialMeeting.minutes,
      speakerCount: 0,
      durationSecond: 0,
      crmStatus: "idle",
      evaluation: undefined,
    }));
  }

  return {
    selectedFile,
    selectedFileName,
    selectedFileSizeBytes,
    selectedFileDurationSecond,
    filePreviewUrl,
    uploadWarning,
    isDraggingUpload,
    fileInputRef,
    clearUploadState,
    handleFileChange,
    handleUploadDragEnter,
    handleUploadDragOver,
    handleUploadDragLeave,
    handleUploadDrop,
    handleClearSelectedFile,
  };
}
