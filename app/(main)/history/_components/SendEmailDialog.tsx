import { LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SendEmailDialogProps = {
  open: boolean;
  recordFilename?: string;
  reportUrl?: string | null;
  emailRecipientsInput: string;
  emailValidationError: string | null;
  isSendingEmail: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onEmailRecipientsInputChange: (value: string) => void;
  onSendEmail: () => void;
};

export function SendEmailDialog({
  open,
  recordFilename,
  reportUrl,
  emailRecipientsInput,
  emailValidationError,
  isSendingEmail,
  onOpenChange,
  onEmailRecipientsInputChange,
  onSendEmail,
}: SendEmailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gửi email biên bản</DialogTitle>
          <DialogDescription>
            Bạn đang gửi biên bản của tệp: {recordFilename}
          </DialogDescription>
        </DialogHeader>
        {reportUrl ? (
          <div className="min-w-0 space-y-1 rounded-md border border-border/70 bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              URL file biên bản
            </p>
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-muted-foreground transition-colors hover:text-primary hover:underline hover:underline-offset-2"
              title={reportUrl}
            >
              {reportUrl}
            </a>
          </div>
        ) : null}
        <div className="space-y-3">
          <div className="space-y-2">
            <label
              htmlFor="email-input"
              className="text-sm font-medium text-foreground"
            >
              Danh sách email người nhận (mỗi email một dòng hoặc cách nhau bằng
              dấu phẩy)
            </label>
            <textarea
              id="email-input"
              value={emailRecipientsInput}
              onChange={(event) => {
                onEmailRecipientsInputChange(event.target.value);
              }}
              rows={4}
              placeholder={"nguoi-nhan-1@congty.vn\nnguoi-nhan-2@congty.vn"}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {emailValidationError ? (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {emailValidationError}
              </p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSendingEmail}>
              Hủy
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={onSendEmail}
            disabled={isSendingEmail}
            className="gap-1.5"
          >
            {isSendingEmail ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : null}
            Gửi email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
