export const historyDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function buildDownloadUrl(url: string): string {
  return url;
}

export function resolveTranscriptFilename(filename: string): string {
  if (filename.toLowerCase().endsWith(".wav")) {
    return filename.replace(/\.wav$/i, ".txt");
  }

  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) {
    return `${filename}.txt`;
  }

  return `${filename.slice(0, dotIndex)}.txt`;
}

export function resolveReportFilename(filename: string, reportUrl: string): string {
  const extension = (() => {
    try {
      const extracted = new URL(reportUrl).pathname
        .split(".")
        .pop()
        ?.toLowerCase();

      return extracted ? `.${extracted}` : ".docx";
    } catch {
      return ".docx";
    }
  })();

  if (filename.toLowerCase().endsWith(".wav")) {
    return filename.replace(/\.wav$/i, `_report${extension}`);
  }

  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) {
    return `${filename}_report${extension}`;
  }

  return `${filename.slice(0, dotIndex)}_report${extension}`;
}
