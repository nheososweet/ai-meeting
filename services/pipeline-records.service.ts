import axios from "axios";
import { pipelineApi } from "@/services/pipeline-api";

interface UpstreamDiarizeTranscribeResponse {
  id?: unknown;
  filename?: unknown;
  status?: unknown;
  transcription?: unknown;
  raw_transcription?: unknown;
  refined_transcription?: unknown;
  audio_url?: unknown;
  transcribe_url?: unknown;
}

interface UpstreamUpdateReportResponse {
  status?: unknown;
  report_url?: unknown;
}

interface UpstreamUpdateTranscribeResponse {
  status?: unknown;
  transcribe_url?: unknown;
}

interface UpstreamRecord {
  id?: unknown;
  create_time?: unknown;
  audio_url?: unknown;
  transcribe_url?: unknown;
  report?: unknown;
  filename?: unknown;
  mail_template?: unknown;
}

interface UpstreamChatResponse {
  model?: unknown;
  reply?: unknown;
}

interface ChatReplyPayload {
  speaker_summary?: unknown;
  summary_by_speaker?: unknown;
  mom_mark?: unknown;
  mom_markdown?: unknown;
  mail_template?: unknown;
}

interface ChatReplyMailTemplate {
  subject?: unknown;
  body?: unknown;
  is_html?: unknown;
}

interface UpstreamSendMailResponse {
  total?: unknown;
  sent?: unknown;
  failed?: unknown;
  results?: unknown;
}

interface UpstreamSendMailResultItem {
  email?: unknown;
  status?: unknown;
}

interface ChatSummaryBySpeakerItem {
  speaker?: unknown;
  points?: unknown;
}

interface UpstreamEvaluateResponse {
  error_details: Record<string, string[]>;
  deductions_per_code: Record<string, number>;
  deductions_per_group: Record<string, number>;
  final_score: number;
}

export interface EvaluationResponse {
  errorDetails: Record<string, string[]>;
  deductionsPerCode: Record<string, number>;
  deductionsPerGroup: Record<string, number>;
  finalScore: number;
}

export interface DiarizeTranscribeResponse {
  id?: number;
  filename: string;
  status: string;
  rawTranscription: string[];
  refinedTranscription: string[];
  audioUrl?: string;
  transcribeUrl?: string;
}

export interface UpdateReportResponse {
  status: "success";
  reportUrl: string;
}

export interface UpdateTranscribeResponse {
  status: "success";
  transcribeUrl: string;
}

export interface PipelineRecord {
  id: number;
  createTime: string;
  audioUrl: string;
  transcribeUrl: string;
  reportUrl: string | null;
  filename: string;
  mailTemplate?: MailTemplatePayload;
}

export interface SpeakerSummaryFromChat {
  speaker: string;
  keyPoints: string[];
}

export interface MailTemplatePayload {
  subject: string;
  body: string;
  isHtml: boolean;
}

export interface SummaryAndMinutesResponse {
  speakerSummaries: SpeakerSummaryFromChat[];
  minutesMarkdown: string;
  mailTemplate?: MailTemplatePayload;
}

export interface SendMailResponse {
  total: number;
  sent: number;
  failed: number;
  results: {
    email: string;
    status: string;
  }[];
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function normalizeChatReplyString(reply: string): string {
  const trimmed = reply.trim();

  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  return trimmed;
}

function parseChatReplyPayload(reply: string): ChatReplyPayload {
  const normalizedReply = normalizeChatReplyString(reply);

  try {
    return JSON.parse(normalizedReply) as ChatReplyPayload;
  } catch {
    const firstBrace = normalizedReply.indexOf("{");
    const lastBrace = normalizedReply.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Chat API trả về reply không phải JSON hợp lệ.");
    }

    const slicedReply = normalizedReply.slice(firstBrace, lastBrace + 1);
    return JSON.parse(slicedReply) as ChatReplyPayload;
  }
}

function parseMailTemplatePayload(value: unknown): MailTemplatePayload | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const template = value as ChatReplyMailTemplate;
  const subject =
    typeof template.subject === "string" ? template.subject.trim() : "";
  const body = typeof template.body === "string" ? template.body.trim() : "";

  if (!subject && !body) {
    return undefined;
  }

  return {
    subject,
    body,
    isHtml: typeof template.is_html === "boolean" ? template.is_html : true,
  };
}

function parseSendMailResponse(data: unknown): SendMailResponse {
  if (!data || typeof data !== "object") {
    throw new Error("API send-mail trả về dữ liệu không hợp lệ.");
  }

  const payload = data as UpstreamSendMailResponse;
  const total = typeof payload.total === "number" ? payload.total : 0;
  const sent = typeof payload.sent === "number" ? payload.sent : 0;
  const failed = typeof payload.failed === "number" ? payload.failed : 0;

  const results = Array.isArray(payload.results)
    ? payload.results
        .map((item) => {
          const parsedItem = item as UpstreamSendMailResultItem;
          const email =
            typeof parsedItem.email === "string" ? parsedItem.email.trim() : "";
          const status =
            typeof parsedItem.status === "string"
              ? parsedItem.status.trim()
              : "unknown";

          if (!email) {
            return null;
          }

          return {
            email,
            status: status || "unknown",
          };
        })
        .filter((item): item is { email: string; status: string } =>
          Boolean(item),
        )
    : [];

  return {
    total,
    sent,
    failed,
    results,
  };
}

export async function diarizeAndTranscribe(input: {
  file: File;
  language?: string;
}): Promise<DiarizeTranscribeResponse> {
  const formData = new FormData();
  formData.append("file", input.file, input.file.name);
  formData.append("language", input.language ?? "Vietnamese");

  const response = await pipelineApi.post<UpstreamDiarizeTranscribeResponse>(
    "/diarize-and-transcribe",
    formData,
  );

  const payload = response.data;

  const rawTranscription = ensureStringArray(
    Array.isArray(payload.raw_transcription)
      ? payload.raw_transcription
      : payload.transcription,
  );

  if (!rawTranscription.length) {
    throw new Error("API diarize/transcribe trả về dữ liệu không hợp lệ.");
  }

  const refinedTranscription = ensureStringArray(
    Array.isArray(payload.refined_transcription)
      ? payload.refined_transcription
      : payload.raw_transcription,
  );

  return {
    id: typeof payload.id === "number" ? payload.id : undefined,
    filename:
      typeof payload.filename === "string" && payload.filename.trim()
        ? payload.filename
        : input.file.name,
    status:
      typeof payload.status === "string" && payload.status.trim()
        ? payload.status
        : "success",
    rawTranscription,
    refinedTranscription: refinedTranscription.length
      ? refinedTranscription
      : rawTranscription,
    audioUrl:
      typeof payload.audio_url === "string" && payload.audio_url.trim()
        ? payload.audio_url
        : undefined,
    transcribeUrl:
      typeof payload.transcribe_url === "string" && payload.transcribe_url.trim()
        ? payload.transcribe_url
        : undefined,
  };
}

export async function updateReport(input: {
  id: number;
  textContent: string;
}): Promise<UpdateReportResponse> {
  const formData = new URLSearchParams();
  formData.append("id", String(input.id));
  formData.append("text_content", input.textContent);

  const response = await pipelineApi.post<UpstreamUpdateReportResponse>(
    "/update-report",
    formData.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const payload = response.data;

  if (payload.status !== "success" || typeof payload.report_url !== "string") {
    throw new Error("Không thể lưu biên bản từ API update-report.");
  }

  return {
    status: "success",
    reportUrl: payload.report_url,
  };
}

export async function updateTranscribe(input: {
  id: number;
  textContent: string;
}): Promise<UpdateTranscribeResponse> {
  const formData = new URLSearchParams();
  formData.append("id", String(input.id));
  formData.append("text_content", input.textContent);

  const response = await pipelineApi.post<UpstreamUpdateTranscribeResponse>(
    "/update-transcribe",
    formData.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const payload = response.data;

  if (
    payload.status !== "success" ||
    typeof payload.transcribe_url !== "string"
  ) {
    throw new Error("Không thể cập nhật transcribe từ API update-transcribe.");
  }

  return {
    status: "success",
    transcribeUrl: payload.transcribe_url,
  };
}

export async function generateSummaryAndMinutes(input: {
  transcriptLines: string[];
  model?: string;
}): Promise<SummaryAndMinutesResponse> {
  const mergedTranscript = input.transcriptLines
    .map((line) => String(line ?? "").trim())
    .filter(Boolean)
    .join(" ");

  if (!mergedTranscript) {
    throw new Error("Thiếu transcript để gọi API chat.");
  }

  const response = await pipelineApi.post<UpstreamChatResponse>("/chat", {
    messages: [
      {
        role: "user",
        content: mergedTranscript,
      },
    ],
    model: input.model ?? "qwen3.5-flash-2026-02-23",
  });

  const reply = response.data?.reply;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Chat API không trả về nội dung reply hợp lệ.");
  }

  const payload = parseChatReplyPayload(reply);

  const summarySource = Array.isArray(payload.summary_by_speaker)
    ? payload.summary_by_speaker
    : Array.isArray(payload.speaker_summary)
      ? payload.speaker_summary
      : [];

  const summaryBySpeaker = summarySource as ChatSummaryBySpeakerItem[];

  const speakerSummaries: SpeakerSummaryFromChat[] = summaryBySpeaker
    .map((item) => {
      const speaker =
        typeof item.speaker === "string" && item.speaker.trim()
          ? item.speaker.trim()
          : "Người chưa xác định";
      const keyPoints = ensureStringArray(item.points);

      return {
        speaker,
        keyPoints,
      };
    })
    .filter((summary) => summary.keyPoints.length > 0);

  const minutesMarkdown =
    typeof payload.mom_markdown === "string"
      ? payload.mom_markdown.trim()
      : typeof payload.mom_mark === "string"
        ? payload.mom_mark.trim()
        : "";

  if (!minutesMarkdown) {
    throw new Error("Chat API không trả về nội dung biên bản hợp lệ.");
  }

  return {
    speakerSummaries,
    minutesMarkdown,
    mailTemplate: parseMailTemplatePayload(payload.mail_template),
  };
}

export async function sendMail(input: {
  emails: string[];
  momFileUrl: string;
  template: MailTemplatePayload;
}): Promise<SendMailResponse> {
  const cleanedEmails = input.emails
    .map((email) => String(email ?? "").trim())
    .filter(Boolean);

  if (!cleanedEmails.length) {
    throw new Error("Thiếu danh sách email người nhận.");
  }

  const momFileUrl = input.momFileUrl.trim();
  if (!momFileUrl) {
    throw new Error("Thiếu URL file biên bản để gửi mail.");
  }

  const subject = input.template.subject.trim();
  const body = input.template.body.trim();

  if (!subject) {
    throw new Error("Thiếu tiêu đề email.");
  }

  if (!body) {
    throw new Error("Thiếu nội dung email.");
  }

  const response = await pipelineApi.post<unknown>("/send-mail", {
    template: {
      subject,
      body,
      is_html: input.template.isHtml,
    },
    emails: cleanedEmails,
    mom_file_url: momFileUrl,
  });

  return parseSendMailResponse(response.data);
}

export async function evaluateTranscript(input: {
  id: number;
  transcript: string;
}): Promise<EvaluationResponse> {
  if (!input.transcript.trim()) {
    throw new Error("Thiếu nội dung transcript để chấm điểm.");
  }

  const response = await axios.post<UpstreamEvaluateResponse>(
    "https://api-stel.svisor.vn/evaluate",
    {
      id: input.id,
      transcript: input.transcript,
    },
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const payload = response.data;

  return {
    errorDetails: payload.error_details,
    deductionsPerCode: payload.deductions_per_code,
    deductionsPerGroup: payload.deductions_per_group,
    finalScore: payload.final_score,
  };
}

export async function getRecords(): Promise<PipelineRecord[]> {
  const response = await pipelineApi.get<unknown>("/records");

  if (!Array.isArray(response.data)) {
    throw new Error("API records trả về dữ liệu không hợp lệ.");
  }

  return (response.data as UpstreamRecord[])
    .map((record): PipelineRecord | null => {
      if (
        typeof record.id !== "number" ||
        typeof record.create_time !== "string" ||
        typeof record.audio_url !== "string" ||
        typeof record.transcribe_url !== "string" ||
        typeof record.filename !== "string"
      ) {
        return null;
      }

      return {
        id: record.id,
        createTime: record.create_time,
        audioUrl: record.audio_url,
        transcribeUrl: record.transcribe_url,
        reportUrl:
          typeof record.report === "string" && record.report.trim()
            ? record.report
            : null,
        filename: record.filename,
        mailTemplate: parseMailTemplatePayload(record.mail_template),
      };
    })
    .filter((record): record is PipelineRecord => Boolean(record));
}
