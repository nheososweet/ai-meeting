"use client";

import dynamic from "next/dynamic";
import { LoaderCircleIcon } from "lucide-react";

const DocViewerLazy = dynamic(
  async () => {
    const mod = await import("@cyntler/react-doc-viewer");

    return function CriteriaDocViewerInner(props: {
      url: string;
      fileName: string;
      fileType?: string;
    }) {
      return (
        <mod.default
          documents={[
            {
              uri: props.url,
              fileName: props.fileName,
              fileType: props.fileType,
            },
          ]}
          pluginRenderers={mod.DocViewerRenderers}
          prefetchMethod="GET"
          className="h-full w-full"
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
      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        Đang tải trình xem tài liệu...
      </div>
    ),
  },
);

type CriteriaDocViewerProps = {
  url: string;
  fileName?: string;
};

export function CriteriaDocViewer({
  url,
  fileName = "tieu-chi-danh-gia.docx",
}: CriteriaDocViewerProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/70 bg-background">
      <DocViewerLazy
        url={url}
        fileName={fileName}
        fileType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
    </div>
  );
}
