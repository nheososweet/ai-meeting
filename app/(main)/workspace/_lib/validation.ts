import { z } from "zod";

import {
  ACCEPTED_AUDIO_EXTENSIONS,
  ACCEPTED_AUDIO_MIME_TYPES,
} from "@/app/(main)/workspace/_lib/pipeline-constants";

export const recipientEmailsSchema = z
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

export const minutesDraftSchema = z
  .string()
  .trim()
  .min(1, "Biên bản không được để trống.");

export function isSupportedAudioFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    ACCEPTED_AUDIO_MIME_TYPES.has(file.type) ||
    ACCEPTED_AUDIO_EXTENSIONS.has(extension)
  );
}
