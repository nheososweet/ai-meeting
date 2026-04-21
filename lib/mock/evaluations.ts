import type { RecordEvaluation } from "@/lib/types/evaluation";

/**
 * Mock evaluation data keyed by PipelineRecord `id`.
 * Replace with actual API data once the evaluation endpoint is available.
 */
export const evaluationsByRecordId: Record<number, RecordEvaluation> = {};

/**
 * This function initializes mock data using actual record IDs.
 * Call with real record IDs after loading records from API.
 */
export function buildMockEvaluations(
  recordIds: number[],
): Record<number, RecordEvaluation> {
  const mockPool: RecordEvaluation[] = [
    {
      overallScore: 8.5,
      overallComment:
        "Cuộc họp đạt chất lượng tốt. Các nội dung chính được trình bày rõ ràng, có phân công nhiệm vụ cụ thể và thống nhất thời hạn. Cần cải thiện phần thảo luận mở để tăng tính tương tác.",
      highlights: [
        {
          id: "eval-h-1",
          segmentText:
            "Tiến độ tích hợp ASR đã đạt mức ổn định cho bộ dữ liệu nội bộ.",
          speaker: "Long",
          score: 9.0,
          reason:
            "Báo cáo tiến độ rõ ràng, có số liệu cụ thể về mức độ ổn định. Thể hiện sự chuẩn bị kỹ lưỡng trước khi trình bày.",
          startSecond: 16,
          endSecond: 72,
        },
        {
          id: "eval-h-2",
          segmentText:
            "Cần thêm kiểm thử cho tình huống nhiều người nói chồng lấn âm thanh.",
          speaker: "Thành",
          score: 8.0,
          reason:
            "Đưa ra vấn đề kỹ thuật cụ thể cần giải quyết. Tuy nhiên chưa đề xuất giải pháp hoặc timeline cụ thể để xử lý.",
          startSecond: 79,
          endSecond: 145,
        },
        {
          id: "eval-h-3",
          segmentText:
            "Biên bản sẽ được gửi email cho toàn bộ thành viên vào cuối ngày.",
          speaker: "Hà",
          score: 9.5,
          reason:
            "Cam kết rõ ràng về thời hạn gửi biên bản. Thể hiện trách nhiệm và sự chủ động trong điều phối.",
          startSecond: 151,
          endSecond: 210,
        },
        {
          id: "eval-h-4",
          segmentText:
            "Đề xuất ưu tiên tối ưu thời gian xử lý cho file dài hơn 60 phút.",
          speaker: "Long",
          score: 7.0,
          reason:
            "Đề xuất hợp lý nhưng thiếu phân tích chi phí và tác động đến timeline chung của dự án.",
          startSecond: 230,
          endSecond: 290,
        },
      ],
    },
    {
      overallScore: 6.8,
      overallComment:
        "Cuộc họp ở mức trung bình khá. Có nội dung rà soát nhưng thiếu kết luận rõ ràng cho một số hạng mục. Cần bổ sung action items cụ thể hơn.",
      highlights: [
        {
          id: "eval-h-5",
          segmentText:
            "Bắt đầu rà soát lại mẫu giọng đại diện cho nhóm phòng họp.",
          speaker: "Long",
          score: 7.0,
          reason:
            "Đặt vấn đề rà soát đúng hướng nhưng chưa có tiêu chí đánh giá cụ thể cho từng mẫu giọng.",
          startSecond: 14,
          endSecond: 44,
        },
        {
          id: "eval-h-6",
          segmentText:
            "Chuẩn hóa bộ mẫu giọng đầu vào theo format mới của hệ thống.",
          speaker: "Long",
          score: 6.5,
          reason:
            "Đề cập chuẩn hóa nhưng không nêu rõ format mới là gì và lý do chuyển đổi.",
          startSecond: 50,
          endSecond: 85,
        },
      ],
    },
    {
      overallScore: 4.2,
      overallComment:
        "Cuộc họp gặp sự cố kỹ thuật, không thể hoàn thành xử lý. Đề nghị tải lại file ghi âm và tiến hành lại phiên xử lý.",
      highlights: [
        {
          id: "eval-h-7",
          segmentText:
            "Phiên xử lý bị gián đoạn do lỗi tệp nguồn, cần tải lại file hoặc ghi âm mới.",
          speaker: "Hệ thống",
          score: 3.0,
          reason:
            "Lỗi kỹ thuật dẫn đến không có transcript hoàn chỉnh. Không thể đánh giá nội dung cuộc họp.",
        },
      ],
    },
  ];

  const result: Record<number, RecordEvaluation> = {};

  recordIds.forEach((id, index) => {
    if (index < mockPool.length) {
      result[id] = mockPool[index]!;
    }
  });

  return result;
}
