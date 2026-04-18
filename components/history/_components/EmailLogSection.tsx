import { CheckCircle2Icon, Clock3Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MeetingEmailLog } from "@/lib/types/meeting";

type EmailLogSectionProps = {
  recipient: string;
  sendStatus: "idle" | "sending" | "sent" | "failed";
  emailLogs: MeetingEmailLog[];
  onRecipientChange: (value: string) => void;
  onSendMinutes: () => void;
  formatEmailSentAt: (dateString: string) => string;
};

export function EmailLogSection({
  recipient,
  sendStatus,
  emailLogs,
  onRecipientChange,
  onSendMinutes,
  formatEmailSentAt,
}: EmailLogSectionProps) {
  return (
    <section className="rounded-lg border border-border/80 bg-card p-5 shadow-sm xl:col-span-2">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Clock3Icon className="size-4" />
        Nhật ký gửi email
      </h2>

      <div className="mt-3 grid gap-2 md:grid-cols-[1.3fr_1fr]">
        <Input
          value={recipient}
          onChange={(event) => onRecipientChange(event.target.value)}
          placeholder="Nhập email người nhận..."
        />
        <Button onClick={onSendMinutes} disabled={sendStatus === "sending"}>
          {sendStatus === "sending" ? "Đang gửi..." : "Gửi email ngay"}
        </Button>
      </div>

      {sendStatus === "sent" ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2Icon className="size-4" />
          Gửi biên bản thành công.
        </p>
      ) : null}

      {sendStatus === "failed" ? (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          Email không hợp lệ, vui lòng kiểm tra lại người nhận.
        </p>
      ) : null}

      <ul className="mt-3 space-y-2 text-sm">
        {emailLogs.length ? (
          emailLogs.map((email) => (
            <li
              key={email.id}
              className="rounded-md border border-border/70 p-3"
            >
              <p className="font-medium text-foreground">{email.recipient}</p>
              <p className="text-muted-foreground">
                {formatEmailSentAt(email.sentAt)}
              </p>
              <p className="text-muted-foreground">
                Trạng thái: {email.status === "sent" ? "Đã gửi" : "Thất bại"}
              </p>
            </li>
          ))
        ) : (
          <li className="rounded-md border border-dashed border-border p-3 text-muted-foreground">
            Chưa có lịch sử gửi email cho phiên này.
          </li>
        )}
      </ul>
    </section>
  );
}
