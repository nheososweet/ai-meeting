import dynamic from "next/dynamic";
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

const ReportDocViewer = dynamic(
  async () => {
    const mod = await import("@cyntler/react-doc-viewer");

    return function ReportDocViewerInner(props: {
      url: string;
      fileName: string;
    }) {
      return (
        <mod.default
          documents={[
            {
              uri: props.url,
              fileName: props.fileName,
            },
          ]}
          pluginRenderers={mod.DocViewerRenderers}
          style={{ height: "100%" }}
          config={{
            header: {
              disableHeader: true,
              disableFileName: true,
            },
          }}
        />
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        Đang tải trình xem tài liệu...
      </div>
    ),
  },
);

type ReportPreviewDialogProps = {
  open: boolean;
  reportRecordId: number | null;
  reportRecordFilename?: string;
  reportUrl?: string | null;
  reportFileName?: string;
  onOpenChange: (nextOpen: boolean) => void;
};

export function ReportPreviewDialog({
  open,
  reportRecordId,
  reportRecordFilename,
  reportUrl,
  reportFileName,
  onOpenChange,
}: ReportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="mb-2 flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col justify-between gap-0 overflow-hidden rounded-xl p-0 sm:mb-4 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]"
      >
        <DialogHeader className="space-y-0 text-left">
          <DialogTitle className="px-4 pt-4 text-base sm:px-6 sm:pt-6">
            Xem nhanh biên bản
          </DialogTitle>
          <DialogDescription className="px-4 pb-3 text-xs sm:px-6">
            {reportRecordFilename ??
              (reportRecordId ? `Bản ghi #${reportRecordId}` : "")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 sm:px-6 sm:pb-6">
          {reportUrl && reportFileName ? (
            <div className="h-full min-h-[58dvh] overflow-hidden rounded-md border border-border/70 bg-background">
              <ReportDocViewer url={reportUrl} fileName={reportFileName} />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Chưa có nội dung biên bản.
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-t px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:justify-end">
          {reportUrl ? (
            <Button type="button" variant="outline" className="gap-1.5" asChild>
              <a href={reportUrl} target="_blank" rel="noopener noreferrer">
                Mở tab mới
              </a>
            </Button>
          ) : null}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Đóng
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
