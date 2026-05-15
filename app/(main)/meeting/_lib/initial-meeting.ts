import { meetingRecords } from "@/lib/mock/meetings";
import type { MeetingMailTemplate, MeetingRecord } from "@/lib/types/meeting";

const sourceMeeting = meetingRecords[0];

const DEFAULT_EMAIL_SUBJECT_PREFIX = "Thông báo Biên bản Họp";
const DEFAULT_EMAIL_BODY =
  '<p>Kính gửi Quý thành viên,</p><p>Liên quan đến cuộc họp vừa diễn ra, Ban tổ chức xin gửi đến Quý vị Biên bản họp chi tiết.</p><p>Vui lòng truy cập liên kết sau để xem hoặc tải tài liệu:</p><p><a href="{{mom_file_url}}">{{mom_file_url}}</a></p><p>Mọi thắc mắc vui lòng phản hồi trực tiếp cho Thư ký.</p><p>Trân trọng,</p><p>Admin</p>';

export function buildDefaultMailTemplate(meetingTitle: string): MeetingMailTemplate {
  const cleanTitle = meetingTitle.trim();
  return {
    subject: cleanTitle
      ? `${DEFAULT_EMAIL_SUBJECT_PREFIX} - ${cleanTitle}`
      : DEFAULT_EMAIL_SUBJECT_PREFIX,
    body: DEFAULT_EMAIL_BODY,
    isHtml: true,
  };
}

export function resolveMailTemplate(
  template: MeetingMailTemplate | undefined,
  meetingTitle: string,
): MeetingMailTemplate {
  const fallback = buildDefaultMailTemplate(meetingTitle);
  if (!template) return fallback;
  return {
    subject: template.subject.trim() || fallback.subject,
    body: template.body.trim() || fallback.body,
    isHtml: template.isHtml,
  };
}

export const initialMeeting: MeetingRecord = {
  ...sourceMeeting,
  title: "Phiên mới chưa xử lý",
  fileName: "Chưa có tệp nguồn",
  inputSource: "upload",
  processingStatus: "idle",
  emailStatus: "not_sent",
  rawTranscript: "Bản gỡ băng sẽ hiển thị sau khi bạn chọn tệp và hoàn tất xử lý AI.",
  refinedTranscript: "Bản làm sạch sẽ hiển thị sau khi hệ thống xử lý xong bản gỡ băng gốc.",
  segments: [],
  minutes: "Biên bản điều hành sẽ được sinh sau khi xử lý hoàn tất.",
  speakerSummaries: [],
  emailLogs: [],
  durationSecond: 0,
  speakerCount: 0,
  mailTemplate: buildDefaultMailTemplate(""),
};
