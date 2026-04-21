"use client";

import { ClipboardCheckIcon, DownloadCloudIcon, ExternalLinkIcon, FileWarningIcon } from "lucide-react";
import { CriteriaDocViewer } from "@/app/(main)/evaluation-criteria/_components/CriteriaDocViewer";

const CRITERIA_DOC_URL =
  process.env.NEXT_PUBLIC_CRITERIA_DOC_URL ??
  "https://thanh-face-bucket.s3.us-east-1.amazonaws.com/meeting/south_telecom.docx";

export default function EvaluationCriteriaPage() {
  const hasDocUrl = Boolean(CRITERIA_DOC_URL);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-border/80 bg-card p-5 shadow-sm lg:sticky lg:top-4 lg:h-[calc(100dvh-8.5rem)]">
        {/* Header */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <ClipboardCheckIcon className="size-5 text-primary" />
              Tiêu chí đánh giá
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Xem tài liệu tiêu chí đánh giá chất lượng cuộc họp và phiên dịch.
            </p>
          </div>
          {hasDocUrl ? (
            <a
              href={CRITERIA_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <DownloadCloudIcon className="size-3.5" />
              Tải xuống
            </a>
          ) : null}
        </div>

        {/* Body — DocViewer or empty state */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
          {hasDocUrl ? (
            <CriteriaDocViewer url={CRITERIA_DOC_URL} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileWarningIcon className="size-10 opacity-40" />
              <p className="text-sm">Chưa có tài liệu tiêu chí đánh giá.</p>
              <p className="text-xs opacity-70">
                Vui lòng cấu hình URL tài liệu qua biến môi trường{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  NEXT_PUBLIC_CRITERIA_DOC_URL
                </code>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
