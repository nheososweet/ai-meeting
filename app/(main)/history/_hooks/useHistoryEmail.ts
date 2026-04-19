import { useMemo, useState } from "react";
import { z } from "zod";

import {
  sendMail,
  type PipelineRecord,
} from "@/services/pipeline-records.service";

const DEFAULT_EMAIL_BODY =
  "<p>Kính gửi Quý thành viên,</p><p>Liên quan đến cuộc họp vừa diễn ra, Ban tổ chức xin gửi đến Quý vị Biên bản họp chi tiết.</p><p>Vui lòng truy cập liên kết sau để xem hoặc tải tài liệu:</p><p><a href=\"{{mom_file_url}}\">{{mom_file_url}}</a></p><p>Mọi thắc mắc vui lòng phản hồi trực tiếp cho Thư ký.</p><p>Trân trọng,</p><p>Admin</p>";

function buildDefaultSubject(fileName: string): string {
  const trimmedFileName = fileName.trim();
  return trimmedFileName
    ? `Thông báo Biên bản Họp - ${trimmedFileName}`
    : "Thông báo Biên bản Họp";
}

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
  const [emailTemplateValidationError, setEmailTemplateValidationError] =
    useState<string | null>(null);
  const [emailSubjectInput, setEmailSubjectInput] = useState("");
  const [emailBodyInput, setEmailBodyInput] = useState("");
  const [emailIsHtml, setEmailIsHtml] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const selectedSendEmailRecord = useMemo(() => {
    if (!sendEmailRecordId) {
      return null;
    }

    return records?.find((record) => record.id === sendEmailRecordId) ?? null;
  }, [sendEmailRecordId, records]);

  function handleOpenSendEmailDialog(recordId: number) {
    const record = records?.find((candidate) => candidate.id === recordId);
    const fallbackSubject = buildDefaultSubject(record?.filename ?? "");

    setEmailSubjectInput(record?.mailTemplate?.subject?.trim() || fallbackSubject);
    setEmailBodyInput(record?.mailTemplate?.body?.trim() || DEFAULT_EMAIL_BODY);
    setEmailIsHtml(record?.mailTemplate?.isHtml ?? true);
    setSendEmailRecordId(recordId);
    setEmailRecipientsInput("");
    setEmailValidationError(null);
    setEmailTemplateValidationError(null);
  }

  function handleCloseSendEmailDialog() {
    setSendEmailRecordId(null);
    setEmailRecipientsInput("");
    setEmailValidationError(null);
    setEmailTemplateValidationError(null);
  }

  function handleEmailRecipientsInputChange(value: string) {
    setEmailRecipientsInput(value);
    if (emailValidationError) {
      setEmailValidationError(null);
    }
  }

  function handleEmailSubjectInputChange(value: string) {
    setEmailSubjectInput(value);
    if (emailTemplateValidationError) {
      setEmailTemplateValidationError(null);
    }
  }

  function handleEmailBodyInputChange(value: string) {
    setEmailBodyInput(value);
    if (emailTemplateValidationError) {
      setEmailTemplateValidationError(null);
    }
  }

  function handleEmailIsHtmlChange(nextValue: boolean) {
    setEmailIsHtml(nextValue);
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

    const subject = emailSubjectInput.trim();
    const body = emailBodyInput.trim();

    if (!subject) {
      setEmailTemplateValidationError("Vui lòng nhập tiêu đề email.");
      return;
    }

    if (!body) {
      setEmailTemplateValidationError("Vui lòng nhập nội dung email.");
      return;
    }

    setEmailValidationError(null);
    setEmailTemplateValidationError(null);
    setIsSendingEmail(true);

    try {
      const sendResult = await sendMail({
        emails: parsed.data,
        momFileUrl: record.reportUrl,
        template: {
          subject,
          body,
          isHtml: emailIsHtml,
        },
      });

      if (sendResult.failed > 0) {
        setEmailValidationError(
          `Đã gửi ${sendResult.sent}/${sendResult.total}, còn ${sendResult.failed} email lỗi.`,
        );
        showActionToast(
          `Đã gửi ${sendResult.sent}/${sendResult.total}, còn ${sendResult.failed} email lỗi.`,
        );
        return;
      }

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
    emailSubjectInput,
    emailBodyInput,
    emailIsHtml,
    emailValidationError,
    emailTemplateValidationError,
    isSendingEmail,
    handleOpenSendEmailDialog,
    handleCloseSendEmailDialog,
    handleSendEmailDialogOpenChange,
    handleEmailRecipientsInputChange,
    handleEmailSubjectInputChange,
    handleEmailBodyInputChange,
    handleEmailIsHtmlChange,
    handleSendEmail,
  };
}
