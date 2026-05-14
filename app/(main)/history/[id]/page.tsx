import { notFound } from "next/navigation";
import { HistoryDetailView } from "@/components/history/history-detail-view";
import { getMeetingById } from "@/lib/mock/meetings";
import { PermissionGuard } from "@/components/iam/shared/permission-guard";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = getMeetingById(id);

  if (!meeting) {
    notFound();
  }

  return (
    <PermissionGuard permission="view_records">
      <HistoryDetailView meeting={meeting} />
    </PermissionGuard>
  );
}
