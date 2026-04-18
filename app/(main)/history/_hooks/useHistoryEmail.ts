import { useMemo, useState } from "react";
import axios from "axios";
import { z } from "zod";

import type { PipelineRecord } from "@/services/pipeline-records.service";

const recipientEmailsSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập ít nhất 1 email người nhận.")
  .transform((input) =>
    input
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  )
  .pipe(
    z
      .array(z.string().email("Danh sách email có địa chỉ không hợp lệ."))
      .min(1, "Vui lòng nhập ít nhất 1 email người nhận."),
  );

type UseHistoryEmailParams = {
  records?: PipelineRecord[];
  showActionToast: (message: string) => void;
};

export function useHistoryEmail({ records, showActionToast }: UseHistoryEmailParams) {
  const [sendEmailRecordId, setSendEmailRecordId] = useState<number | null>(null);
  const [emailRecipientsInput, setEmailRecipientsInput] = useState("");
  const [emailValidationError, setEmailValidationError] = useState<
    string | null
  >(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const selectedSendEmailRecord = useMemo(() => {
    if (!sendEmailRecordId) {
      return null;
    }

    return records?.find((record) => record.id === sendEmailRecordId) ?? null;
  }, [sendEmailRecordId, records]);

  function handleOpenSendEmailDialog(recordId: number) {
    setSendEmailRecordId(recordId);
    setEmailRecipientsInput("");
    setEmailValidationError(null);
  }

  function handleCloseSendEmailDialog() {
    setSendEmailRecordId(null);
    setEmailRecipientsInput("");
    setEmailValidationError(null);
  }

  function handleEmailRecipientsInputChange(value: string) {
    setEmailRecipientsInput(value);
    if (emailValidationError) {
      setEmailValidationError(null);
    }
  }

  function handleSendEmailDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      handleCloseSendEmailDialog();
    }
  }

  async function handleSendEmail() {
    if (!sendEmailRecordId || isSendingEmail) {
      return;
    }

    const record = records?.find((candidate) => candidate.id === sendEmailRecordId);

    if (!record?.reportUrl) {
      setEmailValidationError("Bản ghi này chưa có biên bản để gửi.");
      return;
    }

    const parsed = recipientEmailsSchema.safeParse(emailRecipientsInput);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message;
      setEmailValidationError(message ?? "Danh sách email không hợp lệ.");
      return;
    }

    setEmailValidationError(null);
    setIsSendingEmail(true);

    try {
      await axios.post("/api/agent/send-email", {
        recipients: parsed.data,
        meetingTitle: record.filename,
        reportUrl: record.reportUrl,
        sessionId: process.env.NEXT_PUBLIC_AGENT_MOM_EMAIL_SESSION_ID,
      });

      handleCloseSendEmailDialog();
      showActionToast("Đã gửi email thành công.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi không xác định";
      setEmailValidationError(`Gửi email thất bại: ${message}`);
      showActionToast(`Gửi email thất bại: ${message}`);
    } finally {
      setIsSendingEmail(false);
    }
  }

  return {
    sendEmailRecordId,
    selectedSendEmailRecord,
    emailRecipientsInput,
    emailValidationError,
    isSendingEmail,
    handleOpenSendEmailDialog,
    handleCloseSendEmailDialog,
    handleSendEmailDialogOpenChange,
    handleEmailRecipientsInputChange,
    handleSendEmail,
  };
}
